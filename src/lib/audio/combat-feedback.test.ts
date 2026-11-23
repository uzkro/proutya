import { describe, expect, it } from "vitest";
import { combatFeedback } from "./combat-feedback";

describe("combat feedback", () => {
  it("nuke strikes boom with a heavy buzz", () => expect(combatFeedback("nukeLaunched")).toEqual({ sound: "nuke", haptic: "heavy" }));
  it("sector captures chime with a success buzz", () => expect(combatFeedback("capture")).toEqual({ sound: "capture", haptic: "success" }));
  it("wins play the fanfare", () => expect(combatFeedback("battleWin")?.sound).toBe("fanfare"));
  it("incoming nukes raise the alarm", () => expect(combatFeedback("nukeIncoming")).toEqual({ sound: "alarm", haptic: "warning" }));
  it("chatter stays silent", () => expect(combatFeedback("greeting")).toBeNull());
});
