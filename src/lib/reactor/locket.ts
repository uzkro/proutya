// Locket Core reactor (pure): how protocol revenue is split and shared.
export const PARTNER_FEE_BPS = 35;
export const FEE_TO_LOCKET_SHARE = 0.5;
export const SLASHED_BOND_TO_LOCKET_SHARE = 1;

/** Partner fee taken from a swap's output; player keeps the rest. */
export function splitSwapOutput(amountOut: number) {
  const fee = (amountOut * PARTNER_FEE_BPS) / 10_000;
  return { player: amountOut - fee, treasury: fee };
}

/** Amount routed into $LOCKET from collected fees and slashed call bonds. */
export function locketInflow(feesGram: number, slashedBonds: number) {
  return { fromFees: feesGram * FEE_TO_LOCKET_SHARE, fromBonds: slashedBonds * SLASHED_BOND_TO_LOCKET_SHARE };
}

/** Share a GRAM reflection pot by weekly map control + bunker defense weight. */
export function shareReflections(pot: number, weights: { id: string; map: number; defense: number }[]) {
  const w = weights.map((x) => ({ id: x.id, w: Math.max(0, x.map) + Math.max(0, x.defense) }));
  const total = w.reduce((s, x) => s + x.w, 0);
  return w.map((x) => ({ id: x.id, amount: total > 0 ? (pot * x.w) / total : 0 }));
}

/** Simple yearly yield from 24h GRAM generated vs reserve value (both in GRAM). */
export function reactorApy(gram24h: number, reserveGram: number): number {
  return reserveGram > 0 ? (gram24h * 365 * 100) / reserveGram : 0;
}
