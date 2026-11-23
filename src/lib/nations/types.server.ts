/**
 * Server-only Nations types and static country data.
 * Phase 1: protection, contribution & redemption fields.
 * Phase 2: faction alignment (wardog | warcat | null).
 */

export type NationFaction = "wardog" | "warcat";

export interface NationRow {
  id: number;
  name: string;
  tag: string;
  emblem: string;
  leaderId: number | null;
  isDefault: boolean;
  totalGlory: number;
  memberCount: number;
  listedPrice: number | null;
  listedAt: string | null;
  vaultWardog?: number;
  vaultWarcat?: number;
  reputation?: number;
  activeBuff?: string | null;
  buffExpiresAt?: string | null;
  /** Sum of nukesOwned across all members of this nation */
  nukesOwnedTotal?: number;
  /** How many times this nation has been nuked */
  timesNuked?: number;
  // Phase 1
  isProtected?: boolean;
  protectionExpiresAt?: string | null;
  joinContributionWardog?: number;
  joinContributionWarcat?: number;
  redemptionPriceWardog?: number;
  redemptionPriceWarcat?: number;
  // Phase 2
  faction?: NationFaction | null;
}

export interface NationMember {
  userId: number;
  username: string | null;
  firstName: string | null;
  role: "leader" | "officer" | "member";
  weeklyGlory: number;
  glory: number;
  isTraitor?: boolean;
}

export interface NationDetails {
  id: number;
  name: string;
  tag: string;
  emblem: string;
  leaderId: number | null;
  isDefault: boolean;
  totalGlory: number;
  memberCount: number;
  listedPrice: number | null;
  listedAt: string | null;
  vaultWardog: number;
  vaultWarcat: number;
  reputation: number;
  /** Citadel Fortification level (0–5). */
  citadelLevel?: number;
  activeBuff: string | null;
  buffExpiresAt: string | null;
  lastNukeReceivedAt?: string | null;
  lastNukeLaunchedAt?: string | null;
  // Phase 1
  isProtected: boolean;
  protectionExpiresAt: string | null;
  joinContributionWardog: number;
  joinContributionWarcat: number;
  redemptionPriceWardog: number;
  redemptionPriceWarcat: number;
  // Phase 2
  faction: NationFaction | null;
  leader: {
    userId: number;
    username: string | null;
    firstName: string | null;
    isTraitor?: boolean;
  } | null;
  topMembers: NationMember[];
  myRole: "leader" | "officer" | "member" | null;
  isMember: boolean;
  canClaim: boolean;
  canBuy: boolean;
}

export interface NationRankRow {
  id: number;
  name: string;
  tag: string;
  emblem: string;
  isDefault: boolean;
  totalGlory: number;
  memberCount: number;
  leaderName: string | null;
  reputation?: number;
  faction?: NationFaction | null;
}

export const COUNTRY_NATIONS: { name: string; tag: string; emblem: string }[] = [
  { name: "Murad's Cult", tag: "MURAD", emblem: "🛐" },
  { name: "Ansem's Raiders", tag: "ANSEM", emblem: "⚔️" },
  { name: "TON Diamond Hands", tag: "TONDH", emblem: "💎" },
  { name: "Pepe Cartel", tag: "PEPE", emblem: "🐸" },
  { name: "Doge Legion", tag: "DOGE", emblem: "🐕" },
  { name: "Putya Army", tag: "PUTYA", emblem: "🎖️" },
  { name: "Solana Migrants", tag: "SOLMG", emblem: "🌅" },
  { name: "Whale Cartel", tag: "WHALE", emblem: "🐋" },
  { name: "Notcoin Horde", tag: "NOT", emblem: "🟡" },
  { name: "Degen Snipers", tag: "SNIPE", emblem: "🎯" },
  { name: "Jeet Hunters", tag: "JEETH", emblem: "🪓" },
  { name: "Bonk Brigade", tag: "BONK", emblem: "🔨" },
  { name: "Rug Watch", tag: "RUGW", emblem: "🛡️" },
  { name: "Moon Mission", tag: "MOON", emblem: "🚀" },
  { name: "Ape Syndicate", tag: "APE", emblem: "🦍" },
  { name: "Frog Nation", tag: "FROG", emblem: "🐊" },
];

/** Legacy UN-country tags from War On Nations; empty ones are retired on seed. */
export const LEGACY_COUNTRY_TAGS: string[] = ["US", "CA", "MX", "BR", "AR", "CO", "CL", "PE", "VE", "EC", "BO", "PY", "UY", "CR", "PA", "GT", "HN", "SV", "NI", "CU", "DO", "HT", "JM", "TT", "BS", "BB", "BZ", "GY", "SR", "AG", "DM", "GD", "KN", "LC", "VC", "GB", "DE", "FR", "IT", "ES", "PL", "NL", "BE", "SE", "NO", "DK", "FI", "CH", "AT", "PT", "GR", "CZ", "RO", "HU", "UA", "IE", "HR", "RS", "BG", "SK", "LT", "LV", "EE", "SI", "BA", "MK", "AL", "ME", "XK", "MD", "BY", "IS", "LU", "MT", "CY", "AD", "MC", "LI", "SM", "VA", "RU", "CN", "IN", "JP", "KR", "KP", "ID", "TR", "SA", "IR", "IQ", "PK", "BD", "PH", "VN", "TH", "MY", "SG", "AE", "IL", "PS", "QA", "KW", "BH", "OM", "YE", "JO", "LB", "SY", "KZ", "UZ", "TM", "KG", "TJ", "AF", "MM", "KH", "LA", "NP", "LK", "BT", "MV", "MN", "BN", "TL", "TW", "HK", "MO", "GE", "AM", "AZ", "ZA", "NG", "EG", "ET", "KE", "GH", "MA", "DZ", "TN", "LY", "SD", "SS", "AO", "TZ", "UG", "CD", "CG", "CM", "CI", "SN", "ML", "BF", "NE", "TD", "SO", "ZW", "ZM", "MZ", "MG", "BW", "NA", "RW", "BI", "MW", "MU", "SC", "GA", "GQ", "GN", "GW", "SL", "LR", "TG", "BJ", "MR", "GM", "ER", "DJ", "KM", "CV", "ST", "LS", "SZ", "CF", "AU", "NZ", "PG", "FJ", "SB", "VU", "WS", "TO", "KI", "FM", "MH", "PW", "NR", "TV"];
