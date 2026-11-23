// Syndicate diplomacy storage: social links, Dev Emblems, treaties, Oathbreaker flag, War Chest board.
import { sql } from "@/lib/db/client.server";
import { breachedTreaty, oathbreakerMult, treatyDurationOk, type Treaty } from "./treaty";
import { normalizeDiscord, normalizeTelegram, normalizeXHandle } from "./identity";

let ready: Promise<void> | null = null;
export function ensureDiplomacySchema() {
  ready ??= (async () => {
    await sql`ALTER TABLE nations ADD COLUMN IF NOT EXISTS tg_link TEXT`;
    await sql`ALTER TABLE nations ADD COLUMN IF NOT EXISTS x_handle TEXT`;
    await sql`ALTER TABLE nations ADD COLUMN IF NOT EXISTS discord_link TEXT`;
    await sql`ALTER TABLE nations ADD COLUMN IF NOT EXISTS reddit_link TEXT`;
    await sql`ALTER TABLE nations ADD COLUMN IF NOT EXISTS dev_verified BOOLEAN NOT NULL DEFAULT FALSE`;
    await sql`ALTER TABLE nations ADD COLUMN IF NOT EXISTS oathbreaker_at TIMESTAMPTZ`;
    await sql`CREATE TABLE IF NOT EXISTS nation_treaties (
      id BIGSERIAL PRIMARY KEY,
      proposer_id BIGINT NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
      partner_id BIGINT NOT NULL REFERENCES nations(id) ON DELETE CASCADE,
      hours INT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, broken_by BIGINT, broken_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS nation_treaties_one_pending ON nation_treaties (LEAST(proposer_id, partner_id), GREATEST(proposer_id, partner_id)) WHERE status = 'pending'`;
  })().catch((e) => { ready = null; throw e; });
  return ready;
}

async function myCommand(userId: number) {
  const r = await sql`SELECT nation_id, role FROM nation_members WHERE user_id = ${userId} LIMIT 1`;
  const row = r.rows[0];
  if (!row) throw new Error("not_a_member");
  if (row.role !== "leader" && row.role !== "officer") throw new Error("authority_required");
  return Number(row.nation_id);
}

const toTreaty = (r: any): Treaty => ({
  a: Number(r.proposer_id), b: Number(r.partner_id),
  startsAt: r.starts_at ? new Date(r.starts_at).getTime() : Infinity,
  endsAt: r.ends_at ? new Date(r.ends_at).getTime() : 0,
  brokenBy: r.broken_by === null || r.broken_by === undefined ? null : Number(r.broken_by),
});

export async function setSocials(userId: number, tg: string, x: string, discord = "") {
  await ensureDiplomacySchema();
  const nationId = await myCommand(userId);
  const t = normalizeTelegram(tg); const h = normalizeXHandle(x);
  if (t === null) throw new Error("invalid_telegram");
  if (h === null) throw new Error("invalid_x");
  const d = normalizeDiscord(discord);
  if (d === null) throw new Error("invalid_discord");
  await sql`UPDATE nations SET tg_link = ${t || null}, x_handle = ${h || null}, discord_link = ${d || null} WHERE id = ${nationId}`;
  return { ok: true as const };
}

export async function proposeTreaty(userId: number, partnerId: number, hours: number) {
  await ensureDiplomacySchema();
  if (!treatyDurationOk(hours)) throw new Error("invalid_duration");
  const nationId = await myCommand(userId);
  if (nationId === partnerId) throw new Error("invalid_partner");
  const rows = (await sql`SELECT * FROM nation_treaties WHERE status = 'active' AND ((proposer_id = ${nationId} AND partner_id = ${partnerId}) OR (proposer_id = ${partnerId} AND partner_id = ${nationId}))`).rows;
  if (breachedTreaty(rows.map(toTreaty), nationId, partnerId, Date.now())) throw new Error("already_allied");
  await sql`INSERT INTO nation_treaties (proposer_id, partner_id, hours) VALUES (${nationId}, ${partnerId}, ${Math.round(hours)})`.catch(() => { throw new Error("already_pending"); });
  return { ok: true as const };
}

export async function respondTreaty(userId: number, treatyId: number, accept: boolean) {
  await ensureDiplomacySchema();
  const nationId = await myCommand(userId);
  const r = accept
    ? await sql`UPDATE nation_treaties SET status = 'active', starts_at = NOW(), ends_at = NOW() + (hours || ' hours')::interval WHERE id = ${treatyId} AND partner_id = ${nationId} AND status = 'pending' RETURNING id`
    : await sql`UPDATE nation_treaties SET status = 'declined' WHERE id = ${treatyId} AND (partner_id = ${nationId} OR proposer_id = ${nationId}) AND status = 'pending' RETURNING id`;
  if (!r.rows[0]) throw new Error("treaty_not_found");
  return { ok: true as const };
}

/** Public diplomacy view of one Syndicate: links, emblem, Oathbreaker state, pacts, War Chest top donors. */
export async function nationDiplomacy(nationId: number) {
  await ensureDiplomacySchema();
  const n = (await sql`SELECT id, tg_link, x_handle, discord_link, dev_verified, oathbreaker_at FROM nations WHERE id = ${nationId}`).rows[0];
  if (!n) return null;
  const treaties = (await sql`
    SELECT t.id, t.proposer_id, t.partner_id, t.hours, t.status, t.starts_at, t.ends_at, t.broken_by,
           p.name AS proposer_name, p.tag AS proposer_tag, q.name AS partner_name, q.tag AS partner_tag
    FROM nation_treaties t JOIN nations p ON p.id = t.proposer_id JOIN nations q ON q.id = t.partner_id
    WHERE (t.proposer_id = ${nationId} OR t.partner_id = ${nationId})
      AND (t.status = 'pending' OR (t.status = 'active' AND t.ends_at > NOW()) OR (t.status = 'broken' AND t.broken_at > NOW() - INTERVAL '3 days'))
    ORDER BY t.created_at DESC LIMIT 20`).rows;
  const donors = (await sql`
    SELECT h.user_id, COALESCE(u.username, u.first_name, 'Soldier') AS name,
           SUM(COALESCE((h.details->>'wardog')::numeric, 0)) AS wardog,
           SUM(COALESCE((h.details->>'warcat')::numeric, 0)) AS warcat
    FROM nation_history h LEFT JOIN users u ON u.id = h.user_id
    WHERE h.nation_id = ${nationId} AND h.event = 'vault_donation' AND h.user_id IS NOT NULL
    GROUP BY h.user_id, u.username, u.first_name
    ORDER BY SUM(COALESCE((h.details->>'wardog')::numeric, 0) + COALESCE((h.details->>'warcat')::numeric, 0)) DESC
    LIMIT 10`).rows;
  const brokenAt = n.oathbreaker_at ? new Date(String(n.oathbreaker_at)).getTime() : null;
  return {
    tgLink: n.tg_link as string | null,
    xHandle: n.x_handle as string | null,
    discordLink: (n.discord_link as string | null) ?? null,
    devVerified: !!n.dev_verified,
    oathbreakerUntil: brokenAt && oathbreakerMult(brokenAt, Date.now()) < 1 ? new Date(brokenAt + 24 * 3_600_000).toISOString() : null,
    treaties: treaties.map((t) => {
      const mine = Number(t.proposer_id) === nationId;
      return {
        id: Number(t.id), status: String(t.status), hours: Number(t.hours),
        endsAt: t.ends_at ? new Date(String(t.ends_at)).toISOString() : null,
        incoming: !mine && t.status === "pending",
        otherId: Number(mine ? t.partner_id : t.proposer_id),
        otherName: String(mine ? t.partner_name : t.proposer_name),
        otherTag: String(mine ? t.partner_tag : t.proposer_tag),
        brokenByUs: t.broken_by !== null && Number(t.broken_by) === nationId,
      };
    }),
    donors: donors.map((d, i) => ({ rank: i + 1, name: String(d.name), wardog: Number(d.wardog), warcat: Number(d.warcat) })),
  };
}

/** Called on a strike: breaks any active pact and brands the attacker Oathbreaker. Returns true if a pact broke. */
export async function breakTreatyOnStrike(attackerNation: number, targetNation: number): Promise<boolean> {
  await ensureDiplomacySchema();
  const rows = (await sql`SELECT * FROM nation_treaties WHERE status = 'active' AND ((proposer_id = ${attackerNation} AND partner_id = ${targetNation}) OR (proposer_id = ${targetNation} AND partner_id = ${attackerNation}))`).rows;
  const hit = rows.find((r) => breachedTreaty([toTreaty(r)], attackerNation, targetNation, Date.now()));
  if (!hit) return false;
  await sql`UPDATE nation_treaties SET status = 'broken', broken_by = ${attackerNation}, broken_at = NOW() WHERE id = ${hit.id}`;
  await sql`UPDATE nations SET oathbreaker_at = NOW() WHERE id = ${attackerNation}`;
  await sql`INSERT INTO nation_history (nation_id, user_id, event, details) VALUES (${attackerNation}, NULL, 'oathbreaker', ${JSON.stringify({ target: targetNation })}::jsonb)`.catch(() => {});
  return true;
}

/** Oathbreaker glory multiplier for a player's Syndicate; unreadable → 1. */
export async function oathbreakerMultForUser(userId: number | string): Promise<number> {
  try {
    await ensureDiplomacySchema();
    const r = await sql`SELECT n.oathbreaker_at FROM nation_members nm JOIN nations n ON n.id = nm.nation_id WHERE nm.user_id = ${userId} LIMIT 1`;
    const at = r.rows[0]?.oathbreaker_at;
    return oathbreakerMult(at ? new Date(String(at)).getTime() : null, Date.now());
  } catch { return 1; }
}
