import { describe, expect, it } from "vitest";
import { computeFavor, moodFor, clampHeat } from "./favor";

const base = { dailyStreak: 0, energy: 10, maxEnergy: 100, lastDailyClaim: 0, now: 1_000 * 86_400_000 };

describe("putya favor", () => {
  it("starts at 50", () => expect(computeFavor(base)).toBe(50));
  it("streak adds 4 per day, capped at 20", () => {
    expect(computeFavor({ ...base, dailyStreak: 2 })).toBe(58);
    expect(computeFavor({ ...base, dailyStreak: 30 })).toBe(70);
  });
  it("claiming today adds 5", () => expect(computeFavor({ ...base, lastDailyClaim: base.now })).toBe(55));
  it("wasting full energy costs 8", () => expect(computeFavor({ ...base, energy: 100 })).toBe(42));
  it("heat clamps to ±25", () => expect(clampHeat(99)).toBe(25));
  it("mood boundaries: cold <35, doting >=70", () => {
    expect(moodFor(34)).toBe("cold");
    expect(moodFor(35)).toBe("sassy");
    expect(moodFor(69)).toBe("sassy");
    expect(moodFor(70)).toBe("doting");
  });
});
