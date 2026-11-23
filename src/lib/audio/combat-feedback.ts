// Which sound + Telegram haptic each major combat moment gets (pure mapping).
import type { PutyaEvent } from "@/lib/putya/voice";

export type CombatSound = "nuke" | "capture" | "fanfare" | "alarm" | "impact" | "error";
export type CombatHaptic = "heavy" | "medium" | "success" | "warning" | "error";

export const COMBAT_FEEDBACK: Partial<Record<PutyaEvent, { sound: CombatSound; haptic: CombatHaptic }>> = {
  nukeLaunched: { sound: "nuke", haptic: "heavy" },
  nukeIncoming: { sound: "alarm", haptic: "warning" },
  terrorist: { sound: "alarm", haptic: "warning" },
  capture: { sound: "capture", haptic: "success" },
  battleWin: { sound: "fanfare", haptic: "success" },
  victory: { sound: "fanfare", haptic: "success" },
  battleLoss: { sound: "error", haptic: "error" },
  defeat: { sound: "error", haptic: "error" },
};

export function combatFeedback(event: PutyaEvent) {
  return COMBAT_FEEDBACK[event] ?? null;
}
