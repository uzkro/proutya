// Syndicate Armory server: tactical effects, crate loot and the dual payment rail.
// WARDOG: debited from topped-up spendable balance (atomic) + 50/50 burn/vault ledger.
// Stars: credited only from Telegram's successful_payment update, once per order.
import { sql } from "@/lib/db.server";
import { loadProgress, writeProgress } from "@/lib/game.server";
import { debitSpendable } from "@/lib/topups.server";
import { recordWardogSpend } from "@/lib/money/wardog-spend.server";
import {
  CRATES,
  EFFECT_IDS,
  STARS_ORDER_TTL_MS,
  UTILITIES,
  armoryItem,
  armoryPrice,
  crateTierOf,
  isEffectId,
  rollCrate,
  starsPayload,
  type ArmoryItemId,
  type CrateLoot,
  type EffectId,
} from "./utilities";

export type ArmoryGrant = { item: ArmoryItemId; loot: CrateLoot[]; activated: EffectId | null };
export type ArmoryState = { effects: Partial<Record<EffectId, number>>; stock: Partial<Record<EffectId, number>> };

let ready: Promise<void> | null = null;
export function ensureArmoryTables(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS armory_effects (
          user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          utility_id TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          PRIMARY KEY (user_id, utility_id)
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS armory_stock (
          user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          utility_id TEXT NOT NULL,
          qty        INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
          PRIMARY KEY (user_id, utility_id)
        )`;
      await sql`
        CREATE TABLE IF NOT EXISTS armory_orders (
          id          TEXT PRIMARY KEY,
          user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          item        TEXT NOT NULL,
          stars       INT NOT NULL CHECK (stars > 0),
          status      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','refunded')),
          charge_id   TEXT UNIQUE,
          result      JSONB,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          settled_at  TIMESTAMPTZ
        )`;
      await sql`CREATE INDEX IF NOT EXISTS armory_orders_user_idx ON armory_orders (user_id, created_at DESC)`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export async function getArmoryState(userId: number): Promise<ArmoryState> {
  await ensureArmoryTables();
  const [fx, st] = await Promise.all([
    sql`SELECT utility_id, (EXTRACT(EPOCH FROM expires_at) * 1000)::float8 AS exp FROM armory_effects WHERE user_id = ${userId} AND expires_at > NOW()`,
    sql`SELECT utility_id, qty FROM armory_stock WHERE user_id = ${userId} AND qty > 0`,
  ]);
  const effects: ArmoryState["effects"] = {};
  const stock: ArmoryState["stock"] = {};
  for (const r of fx.rows) if (isEffectId(String(r["utility_id"]))) effects[r["utility_id"] as EffectId] = Number(r["exp"]);
  for (const r of st.rows) if (isEffectId(String(r["utility_id"]))) stock[r["utility_id"] as EffectId] = Number(r["qty"]);
  return { effects, stock };
}

/** True while the player's effect is running. Unreadable state → false (no bonus, no shield). */
export async function hasActiveEffect(userId: number, id: EffectId): Promise<boolean> {
  try {
    await ensureArmoryTables();
    const { rows } = await sql`SELECT 1 AS x FROM armory_effects WHERE user_id = ${userId} AND utility_id = ${id} AND expires_at > NOW() LIMIT 1`;
    return rows.length > 0;
  } catch {
    return false;
  }
}

async function activate(userId: number, id: EffectId) {
  const ms = UTILITIES[id].durationMs;
  // Atomic stacking: time left + duration (extendedExpiry in utilities.ts is the same rule).
  await sql`
    INSERT INTO armory_effects (user_id, utility_id, expires_at)
    VALUES (${userId}, ${id}, NOW() + (${ms} * INTERVAL '1 millisecond'))
    ON CONFLICT (user_id, utility_id)
    DO UPDATE SET expires_at = GREATEST(armory_effects.expires_at, NOW()) + (${ms} * INTERVAL '1 millisecond')`;
}

function serverRandoms(n: number): number[] {
  const buf = new Uint32Array(n);
  crypto.getRandomValues(buf);
  return Array.from(buf, (v) => v / 2 ** 32);
}

async function applyLoot(userId: number, loot: CrateLoot[]) {
  const glory = loot.filter((l) => l.kind === "glory").reduce((s, l) => s + l.amount, 0);
  for (const l of loot) {
    if (l.kind === "glory") continue;
    await sql`
      INSERT INTO armory_stock (user_id, utility_id, qty) VALUES (${userId}, ${l.kind}, ${l.amount})
      ON CONFLICT (user_id, utility_id) DO UPDATE SET qty = armory_stock.qty + EXCLUDED.qty`;
  }
  if (glory > 0) {
    const prog = await loadProgress(userId);
    if (prog) {
      const state = { ...(prog.state as Record<string, unknown>) };
      state["glory"] = Number(state["glory"] ?? prog.glory ?? 0) + glory;
      await writeProgress(userId, state as never, { touchSyncClock: false });
    }
  }
}

/** Delivers a paid item. Only called after the payment is settled. */
async function grant(userId: number, item: ArmoryItemId): Promise<ArmoryGrant> {
  await ensureArmoryTables();
  const tier = crateTierOf(item);
  if (tier) {
    const loot = rollCrate(tier, serverRandoms(CRATES[tier].rolls));
    await applyLoot(userId, loot);
    return { item, loot, activated: null };
  }
  await activate(userId, item as EffectId);
  return { item, loot: [], activated: item as EffectId };
}

export async function buyArmoryWithWardog(userId: number, item: ArmoryItemId): Promise<ArmoryGrant & { paid: number }> {
  await ensureArmoryTables();
  const { amount } = armoryPrice(item, "wardog");
  const deb = await debitSpendable(userId, "wardog", amount);
  if (!deb.ok) throw new Error(deb.error);
  await recordWardogSpend({ userId, amount, purpose: "armory", details: { item, listPrice: armoryItem(item).listWardog } });
  return { ...(await grant(userId, item)), paid: amount };
}

/** Activates one utility from crate stock (atomic: never below zero). */
export async function deployFromStock(userId: number, id: EffectId) {
  await ensureArmoryTables();
  const res = await sql`
    UPDATE armory_stock SET qty = qty - 1
    WHERE user_id = ${userId} AND utility_id = ${id} AND qty >= 1
    RETURNING qty`;
  if ((res.rowCount ?? 0) < 1) throw new Error("not_in_stock");
  await activate(userId, id);
  return getArmoryState(userId);
}

// ── Telegram Stars rail ────────────────────────────────────────────────────

export async function createStarsOrder(userId: number, item: ArmoryItemId) {
  await ensureArmoryTables();
  const { createStarsInvoiceLink } = await import("./stars.server");
  const c = armoryItem(item);
  const id = crypto.randomUUID();
  await sql`INSERT INTO armory_orders (id, user_id, item, stars) VALUES (${id}, ${userId}, ${item}, ${c.stars})`;
  const link = await createStarsInvoiceLink({
    title: c.name,
    description: tierDescription(item),
    payload: starsPayload(id),
    stars: c.stars,
  });
  if (!link.ok) {
    await sql`UPDATE armory_orders SET status = 'refunded', result = ${JSON.stringify({ error: "invoice_failed" })}::jsonb WHERE id = ${id} AND status = 'pending'`;
    throw new Error("stars_unavailable");
  }
  return { orderId: id, link: link.result, stars: c.stars };
}

function tierDescription(item: ArmoryItemId) {
  const tier = crateTierOf(item);
  return tier ? `${CRATES[tier].rolls} random war supplies from the Syndicate Armory.` : UTILITIES[item as EffectId].blurb;
}

type OrderRow = { user_id: number; item: string; stars: number; status: string; created_ms: number; telegram_id: number };
async function readOrder(id: string): Promise<OrderRow | null> {
  const { rows } = await sql`
    SELECT o.user_id, o.item, o.stars, o.status, (EXTRACT(EPOCH FROM o.created_at) * 1000)::float8 AS created_ms, u.telegram_id
    FROM armory_orders o JOIN users u ON u.id = o.user_id WHERE o.id = ${id} LIMIT 1`;
  const r = rows[0];
  return r ? { user_id: Number(r["user_id"]), item: String(r["item"]), stars: Number(r["stars"]), status: String(r["status"]), created_ms: Number(r["created_ms"]), telegram_id: Number(r["telegram_id"]) } : null;
}

/** Pre-checkout gate: right buyer, right amount, still pending and fresh. */
export async function checkStarsOrder(id: string, fromTelegramId: number, currency: string, total: number, now = Date.now()) {
  await ensureArmoryTables();
  const o = await readOrder(id);
  if (!o || o.status !== "pending") return false;
  if (currency !== "XTR" || total !== o.stars || o.telegram_id !== fromTelegramId) return false;
  return now - o.created_ms <= STARS_ORDER_TTL_MS;
}

/** successful_payment handler. Idempotent per order and per charge id. */
export async function settleStarsOrder(p: { orderId: string; fromTelegramId: number; currency: string; total: number; chargeId: string }) {
  await ensureArmoryTables();
  const o = await readOrder(p.orderId);
  if (!o || p.currency !== "XTR" || p.total !== o.stars || o.telegram_id !== p.fromTelegramId) {
    console.error(JSON.stringify({ event: "stars_payment_mismatch", orderId: p.orderId, chargeId: p.chargeId }));
    return { status: "mismatch" as const };
  }
  const claimed = await sql`
    UPDATE armory_orders SET status = 'paid', charge_id = ${p.chargeId}, settled_at = NOW()
    WHERE id = ${p.orderId} AND status = 'pending' AND charge_id IS NULL
    RETURNING id`;
  if ((claimed.rowCount ?? 0) < 1) return { status: "duplicate" as const };
  try {
    const g = await grant(o.user_id, o.item as ArmoryItemId);
    await sql`UPDATE armory_orders SET result = ${JSON.stringify(g)}::jsonb WHERE id = ${p.orderId}`;
    return { status: "paid" as const };
  } catch (e) {
    // Could not deliver: give the Stars back instead of keeping them.
    const { refundStars } = await import("./stars.server");
    const r = await refundStars(p.fromTelegramId, p.chargeId);
    await sql`UPDATE armory_orders SET status = ${r.ok ? "refunded" : "paid"}, result = ${JSON.stringify({ error: "grant_failed", refunded: r.ok })}::jsonb WHERE id = ${p.orderId}`;
    console.error(JSON.stringify({ event: "stars_grant_failed", orderId: p.orderId, refunded: r.ok, error: e instanceof Error ? e.message : String(e) }));
    return { status: "refunded" as const };
  }
}

export async function getStarsOrder(userId: number, id: string) {
  await ensureArmoryTables();
  const { rows } = await sql`SELECT status, result FROM armory_orders WHERE id = ${id} AND user_id = ${userId} LIMIT 1`;
  const r = rows[0];
  if (!r) throw new Error("order_not_found");
  const result = (r["result"] ?? null) as (ArmoryGrant & { error?: string }) | null;
  return { status: String(r["status"]) as "pending" | "paid" | "refunded", grant: result && !result.error ? (result as ArmoryGrant) : null };
}

export { EFFECT_IDS };
