import { describe, it, expect } from "vitest";
import { feedLine } from "./flavor";
const base = { id: 1, weaponId: "knife", hit: true, attackerName: "A", victimName: "B", gloryGained: 10 };
describe("war feed voice", () => {
  it("names glory on a hit", () => expect(feedLine(base).text).toContain("+10 glory"));
  it("jailed beats hit", () => expect(feedLine({ ...base, jailed: true }).text).toContain("JAILED"));
  it("misses have no quip", () => expect(feedLine({ ...base, hit: false }).quip).toBeNull());
  it("same row → same line", () => expect(feedLine(base)).toEqual(feedLine(base)));
  it("Putya speaks when on", () => expect(feedLine(base, { putya: true }).quip).toBe("That's my good boy."));
});
