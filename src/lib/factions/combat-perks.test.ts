import { describe, expect, it } from "vitest";
import { factionPerkMult, raceForCoin } from "./combat-perks";

describe("faction combat perks", () => {
  it("maps home coins to their race perk", () => {
    expect(raceForCoin("PEPE")?.perk).toBe("Toxic Frenzy");
    expect(raceForCoin("$dogs")?.perk).toBe("Pack Swarm");
  });
  it("pays +10% season points for home coins only", () => {
    expect(factionPerkMult("POPCAT")).toBeCloseTo(1.1);
    expect(factionPerkMult("USDT")).toBe(1);
    expect(factionPerkMult(null)).toBe(1);
  });
});
