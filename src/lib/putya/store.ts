// Browser-only Putya storage: today's favor heat and once-a-day flags.
import { clampHeat, heatDelta } from "./favor";
import type { PutyaEvent } from "./voice";

const today = () => new Date().toISOString().slice(0, 10);
const HEAT_KEY = () => `won:putya:heat:${today()}`;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, v: string) {
  try {
    window.localStorage.setItem(key, v);
  } catch {
    /* storage blocked */
  }
}

export function readHeat(): number {
  const n = Number(read(HEAT_KEY()) ?? 0);
  return Number.isFinite(n) ? clampHeat(n) : 0;
}

export function bumpHeat(event: PutyaEvent): number {
  const d = heatDelta(event);
  if (!d) return readHeat();
  const next = clampHeat(readHeat() + d);
  write(HEAT_KEY(), String(next));
  return next;
}

/** True the first time it's called for `flag` today. */
export function onceToday(flag: string): boolean {
  const key = `won:putya:${flag}:${today()}`;
  if (read(key)) return false;
  write(key, "1");
  return true;
}

/** Add raw favor heat (tent dialogues). */
export function addHeat(points: number): number {
  const next = clampHeat(readHeat() + points);
  write(HEAT_KEY(), String(next));
  return next;
}
