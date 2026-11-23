// Destress Tent: rest with Putya for faster energy, passive Glory and favor talks.
import { useEffect, useState } from "react";
import { Tent } from "lucide-react";
import { TacticalModal } from "@/components/ui/TacticalModal";
import { MAX_ENERGY } from "@/lib/constants";
import { FAVOR_COSMETICS, TENT_DIALOGUES, TENT_DIALOGUES_PER_DAY, TENT_GLORY_PER_MIN, dialogueFavor, favorRank, restOutcome } from "@/lib/putya/tent";
import { renderVictorySticker } from "@/lib/putya/brag-card";
import { addHeat } from "@/lib/putya/store";
import { playTentRest } from "@/lib/sounds";
import { haptic, hapticNotify } from "@/lib/telegram";
import type { PutyaMood } from "@/lib/putya/voice";
import { PutyaPortrait } from "./PutyaAvatar";

const REST_KEY = "won:tent:restStart";
const TALK_KEY = () => `won:tent:talks:${new Date().toISOString().slice(0, 10)}`;
export const OPEN_TENT_EVENT = "won:open-tent";
export const openDestressTent = () => window.dispatchEvent(new Event(OPEN_TENT_EVENT));

function readNum(k: string) {
  try {
    const n = Number(window.localStorage.getItem(k) ?? 0);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
function writeNum(k: string, v: number | null) {
  try {
    if (v === null) window.localStorage.removeItem(k);
    else window.localStorage.setItem(k, String(v));
  } catch {
    /* storage blocked */
  }
}

export function DestressTent({ open, onClose, energy, mood, favor, onCollect, onFavor }: {
  open: boolean;
  onClose: () => void;
  energy: number;
  mood: PutyaMood;
  favor: number;
  onCollect: (energy: number, glory: number) => void;
  onFavor: () => void;
}) {
  const [start, setStart] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [talks, setTalks] = useState(0);
  const [reply, setReply] = useState<string | null>(null);
  const [sticker, setSticker] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStart(readNum(REST_KEY));
    setTalks(readNum(TALK_KEY()));
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [open]);

  const rank = favorRank(favor);
  const cos = FAVOR_COSMETICS[rank];
  const out = start ? restOutcome(start, now, energy, MAX_ENERGY) : null;

  const beginRest = () => {
    const t = Date.now();
    writeNum(REST_KEY, t);
    setStart(t);
    playTentRest();
    haptic("light");
  };
  const collect = () => {
    if (!out) return;
    onCollect(out.energy, out.glory);
    writeNum(REST_KEY, null);
    setStart(0);
    hapticNotify("success");
  };
  const talk = (i: number) => {
    const d = TENT_DIALOGUES[i]!;
    setReply(d.reply);
    const gain = dialogueFavor(talks);
    if (gain) {
      addHeat(gain);
      writeNum(TALK_KEY(), talks + 1);
      setTalks(talks + 1);
      onFavor();
    }
    haptic("light");
  };

  return (
    <TacticalModal open={open} onClose={onClose} title="Destress Tent" subtitle="Rest with Putya behind the lines" badge="Off duty" badgeIcon={Tent} tone="green" sound="transmission" hapticOnOpen="light" layer="top">
      <div className="mt-3 flex items-center gap-3">
        <div className={cos.frame}>
          <PutyaPortrait mood={mood} className="h-16 w-16" />
        </div>
        <div className="min-w-0">
          <span className="hud-chip">{cos.sticker} {cos.title}</span>
          <p className="mt-1 text-xs text-muted-foreground">Favor {favor}/100 · Confidante at 60, Empress at 85</p>
        </div>
      </div>

      <div className="hud-card mt-3 p-3">
        <p className="hud-label">Rest</p>
        {out ? (
          <>
            <p className="mt-1 font-mono text-sm font-black text-foreground">{out.minutes} min · +{out.energy} energy · +{out.glory} Glory</p>
            <p className="text-[11px] text-muted-foreground">{out.capped ? "Fully rested — collect and start again." : `+1 energy and +${TENT_GLORY_PER_MIN} Glory every minute, up to 1 hour.`}</p>
            <button type="button" onClick={collect} className="cta-deploy mt-2 w-full">Collect & stand up</button>
          </>
        ) : (
          <>
            <p className="mt-1 text-[11px] text-muted-foreground">Extra +1 energy and +{TENT_GLORY_PER_MIN} Glory each minute you rest (max 1 hour). Rest keeps counting while you're away.</p>
            <button type="button" onClick={beginRest} className="cta-deploy mt-2 w-full">Rest with Putya</button>
          </>
        )}
      </div>

      <div className="hud-card mt-3 p-3">
        <p className="hud-label">Talk ({Math.min(talks, TENT_DIALOGUES_PER_DAY)}/{TENT_DIALOGUES_PER_DAY} favor talks today)</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {TENT_DIALOGUES.map((d, i) => (
            <button key={d.ask} type="button" onClick={() => talk(i)} className="hud-segment min-h-10 px-2 text-left text-[11px]">{d.ask}</button>
          ))}
        </div>
        {reply && <p className="mt-2 text-xs font-bold italic text-foreground">“{reply}”</p>}
      </div>

      <div className="hud-card mt-3 p-3">
        <p className="hud-label">Victory sticker</p>
        <button type="button" onClick={() => setSticker(renderVictorySticker({ emoji: cos.sticker, title: cos.title, text: "Victory" }))} className="cta-amber mt-2 w-full">Make sticker</button>
        {sticker && (
          <div className="mt-2 flex items-center gap-3">
            <img src={sticker} alt="Victory sticker" className="h-24 w-24" />
            <a href={sticker} download="war-on-nations-sticker.png" className="cta-amber px-3 py-2">Save & share</a>
          </div>
        )}
      </div>
    </TacticalModal>
  );
}
