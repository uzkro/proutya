// Universal Token Detail: live stats, market momentum, DEX venues, in-game trade
// (only for coins Quick Swap supports), chart link and Telegram rally share.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Share2, Zap, Crown, Skull, Swords } from "lucide-react";
import { TacticalModal } from "@/components/ui/TacticalModal";
import { CachedTokenImage, VenueBadge } from "@/components/ui/CachedTokenImage";
import { venueOf } from "@/lib/dex/venue-badge";
import { QuickSwapPanel } from "@/components/dex/QuickSwapPanel";
import { MomentumBadge } from "./MomentumBadge";
import { useCachedQuery } from "@/lib/cache/use-cached";
import { getTokenIntelFn } from "@/lib/market.functions";
import { rallyText } from "@/lib/market/momentum";
import { swapAssets, type SwapAssetKey } from "@/lib/dex/coffeeswap";
import type { TopCoin } from "@/lib/memewar/top100";
import { GAME_LINK } from "@/lib/share";
import { shareUrl, haptic } from "@/lib/telegram";

const usd = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `$${(n / 1e3).toFixed(1)}K` : `$${n.toFixed(0)}`);
const price = (p: number) => (p <= 0 ? "—" : p < 0.01 ? `$${p.toPrecision(2)}` : `$${p.toFixed(3)}`);

export function TokenDetailModal({ coin, owned, onClose }: { coin: TopCoin | null; owned: boolean; onClose: () => void }) {
  return (
    <TacticalModal open={!!coin} onClose={onClose} title={coin ? `$${coin.symbol}` : ""} subtitle={coin?.name} badge="Token intel" tone={coin?.tier === "deathrow" ? "danger" : "cyan"}
      icon={coin ? <CachedTokenImage src={coin.image} master={coin.master} symbol={coin.symbol} venue="stonfi" className="mx-auto h-14 w-14 rounded-full" /> : null}>
      {coin && <Body coin={coin} owned={owned} />}
    </TacticalModal>
  );
}

function Body({ coin, owned }: { coin: TopCoin; owned: boolean }) {
  const get = useServerFn(getTokenIntelFn);
  const { data, loading } = useCachedQuery(`intel:${coin.master}`, 10 * 60_000, () => get({ data: { master: coin.master } }));
  const intel = data?.intel ?? null;
  const [trade, setTrade] = useState(false);
  const swapKey = swapAssets().find((a) => a.address === coin.master)?.key as SwapAssetKey | undefined;
  const TierIcon = coin.tier === "apex" ? Crown : coin.tier === "deathrow" ? Skull : Swords;
  const ch = intel?.change24h;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="hud-chip inline-flex items-center gap-1 text-[10px] font-black uppercase"><TierIcon className="h-3 w-3" /> #{coin.rank} {coin.tier === "deathrow" ? "Death Row" : coin.tier}</span>
        {intel ? <MomentumBadge status={intel.momentum.status} mult={intel.momentum.mult} /> : loading ? <span className="hud-chip text-[10px]">Scanning…</span> : null}
      </div>

      <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
        <div className="hud-card p-2"><div className="hud-label">Price</div><b>{price(coin.priceUsd)}</b></div>
        <div className="hud-card p-2"><div className="hud-label">24h move</div><b className={ch == null ? "" : ch >= 0 ? "text-neon-green" : "text-destructive"}>{ch == null ? "—" : `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`}</b></div>
        <div className="hud-card p-2"><div className="hud-label">24h volume</div><b>{usd(coin.volume24hUsd)}</b></div>
        <div className="hud-card p-2"><div className="hud-label">Liquidity</div><b>{usd(coin.liquidityUsd)}</b></div>
      </div>

      {intel && <p className="hud-card p-2 text-center text-[11px] text-muted-foreground">{intel.momentum.blurb}{intel.volumeX > 0 && ` Volume ${intel.volumeX}× its 2-week average.`}</p>}
      {!intel && !loading && <p className="text-center text-[11px] text-muted-foreground">Live market intel is offline — no momentum modifier applied.</p>}

      {intel && intel.venues.length > 0 && (
        <div><div className="hud-label mb-1">Liquidity venues</div>
          <div className="flex flex-wrap gap-1">{intel.venues.map((v) => <span key={v} className="hud-chip relative pr-4 text-[10px] font-bold">{v}<VenueBadge venue={venueOf(v)} className="bottom-auto right-0.5 top-1/2 -translate-y-1/2" /></span>)}</div></div>
      )}

      <p className="text-center text-[11px] text-muted-foreground">{owned ? "Your troops are deployed here — battle it from your army above." : "Not in your army yet."}</p>

      <div className="grid grid-cols-2 gap-2">
        {swapKey && swapKey !== "ton" && (
          <button type="button" onClick={() => { haptic("medium"); setTrade((t) => !t); }} className="cta-amber col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-black uppercase">
            <Zap className="h-4 w-4" /> {trade ? "Hide trade" : `Trade $${coin.symbol}`}
          </button>
        )}
        {intel?.poolUrl && (
          <a href={intel.poolUrl} target="_blank" rel="noreferrer" className="hud-card inline-flex min-h-11 items-center justify-center gap-1.5 text-xs font-black uppercase"><BarChart3 className="h-4 w-4" /> Chart</a>
        )}
        <button type="button" onClick={() => { haptic("light"); shareUrl(GAME_LINK, rallyText(coin.symbol, ch ?? null, intel?.momentum ?? { status: "steady", mult: 1, label: "Steady", blurb: "" })); }}
          className={`cta-deploy inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg text-xs font-black uppercase ${intel?.poolUrl ? "" : "col-span-2"}`}>
          <Share2 className="h-4 w-4" /> Rally squad
        </button>
      </div>
      {trade && swapKey && <QuickSwapPanel initialTo={swapKey} nested />}
    </div>
  );
}
