import { describe, expect, it, vi } from "vitest";
import {
  type CacheEntry,
  normalizeCacheKey,
  readCache,
  resolveCacheTtlMs,
  resolveTimeoutSeconds,
  writeCache,
} from "./web-shared.js";

describe("resolveTimeoutSeconds", () => {
  it("returns fallback for non-number", () => {
    expect(resolveTimeoutSeconds(undefined, 30)).toBe(30);
    expect(resolveTimeoutSeconds("10", 30)).toBe(30);
    expect(resolveTimeoutSeconds(NaN, 30)).toBe(30);
    expect(resolveTimeoutSeconds(Infinity, 30)).toBe(30);
  });

  it("returns parsed value clamped to min 1", () => {
    expect(resolveTimeoutSeconds(0, 30)).toBe(1);
    expect(resolveTimeoutSeconds(-5, 30)).toBe(1);
    expect(resolveTimeoutSeconds(0.5, 30)).toBe(1);
  });

  it("returns valid number floored", () => {
    expect(resolveTimeoutSeconds(10.9, 30)).toBe(10);
    expect(resolveTimeoutSeconds(60, 30)).toBe(60);
  });
});

describe("resolveCacheTtlMs", () => {
  it("returns fallback minutes in ms for non-number", () => {
    expect(resolveCacheTtlMs(undefined, 15)).toBe(900_000);
    expect(resolveCacheTtlMs("10", 15)).toBe(900_000);
  });

  it("converts minutes to ms", () => {
    expect(resolveCacheTtlMs(1, 15)).toBe(60_000);
    expect(resolveCacheTtlMs(0.5, 15)).toBe(30_000);
  });

  it("clamps negative to 0", () => {
    expect(resolveCacheTtlMs(-10, 15)).toBe(0);
  });
});

describe("normalizeCacheKey", () => {
  it("lowercases and trims", () => {
    expect(normalizeCacheKey("  HELLO World  ")).toBe("hello world");
  });
});

describe("cache read/write", () => {
  it("returns null for missing key", () => {
    const cache = new Map<string, CacheEntry<string>>();
    expect(readCache(cache, "missing")).toBeNull();
  });

  it("returns value for valid entry", () => {
    const cache = new Map<string, CacheEntry<string>>();
    writeCache(cache, "key", "value", 60_000);
    const result = readCache(cache, "key");
    expect(result).toEqual({ value: "value", cached: true });
  });

  it("evicts expired entries", () => {
    const cache = new Map<string, CacheEntry<string>>();
    writeCache(cache, "key", "value", 1); // 1ms TTL
    // Manually expire
    const entry = cache.get("key")!;
    entry.expiresAt = Date.now() - 1;
    expect(readCache(cache, "key")).toBeNull();
    expect(cache.has("key")).toBe(false);
  });

  it("skips write when ttlMs <= 0", () => {
    const cache = new Map<string, CacheEntry<string>>();
    writeCache(cache, "key", "value", 0);
    expect(cache.size).toBe(0);
    writeCache(cache, "key", "value", -1);
    expect(cache.size).toBe(0);
  });

  it("evicts oldest entry when cache is full", () => {
    const cache = new Map<string, CacheEntry<string>>();
    // Fill to max (100 entries)
    for (let i = 0; i < 100; i++) {
      writeCache(cache, `key-${i}`, `val-${i}`, 60_000);
    }
    expect(cache.size).toBe(100);
    // Adding one more should evict the oldest
    writeCache(cache, "key-new", "val-new", 60_000);
    expect(cache.size).toBe(100);
    expect(cache.has("key-0")).toBe(false);
    expect(cache.get("key-new")?.value).toBe("val-new");
  });
});
