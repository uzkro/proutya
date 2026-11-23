// KOL / Cabal ranking: syndicates ordered by reputation, verified socials and community size.
import { getReputationTier } from "@/lib/constants";

export type KolInput = {
  id: number; name: string; tag: string; emblem: string;
  reputation: number; memberCount: number;
  xHandle?: string | null; tgLink?: string | null; discordLink?: string | null; devVerified?: boolean;
};

/** Number of linked community channels (0-3). */
export const socialCount = (n: KolInput) => [n.xHandle, n.tgLink, n.discordLink].filter(Boolean).length;

/** Presence score: reputation first, then +250 per linked channel, +500 Verified Dev, +10 per member. */
export function kolScore(n: KolInput): number {
  return Math.max(0, n.reputation) + socialCount(n) * 250 + (n.devVerified ? 500 : 0) + n.memberCount * 10;
}

export function rankKolSyndicates<T extends KolInput>(rows: T[], limit = 50) {
  return rows
    .map((n) => ({ ...n, score: kolScore(n), tier: getReputationTier(n.reputation || 0).tier, socials: socialCount(n) }))
    .sort((a, b) => b.score - a.score || b.reputation - a.reputation || a.name.localeCompare(b.name))
    .slice(0, limit);
}
