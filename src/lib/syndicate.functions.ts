import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { hasDatabase, ensureSchema } from "@/lib/db.server";
import { requireUserId } from "@/lib/auth.server";
import { assertRateLimit } from "@/lib/rate-limit.server";
import { nationDiplomacy, proposeTreaty, respondTreaty, setSocials } from "@/lib/syndicate/diplomacy.server";

export const getDiplomacyFn = createServerFn({ method: "GET" })
  .inputValidator((i: unknown) => z.object({ nationId: z.number().int().positive() }).parse(i))
  .handler(async ({ data }) => {
    if (!hasDatabase()) return null;
    await ensureSchema();
    return nationDiplomacy(data.nationId);
  });

export const setSocialsFn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ tg: z.string().max(120), x: z.string().max(80), discord: z.string().max(120).default("") }).parse(i))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    assertRateLimit(`syn:socials:${userId}`, 5, 60_000);
    return setSocials(userId, data.tg, data.x, data.discord);
  });

export const proposeTreatyFn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ partnerId: z.number().int().positive(), hours: z.number().int() }).parse(i))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    assertRateLimit(`syn:treaty:${userId}`, 5, 60_000);
    return proposeTreaty(userId, data.partnerId, data.hours);
  });

export const respondTreatyFn = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => z.object({ treatyId: z.number().int().positive(), accept: z.boolean() }).parse(i))
  .handler(async ({ data }) => {
    const userId = await requireUserId();
    assertRateLimit(`syn:treaty:${userId}`, 10, 60_000);
    return respondTreaty(userId, data.treatyId, data.accept);
  });
