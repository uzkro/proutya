import { useEffect, useMemo, useState } from "react";
import { Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { imageStatus, markImage } from "@/lib/cache/metric-cache";
import { VENUE_LABEL, type BadgeVenue } from "@/lib/dex/venue-badge";

const VENUE_TONE: Record<Exclude<BadgeVenue, "unknown">, string> = {
  stonfi: "text-neon-green", dedust: "text-neon-amber", tonco: "text-primary", x1000: "text-neon-cyan", coffee: "text-neon-amber",
};

/** 12px circular DEX badge; unknown venue renders nothing. */
export function VenueBadge({ venue, className }: { venue?: BadgeVenue | null; className?: string }) {
  if (!venue || venue === "unknown") return null;
  const glyph = {
    stonfi: <path d="M6 2.5c2 1 2.5 3.5 0 7-2.5-3.5-2-6 0-7z" fill="currentColor" />,
    dedust: <path d="M6 2c1.8 2 2.6 3.4 2.6 4.8A2.6 2.6 0 0 1 6 9.4a2.6 2.6 0 0 1-2.6-2.6C3.4 5.6 4.6 4.6 6 2z" fill="currentColor" />,
    tonco: <path d="M2.8 7.2c1-.9 2.2-.9 3.2 0s2.2.9 3.2 0M2.8 5c1-.9 2.2-.9 3.2 0s2.2.9 3.2 0" stroke="currentColor" strokeWidth="1.1" fill="none" />,
    x1000: <><circle cx="6" cy="6" r="2" fill="currentColor" /><ellipse cx="6" cy="6" rx="4" ry="1.4" stroke="currentColor" strokeWidth="0.9" fill="none" transform="rotate(-25 6 6)" /></>,
    coffee: <><ellipse cx="6" cy="6" rx="2.4" ry="3.2" fill="currentColor" /><path d="M6 3c-.8 1.2-.8 4.8 0 6" stroke="var(--background)" strokeWidth="0.7" fill="none" /></>,
  }[venue];
  return (
    <svg viewBox="0 0 12 12" width={12} height={12} role="img" aria-label={VENUE_LABEL[venue]}
      className={cn("absolute -bottom-0.5 -right-0.5 rounded-full border border-border bg-background", VENUE_TONE[venue], className)}>
      <title>{VENUE_LABEL[venue]}</title>
      {glyph}
    </svg>
  );
}

const AVATAR_TONES = [
  "border-neon-cyan/50 text-neon-cyan",
  "border-neon-green/50 text-neon-green",
  "border-neon-amber/50 text-neon-amber",
  "border-destructive/50 text-destructive",
] as const;

function toneFor(symbol: string) {
  let h = 0;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) >>> 0;
  return AVATAR_TONES[h % AVATAR_TONES.length];
}

/**
 * Token logo backed by the metric cache: known-good images paint without a
 * skeleton, known-broken URLs are skipped instantly, and an initials avatar is
 * the final fallback.
 */
function TokenImageInner({
  src,
  sources,
  master,
  symbol,
  className,
  alt,
  venue,
}: {
  /** DEX the coin trades on; shows a small badge bottom-right. */
  venue?: BadgeVenue | null;
  src?: string | null;
  /** Jetton master address; adds the server logo resolver as a last source. */
  master?: string | null;
  sources?: (string | null | undefined)[];
  symbol: string;
  className?: string;
  alt?: string;
}) {
  const resolver = master ? `/api/public/jetton-logo/${encodeURIComponent(master)}` : null;
  const sig = [src, ...(sources ?? []), resolver].map((s) => s ?? "").join("\n");
  const list = useMemo(() => sig.split("\n").filter((s, i, a) => Boolean(s) && a.indexOf(s) === i), [sig]);
  // Start with the first candidate so server and client render the same markup.
  const [idx, setIdx] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Skip URLs the cache already knows are broken.
    let i = 0;
    while (i < list.length && imageStatus(list[i]!) === "bad") i++;
    setIdx(i);
    setLoaded(i < list.length && imageStatus(list[i]!) === "ok");
  }, [list]);

  const url = list[idx];
  if (!url) {
    const initials = symbol.replace(/^\$/, "").slice(0, 3).toUpperCase();
    return (
      <div
        role="img"
        aria-label={alt ?? `${symbol} logo`}
        className={cn("flex shrink-0 items-center justify-center rounded-full border bg-secondary font-black", toneFor(symbol), className)}
      >
        {initials ? <span className="text-[0.7em] leading-none">{initials}</span> : <Coins className="h-1/2 w-1/2" />}
      </div>
    );
  }

  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-full bg-muted", className)}>
      {!loaded && <span aria-hidden className="skeleton-shimmer absolute inset-0 rounded-full" />}
      <img
        key={url}
        src={url}
        alt={alt ?? `${symbol} logo`}
        loading="lazy"
        decoding="async"
        draggable={false}
        onLoad={() => {
          markImage(url, "ok");
          setLoaded(true);
        }}
        onError={() => {
          markImage(url, "bad");
          setLoaded(false);
          setIdx((i) => i + 1);
        }}
        className={cn("h-full w-full rounded-full object-cover transition-opacity duration-200", loaded ? "opacity-100" : "opacity-0")}
      />
    </span>
  );
}

export function CachedTokenImage(props: Parameters<typeof TokenImageInner>[0]) {
  if (!props.venue || props.venue === "unknown") return <TokenImageInner {...props} />;
  return (
    <span className="relative inline-flex shrink-0">
      <TokenImageInner {...props} />
      <VenueBadge venue={props.venue} />
    </span>
  );
}
