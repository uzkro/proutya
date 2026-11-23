// Syndicate Armory tactical utilities: pure, browser-safe rules. The server applies
// effects only after verified settlement; the UI only shows what is listed here, and
// every blurb restates a rule the server actually enforces.
import { wardogPrice } from "@/lib/money/wardog-pricing";

export type UtilityId = "recon_drone" | "emp_jammer" | "bunker_overdrive" | "supply_crate";
export type EffectId = Exclude<UtilityId, "supply_crate">;
export type CrateTier = "scout" | "veteran" | "warlord";
export type ArmoryItemId = EffectId | `crate_${CrateTier}`;
export type ArmoryPayWith = "wardog" | "stars";

export type Utility = {
  id: EffectId;
  name: string;
  emoji: string;
  blurb: string;
  /** List price in WARDOG; paying with WARDOG takes 20% off. */
  listWardog: number;
  /** Telegram Stars price (no discount). */
  stars: number;
  durationMs: number;
};

const MIN = 60_000;
/** Extra OPS strike hit chance (absolute) while a Recon Drone flies. */
export const RECON_HIT_BONUS = 0.1;
/** Coin Board battle points bonus while Bunker Overdrive runs. */
export const BUNKER_OVERDRIVE_BONUS = 0.25;

export const UTILITIES: Record<EffectId, Utility> = {
  recon_drone: { id: "recon_drone", name: "Recon Drone", emoji: "🛰️", blurb: "+10% OPS strike hit chance for 60 min", listWardog: 1_000, stars: 50, durationMs: 60 * MIN },
  emp_jammer: { id: "emp_jammer", name: "Citadel EMP Jammer", emoji: "⚡", blurb: "Jams every incoming OPS strike for 2 h", listWardog: 2_500, stars: 120, durationMs: 120 * MIN },
  bunker_overdrive: { id: "bunker_overdrive", name: "Bunker Overdrive", emoji: "☢️", blurb: "+25% Coin Board battle points for 2 h", listWardog: 2_000, stars: 100, durationMs: 120 * MIN },
};
export const EFFECT_IDS = Object.keys(UTILITIES) as EffectId[];

export const CRATES: Record<CrateTier, { name: string; emoji: string; listWardog: number; stars: number; rolls: number }> = {
  scout: { name: "Scout Crate", emoji: "📦", listWardog: 500, stars: 25, rolls: 1 },
  veteran: { name: "Veteran Crate", emoji: "🎁", listWardog: 2_000, stars: 90, rolls: 3 },
  warlord: { name: "Warlord Crate", emoji: "💀", listWardog: 6_000, stars: 250, rolls: 5 },
};
export const CRATE_TIERS = Object.keys(CRATES) as CrateTier[];

export type CrateLoot = { kind: "glory" | EffectId; amount: number; rarity: "common" | "rare" | "epic" };
/** Loot table: weights sum to 100. */
export const LOOT: Array<CrateLoot & { weight: number }> = [
  { kind: "glory", amount: 50, rarity: "common", weight: 55 },
  { kind: "glory", amount: 250, rarity: "rare", weight: 20 },
  { kind: "recon_drone", amount: 1, rarity: "rare", weight: 12 },
  { kind: "bunker_overdrive", amount: 1, rarity: "rare", weight: 8 },
  { kind: "emp_jammer", amount: 1, rarity: "epic", weight: 5 },
];

/** Deterministic roll from server-provided random numbers in [0,1). */
export function rollCrate(tier: CrateTier, randoms: number[]): CrateLoot[] {
  const out: CrateLoot[] = [];
  for (let i = 0; i < CRATES[tier].rolls; i++) {
    const r = Math.min(0.999999, Math.max(0, randoms[i] ?? 0)) * 100;
    let acc = 0;
    const hit = LOOT.find((l) => (acc += l.weight) > r) ?? LOOT[0]!;
    out.push({ kind: hit.kind, amount: hit.amount, rarity: hit.rarity });
  }
  return out;
}

export function utilityPrice(listWardog: number, payWith: ArmoryPayWith, stars: number) {
  return payWith === "wardog" ? { amount: wardogPrice(listWardog), currency: "WARDOG" as const } : { amount: stars, currency: "XTR" as const };
}

export const isEffectId = (v: string): v is EffectId => v in UTILITIES;
export const crateTierOf = (item: string): CrateTier | null => {
  const t = item.startsWith("crate_") ? item.slice(6) : "";
  return t in CRATES ? (t as CrateTier) : null;
};
export const isArmoryItem = (v: string): v is ArmoryItemId => isEffectId(v) || crateTierOf(v) !== null;

/** Catalog entry for any purchasable item. */
export function armoryItem(item: ArmoryItemId): { name: string; emoji: string; listWardog: number; stars: number } {
  const tier = crateTierOf(item);
  return tier ? CRATES[tier] : UTILITIES[item as EffectId];
}

export function armoryPrice(item: ArmoryItemId, payWith: ArmoryPayWith) {
  const c = armoryItem(item);
  return utilityPrice(c.listWardog, payWith, c.stars);
}

/** True while an effect bought at `startedAt` is still running. */
export function isActive(startedAt: number, durationMs: number, now: number) {
  return now >= startedAt && now < startedAt + durationMs;
}

/** Stacking: a new activation adds its duration after whatever time is left. */
export function extendedExpiry(currentExpiresAt: number | null, now: number, durationMs: number) {
  return Math.max(now, currentExpiresAt ?? 0) + durationMs;
}

/** OPS strike hit chance with a Recon Drone in the air (capped at 95%). */
export function reconHitChance(base: number, reconActive: boolean) {
  return reconActive ? Math.min(0.95, base + RECON_HIT_BONUS) : base;
}

/** Points multiplier from Bunker Overdrive. */
export const overdriveMult = (active: boolean) => (active ? 1 + BUNKER_OVERDRIVE_BONUS : 1);

/** Stars invoice payload; Telegram echoes it back on pre-checkout and payment. */
export const starsPayload = (orderId: string) => `ARMORY:${orderId}`;
export function parseStarsPayload(payload: string): string | null {
  const m = /^ARMORY:([0-9a-f-]{36})$/.exec(payload);
  return m ? m[1]! : null;
}

/** Pending Stars orders older than this are refused at pre-checkout (no charge). */
export const STARS_ORDER_TTL_MS = 30 * MIN;
