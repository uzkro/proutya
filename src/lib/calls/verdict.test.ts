import { describe, it, expect } from "vitest";
import { slashSplit, verdictCard, hasPutyaSeal } from "./rules";
describe("call verdicts", () => {
  it("rekt bond splits 50% burn / 50% vault", () => expect(slashSplit("rekt", 10_001)).toEqual({ burn: 5000, vault: 5001, returned: 0 }));
  it("hit returns 100% of the bond", () => expect(slashSplit("hit", 10_000)).toEqual({ burn: 0, vault: 0, returned: 10_000 }));
  it("hit card says 100% ALPHA", () => expect(verdictCard("hit")?.title).toBe("APPROVED BY PUTYA · 100% ALPHA"));
  it("rekt card says EXIT LIQUIDITY", () => expect(verdictCard("rekt")?.title).toBe("REKT BY PUTYA · EXIT LIQUIDITY DETECTED"));
  it("seal needs some PUTYA", () => { expect(hasPutyaSeal(0)).toBe(false); expect(hasPutyaSeal(1)).toBe(true); });
});
