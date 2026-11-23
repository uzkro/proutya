// Points the bot's webhook at our Stars handler once per worker, so Stars purchases settle.
import { botWebhookSecret, getWebhookInfo, setBotWebhook } from "./stars.server";

let done: Promise<void> | null = null;
export function ensureStarsWebhook(origin: string): Promise<void> {
  if (!done) {
    done = (async () => {
      const secret = botWebhookSecret();
      const base = process.env.PUBLIC_APP_URL || origin;
      // Only public https hosts (published app) can receive Telegram updates.
      if (!secret || !/^https:\/\//.test(base) || /id-preview--|localhost/.test(base)) return;
      const url = `${base.replace(/\/$/, "")}/api/public/telegram/webhook`;
      const info = await getWebhookInfo();
      if (info.ok && info.result.url === url) return;
      const r = await setBotWebhook(url, secret);
      if (!r.ok) console.error(JSON.stringify({ event: "stars_webhook_set_failed", error: r.error }));
    })().catch(() => {
      done = null;
    });
  }
  return done;
}
