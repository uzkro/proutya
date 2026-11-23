import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listCallsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { hasDatabase } = await import("@/lib/db.server");
  if (!hasDatabase()) return [];
  const { listCalls } = await import("./calls.server");
  return listCalls();
});

export const createCallFn = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ tokenMaster: z.string().regex(/^[A-Za-z0-9_:\-]{40,80}$/), targetPct: z.number(), durationHours: z.number() }).parse(d))
  .handler(async ({ data }) => {
    const { requireUserId } = await import("@/lib/auth.server");
    const { createCall } = await import("./calls.server");
    return createCall(await requireUserId(), data);
  });
