import { describe, it, expect } from "vitest";
import { admitToken, venuePriority } from "./launchpad-filter";

const ok = { launchpad: "groyp" as const, totalSupply: 1_000_000_000, adminAddress: null, lpBurnedOrLockedShare: 1 };

describe("anti-rug admission", () => {
  it("admits a clean Groyp coin with its badge", () => {
    const a = admitToken(ok);
    expect(a.admitted).toBe(true);
    expect(a.badge).toBe("Groyp Pad");
  });
  it("accepts the zero address as a dead admin", () => {
    expect(admitToken({ ...ok, adminAddress: `0:${"0".repeat(64)}` }).admitted).toBe(true);
  });
  it("rejects unknown launchpads", () => expect(admitToken({ ...ok, launchpad: null }).admitted).toBe(false));
  it("rejects non-standard supply", () => expect(admitToken({ ...ok, totalSupply: 420_000_000 }).admitted).toBe(false));
  it("accepts 100M supply", () => expect(admitToken({ ...ok, totalSupply: 100_000_000 }).admitted).toBe(true));
  it("rejects a live admin key", () => expect(admitToken({ ...ok, adminAddress: "0:" + "1".repeat(64) }).admitted).toBe(false));
  it("rejects unreadable admin", () => expect(admitToken({ ...ok, adminAddress: undefined }).admitted).toBe(false));
  it("rejects partly unlocked LP", () => expect(admitToken({ ...ok, lpBurnedOrLockedShare: 0.9 }).admitted).toBe(false));
  it("prefers DeDust then STON.fi v2", () => {
    expect(venuePriority("DeDust")).toBe(0);
    expect(venuePriority("stonfi_v2")).toBe(1);
    expect(venuePriority("other")).toBe(2);
  });
});
