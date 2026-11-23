// Pure Syndicate identity rules: Telegram / X / Discord links and Dev Emblem labels.
const TG_RE = /^(?:https?:\/\/)?(?:t\.me|telegram\.me)\/(\+?[A-Za-z0-9_]{5,64})\/?$/i;
const X_RE = /^(?:https?:\/\/)?(?:www\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/?$|^@?([A-Za-z0-9_]{1,15})$/i;

/** Canonical https://t.me/... link, "" to clear, or null when invalid. */
export function normalizeTelegram(input: string): string | null {
  const s = input.trim();
  if (!s) return "";
  const m = s.match(TG_RE);
  return m ? `https://t.me/${m[1]}` : null;
}

/** Canonical X handle without "@", "" to clear, or null when invalid. */
export function normalizeXHandle(input: string): string | null {
  const s = input.trim();
  if (!s) return "";
  const m = s.match(X_RE);
  return m ? (m[1] ?? m[2] ?? null) : null;
}

const DC_RE = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/([A-Za-z0-9-]{2,32})\/?$/i;

/** Canonical https://discord.gg/... invite, "" to clear, or null when invalid. */
export function normalizeDiscord(input: string): string | null {
  const s = input.trim();
  if (!s) return "";
  const m = s.match(DC_RE);
  return m ? `https://discord.gg/${m[1]}` : null;
}

export function xUrl(handle: string): string {
  return `https://x.com/${handle}`;
}
