// Pure treaty rules: non-aggression pacts between Syndicates and the
// Oathbreaker penalty for attacking a partner while a pact is active.
export const TREATY_MIN_HOURS = 24;
export const TREATY_MAX_HOURS = 24 * 7;
export const OATHBREAKER_HOURS = 24;
export const OATHBREAKER_MULT = 0.75;

export type Treaty = { a: number; b: number; startsAt: number; endsAt: number; brokenBy: number | null };

const H = 3_600_000;

export function treatyDurationOk(hours: number): boolean {
  return Number.isFinite(hours) && hours >= TREATY_MIN_HOURS && hours <= TREATY_MAX_HOURS;
}

export function isActive(t: Treaty, now: number): boolean {
  return t.brokenBy === null && now >= t.startsAt && now < t.endsAt;
}

/** The active pact (if any) that an attack from `attacker` on `defender` would break. */
export function breachedTreaty(treaties: Treaty[], attacker: number, defender: number, now: number): Treaty | null {
  if (attacker === defender) return null;
  return treaties.find((t) => isActive(t, now) && ((t.a === attacker && t.b === defender) || (t.a === defender && t.b === attacker))) ?? null;
}

/** Glory multiplier for a Syndicate that broke a pact at `brokenAt` (null = never). */
export function oathbreakerMult(brokenAt: number | null, now: number): number {
  if (brokenAt === null) return 1;
  return now >= brokenAt && now < brokenAt + OATHBREAKER_HOURS * H ? OATHBREAKER_MULT : 1;
}
