import { describe, it, expect } from "vitest";
import { momentumFor, rallyText } from "./momentum";

describe("market momentum", () => {
  it("steady between -5% and +5% with normal volume", () => { expect(momentumFor(4.9, 1).mult).toBe(1); expect(momentumFor(-4.9, 1).status).toBe("steady"); });
  it("+5% surge gives 1.10", () => expect(momentumFor(5, 1)).toMatchObject({ status: "surge", mult: 1.1 }));
  it("+20% overcharge gives 1.25", () => expect(momentumFor(20, 1)).toMatchObject({ status: "overcharge", mult: 1.25 }));
  it("-5% radiation gives 0.90", () => expect(momentumFor(-5, 3)).toMatchObject({ status: "radiation", mult: 0.9 }));
  it("2x volume adds frenzy +0.15", () => { expect(momentumFor(0, 2).mult).toBe(1.15); expect(momentumFor(25, 2).mult).toBe(1.4); });
  it("missing data is neutral", () => expect(momentumFor(null, NaN).mult).toBe(1));
  it("rally text names the coin", () => expect(rallyText("dogs", 14, momentumFor(14, 1))).toContain("$DOGS (+14.0% 24h)"));
});
