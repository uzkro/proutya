// Per-token intel from GeckoTerminal: 24h move, volume surge and the DEX venues
// that hold liquidity. 10-minute cache per token keeps the free API limit.
import { volumeSurge } from "@/lib/syndicate/indicators";
import { momentumFor, type Momentum } from "./momentum";

export type TokenIntel = { master: string; change24h: number | null; volumeX: number; venues: string[]; poolUrl: string | null; momentum: Momentum };
const API = "https://api.geckoterminal.com/api/v2/networks/ton";
const TTL = 10 * 60_000;
const cache = new Map<string, { at: number; v: TokenIntel }>();
const DEX: Record<string, string> = { stonfi: "STON.fi", stonfi_v2: "STON.fi", dedust: "DeDust", tonco: "TONCO", "x1000": "x1000", megaton: "Megaton", tonstakers: "Tonstakers" };

async function gt<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API}${path}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch { return null; }
}

type Pool = { attributes: { address: string; reserve_in_usd?: string; price_change_percentage?: { h24?: string } }; relationships: { base_token: { data: { id: string } }; dex?: { data?: { id: string } } } };

export async function getTokenIntel(master: string): Promise<TokenIntel> {
  const hit = cache.get(master);
  if (hit && Date.now() - hit.at < TTL) return hit.v;
  const pools = ((await gt<{ data: Pool[] }>(`/tokens/${master}/pools?page=1`))?.data ?? [])
    .filter((p) => p.relationships.base_token.data.id === `ton_${master}`)
    .sort((a, b) => Number(b.attributes.reserve_in_usd ?? 0) - Number(a.attributes.reserve_in_usd ?? 0));
  const top = pools[0];
  let volumeX = 0;
  if (top) {
    const o = await gt<{ data: { attributes: { ohlcv_list: number[][] } } }>(`/pools/${top.attributes.address}/ohlcv/day?limit=15&token=base`);
    volumeX = volumeSurge((o?.data.attributes.ohlcv_list ?? []).slice().reverse().map((k) => k[5] ?? 0));
  }
  const raw = top?.attributes.price_change_percentage?.h24;
  const change24h = raw == null || !Number.isFinite(Number(raw)) ? null : Number(raw);
  const venues = [...new Set(pools.map((p) => { const id = p.relationships.dex?.data?.id ?? ""; return DEX[id] ?? null; }).filter((x): x is string => !!x))];
  const v: TokenIntel = { master, change24h, volumeX, venues, poolUrl: top ? `https://www.geckoterminal.com/ton/pools/${top.attributes.address}` : null, momentum: momentumFor(change24h, volumeX) };
  if (top || !hit) cache.set(master, { at: Date.now(), v });
  return top || !hit ? v : hit.v;
}

/** Points multiplier for a coin at settlement; unreadable feed → 1. */
export async function momentumMult(master: string | null | undefined): Promise<number> {
  if (!master || master === "TON") return 1;
  return getTokenIntel(master).then((i) => i.momentum.mult).catch(() => 1);
}
