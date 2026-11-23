// Pure mapping from DEX/market names to the venue badge shown on coin logos.
export type BadgeVenue = "stonfi" | "dedust" | "tonco" | "x1000" | "coffee" | "unknown";

/** Normalise a DEX name or id (e.g. "STON.fi v2", "dedust", "swap.coffee") to a badge venue. */
export function venueOf(name: string | null | undefined): BadgeVenue {
  const s = (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!s) return "unknown";
  if (s.startsWith("ston")) return "stonfi";
  if (s.startsWith("dedust")) return "dedust";
  if (s.startsWith("tonco")) return "tonco";
  if (s.startsWith("x1000") || s.includes("uranus")) return "x1000";
  if (s.includes("coffee")) return "coffee";
  return "unknown";
}

export const VENUE_LABEL: Record<Exclude<BadgeVenue, "unknown">, string> = {
  stonfi: "STON.fi", dedust: "DeDust", tonco: "TONCO", x1000: "x1000", coffee: "swap.coffee",
};
