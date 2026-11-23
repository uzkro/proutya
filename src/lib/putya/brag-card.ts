// Browser-only "Approved by Putya" brag card (canvas → PNG data URL).
// Colors come from the theme tokens so the card restyles with the game.
import type { PutyaMood } from "./voice";

export type BragStats = { name: string; rank: string; glory: number; streak: number; highestTier: number; nukes: number; mood: PutyaMood; line: string; title?: string };

function token(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

export async function renderBragCard(stats: BragStats, portraitSrc: string): Promise<string> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  const bg = token("--background", "#05070d");
  const fg = token("--foreground", "#f5f7fb");
  const muted = token("--muted-foreground", "#8a93a6");
  const cyan = token("--neon-cyan", "#22d3ee");
  const amber = token("--neon-amber", "#f59e0b");
  const danger = token("--destructive", "#ef4444");
  const ring = stats.mood === "doting" ? amber : stats.mood === "cold" ? danger : cyan;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 360, 40, W / 2, 360, 620);
  glow.addColorStop(0, ring);
  glow.addColorStop(1, bg);
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;

  const img = await loadImage(portraitSrc);
  const size = 560;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, 360, size / 2, 0, Math.PI * 2);
  ctx.clip();
  const scale = size / Math.min(img.width, img.height);
  ctx.drawImage(img, W / 2 - (img.width * scale) / 2, 360 - size / 2, img.width * scale, img.height * scale);
  ctx.restore();
  ctx.strokeStyle = ring;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(W / 2, 360, size / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.fillStyle = ring;
  ctx.font = "900 34px system-ui, sans-serif";
  ctx.fillText((stats.title ?? "Certified dangerous").toUpperCase(), W / 2, 720);
  ctx.fillStyle = fg;
  ctx.font = "900 64px system-ui, sans-serif";
  ctx.fillText(stats.name.slice(0, 18).toUpperCase(), W / 2, 800);
  ctx.fillStyle = muted;
  ctx.font = "600 32px system-ui, sans-serif";
  ctx.fillText(stats.rank, W / 2, 850);

  const cells: Array<[string, string]> = [
    ["GLORY", stats.glory.toLocaleString()],
    ["STREAK", `${stats.streak}d`],
    ["TIER", `T${stats.highestTier}`],
    ["NUKES", String(stats.nukes)],
  ];
  const cw = (W - 160) / 4;
  cells.forEach(([k, v], i) => {
    const x = 80 + cw * i + cw / 2;
    ctx.fillStyle = muted;
    ctx.font = "800 24px system-ui, sans-serif";
    ctx.fillText(k, x, 940);
    ctx.fillStyle = fg;
    ctx.font = "900 46px system-ui, sans-serif";
    ctx.fillText(v, x, 995);
  });

  ctx.fillStyle = fg;
  ctx.font = "italic 600 38px system-ui, sans-serif";
  wrap(ctx, `“${stats.line}”`, W - 200).forEach((l, i) => ctx.fillText(l, W / 2, 1090 + i * 48));

  ctx.fillStyle = amber;
  ctx.font = "900 32px system-ui, sans-serif";
  ctx.fillText("— APPROVED BY PUTYA · WAR ON MEMECOINS", W / 2, 1260);
  ctx.fillStyle = muted;
  ctx.font = "600 24px system-ui, sans-serif";
  ctx.fillText("t.me/waronnationsgamebot", W / 2, 1305);
  return canvas.toDataURL("image/png");
}

/** 512×512 Telegram-style sticker: emoji medal + favor title + victory text. */
export function renderVictorySticker(opts: { emoji: string; title: string; text: string }): string {
  const S = 512;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no_canvas");
  const amber = token("--neon-amber", "#f59e0b");
  const bg = token("--background", "#05070d");
  const fg = token("--foreground", "#f5f7fb");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = amber;
  ctx.lineWidth = 14;
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.font = "180px system-ui, sans-serif";
  ctx.fillText(opts.emoji, S / 2, 250);
  ctx.fillStyle = fg;
  ctx.font = "900 44px system-ui, sans-serif";
  ctx.fillText(opts.text.slice(0, 16).toUpperCase(), S / 2, 340);
  ctx.fillStyle = amber;
  ctx.font = "800 26px system-ui, sans-serif";
  ctx.fillText(opts.title.toUpperCase(), S / 2, 390);
  return canvas.toDataURL("image/png");
}
