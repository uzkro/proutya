// Putya's favor: a pure 0–100 score that only drives her mood and lines.
// It never changes rewards — the game must not promise bonuses it doesn't pay.
import type { PutyaEvent, PutyaMood } from "./voice";

export type FavorInput = {
  dailyStreak: number;
  energy: number;
  maxEnergy: number;
  lastDailyClaim: number;
  totalNukesLaunched?: number;
  /** Today's event heat from `heatDelta`, clamped to ±HEAT_CAP. */
  heat?: number;
  now?: number;
};

export const FAVOR_BASE = 50;
export const STREAK_POINTS = 4;
export const STREAK_CAP = 20;
export const DAILY_CLAIM_POINTS = 5;
export const ENERGY_CAPPED_PENALTY = 8;
export const NUKER_POINTS = 5;
export const HEAT_CAP = 25;
export const DOTING_AT = 70;
export const COLD_BELOW = 35;

/** How much one game moment warms (or cools) her today. */
export const HEAT: Partial<Record<PutyaEvent, number>> = {
  battleWin: 6,
  capture: 6,
  dailyClaim: 5,
  nukeLaunched: 5,
  victory: 4,
  questDone: 3,
  swap: 2,
  terrorist: -3,
  battleLoss: -4,
  defeat: -4,
  energyFull: -5,
};

export function heatDelta(event: PutyaEvent): number {
  return HEAT[event] ?? 0;
}

export function clampHeat(h: number): number {
  return Math.max(-HEAT_CAP, Math.min(HEAT_CAP, h));
}

const dayOf = (ms: number) => Math.floor(ms / 86_400_000);

export function computeFavor(i: FavorInput): number {
  const now = i.now ?? Date.now();
  let f = FAVOR_BASE;
  f += Math.min(STREAK_CAP, Math.max(0, i.dailyStreak) * STREAK_POINTS);
  if (i.lastDailyClaim > 0 && dayOf(i.lastDailyClaim) === dayOf(now)) f += DAILY_CLAIM_POINTS;
  if (i.energy >= i.maxEnergy) f -= ENERGY_CAPPED_PENALTY;
  if ((i.totalNukesLaunched ?? 0) > 0) f += NUKER_POINTS;
  f += clampHeat(i.heat ?? 0);
  return Math.max(0, Math.min(100, Math.round(f)));
}

export function moodFor(favor: number): PutyaMood {
  if (favor >= DOTING_AT) return "doting";
  if (favor < COLD_BELOW) return "cold";
  return "sassy";
}

export const MOOD_LABEL: Record<PutyaMood, string> = {
  doting: "Smitten",
  sassy: "Sassy",
  cold: "Unimpressed",
};
