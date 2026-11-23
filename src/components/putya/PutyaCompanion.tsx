// Floating Putya: the voice of every in-game dispatch. Tap her for the drawer.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Tent, X } from "lucide-react";
import { DestressTent, OPEN_TENT_EVENT } from "./DestressTent";
import { FAVOR_COSMETICS, favorRank } from "@/lib/putya/tent";
import { playCombatFeedback } from "@/lib/audio/combat-player";
import { PUTYA_ENABLED } from "@/lib/config/features";
import { MAX_ENERGY } from "@/lib/constants";
import { getRank } from "@/lib/ranks";
import { haptic, tgUser } from "@/lib/telegram";
import { useTierBoard } from "@/lib/cache/use-cached";
import type { CoinTier, MarketCoin } from "@/lib/war-cycle/cycle";
import { TIER_RULES } from "@/lib/war-cycle/cycle";
import type { GameState } from "@/lib/game/types";
import { computeFavor, moodFor } from "@/lib/putya/favor";
import { putyaLine } from "@/lib/putya/voice";
import { putyaSay, setPutyaMood, subscribePutya, type PutyaActionId, type PutyaMessage } from "@/lib/putya/bus";
import { onceToday, readHeat } from "@/lib/putya/store";
import type { PutyaIntel } from "@/lib/putya/persona";
import { PutyaPortrait } from "./PutyaAvatar";
import { PutyaDrawer, type FrontCoin } from "./PutyaDrawer";
import { cn } from "@/lib/utils";

const MUTE_KEY = "won:putya:muted";

function topFront(board: Record<CoinTier, MarketCoin[]> | null): FrontCoin[] {
  if (!board) return [];
  const all: FrontCoin[] = [];
  for (const tier of ["admiral", "captain", "recruit"] as CoinTier[]) {
    for (const c of board[tier] ?? []) all.push({ symbol: c.symbol, tier: TIER_RULES[tier].label, volume24hUsd: c.volume24hUsd, liquidityUsd: c.liquidityUsd });
  }
  return all.sort((a, b) => b.volume24hUsd - a.volume24hUsd).slice(0, 4);
}

export function PutyaCompanion({
  state,
  authenticated,
  hidden,
  onOpenBriefing,
  onGoBattlefield,
  onRestCollect,
}: {
  state: GameState;
  authenticated: boolean;
  hidden?: boolean;
  onOpenBriefing: () => void;
  onGoBattlefield: () => void;
  onRestCollect?: (energy: number, glory: number) => void;
}) {
  const [tent, setTent] = useState(false);
  useEffect(() => {
    const open = () => setTent(true);
    window.addEventListener(OPEN_TENT_EVENT, open);
    return () => window.removeEventListener(OPEN_TENT_EVENT, open);
  }, []);
  const [heat, setHeat] = useState(0);
  const [queue, setQueue] = useState<PutyaMessage[]>([]);
  const [log, setLog] = useState<PutyaMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [drawer, setDrawer] = useState(false);
  const [muted, setMuted] = useState(false);
  const mutedRef = useRef(false);
  const { data } = useTierBoard();
  const board = (data?.board ?? null) as Record<CoinTier, MarketCoin[]> | null;
  const front = useMemo(() => topFront(board), [board]);

  useEffect(() => {
    setHeat(readHeat());
    try {
      const m = window.localStorage.getItem(MUTE_KEY) === "1";
      setMuted(m);
      mutedRef.current = m;
    } catch {
      /* storage blocked */
    }
  }, []);

  const favor = computeFavor({
    dailyStreak: state.dailyStreak,
    energy: state.energy,
    maxEnergy: MAX_ENERGY,
    lastDailyClaim: state.lastDailyClaim,
    totalNukesLaunched: state.totalNukesLaunched ?? 0,
    heat,
  });
  const mood = moodFor(favor);
  const cosmetic = FAVOR_COSMETICS[favorRank(favor)];
  useEffect(() => setPutyaMood(mood), [mood]);

  // Every dispatch lands here.
  useEffect(() => {
    if (!PUTYA_ENABLED) return;
    return subscribePutya((m) => {
      setHeat(readHeat());
      playCombatFeedback(m.event);
      setLog((l) => [m, ...l].slice(0, 20));
      if (mutedRef.current) {
        setUnread((n) => n + 1);
        return;
      }
      setQueue((q) => [...q, m].slice(-4));
    });
  }, []);

  const current = queue[0] ?? null;
  const dismiss = useCallback(() => setQueue((q) => q.slice(1)), []);

  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(dismiss, current.ttlMs + Math.min(3000, (current.detail?.length ?? 0) * 25));
    return () => window.clearTimeout(t);
  }, [current, dismiss]);

  // Greeting / briefing hand-off once the game is on screen.
  const greetedRef = useRef(false);
  useEffect(() => {
    if (!PUTYA_ENABLED || hidden || greetedRef.current) return;
    greetedRef.current = true;
    const t = window.setTimeout(() => {
      if (onceToday("briefing")) {
        putyaSay("briefing", { action: { id: "briefing", label: "Open briefing" }, detail: "Today's front line + supply drop are in.", ttlMs: 9000 });
      } else {
        putyaSay("greeting");
      }
    }, 1200);
    return () => window.clearTimeout(t);
  }, [hidden]);

  // Energy capped → she notices.
  const wasFullRef = useRef<boolean | null>(null);
  useEffect(() => {
    const full = state.energy >= MAX_ENERGY;
    if (wasFullRef.current === false && full) putyaSay("energyFull", { detail: `Energy ${MAX_ENERGY}/${MAX_ENERGY}`, tone: "alert", action: { id: "battlefield", label: "Go fight" } });
    wasFullRef.current = full;
  }, [state.energy]);

  const runAction = (id: PutyaActionId) => {
    dismiss();
    if (id === "briefing") onOpenBriefing();
    else if (id === "battlefield") onGoBattlefield();
    else setDrawer(true);
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    try {
      window.localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* storage blocked */
    }
    if (next) setQueue([]);
  };

  const intel: PutyaIntel = {
    playerName: tgUser()?.first_name?.slice(0, 40),
    rank: getRank(state.glory).rank.name,
    glory: Math.max(0, Math.round(state.glory)),
    energy: Math.max(0, Math.round(state.energy)),
    maxEnergy: MAX_ENERGY,
    streak: state.dailyStreak,
    highestTier: state.highestTier,
    nukesLaunched: state.totalNukesLaunched ?? 0,
    mood,
    favor,
    front: front.map((c) => `$${c.symbol} (${c.tier}) ${Math.round(c.volume24hUsd).toLocaleString()} USD 24h volume`.slice(0, 120)),
  };

  if (!PUTYA_ENABLED) return null;

  return (
    <>
      {!hidden && (
        <div className={cn("putya-dock", `putya-mood-${mood}`)}>
          <AnimatePresence mode="wait">
            {current && (
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 24, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 16, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className={cn("putya-bubble", `putya-tone-${current.tone}`)}
                role="status"
                aria-live="polite"
              >
                <button type="button" onClick={dismiss} aria-label="Dismiss" className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-border bg-background text-muted-foreground">
                  <X className="h-3 w-3" />
                </button>
                <p className="text-xs font-bold italic leading-snug text-foreground">{current.quip}</p>
                {current.detail && <p className="putya-detail mt-0.5 font-mono text-[11px] font-black leading-snug">{current.detail}</p>}
                {current.action && (
                  <button type="button" onClick={() => runAction(current.action!.id)} className="mt-1.5 min-h-8 rounded-md border border-current px-2 text-[10px] font-black uppercase putya-detail">
                    {current.action.label}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            type="button"
            aria-label={`Open Putya (${mood})`}
            onClick={() => {
              haptic("light");
              setUnread(0);
              setDrawer(true);
            }}
            className="putya-bob relative"
          >
            <span className={cn("block", cosmetic.frame)}><PutyaPortrait mood={mood} alt="" /></span>
            {unread > 0 && <span className="putya-badge">{unread > 9 ? "9+" : unread}</span>}
          </button>
          <button type="button" aria-label="Open Destress Tent" onClick={() => setTent(true)} className="hud-chip mt-1 flex items-center gap-1 text-[10px]">
            <Tent className="h-3 w-3" /> Tent
          </button>
        </div>
      )}
      <PutyaDrawer
        open={drawer}
        onClose={() => setDrawer(false)}
        mood={mood}
        favor={favor}
        intel={intel}
        front={front}
        log={log}
        muted={muted}
        onToggleMute={toggleMute}
        onOpenBriefing={() => {
          setDrawer(false);
          onOpenBriefing();
        }}
        authenticated={authenticated}
        title={cosmetic.title}
      />
      <DestressTent
        open={tent}
        onClose={() => setTent(false)}
        energy={state.energy}
        mood={mood}
        favor={favor}
        onCollect={(e, g) => {
          onRestCollect?.(e, g);
          if (e || g) putyaSay("questDone", { tone: "good", detail: `Rested: +${e} energy · +${g} Glory` });
        }}
        onFavor={() => setHeat(readHeat())}
      />
    </>
  );
}

/** One-liner for screens that just want her take (e.g. briefing). */
export function usePutyaTake(event: Parameters<typeof putyaLine>[0], seed = 0) {
  return putyaLine(event, { seed });
}
