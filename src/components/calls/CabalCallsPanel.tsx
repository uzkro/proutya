import { useCallback, useEffect, useState } from "react";
import { Target, Plus } from "lucide-react";
import { toast } from "sonner";
import { listCallsFn, createCallFn } from "@/lib/calls/calls.functions";
import { gainPct, MIN_COMMIT_WARDOG } from "@/lib/calls/rules";
import { haptic } from "@/lib/telegram";
import { cn } from "@/lib/utils";

type Call = Awaited<ReturnType<typeof listCallsFn>>[number];

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "settling";
  const h = Math.floor(ms / 3.6e6);
  return h >= 1 ? `${h}h left` : `${Math.max(1, Math.floor(ms / 6e4))}m left`;
}

export function CabalCallsPanel() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [open, setOpen] = useState(false);
  const [master, setMaster] = useState("");
  const [target, setTarget] = useState(50);
  const [hours, setHours] = useState(24);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => listCallsFn().then(setCalls).catch(() => setCalls([])), []);
  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      await createCallFn({ data: { tokenMaster: master.trim(), targetPct: target, durationHours: hours } });
      haptic("heavy");
      toast.success("Call locked in. The market will judge you.");
      setOpen(false); setMaster("");
      await load();
    } catch (e) {
      const m = e instanceof Error ? e.message : "Call failed";
      toast.error(m === "unauthorized" ? "Open in Telegram and connect your wallet first" : m);
    } finally { setBusy(false); }
  };

  return (
    <div className="holo-panel space-y-3 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-neon-cyan" />
          <h3 className="hud-label">KOL Coin Calls</h3>
        </div>
        <button onClick={() => { setOpen((o) => !o); haptic("light"); }} className="hud-chip min-h-9 inline-flex items-center gap-1">
          <Plus className="h-3.5 w-3.5" /> Make a call
        </button>
      </div>
      <p className="text-[0.7rem] text-muted-foreground">
        Call a TON coin against the market. Proof of commitment: hold {MIN_COMMIT_WARDOG.toLocaleString("en-US")}+ $WARDOG (checked on-chain). Hit = reputation + cabal glory. Miss = reputation slashed.
      </p>
      {open && (
        <div className="hud-card space-y-2 p-3">
          <input className="hud-input w-full" placeholder="Token address (EQ… / UQ…)" value={master} onChange={(e) => setMaster(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[0.7rem] text-muted-foreground">Target %
              <input type="number" min={10} max={500} className="hud-input mt-1 w-full" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
            </label>
            <label className="text-[0.7rem] text-muted-foreground">Window
              <select className="hud-input mt-1 w-full" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                <option value={24}>24h</option><option value={48}>48h</option>
              </select>
            </label>
          </div>
          <button disabled={busy || master.trim().length < 40} onClick={() => void submit()} className="cta-primary w-full min-h-11 disabled:opacity-50">
            {busy ? "Verifying commitment…" : "Lock call"}
          </button>
        </div>
      )}
      {calls.length === 0 ? (
        <div className="text-center text-xs text-muted-foreground py-2">No calls yet. Be the first caller.</div>
      ) : (
        <ul className="space-y-1.5">
          {calls.slice(0, 10).map((c) => {
            const g = c.lastPrice != null ? gainPct(c.startPrice, c.lastPrice) : 0;
            return (
              <li key={c.id} className="hud-card flex items-center justify-between gap-2 p-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-foreground truncate">${c.symbol} <span className="text-muted-foreground">→ +{c.targetPct}%</span></div>
                  <div className="text-[0.65rem] text-muted-foreground truncate">{c.emblem ?? ""} {c.caller}{c.cabal ? ` · ${c.cabal}` : ""} · rep {c.reputation}</div>
                </div>
                <div className="text-right shrink-0 max-w-[45%]">
                  <div className={cn("font-mono font-bold", g >= 0 ? "text-neon-green" : "text-destructive")}>{g >= 0 ? "+" : ""}{g.toFixed(1)}%</div>
                  <div className={cn("text-[0.6rem] uppercase font-bold", c.status === "hit" ? "text-neon-green" : c.status === "rekt" ? "text-destructive" : "text-muted-foreground")}>
                    {c.status === "active" ? timeLeft(c.expiresAt) : c.verdict?.title}
                  </div>
                  {c.status === "rekt" && c.slashedBurn + c.slashedVault > 0 && (
                    <div className="text-[0.55rem] text-muted-foreground">🔥 {Math.round(c.slashedBurn).toLocaleString("en-US")} burn · 🏦 {Math.round(c.slashedVault).toLocaleString("en-US")} vault</div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
