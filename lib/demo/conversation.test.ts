import { describe, expect, it } from "vitest";
import { CONVERSATION, sanitizeChatMessages, scriptedReply } from "./conversation";

describe("scriptedReply (voice agent fallback)", () => {
  it("cycles the canned agent lines by user-turn count", () => {
    expect(scriptedReply(1)).toBe(CONVERSATION[0].agent);
    expect(scriptedReply(2)).toBe(CONVERSATION[1].agent);
    expect(scriptedReply(CONVERSATION.length + 1)).toBe(CONVERSATION[0].agent); // wraps
  });

  it("never throws on 0 or unexpected turn counts", () => {
    expect(scriptedReply(0)).toBe(CONVERSATION[0].agent);
    expect(typeof scriptedReply(999)).toBe("string");
  });
});

describe("sanitizeChatMessages", () => {
  it("returns [] for non-array / garbage input", () => {
    expect(sanitizeChatMessages(undefined)).toEqual([]);
    expect(sanitizeChatMessages("nope")).toEqual([]);
    expect(sanitizeChatMessages({ role: "user" })).toEqual([]);
  });

  it("drops malformed turns (bad role, non-string/empty content)", () => {
    const raw = [
      { role: "user", content: "hi" },
      { role: "system", content: "x" }, // bad role
      { role: "assistant", content: 42 }, // non-string
      { role: "user", content: "   " }, // whitespace
      { role: "assistant", content: "ok" },
      null,
    ];
    expect(sanitizeChatMessages(raw)).toEqual([
      { role: "user", content: "hi" },
      { role: "assistant", content: "ok" },
    ]);
  });

  it("caps message length (4000) and turn count (12)", () => {
    expect(sanitizeChatMessages([{ role: "user", content: "a".repeat(9000) }])[0].content).toHaveLength(4000);
    const many = Array.from({ length: 30 }, () => ({ role: "user" as const, content: "x" }));
    expect(sanitizeChatMessages(many)).toHaveLength(12);
  });
});
