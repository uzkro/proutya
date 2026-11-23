// Client-callable Syndicate Armory: state, WARDOG/Stars purchases, deploy from stock.
// Every mutation needs a session; effects are granted only after settled payment.
import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { ensureSchema, hasDatabase } from "@/lib/db.server";
import { requireUserId } from "@/lib/auth.server";
import { assertRateLimit } from "@/lib/rate-limit.server";
import { EFFECT_IDS, isArmoryItem, type ArmoryItemId, type EffectId } from "@/lib/armory/utilities";

const ItemSchema = z.string().refine(isArmoryItem, "unknown_item");
const EffectSchema = z.string().refine((v) => (EFFECT_IDS as string[]).includes(v), "unknown_item");

export const getArmoryStateFn = createServerFn({ method: "GET" }).handler(async () => {
  if (!hasDatabase()) return { effects: {}, stock: {}, now: Date.now() };
  await ensureSchema();
  const userId = await requireUserId();
  const { getArmoryState } = await import("@/lib/armory/armory.server");
  return { ...(await getArmoryState(userId)), now: Date.now() };
});

export const buyArmoryWardogFn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ item: ItemSchema }).parse(i))
  .handler(async ({ data }) => {
    if (!hasDatabase()) throw new Error("database_unavailable");
    await ensureSchema();
    const userId = await requireUserId();
    assertRateLimit(`armory:buy:${userId}`, 15, 60_000);
    const { buyArmoryWithWardog } = await import("@/lib/armory/armory.server");
    return buyArmoryWithWardog(userId, data.item as ArmoryItemId);
  });

export const createArmoryStarsOrderFn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ item: ItemSchema }).parse(i))
  .handler(async ({ data }) => {
    if (!hasDatabase()) throw new Error("database_unavailable");
    await ensureSchema();
    const userId = await requireUserId();
    assertRateLimit(`armory:stars:${userId}`, 10, 60_000);
    const { ensureStarsWebhook } = await import("@/lib/armory/webhook.server");
    await ensureStarsWebhook(new URL(getRequest().url).origin);
    const { createStarsOrder } = await import("@/lib/armory/armory.server");
    return createStarsOrder(userId, data.item as ArmoryItemId);
  });

export const getArmoryStarsOrderFn = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ orderId: z.string().uuid() }).parse(i))
  .handler(async ({ data }) => {
    if (!hasDatabase()) throw new Error("database_unavailable");
    await ensureSchema();
    const userId = await requireUserId();
    const { getStarsOrder } = await import("@/lib/armory/armory.server");
    return getStarsOrder(userId, data.orderId);
  });

export const deployArmoryStockFn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ id: EffectSchema }).parse(i))
  .handler(async ({ data }) => {
    if (!hasDatabase()) throw new Error("database_unavailable");
    await ensureSchema();
    const userId = await requireUserId();
    assertRateLimit(`armory:deploy:${userId}`, 20, 60_000);
    const { deployFromStock } = await import("@/lib/armory/armory.server");
    return { ...(await deployFromStock(userId, data.id as EffectId)), now: Date.now() };
  });
