import { describe, it, expect } from "vitest";
import { splitSwapOutput, locketInflow, shareReflections, reactorApy } from "./locket";

describe("locket reactor", () => {
  it("takes a 0.35% partner fee", () => {
    const s = splitSwapOutput(1000);
    expect(s.treasury).toBeCloseTo(3.5);
    expect(s.player).toBeCloseTo(996.5);
  });
  it("routes 50% of fees and 100% of slashed bonds to LOCKET", () => {
    expect(locketInflow(10, 4)).toEqual({ fromFees: 5, fromBonds: 4 });
  });
  it("shares reflections by map + defense", () => {
    expect(shareReflections(100, [{ id: "a", map: 3, defense: 1 }, { id: "b", map: 0, defense: 0 }, { id: "c", map: 1, defense: 0 }]))
      .toEqual([{ id: "a", amount: 80 }, { id: "b", amount: 0 }, { id: "c", amount: 20 }]);
  });
  it("APY is zero without a reserve", () => {
    expect(reactorApy(1, 0)).toBe(0);
    expect(reactorApy(1, 365)).toBe(100);
  });
});
