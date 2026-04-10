import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const CACHE_DIR = path.join(os.homedir(), ".openclaw", "bootstrap-summary");
const CACHE_VERSION = 1;

/**
 * Structure-aware markdown compressor.
 * Preserves all headers, extracts key rules/constraints, drops verbose examples.
 * Zero-cost fallback when LLM is unavailable.
 */
export function extractStructure(content: string, maxChars: number): string {
  if (content.length <= maxChars) {
    return content;
  }

  const lines = content.split("\n");
  const sections: Array<{ header: string; body: string[] }> = [];
  let currentHeader = "";
  let currentBody: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^(#{1,4})\s+(.+)/);
    if (headerMatch) {
      if (currentHeader || currentBody.length > 0) {
        sections.push({ header: currentHeader, body: currentBody });
      }
      currentHeader = line;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentHeader || currentBody.length > 0) {
    sections.push({ header: currentHeader, body: currentBody });
  }

  // First pass: extract key content from each section
  const extracted = sections.map((section) => {
    const header = section.header;
    const body = section.body;

    // Keep lines that look like rules, constraints, or key info
    const kept: string[] = [];
    let bodyBudget = Math.floor(maxChars / Math.max(sections.length, 1));

    for (const line of body) {
      if (kept.join("\n").length >= bodyBudget) {
        break;
      }
      // Keep: non-empty short lines, bullet points, numbered items, code refs, rules
      const trimmed = line.trim();
      if (
        trimmed.length === 0 ||
        trimmed.startsWith("- ") ||
        trimmed.startsWith("* ") ||
        trimmed.startsWith("> ") ||
        /^\d+\.\s/.test(trimmed) ||
        trimmed.startsWith("`") ||
        trimmed.startsWith("**") ||
        trimmed.match(
          /^(NEVER|MUST|ALWAYS|NEVER|MUST NOT|IMPORTANT|WARNING|CRITICAL|REQUIRED|FORBIDDEN)/i,
        ) ||
        trimmed.length < 120 // Short lines are likely rules, not examples
      ) {
        kept.push(line);
      }
    }

    return header ? [header, ...kept] : kept;
  });

  let result = extracted.flat().join("\n").trim();

  // If still too long, truncate proportionally from the end
  if (result.length > maxChars) {
    const marker = `\n\n[… ${content.length - maxChars} chars compressed from ${content.length} total …]`;
    const budget = maxChars - marker.length;
    result = result.slice(0, budget) + marker;
  }

  return result;
}

/**
 * Compute SHA-256 hash of content for cache key.
 */
function contentHash(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

type CachedSummary = {
  version: number;
  hash: string;
  summary: string;
  originalChars: number;
  createdAt: number;
};

/**
 * Check for a cached LLM summary. Returns null on cache miss.
 */
export async function getCachedSummary(content: string): Promise<string | null> {
  const hash = contentHash(content);
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  try {
    const raw = await fs.readFile(cacheFile, "utf-8");
    const cached: CachedSummary = JSON.parse(raw);
    if (cached.version === CACHE_VERSION && cached.hash === hash) {
      return cached.summary;
    }
  } catch {
    // Cache miss
  }
  return null;
}

/**
 * Save an LLM summary to the cache.
 */
export async function setCachedSummary(content: string, summary: string): Promise<void> {
  const hash = contentHash(content);
  const cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const entry: CachedSummary = {
      version: CACHE_VERSION,
      hash,
      summary,
      originalChars: content.length,
      createdAt: Date.now(),
    };
    await fs.writeFile(cacheFile, JSON.stringify(entry), "utf-8");
  } catch {
    // Best-effort cache write
  }
}

/**
 * Smart summarization: tries cache → structure-aware extraction as fallback.
 * LLM enhancement is called separately and cached for next time.
 *
 * This function is synchronous (no LLM call) and always returns promptly.
 */
export function smartTrimBootstrap(
  content: string,
  fileName: string,
  maxChars: number,
  cachedSummary: string | null,
): { content: string; truncated: boolean; originalLength: number } {
  const trimmed = content.trimEnd();
  if (trimmed.length <= maxChars) {
    return { content: trimmed, truncated: false, originalLength: trimmed.length };
  }

  // Use cached LLM summary if available and within budget
  if (cachedSummary && cachedSummary.length <= maxChars) {
    const prefix = `[LLM-summarized ${fileName} (${trimmed.length} → ${cachedSummary.length} chars)]\n\n`;
    if (prefix.length + cachedSummary.length <= maxChars) {
      return {
        content: prefix + cachedSummary,
        truncated: true,
        originalLength: trimmed.length,
      };
    }
    // Cached summary too long, use it without prefix
    if (cachedSummary.length <= maxChars) {
      return { content: cachedSummary, truncated: true, originalLength: trimmed.length };
    }
  }

  // Fallback: structure-aware extraction
  const extracted = extractStructure(trimmed, maxChars);
  return { content: extracted, truncated: true, originalLength: trimmed.length };
}

const BOOTSTRAP_SUMMARY_PROMPT = [
  "Summarize this workspace configuration file for an AI coding assistant.",
  "The summary will replace the full file in the system prompt, so it must be self-contained.",
  "",
  "MUST PRESERVE:",
  "- All rules with MUST/NEVER/ALWAYS/FORBIDDEN keywords (exact wording)",
  "- All constraints and boundaries",
  "- All tool names, command patterns, and file paths",
  "- Active task lists and their statuses",
  "- Environment-specific settings (paths, URLs, keys)",
  "",
  "CAN COMPRESS:",
  "- Examples and demonstrations → one-line mentions",
  "- Long explanations → key takeaway only",
  "- Repetitive patterns → single template",
  "- Background/motivation → omit",
  "",
  "Target length: under 4000 characters. Be extremely concise.",
].join("\n");

export { BOOTSTRAP_SUMMARY_PROMPT };

/**
 * Generate an LLM summary of a bootstrap file and save to cache.
 * Designed to be called fire-and-forget from the bootstrap loading path.
 * Errors are silently caught and logged — cache write failure is non-fatal.
 */
export async function generateAndCacheBootstrapSummary(params: {
  content: string;
  fileName: string;
  callLLM: (prompt: string) => Promise<string>;
}): Promise<void> {
  const { content, callLLM } = params;
  try {
    const fullPrompt = `${BOOTSTRAP_SUMMARY_PROMPT}\n\n---\n\n${content}`;
    const summary = await callLLM(fullPrompt);
    if (summary && summary.trim().length > 0) {
      await setCachedSummary(content, summary.trim());
    }
  } catch {
    // LLM summary generation is best-effort. Failure doesn't affect
    // the current run — structure-aware extraction was already used.
  }
}
