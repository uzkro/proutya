// Syndicate Armory: tactical utilities + supply crates, paid in WARDOG (20% off) or Telegram Stars.
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Loader2, Package, Star, Zap } from "lucide-react";
import { toast } from "sonner";
import { TacticalModal, tacticalFeedback } from "@/components/ui/TacticalModal";
import {
  CRATES,
  CRATE_TIERS,
  EFFECT_IDS,
  UTILITIES,
  armoryItem,
  armoryPrice,
  type ArmoryItemId,
  type ArmoryPayWith,
  type CrateLoot,
  type EffectId,
} from "@/lib/armory/utilities";
import {
  buyArmoryWardogFn,
  createArmoryStarsOrderFn,
  deployArmoryStockFn,
  getArmoryStarsOrderFn,
  getArmoryStateFn,
} from "@/lib/armory.functions";
import { getTelegram } from "@/lib/telegram";

type State = { effects: Partial<Record<EffectId, number>>; stock: Partial<Record<EffectId, number>> };
type Grant = { item: ArmoryItemId; loot: CrateLoot[]; activated: EffectId | null };

const lootLabel = (l: CrateLoot) => (l.kind === "glory" ? `+${l.amount} Glory` : `${UTILITIES[l.kind].emoji} ${UTILITIES[l.kind].name}`);
const lootEmoji = (l: CrateLoot) => (l.kind === "glory" ? "🎖️" : UTILITIES[l.kind].emoji);

function left(ms: number) {
  const m = Math.max(0, Math.ceil(ms / 60_000));
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}

function errText(e: unknown) {
  const m = e instanceof Error ? e.message : String(e);
  if (m.includes("unauthorized")) return "Sign in via Telegram first";
  if (m.includes("insufficient") || m.includes("balance")) return "Not enough topped-up WARDOG";
  if (m.includes("stars_unavailable")) return "Stars checkout is unavailable right now";
  if (m.includes("rate")) return "Slow down, soldier";
  if (m.includes("not_in_stock")) return "None left in your stock";
  return "Armory is offline — try again";
}

export function SyndicateArmory() {
  const getState = useServerFn(getArmoryStateFn);
  const buyWardog = useServerFn(buyArmoryWardogFn);
  const createStars = useServerFn(createArmoryStarsOrderFn);
  const getOrder = useServerFn(getArmoryStarsOrderFn);
  const deploy = useServerFn(deployArmoryStockFn);

  const [state, setState] = useState<State | null>(null);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [payWith, setPayWith] = useState<ArmoryPayWith>("wardog");
  const [busy, setBusy] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Grant | null>(null);

  const refresh = useCallback(async () => {
    try {
      const r = await getState();
      setOffset(r.now - Date.now());
      setState({ effects: r.effects, stock: r.stock });
    } catch {
      setState({ effects: {}, stock: {} });
    }
  }, [getState]);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  const serverNow = now + offset;

  async function pollOrder(orderId: string) {
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const o = await getOrder({ data: { orderId } }).catch(() => null);
      if (o?.status === "paid" && o.grant) return o.grant as Grant;
      if (o?.status === "refunded") throw new Error("refunded");
    }
    return null;
  }

  async function buy(item: ArmoryItemId) {
    setBusy(item);
    try {
      let grant: Grant | null = null;
      if (payWith === "wardog") {
        grant = await buyWardog({ data: { item } });
      } else {
        const order = await createStars({ data: { item } });
        const tg = getTelegram() as unknown as { openInvoice?: (url: string, cb: (s: string) => void) => void } | null;
        if (!tg?.openInvoice) {
          window.open(order.link, "_blank", "noopener");
          toast("Finish the Stars payment in Telegram");
          return;
        }
        const status = await new Promise<string>((res) => tg.openInvoice!(order.link, res));
        if (status !== "paid") {
          if (status === "failed") toast.error("Payment failed");
          return;
        }
        grant = await pollOrder(order.orderId);
        if (!grant) {
          toast("Payment received — supplies arrive shortly");
          return;
        }
      }
      if (grant.activated) {
        tacticalFeedback("reward", "success");
        toast.success(`${UTILITIES[grant.activated].emoji} ${UTILITIES[grant.activated].name} deployed`);
      } else setReveal(grant);
      await refresh();
    } catch (e) {
      tacticalFeedback("error", "error");
      toast.error(e instanceof Error && e.message === "refunded" ? "Delivery failed — your Stars were refunded" : errText(e));
    } finally {
      setBusy(null);
    }
  }

  async function deployStock(id: EffectId) {
    setBusy(`deploy_${id}`);
    try {
      const r = await deploy({ data: { id } });
      setOffset(r.now - Date.now());
      setState({ effects: r.effects, stock: r.stock });
      tacticalFeedback("reward", "success");
      toast.success(`${UTILITIES[id].emoji} ${UTILITIES[id].name} deployed`);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(null);
    }
  }

  const active = EFFECT_IDS.filter((id) => (state?.effects[id] ?? 0) > serverNow);

  return (
    <div className="mt-4 holo-panel p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-neon-cyan" />
        <h3 className="hud-title">Syndicate Armory</h3>
        <div className="hud-segment ml-auto flex text-[0.6rem] font-bold">
          {(["wardog", "stars"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPayWith(p)}
              aria-pressed={payWith === p}
              className={`min-h-9 px-2.5 ${payWith === p ? "hud-segment-active text-neon-cyan" : "text-muted-foreground"}`}
            >
              {p === "wardog" ? "WARDOG −20%" : "★ Stars"}
            </button>
          ))}
        </div>
      </div>

      {active.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {active.map((id) => (
            <span key={id} className="hud-chip text-[0.6rem] font-bold text-neon-green">
              {UTILITIES[id].emoji} {UTILITIES[id].name} · {left((state?.effects[id] ?? 0) - serverNow)}
            </span>
          ))}
        </div>
      )}

      <div className="hud-label mb-1.5">Tactical utilities</div>
      <div className="grid gap-2">
        {EFFECT_IDS.map((id) => {
          const u = UTILITIES[id];
          const p = armoryPrice(id, payWith);
          const owned = state?.stock[id] ?? 0;
          return (
            <div key={id} className="hud-card flex items-center gap-3 px-3 py-2.5">
              <span className="text-xl" aria-hidden>{u.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-foreground">{u.name}</div>
                <div className="text-[0.6rem] text-muted-foreground">{u.blurb}</div>
              </div>
              <div className="flex flex-col gap-1">
                <button type="button" disabled={!!busy} onClick={() => void buy(id)} className="cta-deploy min-h-9 px-2.5 text-[0.6rem] font-black">
                  {busy === id ? <Loader2 className="h-3 w-3 animate-spin" /> : <PriceTag amount={p.amount} stars={payWith === "stars"} list={payWith === "wardog" ? u.listWardog : null} />}
                </button>
                {owned > 0 && (
                  <button type="button" disabled={!!busy} onClick={() => void deployStock(id)} className="cta-amber min-h-9 px-2.5 text-[0.6rem] font-black">
                    {busy === `deploy_${id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : `Deploy ×${owned}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hud-label mb-1.5 mt-4">Supply crates</div>
      <div className="grid grid-cols-3 gap-2">
        {CRATE_TIERS.map((t) => {
          const c = CRATES[t];
          const item = `crate_${t}` as ArmoryItemId;
          const p = armoryPrice(item, payWith);
          return (
            <button key={t} type="button" disabled={!!busy} onClick={() => void buy(item)} className="hud-card flex flex-col items-center gap-1 px-2 py-3 text-center">
              <span className="text-2xl" aria-hidden>{c.emoji}</span>
              <span className="text-[0.65rem] font-black text-foreground">{c.name}</span>
              <span className="text-[0.55rem] text-muted-foreground">{c.rolls} {c.rolls === 1 ? "drop" : "drops"}</span>
              <span className="text-[0.6rem] font-black text-neon-cyan">
                {busy === item ? <Loader2 className="h-3 w-3 animate-spin" /> : <PriceTag amount={p.amount} stars={payWith === "stars"} list={null} />}
              </span>
            </button>
          );
        })}
      </div>

      <CrateReveal grant={reveal} onClose={() => setReveal(null)} />
    </div>
  );
}

function PriceTag({ amount, stars, list }: { amount: number; stars: boolean; list: number | null }) {
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap">
      {list !== null && <s className="opacity-60">{list.toLocaleString()}</s>}
      {stars && <Star className="h-3 w-3" />}
      {amount.toLocaleString()}
      {!stars && " WD"}
    </span>
  );
}

function CrateReveal({ grant, onClose }: { grant: Grant | null; onClose: () => void }) {
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (!grant) return setOpened(false);
    const t = setTimeout(() => {
      setOpened(true);
      tacticalFeedback(grant.loot.some((l) => l.rarity === "epic") ? "victory" : "reward", "success");
    }, 1100);
    return () => clearTimeout(t);
  }, [grant]);
  if (!grant) return null;
  const c = armoryItem(grant.item);
  return (
    <TacticalModal
      open
      onClose={onClose}
      title={opened ? "Supplies secured" : `Opening ${c.name}…`}
      badge="Supply drop"
      badgeIcon={Package}
      tone={grant.loot.some((l) => l.rarity === "epic") ? "amber" : "green"}
      align="center"
      icon={
        <motion.span
          className="block text-5xl"
          animate={opened ? { scale: [1, 1.3, 1], rotate: 0 } : { rotate: [-8, 8, -8], scale: [1, 1.05, 1] }}
          transition={opened ? { duration: 0.4 } : { repeat: Infinity, duration: 0.35 }}
        >
          {c.emoji}
        </motion.span>
      }
      footer={
        opened ? (
          <button type="button" onClick={onClose} className="cta-deploy min-h-11 w-full font-black">
            Back to the war
          </button>
        ) : null
      }
    >
      {opened && (
        <div className="grid gap-2">
          {grant.loot.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.18 }}
              className="hud-card flex items-center gap-3 px-3 py-2"
            >
              <span className="text-xl" aria-hidden>{lootEmoji(l)}</span>
              <span className="flex-1 text-xs font-black text-foreground">{lootLabel(l)}</span>
              <span className={`hud-chip text-[0.55rem] font-bold uppercase ${l.rarity === "epic" ? "text-neon-amber" : l.rarity === "rare" ? "text-neon-cyan" : "text-muted-foreground"}`}>
                {l.rarity}
              </span>
            </motion.div>
          ))}
          {grant.loot.some((l) => l.kind !== "glory") && (
            <p className="text-center text-[0.6rem] text-muted-foreground">Utilities go to your stock — deploy them any time.</p>
          )}
        </div>
      )}
    </TacticalModal>
  );
}
