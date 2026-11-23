import { describe, it, expect } from "vitest";
import { reminderText, radiationStep } from "./reminders";
describe("Putya reminders", () => {
  it("plain text when Putya is off", () => expect(reminderText("daily_ready", { enabled: false })).toContain("daily bonus"));
  it("Putya signs when on", () => expect(reminderText("energy_full", { enabled: true })).toContain("Putya"));
  it("radiation steps", () => {
    expect(radiationStep(49)).toBe(0);
    expect(radiationStep(50)).toBe(50);
    expect(radiationStep(80)).toBe(75);
    expect(radiationStep(95)).toBe(90);
  });
});
