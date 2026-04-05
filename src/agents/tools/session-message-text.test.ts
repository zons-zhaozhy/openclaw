import { describe, expect, it } from "vitest";
import {
  extractAssistantText,
  sanitizeTextContent,
  stripToolMessages,
} from "./session-message-text.js";

describe("stripToolMessages", () => {
  it("filters out toolResult and tool messages", () => {
    const messages = [
      { role: "user", content: "hello" },
      { role: "toolResult", content: "result" },
      { role: "tool", content: "call" },
      { role: "assistant", content: "reply" },
    ];
    expect(stripToolMessages(messages)).toEqual([
      { role: "user", content: "hello" },
      { role: "assistant", content: "reply" },
    ]);
  });

  it("passes through non-object entries", () => {
    expect(stripToolMessages([null, undefined, "string", 42])).toEqual([
      null,
      undefined,
      "string",
      42,
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(stripToolMessages([])).toEqual([]);
  });
});

describe("sanitizeTextContent", () => {
  it("returns empty string unchanged", () => {
    expect(sanitizeTextContent("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(sanitizeTextContent("hello world")).toBe("hello world");
  });

  it("strips thinking tags", () => {
    const input = "before<thinking>secret</thinking>after";
    const result = sanitizeTextContent(input);
    expect(result).not.toContain("secret");
    expect(result).toContain("before");
    expect(result).toContain("after");
  });
});

describe("extractAssistantText", () => {
  it("returns undefined for non-object", () => {
    expect(extractAssistantText(null)).toBeUndefined();
    expect(extractAssistantText(undefined)).toBeUndefined();
    expect(extractAssistantText("string")).toBeUndefined();
  });

  it("returns undefined for non-assistant role", () => {
    expect(extractAssistantText({ role: "user", content: [] })).toBeUndefined();
    expect(extractAssistantText({ role: "toolResult", content: [] })).toBeUndefined();
  });

  it("returns undefined when content is not an array", () => {
    expect(
      extractAssistantText({ role: "assistant", content: "string content" }),
    ).toBeUndefined();
  });

  it("extracts text from content blocks", () => {
    const result = extractAssistantText({
      role: "assistant",
      content: [{ type: "text", text: "Hello world" }],
    });
    expect(result).toBe("Hello world");
  });

  it("joins multiple text blocks", () => {
    const result = extractAssistantText({
      role: "assistant",
      content: [
        { type: "text", text: "Hello " },
        { type: "text", text: "world" },
      ],
    });
    expect(result).toBe("Hello world");
  });

  it("returns undefined for empty joined text", () => {
    const result = extractAssistantText({
      role: "assistant",
      content: [{ type: "text", text: "   " }],
    });
    expect(result).toBeUndefined();
  });

  it("strips thinking tags from content", () => {
    const result = extractAssistantText({
      role: "assistant",
      content: [{ type: "text", text: "<thinking>secret</thinking>visible text" }],
    });
    expect(result).not.toContain("secret");
    expect(result).toContain("visible text");
  });
});
