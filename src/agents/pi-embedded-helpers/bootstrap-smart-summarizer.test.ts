import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  extractStructure,
  generateAndCacheBootstrapSummary,
  getCachedSummary,
  setCachedSummary,
  smartTrimBootstrap,
  BOOTSTRAP_SUMMARY_PROMPT,
} from "./bootstrap-smart-summarizer.js";

const CACHE_DIR = path.join(os.homedir(), ".openclaw", "bootstrap-summary");

// ── extractStructure ──────────────────────────────────────────────────

describe("extractStructure", () => {
  it("returns content unchanged when under maxChars", () => {
    const content = "short content";
    expect(extractStructure(content, 100)).toBe(content);
  });

  it("preserves all headers when budget allows", () => {
    const padding = "x".repeat(400);
    const content = [
      "# Header 1",
      "body line 1 that is quite long and goes beyond the short line threshold so it gets dropped",
      "## Header 2",
      "body line 2 also very long and will be dropped by the extraction algorithm",
      "### Header 3",
      "short",
      padding,
    ].join("\n");
    const result = extractStructure(content, 300);
    expect(result).toContain("# Header 1");
    expect(result).toContain("## Header 2");
    expect(result).toContain("### Header 3");
    expect(result.length).toBeLessThan(content.length);
  });

  it("keeps bullet points and numbered items", () => {
    const content = [
      "# Rules",
      "- Rule A is important",
      "* Rule B also matters",
      "1. First numbered item",
      "2. Second numbered item",
      "",
      "This is a very long line that exceeds the 120-char threshold for short-line extraction and should be dropped from the extracted output",
    ].join("\n");
    const result = extractStructure(content, 500);
    expect(result).toContain("- Rule A is important");
    expect(result).toContain("* Rule B also matters");
    expect(result).toContain("1. First numbered item");
    expect(result).toContain("2. Second numbered item");
  });

  it("keeps lines with MUST/NEVER/ALWAYS/FORBIDDEN keywords", () => {
    const content = [
      "# Constraints",
      "MUST always validate input",
      "NEVER expose secrets",
      "FORBIDDEN to use eval",
      "IMPORTANT: check auth first",
      "This is a long explanation that goes well beyond the one hundred twenty character threshold and contains detailed background information that should be compressed away",
    ].join("\n");
    const result = extractStructure(content, 500);
    expect(result).toContain("MUST always validate input");
    expect(result).toContain("NEVER expose secrets");
    expect(result).toContain("FORBIDDEN to use eval");
    expect(result).toContain("IMPORTANT: check auth first");
  });

  it("keeps short lines under 120 chars", () => {
    const content = ["# Config", "short line", "another short one"].join("\n");
    const result = extractStructure(content, 500);
    expect(result).toContain("short line");
    expect(result).toContain("another short one");
  });

  it("keeps code references and bold text", () => {
    const content = [
      "# Tools",
      "`code reference`",
      "**bold text**",
      "This is a very long normal line that exceeds one hundred twenty characters and should be filtered out by the structure-aware extraction",
    ].join("\n");
    const result = extractStructure(content, 500);
    expect(result).toContain("`code reference`");
    expect(result).toContain("**bold text**");
  });

  it("truncates with marker when still too long after extraction", () => {
    const longSection = "# H\n" + "MUST keep this\n".repeat(500);
    const result = extractStructure(longSection, 200);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result).toContain("chars compressed from");
  });

  it("handles content with no headers", () => {
    const content = Array.from({ length: 100 }, (_, i) => `short line ${i}`).join("\n");
    const result = extractStructure(content, 500);
    expect(result.length).toBeLessThanOrEqual(500 + 100); // Allow slack for marker
  });
});

// ── smartTrimBootstrap ─────────────────────────────────────────────────

describe("smartTrimBootstrap", () => {
  it("returns content unchanged when under maxChars", () => {
    const result = smartTrimBootstrap("hello", "test.md", 100, null);
    expect(result).toEqual({ content: "hello", truncated: false, originalLength: 5 });
  });

  it("trims trailing whitespace before checking", () => {
    const result = smartTrimBootstrap("hello   \n  ", "test.md", 100, null);
    expect(result.content).toBe("hello");
    expect(result.truncated).toBe(false);
  });

  it("uses cached LLM summary when available and fits budget", () => {
    const content = "x".repeat(1000);
    const cachedSummary = "Short summary";
    const result = smartTrimBootstrap(content, "AGENTS.md", 500, cachedSummary);
    expect(result.truncated).toBe(true);
    expect(result.originalLength).toBe(1000);
    expect(result.content).toContain("LLM-summarized AGENTS.md");
    expect(result.content).toContain("Short summary");
  });

  it("uses cached summary without prefix when prefix exceeds budget", () => {
    const content = "x".repeat(1000);
    const cachedSummary = "a".repeat(50);
    const result = smartTrimBootstrap(content, "AGENTS.md", 50, cachedSummary);
    expect(result.truncated).toBe(true);
    expect(result.content).toBe(cachedSummary);
  });

  it("falls back to structure extraction when cached summary too long", () => {
    const content = "# Header\n\nMUST follow rule\n\n" + "x".repeat(500);
    const cachedSummary = "y".repeat(600); // Exceeds maxChars
    const result = smartTrimBootstrap(content, "AGENTS.md", 200, cachedSummary);
    expect(result.truncated).toBe(true);
    expect(result.content).toContain("# Header");
  });

  it("falls back to structure extraction when no cache", () => {
    const content = "# Header\n\nMUST follow rule\n\n" + "x".repeat(500);
    const result = smartTrimBootstrap(content, "AGENTS.md", 200, null);
    expect(result.truncated).toBe(true);
    expect(result.content).toContain("# Header");
    expect(result.content).toContain("MUST follow rule");
  });
});

// ── Cache layer (getCachedSummary / setCachedSummary) ──────────────────

describe("bootstrap summary cache", () => {
  const testContent = "test bootstrap content for cache " + Date.now();
  let cacheFile: string;

  beforeAll(() => {
    const hash = crypto.createHash("sha256").update(testContent).digest("hex").slice(0, 16);
    cacheFile = path.join(CACHE_DIR, `${hash}.json`);
  });

  afterEach(async () => {
    try {
      await fs.unlink(cacheFile);
    } catch {
      // File may not exist
    }
  });

  it("returns null on cache miss", async () => {
    const result = await getCachedSummary("nonexistent content " + Math.random());
    expect(result).toBeNull();
  });

  it("round-trips: set then get cached summary", async () => {
    const summary = "This is a test LLM summary";
    await setCachedSummary(testContent, summary);
    const cached = await getCachedSummary(testContent);
    expect(cached).toBe(summary);
  });

  it("returns null when cache version mismatches", async () => {
    await setCachedSummary(testContent, "v1 summary");
    const hash = crypto.createHash("sha256").update(testContent).digest("hex").slice(0, 16);
    const cacheFilePath = path.join(CACHE_DIR, `${hash}.json`);
    const entry = { version: 999, hash, summary: "wrong version" };
    await fs.writeFile(cacheFilePath, JSON.stringify(entry), "utf-8");
    const cached = await getCachedSummary(testContent);
    expect(cached).toBeNull();
  });

  it("returns null when hash mismatches", async () => {
    await setCachedSummary(testContent, "summary");
    const hash = crypto.createHash("sha256").update(testContent).digest("hex").slice(0, 16);
    const cacheFilePath = path.join(CACHE_DIR, `${hash}.json`);
    const entry = { version: 1, hash: "wrong_hash", summary: "bad hash" };
    await fs.writeFile(cacheFilePath, JSON.stringify(entry), "utf-8");
    const cached = await getCachedSummary(testContent);
    expect(cached).toBeNull();
  });
});

// ── generateAndCacheBootstrapSummary ───────────────────────────────────

describe("generateAndCacheBootstrapSummary", () => {
  it("calls LLM and caches result", async () => {
    const content = "long content " + Date.now();
    const llmSummary = "Concise summary of the content";
    const callLLM = vi.fn().mockResolvedValue(llmSummary);

    await generateAndCacheBootstrapSummary({ content, fileName: "AGENTS.md", callLLM });

    expect(callLLM).toHaveBeenCalledTimes(1);
    const callArg = callLLM.mock.calls[0][0] as string;
    expect(callArg).toContain(BOOTSTRAP_SUMMARY_PROMPT);
    expect(callArg).toContain(content);

    // Verify cache was written
    const cached = await getCachedSummary(content);
    expect(cached).toBe(llmSummary);

    // Cleanup
    const hash = crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
    try {
      await fs.unlink(path.join(CACHE_DIR, `${hash}.json`));
    } catch {
      // ok
    }
  });

  it("does not cache empty LLM responses", async () => {
    const content = "content " + Math.random();
    const callLLM = vi.fn().mockResolvedValue("   ");

    await generateAndCacheBootstrapSummary({ content, fileName: "AGENTS.md", callLLM });

    expect(callLLM).toHaveBeenCalledTimes(1);
    const cached = await getCachedSummary(content);
    expect(cached).toBeNull();
  });

  it("swallows LLM errors gracefully", async () => {
    const callLLM = vi.fn().mockRejectedValue(new Error("LLM unavailable"));
    await expect(
      generateAndCacheBootstrapSummary({
        content: "test",
        fileName: "AGENTS.md",
        callLLM,
      }),
    ).resolves.toBeUndefined();
  });

  it("swallows cache write errors gracefully", async () => {
    const content = "test " + Math.random();
    const callLLM = vi.fn().mockResolvedValue("summary");
    vi.spyOn(fs, "mkdir").mockRejectedValueOnce(new Error("permission denied"));
    await expect(
      generateAndCacheBootstrapSummary({ content, fileName: "AGENTS.md", callLLM }),
    ).resolves.toBeUndefined();
    vi.restoreAllMocks();
  });
});
