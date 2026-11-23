// Memecoin-lore names for the 10x10 War Map blocks; the A1-1 grid code stays the canonical id.
export const LORE_REGIONS = [
  "The Doge Den", "Pepe Swamps", "Ape Jungle", "Hamster Warrens", "Mog Sanctuary",
  "Bonk Citadel", "Floki Tundra", "Popcat Shore", "Shiba Steppes", "Wojak Wastes",
] as const;
const SUFFIX = ["Gate", "Outpost", "Ridge", "Trench", "Bastion", "Market", "Crater", "Docks", "Spire", "Vault"] as const;

/** Lore name for a block (bx, by in 0..9): region by column, landmark by row. */
export const blockLoreName = (bx: number, by: number) =>
  by === 0 ? LORE_REGIONS[bx % 10]! : `${LORE_REGIONS[bx % 10]} ${SUFFIX[by % 10]}`;
