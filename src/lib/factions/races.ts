/**
 * Animal Factions (pure): the 12 memecoin races of the free-for-all.
 * Every sector (legacy "nation" row) belongs to exactly one race. The ids
 * "wardog" and "warcat" are kept so saved alignments keep working.
 */
export const RACE_IDS = [
  "wardog", "warcat", "frog", "duck", "rat", "rooster",
  "ape", "pig", "bear", "fish", "horse", "beast",
] as const;
export type RaceId = (typeof RACE_IDS)[number];

export type Race = {
  id: RaceId;
  name: string;
  short: string;
  emblem: string;
  coins: string[];
  perk: string;
  perkDesc: string;
  /** Theme token used for the badge text color */
  tone: "destructive" | "neon-cyan" | "neon-green" | "primary" | "accent" | "foreground";
};

export const RACES: Record<RaceId, Race> = {
  wardog: { id: "wardog", name: "Canine Syndicate", short: "DOGS", emblem: "🐶", coins: ["DOGS", "WARDOG", "SHIB", "BONK"], perk: "Pack Swarm", perkDesc: "Energy recovery and rally bonus", tone: "destructive" },
  warcat: { id: "warcat", name: "Feline Cabal", short: "CATS", emblem: "🐱", coins: ["CATS", "POPCAT", "MEW"], perk: "Nine Lives", perkDesc: "Critical evade and stealth ambush", tone: "neon-cyan" },
  frog: { id: "frog", name: "Amphibian Order", short: "FROGS", emblem: "🐸", coins: ["PEPE", "APU", "PLOMB"], perk: "Toxic Frenzy", perkDesc: "Lingering poison damage on strike", tone: "neon-green" },
  duck: { id: "duck", name: "Waterfowl Swarm", short: "DUCKS", emblem: "🦆", coins: ["DUCK", "QUACK"], perk: "Duck Dynasty", perkDesc: "Aerodynamic raids and rapid deployment", tone: "primary" },
  rat: { id: "rat", name: "Rodent Syndicate", short: "RATS", emblem: "🐀", coins: ["HAMSTER", "RAT"], perk: "Swarm Multiplexer", perkDesc: "Faster passive yield and burrow defense", tone: "foreground" },
  rooster: { id: "rooster", name: "Cockfight Cartel", short: "ROOSTERS", emblem: "🐔", coins: ["COQ", "CHICKEN"], perk: "Morning Screech", perkDesc: "Berserk rage multiplier at low health", tone: "accent" },
  ape: { id: "ape", name: "Primate Cartel", short: "APES", emblem: "🐵", coins: ["APE", "MONKE"], perk: "Gorilla Warfare", perkDesc: "Heavy citadel siege impact", tone: "primary" },
  pig: { id: "pig", name: "Pork Coalition", short: "PIGS", emblem: "🐷", coins: ["PIG", "BACON"], perk: "Mud Armor", perkDesc: "Blast damage reduction", tone: "accent" },
  bear: { id: "bear", name: "Ursine Legion", short: "BEARS", emblem: "🐻", coins: ["BEAR"], perk: "Hibernation Shield", perkDesc: "Fortress regeneration and bear-trap retaliation", tone: "foreground" },
  fish: { id: "fish", name: "Aquatic Horde", short: "FISH", emblem: "🐟", coins: ["SHARK", "FISH"], perk: "Deep Sea Surge", perkDesc: "Surprise raid bonus on contested borders", tone: "neon-cyan" },
  horse: { id: "horse", name: "Equine Front", short: "HORSES", emblem: "🐴", coins: ["HORSE"], perk: "Stampede Overrun", perkDesc: "Momentum streak bonus", tone: "destructive" },
  beast: { id: "beast", name: "Wild Beast Vanguard", short: "BEASTS", emblem: "🦛", coins: ["BULL", "MOO"], perk: "Unstoppable Charge", perkDesc: "Shield-piercing assault", tone: "neon-green" },
};

export const ALL_RACES: Race[] = RACE_IDS.map((id) => RACES[id]);

export function isRaceId(v: unknown): v is RaceId {
  return typeof v === "string" && (RACE_IDS as readonly string[]).includes(v);
}

/** Deterministic race for a sector tag, so every sector is tied to one faction. */
export function raceForTag(tag: string): RaceId {
  const t = tag.toUpperCase();
  if (t === "DOG") return "wardog";
  if (t === "CAT") return "warcat";
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0;
  return RACE_IDS[h % RACE_IDS.length]!;
}

/** Stored alignment wins; otherwise the sector's fixed race. */
export function resolveRace(stored: unknown, tag: string): RaceId {
  return isRaceId(stored) ? stored : raceForTag(tag);
}

export type RaceStanding = { race: Race; sectors: number; held: number; members: number; glory: number };

/** Free-for-all ladder: races ranked by total glory, then held sectors. */
export function raceStandings(
  sectors: { faction?: string | null; tag: string; memberCount: number; totalGlory: number }[],
): RaceStanding[] {
  const m = new Map<RaceId, RaceStanding>(ALL_RACES.map((r) => [r.id, { race: r, sectors: 0, held: 0, members: 0, glory: 0 }]));
  for (const s of sectors) {
    const st = m.get(resolveRace(s.faction, s.tag))!;
    st.sectors += 1;
    if (s.memberCount > 0) st.held += 1;
    st.members += s.memberCount;
    st.glory += s.totalGlory;
  }
  return [...m.values()].sort((a, b) => b.glory - a.glory || b.held - a.held || a.race.name.localeCompare(b.race.name));
}
