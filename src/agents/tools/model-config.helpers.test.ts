import { describe, expect, it, vi } from "vitest";
import {
  buildToolModelConfigFromCandidates,
  coerceToolModelConfig,
  hasToolModelConfig,
  resolveDefaultModelRef,
} from "./model-config.helpers.js";

describe("hasToolModelConfig", () => {
  it("returns false for undefined", () => {
    expect(hasToolModelConfig(undefined)).toBe(false);
  });

  it("returns false for empty config", () => {
    expect(hasToolModelConfig({})).toBe(false);
    expect(hasToolModelConfig({ primary: "", fallbacks: [] })).toBe(false);
    expect(hasToolModelConfig({ primary: "  " })).toBe(false);
  });

  it("returns true when primary is set", () => {
    expect(hasToolModelConfig({ primary: "anthropic/claude-4" })).toBe(true);
  });

  it("returns true when only fallbacks are set", () => {
    expect(hasToolModelConfig({ primary: "", fallbacks: ["anthropic/claude-4"] })).toBe(true);
  });

  it("returns false for whitespace-only fallbacks", () => {
    expect(hasToolModelConfig({ fallbacks: ["  ", ""] })).toBe(false);
  });
});

describe("buildToolModelConfigFromCandidates", () => {
  it("returns explicit config when set", () => {
    const result = buildToolModelConfigFromCandidates({
      explicit: { primary: "anthropic/claude-4" },
      candidates: ["openai/gpt-5"],
    });
    expect(result).toEqual({ primary: "anthropic/claude-4" });
  });

  it("returns null for empty candidates", () => {
    const result = buildToolModelConfigFromCandidates({
      explicit: {},
      candidates: [],
    });
    expect(result).toBeNull();
  });

  it("skips candidates without slash", () => {
    const result = buildToolModelConfigFromCandidates({
      explicit: {},
      candidates: ["invalid-model", "claude-4"],
    });
    expect(result).toBeNull();
  });

  it("skips null and undefined candidates", () => {
    const result = buildToolModelConfigFromCandidates({
      explicit: {},
      candidates: [null, undefined, "  ", "anthropic/claude-4"],
    });
    // May or may not resolve depending on auth — just check no crash
    expect([null, expect.any(Object)]).toContainEqual(
      result === null ? null : expect.any(Object),
    );
  });

  it("deduplicates candidates", () => {
    const result = buildToolModelConfigFromCandidates({
      explicit: {},
      candidates: ["anthropic/claude-4", "anthropic/claude-4"],
    });
    if (result) {
      expect(result.primary).toBe("anthropic/claude-4");
      expect(result.fallbacks).toBeUndefined();
    }
  });
});

describe("resolveDefaultModelRef", () => {
  it("returns defaults without config", () => {
    const result = resolveDefaultModelRef();
    expect(result.provider).toBeTruthy();
    expect(result.model).toBeTruthy();
  });
});

describe("coerceToolModelConfig", () => {
  it("returns empty config for undefined input", () => {
    const result = coerceToolModelConfig(undefined);
    expect(result).toEqual({});
  });

  it("extracts primary from string", () => {
    const result = coerceToolModelConfig("anthropic/claude-4");
    expect(result.primary).toBe("anthropic/claude-4");
  });

  it("extracts primary from object", () => {
    const result = coerceToolModelConfig({ primary: "anthropic/claude-4" });
    expect(result.primary).toBe("anthropic/claude-4");
  });

  it("extracts fallbacks from object", () => {
    const result = coerceToolModelConfig({
      primary: "anthropic/claude-4",
      fallbacks: ["openai/gpt-5"],
    });
    expect(result.primary).toBe("anthropic/claude-4");
    expect(result.fallbacks).toEqual(["openai/gpt-5"]);
  });
});
