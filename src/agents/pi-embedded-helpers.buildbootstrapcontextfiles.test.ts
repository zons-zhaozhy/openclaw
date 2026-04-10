import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { OpenClawConfig } from "../config/config.js";
import {
  buildBootstrapContextFiles,
  DEFAULT_BOOTSTRAP_MAX_CHARS,
  DEFAULT_BOOTSTRAP_PROMPT_TRUNCATION_WARNING_MODE,
  DEFAULT_BOOTSTRAP_TOTAL_MAX_CHARS,
  ensureSessionHeader,
  resolveBootstrapMaxChars,
  resolveBootstrapPromptTruncationWarningMode,
  resolveBootstrapTotalMaxChars,
} from "./pi-embedded-helpers.js";
import type { WorkspaceBootstrapFile } from "./workspace.js";
import { DEFAULT_AGENTS_FILENAME } from "./workspace.js";

const makeFile = (overrides: Partial<WorkspaceBootstrapFile>): WorkspaceBootstrapFile => ({
  name: DEFAULT_AGENTS_FILENAME,
  path: "/tmp/AGENTS.md",
  content: "",
  missing: false,
  ...overrides,
});

const createLargeBootstrapFiles = (): WorkspaceBootstrapFile[] => [
  makeFile({ name: "AGENTS.md", content: "a".repeat(10_000) }),
  makeFile({ name: "SOUL.md", path: "/tmp/SOUL.md", content: "b".repeat(10_000) }),
  makeFile({ name: "USER.md", path: "/tmp/USER.md", content: "c".repeat(10_000) }),
];

describe("ensureSessionHeader", () => {
  it("creates transcript files with restrictive permissions", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "openclaw-session-header-"));
    try {
      const sessionFile = path.join(tempDir, "nested", "session.jsonl");
      await ensureSessionHeader({ sessionFile, sessionId: "session-1", cwd: tempDir });

      expect((await fs.stat(path.dirname(sessionFile))).mode & 0o777).toBe(0o700);
      expect((await fs.stat(sessionFile)).mode & 0o777).toBe(0o600);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});

describe("buildBootstrapContextFiles", () => {
  it("keeps missing markers", async () => {
    const files = [makeFile({ missing: true, content: undefined })];
    expect(await buildBootstrapContextFiles(files)).toEqual([
      {
        path: "/tmp/AGENTS.md",
        content: "[MISSING] Expected at: /tmp/AGENTS.md",
      },
    ]);
  });
  it("skips empty or whitespace-only content", async () => {
    const files = [makeFile({ content: "   \n  " })];
    expect(await buildBootstrapContextFiles(files)).toEqual([]);
  });
  it("truncates large bootstrap content using smart summarization", async () => {
    const long =
      "# Header\n\n" + "MUST do something important\n\n".repeat(100) + "## Tail\n\ntail content";
    const files = [makeFile({ name: "TOOLS.md", content: long })];
    const warnings: string[] = [];
    const maxChars = 200;
    const [result] = await buildBootstrapContextFiles(files, {
      maxChars,
      warn: (message) => warnings.push(message),
    });
    expect(result?.content).toBeDefined();
    expect(result.content.length).toBeLessThan(long.length);
    expect(result.content.length).toBeLessThanOrEqual(maxChars + 100); // Allow some slack for structure extraction
    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain("TOOLS.md");
    expect(warnings[0]).toContain("limit 200");
  });
  it("keeps content under the default limit", async () => {
    const long = "a".repeat(DEFAULT_BOOTSTRAP_MAX_CHARS - 10);
    const files = [makeFile({ content: long })];
    const [result] = await buildBootstrapContextFiles(files);
    expect(result?.content).toBe(long);
    expect(result?.content).not.toContain("[...truncated, read AGENTS.md for full content...]");
  });

  it("keeps total injected bootstrap characters under the new default total cap", async () => {
    const files = [
      makeFile({
        name: "AGENTS.md",
        content: "# Rules\n\nMUST follow rule A\n\n" + "a".repeat(10_000),
      }),
      makeFile({
        name: "SOUL.md",
        path: "/tmp/SOUL.md",
        content: "# Soul\n\nMUST be kind\n\n" + "b".repeat(10_000),
      }),
      makeFile({
        name: "USER.md",
        path: "/tmp/USER.md",
        content: "# User\n\nALWAYS help\n\n" + "c".repeat(10_000),
      }),
    ];
    const result = await buildBootstrapContextFiles(files);
    const totalChars = result.reduce((sum, entry) => sum + entry.content.length, 0);
    expect(totalChars).toBeLessThanOrEqual(DEFAULT_BOOTSTRAP_TOTAL_MAX_CHARS);
    expect(result).toHaveLength(3);
  });

  it("caps total injected bootstrap characters when totalMaxChars is configured", async () => {
    const files = [
      makeFile({
        name: "AGENTS.md",
        content: "# Rules\n\nMUST follow rule A\n\n" + "a".repeat(10_000),
      }),
      makeFile({
        name: "SOUL.md",
        path: "/tmp/SOUL.md",
        content: "# Soul\n\nMUST be kind\n\n" + "b".repeat(10_000),
      }),
      makeFile({
        name: "USER.md",
        path: "/tmp/USER.md",
        content: "# User\n\nALWAYS help\n\n" + "c".repeat(10_000),
      }),
    ];
    const result = await buildBootstrapContextFiles(files, { totalMaxChars: 24_000 });
    const totalChars = result.reduce((sum, entry) => sum + entry.content.length, 0);
    expect(totalChars).toBeLessThanOrEqual(24_000);
    expect(result).toHaveLength(3);
  });

  it("enforces strict total cap even when truncation markers are present", async () => {
    const files = [
      makeFile({ name: "AGENTS.md", content: "a".repeat(1_000) }),
      makeFile({ name: "SOUL.md", path: "/tmp/SOUL.md", content: "b".repeat(1_000) }),
    ];
    const result = await buildBootstrapContextFiles(files, {
      maxChars: 100,
      totalMaxChars: 150,
    });
    const totalChars = result.reduce((sum, entry) => sum + entry.content.length, 0);
    expect(totalChars).toBeLessThanOrEqual(150);
  });

  it("skips bootstrap injection when remaining total budget is too small", async () => {
    const files = [makeFile({ name: "AGENTS.md", content: "a".repeat(1_000) })];
    const result = await buildBootstrapContextFiles(files, {
      maxChars: 200,
      totalMaxChars: 40,
    });
    expect(result).toEqual([]);
  });

  it("keeps missing markers under small total budgets", async () => {
    const files = [makeFile({ missing: true, content: undefined })];
    const result = await buildBootstrapContextFiles(files, {
      totalMaxChars: 20,
    });
    expect(result).toHaveLength(1);
    expect(result[0]?.content.length).toBeLessThanOrEqual(20);
    expect(result[0]?.content.startsWith("[MISSING]")).toBe(true);
  });

  it("skips files with missing or invalid paths and emits warnings", async () => {
    const malformedMissingPath = {
      name: "SKILL-SECURITY.md",
      missing: false,
      content: "secret",
    } as unknown as WorkspaceBootstrapFile;
    const malformedNonStringPath = {
      name: "SKILL-SECURITY.md",
      path: 123,
      missing: false,
      content: "secret",
    } as unknown as WorkspaceBootstrapFile;
    const malformedWhitespacePath = {
      name: "SKILL-SECURITY.md",
      path: "   ",
      missing: false,
      content: "secret",
    } as unknown as WorkspaceBootstrapFile;
    const good = makeFile({ content: "hello" });
    const warnings: string[] = [];
    const result = await buildBootstrapContextFiles(
      [malformedMissingPath, malformedNonStringPath, malformedWhitespacePath, good],
      {
        warn: (msg) => warnings.push(msg),
      },
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.path).toBe("/tmp/AGENTS.md");
    expect(warnings).toHaveLength(3);
    expect(warnings.every((warning) => warning.includes('missing or invalid "path" field'))).toBe(
      true,
    );
  });
});

type BootstrapLimitResolverCase = {
  name: "bootstrapMaxChars" | "bootstrapTotalMaxChars";
  resolve: (cfg?: OpenClawConfig) => number;
  defaultValue: number;
};

const BOOTSTRAP_LIMIT_RESOLVERS: BootstrapLimitResolverCase[] = [
  {
    name: "bootstrapMaxChars",
    resolve: resolveBootstrapMaxChars,
    defaultValue: DEFAULT_BOOTSTRAP_MAX_CHARS,
  },
  {
    name: "bootstrapTotalMaxChars",
    resolve: resolveBootstrapTotalMaxChars,
    defaultValue: DEFAULT_BOOTSTRAP_TOTAL_MAX_CHARS,
  },
];

describe("bootstrap limit resolvers", () => {
  it("return defaults when unset", () => {
    for (const resolver of BOOTSTRAP_LIMIT_RESOLVERS) {
      expect(resolver.resolve()).toBe(resolver.defaultValue);
    }
  });

  it("use configured values when valid", () => {
    for (const resolver of BOOTSTRAP_LIMIT_RESOLVERS) {
      const cfg = {
        agents: { defaults: { [resolver.name]: 12345 } },
      } as OpenClawConfig;
      expect(resolver.resolve(cfg)).toBe(12345);
    }
  });

  it("fall back when values are invalid", () => {
    for (const resolver of BOOTSTRAP_LIMIT_RESOLVERS) {
      const cfg = {
        agents: { defaults: { [resolver.name]: -1 } },
      } as OpenClawConfig;
      expect(resolver.resolve(cfg)).toBe(resolver.defaultValue);
    }
  });
});

describe("resolveBootstrapPromptTruncationWarningMode", () => {
  it("defaults to once", () => {
    expect(resolveBootstrapPromptTruncationWarningMode()).toBe(
      DEFAULT_BOOTSTRAP_PROMPT_TRUNCATION_WARNING_MODE,
    );
  });

  it("accepts explicit valid modes", () => {
    expect(
      resolveBootstrapPromptTruncationWarningMode({
        agents: { defaults: { bootstrapPromptTruncationWarning: "off" } },
      } as OpenClawConfig),
    ).toBe("off");
    expect(
      resolveBootstrapPromptTruncationWarningMode({
        agents: { defaults: { bootstrapPromptTruncationWarning: "always" } },
      } as OpenClawConfig),
    ).toBe("always");
  });

  it("falls back to default for invalid values", () => {
    expect(
      resolveBootstrapPromptTruncationWarningMode({
        agents: { defaults: { bootstrapPromptTruncationWarning: "invalid" } },
      } as unknown as OpenClawConfig),
    ).toBe(DEFAULT_BOOTSTRAP_PROMPT_TRUNCATION_WARNING_MODE);
  });
});
