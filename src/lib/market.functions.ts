// Public token intel + faction momentum (market data only, nothing personal).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const getTokenIntelFn = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ master: z.string().min(10).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { getTokenIntel } = await import("@/lib/market/token-intel.server");
    try { return { intel: await getTokenIntel(data.master), error: null as string | null }; }
    catch { return { intel: null, error: "intel_unavailable" }; }
  });

/** War Map heatmap: momentum of each map faction's most liquid coin. */
export const getFactionMomentumFn = createServerFn({ method: "GET" }).handler(async () => {
  const { MAP_FACTIONS } = await import("@/lib/warmap/tiles");
  const { getMarketCoins } = await import("@/lib/market/market.server");
  const { getTokenIntel } = await import("@/lib/market/token-intel.server");
  const coins = await getMarketCoins().catch(() => []);
  const rows = await Promise.all(MAP_FACTIONS.map(async (f) => {
    const c = coins.filter((x) => x.symbol.toUpperCase() === f).sort((a, b) => b.liquidityUsd - a.liquidityUsd)[0];
    if (!c) return { faction: f, change24h: null, status: "steady" as const, mult: 1 };
    const i = await getTokenIntel(c.master).catch(() => null);
    return { faction: f, change24h: i?.change24h ?? null, status: i?.momentum.status ?? "steady", mult: i?.momentum.mult ?? 1 };
  }));
  return { rows };
});
