import { describe, expect, it } from "vitest";
import { breachedTreaty, oathbreakerMult, treatyDurationOk, type Treaty } from "./treaty";

const H = 3_600_000;
const t: Treaty = { a: 1, b: 2, startsAt: 0, endsAt: 48 * H, brokenBy: null };

describe("treaty rules", () => {
  it("pacts last 24h to 7 days", () => {
    expect(treatyDurationOk(23)).toBe(false);
    expect(treatyDurationOk(24)).toBe(true);
    expect(treatyDurationOk(168)).toBe(true);
    expect(treatyDurationOk(169)).toBe(false);
  });
  it("attacking a partner during a pact breaches it, either direction", () => {
    expect(breachedTreaty([t], 2, 1, H)).toBe(t);
    expect(breachedTreaty([t], 1, 3, H)).toBeNull();
    expect(breachedTreaty([t], 1, 2, 48 * H)).toBeNull();
    expect(breachedTreaty([{ ...t, brokenBy: 1 }], 1, 2, H)).toBeNull();
  });
  it("Oathbreakers lose 25% glory for 24 hours", () => {
    expect(oathbreakerMult(null, H)).toBe(1);
    expect(oathbreakerMult(0, 23 * H)).toBe(0.75);
    expect(oathbreakerMult(0, 24 * H)).toBe(1);
  });
});
