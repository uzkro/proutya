// Destress Tent: pure rules for resting with Putya.
// Resting speeds energy refill and trickles Glory; tent talks warm her favor.
import { MAX_ENERGY } from "@/lib/constants";

/** Energy refill while resting, on top of the normal refill: +1 per this many ms. */
export const TENT_ENERGY_MS = 60_000;
/** Passive Glory per full minute of rest. */
export const TENT_GLORY_PER_MIN = 2;
/** Rest stops paying after this long; come back and start again. */
export const TENT_MAX_REST_MS = 60 * 60_000;
/** Favor heat added per tent dialogue, and how many count per day. */
export const TENT_DIALOGUE_FAVOR = 3;
export const TENT_DIALOGUES_PER_DAY = 3;

export type RestOutcome = { minutes: number; energy: number; glory: number; capped: boolean };

export function restOutcome(startedAt: number, now: number, energy: number, maxEnergy = MAX_ENERGY): RestOutcome {
  const raw = Math.max(0, now - startedAt);
  const ms = Math.min(raw, TENT_MAX_REST_MS);
  const minutes = Math.floor(ms / 60_000);
  const room = Math.max(0, maxEnergy - Math.max(0, energy));
  return {
    minutes,
    energy: Math.min(room, Math.floor(ms / TENT_ENERGY_MS)),
    glory: minutes * TENT_GLORY_PER_MIN,
    capped: raw >= TENT_MAX_REST_MS,
  };
}

/** Favor heat a dialogue adds, given how many already counted today. */
export function dialogueFavor(usedToday: number): number {
  return usedToday < TENT_DIALOGUES_PER_DAY ? TENT_DIALOGUE_FAVOR : 0;
}

export type FavorRank = "recruit" | "confidante" | "empress";
export const CONFIDANTE_AT = 60;
export const EMPRESS_AT = 85;

export function favorRank(favor: number): FavorRank {
  if (favor >= EMPRESS_AT) return "empress";
  if (favor >= CONFIDANTE_AT) return "confidante";
  return "recruit";
}

export const FAVOR_COSMETICS: Record<FavorRank, { title: string; frame: string; sticker: string }> = {
  recruit: { title: "Putya's Recruit", frame: "putya-frame-recruit", sticker: "🎖️" },
  confidante: { title: "Putya's Confidante", frame: "putya-frame-confidante", sticker: "💋" },
  empress: { title: "Favored of the Empress", frame: "putya-frame-empress", sticker: "👑" },
};

export const TENT_DIALOGUES: Array<{ ask: string; reply: string }> = [
  { ask: "Rough day on the front.", reply: "Sit. Breathe. You can go back to being terrifying in a minute." },
  { ask: "Did you see that strike?", reply: "I saw. I may have screenshotted it. Twice." },
  { ask: "Tell me we're winning.", reply: "We're winning. I'd tell you if we weren't — loudly." },
  { ask: "Stay a while?", reply: "I'm already here, commander. Put your boots up." },
];
