// Market-driven combat (pure, no I/O): a coin's real 24h price move and volume surge
// set its battle momentum. The multiplier is applied server-side at Coin Board
// battle settlement to points credited to the destination coin.
export type MomentumStatus = "overcharge" | "surge" | "steady" | "radiation" | "frenzy";
export type Momentum = { status: MomentumStatus; mult: number; label: string; blurb: string };

export const MOMENTUM_MIN = 0.9;
export const MOMENTUM_MAX = 1.4;

export function momentumFor(change24h: number | null | undefined, volumeX: number | null | undefined): Momentum {
  const c = Number.isFinite(change24h as number) ? (change24h as number) : 0;
  const v = Number.isFinite(volumeX as number) ? (volumeX as number) : 0;
  let mult = 1;
  let status: MomentumStatus = "steady";
  if (c >= 20) { mult = 1.25; status = "overcharge"; }
  else if (c >= 5) { mult = 1.1; status = "surge"; }
  else if (c <= -5) { mult = 0.9; status = "radiation"; }
  if (v >= 2 && status !== "radiation") { mult += 0.15; status = "frenzy"; }
  mult = Math.round(Math.min(MOMENTUM_MAX, Math.max(MOMENTUM_MIN, mult)) * 100) / 100;
  const pct = Math.round((mult - 1) * 100);
  const LABEL: Record<MomentumStatus, string> = { overcharge: "Overcharge", surge: "Surge", steady: "Steady", radiation: "Radiation", frenzy: "Frenzy" };
  const blurb = status === "steady" ? "No market modifier right now."
    : status === "radiation" ? `Dumping ${c.toFixed(1)}% — battles into this coin earn ${pct}% points.`
    : `Battles into this coin earn +${pct}% season points.`;
  return { status, mult, label: LABEL[status], blurb };
}

/** Rally text for sharing a coin with its current momentum. */
export function rallyText(symbol: string, change24h: number | null, m: Momentum): string {
  const move = change24h == null || !Number.isFinite(change24h) ? "" : ` (${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}% 24h)`;
  const s = symbol.replace(/^\$/, "").toUpperCase();
  if (m.status === "radiation") return `$${s}${move} is under radiation. Hold the line or retreat — War On Memecoins.`;
  if (m.status === "steady") return `Holding the line for $${s}${move}. Rally the squad in War On Memecoins.`;
  return `$${s}${move} is in ${m.label.toUpperCase()} mode — +${Math.round((m.mult - 1) * 100)}% battle points. Rally the squad!`;
}
