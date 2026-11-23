import { describe, it, expect } from "vitest";
import { readMuted, setMuted, isMuted, MUTE_KEY } from "@/lib/audio/mute";

function mem() { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } }; }

describe("master mute", () => {
  it("defaults to sound on", () => { expect(readMuted(mem())).toBe(false); });
  it("remembers mute across reloads", () => {
    const s = mem(); setMuted(true, s);
    expect(s.getItem(MUTE_KEY)).toBe("1"); expect(readMuted(s)).toBe(true); expect(isMuted()).toBe(true);
    setMuted(false, s); expect(readMuted(s)).toBe(false);
  });
});
