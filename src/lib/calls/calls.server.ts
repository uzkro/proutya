// KOL coin calls: proof of commitment = verified on-chain $WARDOG holdings at call time.
// Settled lazily against GeckoTerminal USD prices whenever calls are listed.
import { sql, ensureSchema } from "@/lib/db.server";
import { getWardogBalance } from "@/lib/money/wardog-holdings.server";
import { validateCall, settleCall, reputationDelta, gloryReward, type CallStatus } from "./rules";

let ready: Promise<void> | null = null;
function ensureCallsSchema() {
  ready ??= (async () => {
    await ensureSchema();
    await sql`CREATE TABLE IF NOT EXISTS cabal_calls (
      id BIGSERIAL PRIMARY KEY,
      nation_id BIGINT,
      caller_user_id BIGINT NOT NULL,
      token_master TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      target_pct INT NOT NULL,
      start_price_usd DOUBLE PRECISION NOT NULL,
      last_price_usd DOUBLE PRECISION,
      duration_hours INT NOT NULL,
      wardog_committed DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      expires_at TIMESTAMPTZ NOT NULL,
      settled_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS cabal_calls_status_idx ON cabal_calls (status, expires_at)`;
    await sql`CREATE TABLE IF NOT EXISTS caller_reputation (user_id BIGINT PRIMARY KEY, reputation INT NOT NULL DEFAULT 0, hits INT NOT NULL DEFAULT 0, rekts INT NOT NULL DEFAULT 0)`;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

const priceCache = new Map<string, { at: number; p: number | null; sym: string | null }>();
async function tokenPrice(master: string): Promise<{ p: number | null; sym: string | null }> {
  const hit = priceCache.get(master);
  if (hit && Date.now() - hit.at < 60_000) return hit;
  try {
    const r = await fetch(`https://api.geckoterminal.com/api/v2/networks/ton/tokens/${encodeURIComponent(master)}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(6000) });
    const j = r.ok ? ((await r.json()) as { data?: { attributes?: { price_usd?: string; symbol?: string } } }) : null;
    const n = Number(j?.data?.attributes?.price_usd);
    const v = { at: Date.now(), p: Number.isFinite(n) && n > 0 ? n : null, sym: j?.data?.attributes?.symbol ?? null };
    priceCache.set(master, v);
    return v;
  } catch { return { p: null, sym: null }; }
}

export async function createCall(userId: number, input: { tokenMaster: string; targetPct: number; durationHours: number }) {
  await ensureCallsSchema();
  const u = (await sql`SELECT wallet_address FROM users WHERE id = ${userId} LIMIT 1`).rows[0];
  const wallet = (u?.wallet_address as string | null) ?? null;
  const held = wallet ? await getWardogBalance(wallet) : null;
  const open = Number((await sql`SELECT COUNT(*)::int AS n FROM cabal_calls WHERE caller_user_id = ${userId} AND status = 'active'`).rows[0]?.n ?? 0);
  const err = validateCall({ targetPct: input.targetPct, durationHours: input.durationHours, wardogHeld: held, openCalls: open });
  if (err) throw new Error(err);
  const { p, sym } = await tokenPrice(input.tokenMaster);
  if (p == null) throw new Error("No live price for this token yet");
  const nation = (await sql`SELECT nation_id FROM nation_members WHERE user_id = ${userId} LIMIT 1`).rows[0];
  await sql`INSERT INTO cabal_calls (nation_id, caller_user_id, token_master, token_symbol, target_pct, start_price_usd, last_price_usd, duration_hours, wardog_committed, expires_at)
    VALUES (${nation?.nation_id ?? null}, ${userId}, ${input.tokenMaster}, ${(sym ?? "TOKEN").slice(0, 16)}, ${Math.round(input.targetPct)}, ${p}, ${p}, ${input.durationHours}, ${held}, NOW() + make_interval(hours => ${input.durationHours}))`;
  return { ok: true };
}

async function settleDue() {
  const rows = (await sql`SELECT id, nation_id, caller_user_id, token_master, target_pct, start_price_usd, expires_at FROM cabal_calls WHERE status = 'active' ORDER BY expires_at LIMIT 25`).rows;
  for (const r of rows) {
    const { p } = await tokenPrice(r.token_master as string);
    const status: CallStatus = settleCall({ startPrice: Number(r.start_price_usd), targetPct: Number(r.target_pct), expiresAt: new Date(r.expires_at as string).getTime() }, p, Date.now());
    if (status === "active") {
      if (p != null) await sql`UPDATE cabal_calls SET last_price_usd = ${p} WHERE id = ${r.id}`;
      continue;
    }
    const upd = await sql`UPDATE cabal_calls SET status = ${status}, last_price_usd = COALESCE(${p}, last_price_usd), settled_at = NOW() WHERE id = ${r.id} AND status = 'active' RETURNING id`;
    if (!upd.rows.length) continue; // settled by a parallel request
    const rep = reputationDelta(status, Number(r.target_pct));
    await sql`INSERT INTO caller_reputation (user_id, reputation, hits, rekts) VALUES (${r.caller_user_id}, ${rep}, ${status === "hit" ? 1 : 0}, ${status === "rekt" ? 1 : 0})
      ON CONFLICT (user_id) DO UPDATE SET reputation = caller_reputation.reputation + ${rep}, hits = caller_reputation.hits + ${status === "hit" ? 1 : 0}, rekts = caller_reputation.rekts + ${status === "rekt" ? 1 : 0}`;
    const glory = gloryReward(status, Number(r.target_pct));
    if (r.nation_id != null && (glory || rep)) await sql`UPDATE nations SET total_glory = total_glory + ${glory}, reputation = reputation + ${Math.sign(rep)} WHERE id = ${r.nation_id}`;
  }
}

export async function listCalls(limit = 30) {
  await ensureCallsSchema();
  try { await settleDue(); } catch (e) { console.warn("call settlement skipped", e); }
  const rows = (await sql`SELECT c.id, c.token_master, c.token_symbol, c.target_pct, c.start_price_usd, c.last_price_usd, c.duration_hours, c.wardog_committed, c.status, c.expires_at, c.created_at,
      COALESCE(u.username, u.first_name, 'Anon') AS caller, n.name AS cabal, n.emblem AS emblem, COALESCE(r.reputation, 0) AS reputation
    FROM cabal_calls c LEFT JOIN users u ON u.id = c.caller_user_id LEFT JOIN nations n ON n.id = c.nation_id LEFT JOIN caller_reputation r ON r.user_id = c.caller_user_id
    ORDER BY (c.status = 'active') DESC, c.created_at DESC LIMIT ${limit}`).rows;
  return rows.map((r) => ({
    id: Number(r.id), tokenMaster: r.token_master as string, symbol: r.token_symbol as string, targetPct: Number(r.target_pct),
    startPrice: Number(r.start_price_usd), lastPrice: r.last_price_usd == null ? null : Number(r.last_price_usd),
    durationHours: Number(r.duration_hours), wardogCommitted: Number(r.wardog_committed), status: r.status as CallStatus,
    expiresAt: new Date(r.expires_at as string).toISOString(), caller: r.caller as string, cabal: (r.cabal as string | null) ?? null,
    emblem: (r.emblem as string | null) ?? null, reputation: Number(r.reputation),
  }));
}
