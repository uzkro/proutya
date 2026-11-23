import { describe, it, expect } from "vitest";
import { ALL_RACES, RACES, raceStandings, resolveRace } from "@/lib/factions/races";

describe("12 animal factions", () => {
  it("has exactly 12 races", () => {
    expect(ALL_RACES).toHaveLength(12);
  });
  it("uses the requested names and perks", () => {
    expect(RACES.wardog.name).toBe("Canine Syndicate");
    expect(RACES.wardog.perk).toBe("Pack Swarm");
    expect(RACES.duck.name).toBe("Waterfowl Swarm");
    expect(RACES.rooster.perk).toBe("Morning Screech");
    expect(RACES.beast.name).toBe("Wild Beast Vanguard");
    expect(RACES.beast.coins).toEqual(["BULL", "MOO"]);
  });
  it("keeps legacy wardog/warcat saves on their race", () => {
    expect(resolveRace("warcat", "XYZ")).toBe("warcat");
    expect(resolveRace(null, "DOG")).toBe("wardog");
  });
  it("ranks factions by glory", () => {
    const st = raceStandings([
      { faction: "frog", tag: "A", memberCount: 2, totalGlory: 50 },
      { faction: "bear", tag: "B", memberCount: 0, totalGlory: 10 },
    ]);
    expect(st[0]!.race.id).toBe("frog");
    expect(st[0]!.held).toBe(1);
    expect(st).toHaveLength(12);
  });
});
