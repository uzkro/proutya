// Faction combat perk (pure): sending a battle into one of your race's own coins ("home coin")
// triggers the race perk for +10% season points at settlement. Same rule drives the battle badge.
import { ALL_RACES, type Race } from "./races";

export const HOME_COIN_BONUS = 0.1;

/** Race whose coin list contains this symbol, or null. */
export function raceForCoin(symbol: string | null | undefined): Race | null {
  const s = (symbol ?? "").toUpperCase().replace(/^\$/, "");
  if (!s) return null;
  return ALL_RACES.find((r) => r.coins.includes(s)) ?? null;
}

/** Points multiplier: ×1.10 when the destination coin is a home coin, otherwise ×1. */
export function factionPerkMult(toSymbol: string | null | undefined): number {
  return raceForCoin(toSymbol) ? 1 + HOME_COIN_BONUS : 1;
}
