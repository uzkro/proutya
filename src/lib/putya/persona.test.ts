import { describe, expect, it } from "vitest";
import { questionAllowed, QUESTION_MAX } from "./persona";

describe("putya persona screening", () => {
  it("rejects too-short and too-long questions", () => {
    expect(questionAllowed("a")).toBe(false);
    expect(questionAllowed("x".repeat(QUESTION_MAX + 1))).toBe(false);
  });
  it("allows normal war questions", () => expect(questionAllowed("Which coin should I attack?")).toBe(true));
  it("blocks explicit requests", () => expect(questionAllowed("send nude pics")).toBe(false));
});
