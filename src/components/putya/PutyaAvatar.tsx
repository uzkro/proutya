import doting from "@/assets/putya/putya-doting.webp";
import sassy from "@/assets/putya/putya-sassy.webp";
import cold from "@/assets/putya/putya-cold.webp";
import { cn } from "@/lib/utils";
import type { PutyaMood } from "@/lib/putya/voice";

export const PUTYA_PORTRAIT: Record<PutyaMood, string> = { doting, sassy, cold };

export function PutyaPortrait({ mood, className, alt = "Putya" }: { mood: PutyaMood; className?: string; alt?: string }) {
  return (
    <span className={cn("putya-avatar", `putya-mood-${mood}`, className)}>
      <img src={PUTYA_PORTRAIT[mood]} alt={alt} draggable={false} />
    </span>
  );
}
