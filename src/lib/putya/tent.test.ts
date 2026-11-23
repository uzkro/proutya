import { describe, expect, it } from "vitest";
import { dialogueFavor, favorRank, restOutcome, TENT_MAX_REST_MS } from "./tent";

describe("Destress Tent", () => {
  it("restores 1 energy and 2 glory per rested minute", () => {
    expect(restOutcome(0, 10 * 60_000, 50, 100)).toEqual({ minutes: 10, energy: 10, glory: 20, capped: false });
  });
  it("never fills energy past the max", () => {
    expect(restOutcome(0, 30 * 60_000, 95, 100).energy).toBe(5);
  });
  it("stops paying after one hour", () => {
    const r = restOutcome(0, TENT_MAX_REST_MS * 3, 0, 100);
    expect(r).toEqual({ minutes: 60, energy: 60, glory: 120, capped: true });
  });
  it("pays nothing for under a minute or a clock in the past", () => {
    expect(restOutcome(0, 59_000, 0, 100).glory).toBe(0);
    expect(restOutcome(1000, 0, 0, 100).energy).toBe(0);
  });
  it("gives +3 favor for the first three dialogues a day, then nothing", () => {
    expect([0, 1, 2, 3].map(dialogueFavor)).toEqual([3, 3, 3, 0]);
  });
  it("ranks favor Recruit < 60 ≤ Confidante < 85 ≤ Empress", () => {
    expect([59, 60, 84, 85].map(favorRank)).toEqual(["recruit", "confidante", "confidante", "empress"]);
  });
});
