import { describe, expect, it } from "vitest";
import { ALL_RACES, raceForTag, resolveRace, raceStandings, isRaceId } from "./races";

describe("animal factions", () => {
  it("has 12 races including pigs, bears and fish", () => {
    expect(ALL_RACES).toHaveLength(12);
    for (const id of ["pig", "bear", "fish", "duck", "rat", "rooster"]) expect(isRaceId(id)).toBe(true);
  });
  it("ties hubs to dogs and cats", () => {
    expect(raceForTag("DOG")).toBe("wardog");
    expect(raceForTag("CAT")).toBe("warcat");
  });
  it("gives every sector a fixed race", () => {
    expect(raceForTag("USA")).toBe(raceForTag("usa"));
    expect(isRaceId(raceForTag("ZZZ"))).toBe(true);
  });
  it("keeps a stored alignment over the sector default", () => {
    expect(resolveRace("bear", "DOG")).toBe("bear");
    expect(resolveRace("nonsense", "DOG")).toBe("wardog");
  });
  it("ranks races by glory and counts held sectors", () => {
    const s = raceStandings([
      { faction: "pig", tag: "A", memberCount: 2, totalGlory: 50 },
      { faction: "pig", tag: "B", memberCount: 0, totalGlory: 0 },
      { faction: "fish", tag: "C", memberCount: 1, totalGlory: 90 },
    ]);
    expect(s[0]!.race.id).toBe("fish");
    expect(s[1]).toMatchObject({ sectors: 2, held: 1, members: 2, glory: 50 });
  });
});
