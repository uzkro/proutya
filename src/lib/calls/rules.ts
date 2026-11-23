// Pure rules for KOL "Proof-of-Commitment" coin calls.
export const CALL_DURATIONS = [24, 48] as const;
export const MIN_TARGET_PCT = 10;
export const MAX_TARGET_PCT = 500;
/** $WARDOG a caller must hold (verified on-chain) to open a call. */
export const MIN_COMMIT_WARDOG = 10_000;
export const MAX_OPEN_CALLS = 3;

export type CallStatus = "active" | "hit" | "rekt";

export function validateCall(i: { targetPct: number; durationHours: number; wardogHeld: number | null; openCalls: number }): string | null {
  if (!Number.isFinite(i.targetPct) || i.targetPct < MIN_TARGET_PCT || i.targetPct > MAX_TARGET_PCT) return `Target must be ${MIN_TARGET_PCT}–${MAX_TARGET_PCT}%`;
  if (!(CALL_DURATIONS as readonly number[]).includes(i.durationHours)) return "Duration must be 24h or 48h";
  if (i.wardogHeld == null) return "Connect a verified wallet to prove commitment";
  if (i.wardogHeld < MIN_COMMIT_WARDOG) return `Hold at least ${MIN_COMMIT_WARDOG.toLocaleString("en-US")} $WARDOG to make a call`;
  if (i.openCalls >= MAX_OPEN_CALLS) return `Max ${MAX_OPEN_CALLS} open calls at once`;
  return null;
}

/** Gain in percent from start to current price. */
export function gainPct(start: number, now: number): number {
  return start > 0 ? ((now - start) / start) * 100 : 0;
}

/** A call is hit as soon as the target is reached; rekt when time runs out first. */
export function settleCall(c: { startPrice: number; targetPct: number; expiresAt: number }, price: number | null, now: number): CallStatus {
  if (price != null && gainPct(c.startPrice, price) >= c.targetPct) return "hit";
  return now >= c.expiresAt ? "rekt" : "active";
}

/** Reputation change: bolder hits earn more, misses always cost. */
export function reputationDelta(status: CallStatus, targetPct: number): number {
  if (status === "hit") return Math.round(10 + targetPct / 10);
  if (status === "rekt") return -10;
  return 0;
}

/** Cabal glory awarded on a hit. */
export function gloryReward(status: CallStatus, targetPct: number): number {
  return status === "hit" ? Math.round(100 * (1 + targetPct / 100)) : 0;
}
