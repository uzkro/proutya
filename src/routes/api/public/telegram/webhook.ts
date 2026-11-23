import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "node:crypto";

/** Telegram bot webhook: Stars pre-checkout + successful_payment. Verified by secret header. */
function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Update = {
  pre_checkout_query?: { id: string; from: { id: number }; currency: string; total_amount: number; invoice_payload: string };
  message?: { from?: { id: number }; successful_payment?: { currency: string; total_amount: number; invoice_payload: string; telegram_payment_charge_id: string } };
};

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { botWebhookSecret, answerPreCheckout } = await import("@/lib/armory/stars.server");
        const secret = botWebhookSecret();
        const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
        if (!secret || !safeEqual(got, secret)) return new Response("forbidden", { status: 403 });
        const u = (await request.json().catch(() => null)) as Update | null;
        if (!u) return Response.json({ ok: true });
        const { parseStarsPayload } = await import("@/lib/armory/utilities");
        const { ensureSchema } = await import("@/lib/db.server");
        await ensureSchema();
        const arm = await import("@/lib/armory/armory.server");
        const q = u.pre_checkout_query;
        if (q) {
          const id = parseStarsPayload(q.invoice_payload);
          const ok = id ? await arm.checkStarsOrder(id, q.from.id, q.currency, q.total_amount).catch(() => false) : false;
          await answerPreCheckout(q.id, ok);
          return Response.json({ ok: true });
        }
        const p = u.message?.successful_payment;
        const from = u.message?.from?.id;
        if (p && from) {
          const id = parseStarsPayload(p.invoice_payload);
          if (id) await arm.settleStarsOrder({ orderId: id, fromTelegramId: from, currency: p.currency, total: p.total_amount, chargeId: p.telegram_payment_charge_id });
        }
        return Response.json({ ok: true });
      },
    },
  },
});
