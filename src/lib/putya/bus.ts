// One channel for every in-game dispatch: Putya delivers it, or a plain toast
// stands in when she's switched off or not on screen (e.g. standalone pages).
import { toast } from "sonner";
import { PUTYA_ENABLED } from "@/lib/config/features";
import { putyaLine, type PutyaEvent, type PutyaMood } from "./voice";
import { bumpHeat } from "./store";

export type PutyaTone = "info" | "good" | "bad" | "alert";
export type PutyaActionId = "briefing" | "drawer" | "battlefield";

export type PutyaMessage = {
  id: number;
  event: PutyaEvent;
  /** Putya's own line. */
  quip: string;
  /** The hard fact (numbers, names) — always shown under her line. */
  detail?: string;
  tone: PutyaTone;
  action?: { id: PutyaActionId; label: string };
  ttlMs: number;
};

type Listener = (m: PutyaMessage) => void;
const listeners = new Set<Listener>();
let nextId = 1;
let currentMood: PutyaMood = "sassy";

export function setPutyaMood(m: PutyaMood) {
  currentMood = m;
}

export function subscribePutya(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export type SayOptions = {
  detail?: string;
  tone?: PutyaTone;
  action?: PutyaMessage["action"];
  wild?: boolean;
  ttlMs?: number;
  /** Override her line (e.g. AI reply). */
  quip?: string;
};

export function putyaSay(event: PutyaEvent, opts: SayOptions = {}): PutyaMessage | null {
  const tone = opts.tone ?? "info";
  if (typeof window !== "undefined") bumpHeat(event);
  const quip = opts.quip ?? putyaLine(event, { mood: currentMood, wild: opts.wild, seed: Date.now() });
  if (!PUTYA_ENABLED || listeners.size === 0 || !quip) {
    const text = opts.detail ?? quip;
    if (text) {
      if (tone === "bad" || tone === "alert") toast.error(text);
      else if (tone === "good") toast.success(text);
      else toast(text);
    }
    return null;
  }
  const msg: PutyaMessage = { id: nextId++, event, quip, detail: opts.detail, tone, action: opts.action, ttlMs: opts.ttlMs ?? 5200 };
  for (const l of listeners) l(msg);
  return msg;
}
