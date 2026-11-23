import { describe, expect, it } from "vitest";
import { kolScore, rankKolSyndicates, socialCount } from "./kol";

const base = { id: 1, name: "A", tag: "A", emblem: "🐶", reputation: 0, memberCount: 0 };

describe("KOL ranking", () => {
  it("counts linked channels", () => {
    expect(socialCount({ ...base, xHandle: "x", tgLink: "t" })).toBe(2);
  });
  it("scores verified dev and socials", () => {
    expect(kolScore({ ...base, reputation: 100, xHandle: "x", devVerified: true, memberCount: 3 })).toBe(100 + 250 + 500 + 30);
  });
  it("ranks verified, linked syndicates above bare ones with equal reputation", () => {
    const r = rankKolSyndicates([{ ...base, id: 1, name: "Bare" }, { ...base, id: 2, name: "Linked", tgLink: "t" }]);
    expect(r[0]?.name).toBe("Linked");
  });
});
