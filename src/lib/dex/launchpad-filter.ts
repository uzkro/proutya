// Zero-trust Coin Board admission (pure). A coin is admitted only when every
// check passes; anything unknown is rejected, never assumed safe.
import { isCanonicalBurnAddress as isBurnAddress } from "@/lib/onchain/burn-address";

export type LaunchpadId = "groyp" | "x1000" | "blum" | "topblast" | "tonfun";

export const LAUNCHPADS: Record<LaunchpadId, { badge: string }> = {
  groyp: { badge: "Groyp Pad" },
  x1000: { badge: "x1000 Fair" },
  blum: { badge: "Blum" },
  topblast: { badge: "TopBlast" },
  tonfun: { badge: "TON.fun" },
};

/** Fair-launch supplies in whole tokens. */
export const FAIR_SUPPLIES = [100_000_000, 1_000_000_000] as const;

export type AdmissionInput = {
  launchpad: LaunchpadId | null;
  /** Total supply in whole tokens (already divided by decimals). */
  totalSupply: number | null;
  /** Jetton master admin; null = renounced. undefined = unreadable. */
  adminAddress: string | null | undefined;
  /** Share of pool LP sent to the burn address or a launchpad timelock, 0–1. */
  lpBurnedOrLockedShare: number | null;
};

export type Admission = {
  admitted: boolean;
  reasons: string[];
  badge: string | null;
  lpBurned: boolean;
  devKeyDead: boolean;
};

export function isFairSupply(s: number | null): boolean {
  return s != null && (FAIR_SUPPLIES as readonly number[]).includes(Math.round(s));
}

export function isDevKeyDead(admin: string | null | undefined): boolean {
  if (admin === null) return true;
  if (admin === undefined) return false;
  return isBurnAddress(admin);
}

export function admitToken(i: AdmissionInput): Admission {
  const reasons: string[] = [];
  if (!i.launchpad) reasons.push("Not from a verified launchpad");
  if (!isFairSupply(i.totalSupply)) reasons.push("Supply is not a fixed 100M or 1B");
  const devKeyDead = isDevKeyDead(i.adminAddress);
  if (!devKeyDead) reasons.push("Dev can still mint or edit the coin");
  const lpBurned = i.lpBurnedOrLockedShare != null && i.lpBurnedOrLockedShare >= 0.999;
  if (!lpBurned) reasons.push("Liquidity is not 100% burned or locked");
  return { admitted: reasons.length === 0, reasons, badge: i.launchpad ? LAUNCHPADS[i.launchpad].badge : null, lpBurned, devKeyDead };
}

/** DEX priority: DeDust first, then verified STON.fi v2, then the rest. */
export function venuePriority(venue: string): number {
  const v = venue.toLowerCase();
  if (v.includes("dedust")) return 0;
  if (v.includes("ston") && v.includes("v2")) return 1;
  return 2;
}
