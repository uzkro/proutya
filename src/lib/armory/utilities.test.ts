import { describe, expect, it } from "vitest";
import { BUNKER_OVERDRIVE_BONUS, UTILITIES, isActive, rollCrate, utilityPrice } from "./utilities";

describe("armory utilities", () => {
  it("recon drone lasts 60 minutes", () => expect(UTILITIES.recon_drone.durationMs).toBe(3_600_000));
  it("EMP jammer lasts 2 hours", () => expect(UTILITIES.emp_jammer.durationMs).toBe(7_200_000));
  it("bunker overdrive is +25%", () => expect(BUNKER_OVERDRIVE_BONUS).toBe(0.25));
  it("WARDOG payment is 20% off", () => expect(utilityPrice(1000, "wardog", 50)).toEqual({ amount: 800, currency: "WARDOG" }));
  it("Stars payment has no discount", () => expect(utilityPrice(1000, "stars", 50)).toEqual({ amount: 50, currency: "XTR" }));
  it("crate tiers give 1/3/5 items", () => {
    expect(rollCrate("scout", [0.1])).toHaveLength(1);
    expect(rollCrate("veteran", [0.1, 0.2, 0.3])).toHaveLength(3);
    expect(rollCrate("warlord", [0, 0, 0, 0, 0])).toHaveLength(5);
  });
  it("top roll is the epic EMP", () => expect(rollCrate("scout", [0.99])[0]?.kind).toBe("emp_jammer"));
  it("effect ends exactly at its duration", () => {
    expect(isActive(0, 100, 99)).toBe(true);
    expect(isActive(0, 100, 100)).toBe(false);
  });
});

import { armoryPrice, crateTierOf, extendedExpiry, overdriveMult, parseStarsPayload, reconHitChance, starsPayload } from "./utilities";

describe("armory effects & orders", () => {
  it("recon drone adds 10 points of hit chance", () => expect(reconHitChance(0.5, true)).toBeCloseTo(0.6));
  it("recon bonus never exceeds 95%", () => expect(reconHitChance(0.9, true)).toBe(0.95));
  it("no recon, no bonus", () => expect(reconHitChance(0.5, false)).toBe(0.5));
  it("overdrive is ×1.25 only while active", () => {
    expect(overdriveMult(true)).toBe(1.25);
    expect(overdriveMult(false)).toBe(1);
  });
  it("re-activating stacks after the time left", () => expect(extendedExpiry(1_500, 1_000, 100)).toBe(1_600));
  it("expired effect restarts from now", () => expect(extendedExpiry(500, 1_000, 100)).toBe(1_100));
  it("warlord crate costs 4800 WARDOG or 250 Stars", () => {
    expect(armoryPrice("crate_warlord", "wardog")).toEqual({ amount: 4800, currency: "WARDOG" });
    expect(armoryPrice("crate_warlord", "stars")).toEqual({ amount: 250, currency: "XTR" });
  });
  it("only real crate tiers parse", () => {
    expect(crateTierOf("crate_veteran")).toBe("veteran");
    expect(crateTierOf("crate_mega")).toBeNull();
  });
  it("stars payload round-trips and rejects junk", () => {
    const id = "123e4567-e89b-12d3-a456-426614174000";
    expect(parseStarsPayload(starsPayload(id))).toBe(id);
    expect(parseStarsPayload("ARMORY:'; DROP")).toBeNull();
  });
});
