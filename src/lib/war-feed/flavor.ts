// Pure War Feed voice: turns one kill-feed row into a punchy line.
// Picks are seeded by row id so every player sees the same line.
import { putyaLine } from "@/lib/putya/voice";

export type FeedEvent = { id: number; weaponId: string; hit: boolean; attackerName: string; victimName: string; gloryGained: number; jailed?: boolean };

const VERB: Record<string, string[]> = {
  knife: ["shanked", "stabbed", "knifed"],
  pistol: ["shot", "popped", "capped"],
  rifle: ["sniped", "gunned down", "dropped"],
};
const MISS = ["whiffed on", "missed", "shot at air near"];
const TAG_HIT = ["Brutal.", "Clean kill.", "Pack it up.", "Medic!"];
const TAG_BIG = ["Absolute carnage.", "War crime energy.", "Legendary hit."];

const pick = <T,>(a: T[], seed: number): T => a[Math.abs(seed) % a.length] as T;

export function feedLine(e: FeedEvent, opts: { putya?: boolean } = {}): { text: string; quip: string | null } {
  if (e.jailed) return { text: `${e.attackerName} swung at protected Leader ${e.victimName} — JAILED`, quip: "Rookie mistake." };
  if (!e.hit) return { text: `${e.attackerName} ${pick(MISS, e.id)} ${e.victimName}`, quip: null };
  const verb = pick(VERB[e.weaponId] ?? ["hit"], e.id);
  const big = e.gloryGained >= 50;
  const quip = putyaLine("victory", { seed: e.id, ...(opts.putya !== undefined ? { enabled: opts.putya } : {}) }) ?? pick(big ? TAG_BIG : TAG_HIT, e.id);
  return { text: `${e.attackerName} ${verb} ${e.victimName} · +${e.gloryGained} glory`, quip };
}
