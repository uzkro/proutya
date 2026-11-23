import { describe, expect, it } from "vitest";
import { buildDispatch } from "./dispatch";

describe("war dispatch", () => {
  it("reports leader, surges, bleeders and strikes", () => {
    const d = buildDispatch({
      sectors: [{ symbol: "DOGS", share: 0.6, change24h: 12 }, { symbol: "UTYA", share: 0.4, change24h: -8 }],
      radiation: { level: 20 }, combat: [{ hit: true, glory: 30 }, { hit: false, glory: 0 }],
      whales: [{ symbol: "DOGS", usd: 25000, side: "buy" }], survivors: [{ symbol: "DOGS" }],
    });
    expect(d.headline).toBe("$DOGS commands the battlefield");
    expect(d.lines).toContain("$DOGS surges 12.0% — overcharge in effect.");
    expect(d.lines).toContain("1 of 2 recent strikes landed for 30 glory.");
    expect(d.lines.length).toBe(5);
  });
  it("falls back when there is no data", () => {
    expect(buildDispatch({ sectors: [], radiation: null, combat: [], whales: [], survivors: [] }).lines).toEqual(["No fresh intel. Scouts are still out."]);
  });
});
