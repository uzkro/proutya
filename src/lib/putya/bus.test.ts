import { describe, expect, it, vi } from "vitest";
vi.mock("sonner", () => { const t = Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }); return { toast: t }; });
import { toast } from "sonner";
import { putyaSay, subscribePutya } from "./bus";

describe("putya bus", () => {
  it("falls back to a toast when nobody listens", () => {
    expect(putyaSay("dailyClaim", { tone: "good", detail: "+100 Glory" })).toBeNull();
    expect(toast.success).toHaveBeenCalledWith("+100 Glory");
  });
  it("delivers to subscribers with the fact attached", () => {
    const got: string[] = [];
    const off = subscribePutya((m) => got.push(m.detail ?? ""));
    putyaSay("battleWin", { detail: "strike sent" });
    off();
    expect(got).toEqual(["strike sent"]);
  });
});
