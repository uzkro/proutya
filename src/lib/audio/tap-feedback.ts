import { playClick } from "@/lib/sounds";
import { hapticSelect } from "@/lib/telegram";

/** Elements that should give tap feedback. Opt out with data-no-tap-fx. */
export function isTapTarget(el: Element | null): boolean {
  const t = el?.closest?.('button, [role="button"], [role="tab"], a[href]');
  if (!t) return false;
  if (t.closest("[data-no-tap-fx]")) return false;
  if ((t as HTMLButtonElement).disabled || t.getAttribute("aria-disabled") === "true") return false;
  return true;
}

let last = 0;
/** One soft click + selection haptic per press, game-wide. */
export function installTapFeedback(): () => void {
  if (typeof document === "undefined") return () => {};
  const onDown = (e: PointerEvent) => {
    if (!isTapTarget(e.target as Element)) return;
    const now = Date.now();
    if (now - last < 60) return;
    last = now;
    playClick();
    hapticSelect();
  };
  document.addEventListener("pointerdown", onDown, { passive: true });
  return () => document.removeEventListener("pointerdown", onDown);
}
