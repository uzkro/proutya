import { describe, expect, it } from "vitest";
import { venueOf } from "@/lib/dex/venue-badge";

describe("venue badge mapping", () => {
  it("maps known DEX names", () => {
    expect(venueOf("STON.fi v2")).toBe("stonfi");
    expect(venueOf("DeDust")).toBe("dedust");
    expect(venueOf("tonco")).toBe("tonco");
    expect(venueOf("x1000")).toBe("x1000");
    expect(venueOf("swap.coffee")).toBe("coffee");
  });
  it("unknown venue gets no badge", () => {
    expect(venueOf("megaswap")).toBe("unknown");
    expect(venueOf(null)).toBe("unknown");
  });
});
