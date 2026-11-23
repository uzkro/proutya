// Putya's command drawer: mood + favor, live intel, dispatch log, brag card and "Ask Putya".
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Heart, Megaphone, Send, Share2, Download, BellOff, Bell, Sparkles } from "lucide-react";
import { TacticalModal, TacticalSection } from "@/components/ui/TacticalModal";
import { PutyaPortrait, PUTYA_PORTRAIT } from "./PutyaAvatar";
import { MOOD_LABEL } from "@/lib/putya/favor";
import { putyaLine, type PutyaMood } from "@/lib/putya/voice";
import type { PutyaMessage } from "@/lib/putya/bus";
import { askPutyaFn } from "@/lib/putya.functions";
import { QUESTION_MAX, type PutyaIntel } from "@/lib/putya/persona";
import { renderBragCard } from "@/lib/putya/brag-card";
import { shareUrl, haptic, hapticNotify, tgUser } from "@/lib/telegram";
import { GAME_LINK } from "@/lib/share";
import { cn } from "@/lib/utils";

type Chat = { role: "user" | "assistant"; content: string };

const QUICK = ["Where should I fight today?", "Roast my stats.", "What's pumping right now?", "How do I raise your favor?"];

const fmtUsd = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(0)}K` : `$${n.toFixed(0)}`);

export type FrontCoin = { symbol: string; tier: string; volume24hUsd: number; liquidityUsd: number };

export function PutyaDrawer({
  open,
  onClose,
  mood,
  favor,
  intel,
  front,
  log,
  muted,
  onToggleMute,
  onOpenBriefing,
  authenticated,
  title,
}: {
  open: boolean;
  onClose: () => void;
  mood: PutyaMood;
  favor: number;
  intel: PutyaIntel;
  front: FrontCoin[];
  log: PutyaMessage[];
  muted: boolean;
  onToggleMute: () => void;
  onOpenBriefing: () => void;
  authenticated: boolean;
  title?: string;
}) {
  const ask = useServerFn(askPutyaFn);
  const [chat, setChat] = useState<Chat[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [card, setCard] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const opener = useMemo(() => putyaLine("tap", { mood, seed: Math.floor(Date.now() / 60_000) }) ?? "", [mood, open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [chat, busy]);

  async function send(q: string) {
    const question = q.trim().slice(0, QUESTION_MAX);
    if (!question || busy) return;
    setErr(null);
    setInput("");
    const history = chat.slice(-6);
    setChat((c) => [...c, { role: "user", content: question }]);
    setBusy(true);
    haptic("light");
    try {
      const r = await ask({ data: { question, history, intel } });
      if (r.ok) {
        setChat((c) => [...c, { role: "assistant", content: r.reply }]);
        hapticNotify("success");
      } else {
        setErr(r.error);
        hapticNotify("warning");
      }
    } catch {
      setErr("Putya lost the signal. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function makeCard() {
    try {
      const url = await renderBragCard(
        {
          name: intel.playerName ?? tgUser()?.first_name ?? "Commander",
          rank: intel.rank ?? "Recruit",
          glory: intel.glory ?? 0,
          streak: intel.streak ?? 0,
          highestTier: intel.highestTier ?? 1,
          nukes: intel.nukesLaunched ?? 0,
          mood,
          title,
          line: putyaLine("victory", { mood, seed: intel.glory ?? 0 }) ?? "Approved.",
        },
        PUTYA_PORTRAIT[mood],
      );
      setCard(url);
      haptic("medium");
    } catch {
      setErr("Couldn't print your card. Try again.");
    }
  }

  function shareCard() {
    shareUrl(GAME_LINK, `🦆 Certified Dangerous — approved by Putya.\n${intel.rank ?? "Recruit"} · ${(intel.glory ?? 0).toLocaleString()} glory · ${intel.streak ?? 0}-day streak.\nJoin the war 👇`);
    haptic("medium");
  }

  return (
    <TacticalModal open={open} onClose={onClose} title="Putya" subtitle={`Your companion · ${MOOD_LABEL[mood]}`} badge="Private channel" badgeIcon={Heart} tone="amber" sound="transmission" hapticOnOpen="light">
      <div className="mt-3 flex items-center gap-3">
        <PutyaPortrait mood={mood} className="h-20 w-20" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold italic text-foreground">“{opener}”</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="hud-label">Favor</span>
            <span className="font-mono text-xs font-black text-foreground">{favor}/100</span>
          </div>
          <div className="putya-favor-track mt-1" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={favor} aria-label="Putya favor">
            <div className="putya-favor-fill" style={{ width: `${favor}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">Wins, streaks and strikes warm her up. Wasted energy cools her down. Favor changes her mood, never your rewards.</p>
        </div>
      </div>

      <TacticalSection label="Your war stats">
        <div className="mt-2 grid grid-cols-4 gap-2 text-center">
          {[
            ["Glory", (intel.glory ?? 0).toLocaleString()],
            ["Rank", intel.rank ?? "—"],
            ["Energy", `${intel.energy ?? 0}/${intel.maxEnergy ?? 100}`],
            ["Streak", `${intel.streak ?? 0}d`],
          ].map(([k, v]) => (
            <div key={k} className="hud-card px-1 py-2">
              <div className="hud-label">{k}</div>
              <div className="truncate font-mono text-xs font-black text-foreground">{v}</div>
            </div>
          ))}
        </div>
      </TacticalSection>

      <TacticalSection label="Putya's front-line intel">
        {front.length ? (
          <ul className="mt-2 space-y-1.5">
            {front.map((c, i) => (
              <li key={c.symbol} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate">
                  <b className={i === 0 ? "neon-text-amber" : "text-foreground"}>${c.symbol}</b>
                  <span className="text-muted-foreground"> · {c.tier}</span>
                </span>
                <span className="font-mono text-foreground">{fmtUsd(c.volume24hUsd)} 24h</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">Scanning the market…</p>
        )}
        {front[0] && (
          <p className="mt-2 text-xs italic text-foreground">
            “{front[1] ? `$${front[0].symbol} is running the show. $${front[1].symbol} wants the crown. Pick a side, pup.` : `$${front[0].symbol} owns the front today.`}”
          </p>
        )}
      </TacticalSection>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button type="button" onClick={onOpenBriefing} className="hud-card flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-black uppercase text-foreground">
          <Megaphone className="h-4 w-4 text-neon-cyan" /> Briefing
        </button>
        <button type="button" onClick={makeCard} className="hud-card flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-black uppercase text-foreground">
          <Sparkles className="h-4 w-4 text-neon-amber" /> Brag card
        </button>
        <button type="button" onClick={onToggleMute} aria-pressed={muted} className="hud-card flex min-h-11 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-black uppercase text-foreground">
          {muted ? <BellOff className="h-4 w-4 text-muted-foreground" /> : <Bell className="h-4 w-4 text-neon-green" />} {muted ? "Muted" : "Pop-ups on"}
        </button>
      </div>

      {card && (
        <TacticalSection label="Approved by Putya">
          <img src={card} alt="Your Putya brag card" className="mt-2 w-full rounded-lg border border-border" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button type="button" onClick={shareCard} className="cta-amber flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-black uppercase">
              <Share2 className="h-4 w-4" /> Share
            </button>
            <a href={card} download="putya-brag-card.png" className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-border text-xs font-black uppercase text-foreground">
              <Download className="h-4 w-4" /> Save
            </a>
          </div>
        </TacticalSection>
      )}

      <TacticalSection label="Ask Putya">
        <div className="mt-2 max-h-56 space-y-2 overflow-y-auto" aria-live="polite">
          {chat.length === 0 && <p className="text-xs text-muted-foreground">Ask about the front, your stats, or what to do next.</p>}
          {chat.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[85%] rounded-xl px-3 py-2 text-xs", m.role === "user" ? "bg-muted text-foreground" : "putya-bubble putya-mood-" + mood + " text-foreground")}>{m.content}</div>
            </div>
          ))}
          {busy && <p className="text-xs italic text-muted-foreground">Putya is typing…</p>}
          <div ref={endRef} />
        </div>
        {err && <p className="mt-2 text-xs text-destructive">{err}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q} type="button" disabled={busy} onClick={() => void send(q)} className="hud-chip min-h-8 text-neon-cyan disabled:opacity-40">
              {q}
            </button>
          ))}
        </div>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, QUESTION_MAX))}
            placeholder={authenticated ? "Talk to Putya…" : "Open in Telegram to chat"}
            aria-label="Message Putya"
            className="hud-input text-sm"
            maxLength={QUESTION_MAX}
          />
          <button type="submit" disabled={busy || !input.trim()} aria-label="Send" className="cta-amber grid h-11 w-11 shrink-0 place-items-center rounded-xl disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </TacticalSection>

      {log.length > 0 && (
        <TacticalSection label="Recent dispatches">
          <ul className="mt-2 space-y-1.5">
            {log.slice(0, 8).map((m) => (
              <li key={m.id} className={cn("text-xs", `putya-tone-${m.tone}`)}>
                <span className="italic text-foreground">“{m.quip}”</span>
                {m.detail && <span className="putya-detail block font-mono text-[11px]">{m.detail}</span>}
              </li>
            ))}
          </ul>
        </TacticalSection>
      )}
    </TacticalModal>
  );
}
