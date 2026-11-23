import { describe, it, expect } from "vitest";
import { validateCall, settleCall, reputationDelta, gloryReward, MIN_COMMIT_WARDOG } from "./rules";

describe("coin call rules", () => {
  it("requires verified $WARDOG commitment", () => {
    expect(validateCall({ targetPct: 50, durationHours: 24, wardogHeld: null, openCalls: 0 })).toMatch(/wallet/);
    expect(validateCall({ targetPct: 50, durationHours: 24, wardogHeld: MIN_COMMIT_WARDOG - 1, openCalls: 0 })).toMatch(/WARDOG/);
    expect(validateCall({ targetPct: 50, durationHours: 24, wardogHeld: MIN_COMMIT_WARDOG, openCalls: 0 })).toBeNull();
  });
  it("rejects bad duration, target and too many open calls", () => {
    expect(validateCall({ targetPct: 50, durationHours: 12, wardogHeld: 1e9, openCalls: 0 })).not.toBeNull();
    expect(validateCall({ targetPct: 5, durationHours: 24, wardogHeld: 1e9, openCalls: 0 })).not.toBeNull();
    expect(validateCall({ targetPct: 50, durationHours: 48, wardogHeld: 1e9, openCalls: 3 })).not.toBeNull();
  });
  it("hits when target reached, rekt after expiry", () => {
    const c = { startPrice: 1, targetPct: 50, expiresAt: 1000 };
    expect(settleCall(c, 1.5, 10)).toBe("hit");
    expect(settleCall(c, 1.4, 10)).toBe("active");
    expect(settleCall(c, 1.4, 1000)).toBe("rekt");
    expect(settleCall(c, null, 1000)).toBe("rekt");
  });
  it("scores reputation and glory", () => {
    expect(reputationDelta("hit", 100)).toBe(20);
    expect(reputationDelta("rekt", 100)).toBe(-10);
    expect(gloryReward("hit", 100)).toBe(200);
    expect(gloryReward("rekt", 100)).toBe(0);
  });
});
