// Plays the sound + haptic for a combat moment (browser only).
import type { PutyaEvent } from "@/lib/putya/voice";
import { combatFeedback } from "./combat-feedback";
import { playAlarm, playError, playHeavyImpact, playNukeExplosion, playSectorCapture, playVictoryFanfare } from "@/lib/sounds";
import { haptic, hapticNotify } from "@/lib/telegram";

const SOUND = { nuke: playNukeExplosion, capture: playSectorCapture, fanfare: playVictoryFanfare, alarm: playAlarm, impact: playHeavyImpact, error: playError };

export function playCombatFeedback(event: PutyaEvent) {
  const fx = combatFeedback(event);
  if (!fx) return;
  try {
    SOUND[fx.sound]();
  } catch {
    /* audio blocked */
  }
  if (fx.haptic === "heavy" || fx.haptic === "medium") haptic(fx.haptic);
  else hapticNotify(fx.haptic);
}
