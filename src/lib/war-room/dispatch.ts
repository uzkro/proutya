// Pure War Correspondent: turns public War Room data into a short daily
// dispatch in military voice. Uses only aggregated, non-personal data.
export type DispatchInput = {
  sectors: { symbol: string; share?: number; change24h?: number | null }[];
  radiation: { level: number; label?: string } | null;
  combat: { hit: boolean; glory: number }[];
  whales: { symbol: string; usd: number; side: "buy" | "sell" }[];
  survivors: { symbol: string }[];
};
export type Dispatch = { headline: string; lines: string[] };

const usd = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${Math.round(n / 1e3)}K` : `$${Math.round(n)}`);

export function buildDispatch(d: DispatchInput): Dispatch {
  const lines: string[] = [];
  const lead = [...d.sectors].sort((x, y) => (y.share ?? 0) - (x.share ?? 0))[0];
  const moved = d.sectors.filter((s) => typeof s.change24h === "number");
  const best = [...moved].sort((x, y) => (y.change24h as number) - (x.change24h as number))[0];
  const worst = [...moved].sort((x, y) => (x.change24h as number) - (y.change24h as number))[0];
  if (lead) lines.push(`$${lead.symbol} holds the most ground on the front.`);
  if (best && (best.change24h as number) >= 5) lines.push(`$${best.symbol} surges ${(best.change24h as number).toFixed(1)}% — overcharge in effect.`);
  if (worst && (worst.change24h as number) <= -5) lines.push(`$${worst.symbol} bleeds ${Math.abs(worst.change24h as number).toFixed(1)}% — radiation spreading in its trenches.`);
  const hits = d.combat.filter((c) => c.hit);
  if (d.combat.length) lines.push(`${hits.length} of ${d.combat.length} recent strikes landed for ${hits.reduce((s, c) => s + c.glory, 0)} glory.`);
  const whale = [...d.whales].sort((x, y) => y.usd - x.usd)[0];
  if (whale) lines.push(`Whale ${whale.side === "buy" ? "reinforcement" : "retreat"}: ${usd(whale.usd)} on $${whale.symbol}.`);
  if (d.survivors[0]) lines.push(`Apex survivor: $${d.survivors[0].symbol} leads the Doomsday standings.`);
  const rad = d.radiation?.level ?? 0;
  const headline = rad >= 70 ? "Fallout warning: the front is burning" : lead ? `$${lead.symbol} commands the battlefield` : "All quiet on the front";
  if (!lines.length) lines.push("No fresh intel. Scouts are still out.");
  return { headline, lines: lines.slice(0, 5) };
}
