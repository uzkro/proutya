// Telegram reminder texts. With Putya on, she writes them; otherwise the plain system text.
import { putyaLine } from "@/lib/putya/voice";

export type ReminderKind = "energy_full" | "daily_ready";

const PLAIN: Record<ReminderKind, string> = {
  energy_full: "⚡ Your War On Memecoins energy is fully recharged. Time to fight, Commander.",
  daily_ready: "🎖 Your daily bonus is ready in War On Memecoins. Claim your streak reward!",
};

export function reminderText(kind: ReminderKind, opts: { enabled?: boolean; seed?: number } = {}): string {
  const line = putyaLine(kind === "energy_full" ? "energyFull" : "dailyClaim", {
    seed: opts.seed ?? 0,
    ...(opts.enabled !== undefined ? { enabled: opts.enabled } : {}),
  });
  if (!line) return PLAIN[kind];
  const cta = kind === "energy_full" ? "⚡ Energy full." : "🎖 Daily drop ready.";
  return `💋 Putya: "${line}"\n${cta} Open War On Memecoins.`;
}

/** Radiation alarm steps Putya calls out once each: 50 / 75 / 90 %. */
export function radiationStep(pct: number): 0 | 50 | 75 | 90 {
  return pct >= 90 ? 90 : pct >= 75 ? 75 : pct >= 50 ? 50 : 0;
}
