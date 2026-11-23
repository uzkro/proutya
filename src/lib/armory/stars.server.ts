// Telegram Stars (XTR) Bot API calls. Server-only; never throws on network errors —
// callers decide how to fail closed.
import { createHmac } from "node:crypto";

type TgResult<T> = { ok: true; result: T } | { ok: false; error: string };

async function botCall<T>(method: string, body: Record<string, unknown>): Promise<TgResult<T>> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return { ok: false, error: "bot_not_configured" };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json().catch(() => null)) as { ok?: boolean; result?: T; description?: string } | null;
    if (!res.ok || !json?.ok) return { ok: false, error: String(json?.description ?? `http_${res.status}`).slice(0, 200) };
    return { ok: true, result: json.result as T };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network_error" };
  }
}

/** Secret Telegram must echo in X-Telegram-Bot-Api-Secret-Token; derived so no extra secret is needed. */
export function botWebhookSecret(): string | null {
  const base = process.env.TELEGRAM_WEBHOOK_SECRET || process.env.SESSION_SECRET;
  if (!base) return null;
  return createHmac("sha256", base).update("telegram-webhook:v1").digest("hex").slice(0, 64);
}

export const createStarsInvoiceLink = (p: { title: string; description: string; payload: string; stars: number }) =>
  botCall<string>("createInvoiceLink", {
    title: p.title.slice(0, 32),
    description: p.description.slice(0, 255),
    payload: p.payload,
    currency: "XTR",
    prices: [{ label: p.title.slice(0, 32), amount: p.stars }],
  });

export const answerPreCheckout = (id: string, ok: boolean, error?: string) =>
  botCall<boolean>("answerPreCheckoutQuery", ok ? { pre_checkout_query_id: id, ok: true } : { pre_checkout_query_id: id, ok: false, error_message: error ?? "Order expired — open the Armory again." });

export const refundStars = (telegramUserId: number, chargeId: string) =>
  botCall<boolean>("refundStarPayment", { user_id: telegramUserId, telegram_payment_charge_id: chargeId });

export const getWebhookInfo = () => botCall<{ url: string; pending_update_count: number; last_error_message?: string }>("getWebhookInfo", {});

export const setBotWebhook = (url: string, secret: string) =>
  botCall<boolean>("setWebhook", { url, secret_token: secret, allowed_updates: ["pre_checkout_query", "message"], drop_pending_updates: false });
