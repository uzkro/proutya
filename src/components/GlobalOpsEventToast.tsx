// src/components/GlobalOpsEventToast.tsx
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { listOpsKillFeedFn } from "@/lib/battlefield.functions";
import { feedLine } from "@/lib/war-feed/flavor";

/**
 * Polls the global OPS kill feed and shows a short toast
 * to every player when someone is stabbed/shot or gets jailed
 * for attacking a protected World Leader.
 */
export function GlobalOpsEventToast() {
  const seenRef = useRef<Set<number>>(new Set());
  const primedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const list = await listOpsKillFeedFn({ data: { limit: 12 } });
        if (cancelled || !Array.isArray(list)) return;

        if (!primedRef.current) {
          for (const s of list) seenRef.current.add(s.id);
          primedRef.current = true;
          return;
        }

        for (const s of list) {
          if (seenRef.current.has(s.id)) continue;
          seenRef.current.add(s.id);

          if (!s.hit && !s.jailed) continue;
          const l = feedLine(s);
          toast(`${s.jailed ? "🔒" : "⚔️"} ${l.text}`, {
            description: l.quip ? `💋 ${l.quip}` : undefined,
            duration: s.jailed ? 5500 : 4500,
          });
        }
      } catch {
        // silent
      }
    };

    void poll();
    const id = setInterval(() => void poll(), 7000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return null;
}
