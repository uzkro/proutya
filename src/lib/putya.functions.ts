// "Ask Putya": signed-in players chat with the companion (Lovable AI).
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { QUESTION_MAX, questionAllowed, putyaInstructions } from "@/lib/putya/persona";

const IntelSchema = z.object({
  playerName: z.string().max(40).optional(),
  rank: z.string().max(40).optional(),
  glory: z.number().finite().min(0).max(1e12).optional(),
  energy: z.number().finite().min(0).max(10_000).optional(),
  maxEnergy: z.number().finite().min(1).max(10_000).optional(),
  streak: z.number().int().min(0).max(10_000).optional(),
  highestTier: z.number().int().min(0).max(100).optional(),
  nukesLaunched: z.number().int().min(0).max(1e6).optional(),
  mood: z.enum(["doting", "sassy", "cold"]),
  favor: z.number().int().min(0).max(100),
  front: z.array(z.string().max(120)).max(5).optional(),
});

const AskSchema = z.object({
  question: z.string().min(1).max(QUESTION_MAX),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(600) }))
    .max(6)
    .default([]),
  intel: IntelSchema,
});

export type AskPutyaResult = { ok: true; reply: string } | { ok: false; error: string };

export const askPutyaFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AskSchema.parse(input))
  .handler(async ({ data }): Promise<AskPutyaResult> => {
    const { sessionUserId } = await import("@/lib/auth.server");
    const userId = await sessionUserId();
    if (!userId) return { ok: false, error: "Open the game in Telegram to chat with Putya." };
    const { checkRateLimit } = await import("@/lib/rate-limit.server");
    if (!checkRateLimit(`putya:${userId}`, 6, 60_000) || !checkRateLimit(`putya-day:${userId}`, 60, 86_400_000)) {
      return { ok: false, error: "Easy, pup. Putya needs a breather — try again in a bit." };
    }
    if (!questionAllowed(data.question)) {
      return { ok: true, reply: "Cute try. Keep it classy, soldier — ask me about the war." };
    }
    const { askPutyaModel, PutyaAiError } = await import("@/lib/putya/gateway.server");
    try {
      const reply = await askPutyaModel(putyaInstructions(data.intel), [
        ...data.history.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: data.question },
      ]);
      return reply ? { ok: true, reply } : { ok: false, error: "Putya went quiet. Ask again." };
    } catch (e) {
      console.error(JSON.stringify({ scope: "putya", event: "ask_failed", message: String((e as Error)?.message ?? e) }));
      return { ok: false, error: e instanceof PutyaAiError ? e.message : "Putya lost the signal. Try again." };
    }
  });
