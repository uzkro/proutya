import { describe, expect, it } from "vitest";
import { putyaLine } from "./voice";
import { PUTYA_ENABLED } from "@/lib/config/features";

describe("putya voice", () => {
  it("ships switched on", () => expect(PUTYA_ENABLED).toBe(true));
  it("speaks by default", () => expect(typeof putyaLine("victory")).toBe("string"));
  it("stays silent when explicitly disabled", () => expect(putyaLine("victory", { enabled: false })).toBeNull());
  it("speaks when enabled", () => expect(putyaLine("victory", { enabled: true, seed: 1 })).toBe("That's my good boy."));
  it("wild mode uses the chaotic voice", () => expect(putyaLine("defeat", { enabled: true, wild: true })).toMatch(/counterattack/));
  it("every mood has a battle-win line", () => {
    for (const mood of ["doting", "sassy", "cold"] as const) expect(putyaLine("battleWin", { mood, seed: 0 })).toBeTruthy();
  });
});
