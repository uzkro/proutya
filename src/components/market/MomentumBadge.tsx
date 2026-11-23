import { Flame, Radiation, Zap, Minus, TrendingUp } from "lucide-react";
import type { MomentumStatus } from "@/lib/market/momentum";
import { cn } from "@/lib/utils";

const META: Record<MomentumStatus, { icon: typeof Flame; tone: string; label: string }> = {
  overcharge: { icon: Zap, tone: "text-neon-green border-neon-green/60", label: "Overcharge" },
  surge: { icon: TrendingUp, tone: "text-neon-green border-neon-green/40", label: "Surge" },
  frenzy: { icon: Flame, tone: "text-neon-cyan border-neon-cyan/60", label: "Frenzy" },
  radiation: { icon: Radiation, tone: "text-destructive border-destructive/60", label: "Radiation" },
  steady: { icon: Minus, tone: "text-muted-foreground border-border", label: "Steady" },
};

export function MomentumBadge({ status, mult, className }: { status: MomentumStatus; mult: number; className?: string }) {
  const m = META[status];
  const Icon = m.icon;
  const pct = Math.round((mult - 1) * 100);
  return (
    <span className={cn("hud-chip inline-flex items-center gap-1 border text-[10px] font-black uppercase", m.tone, className)}>
      <Icon className="h-3 w-3" /> {m.label}{pct !== 0 && ` ${pct > 0 ? "+" : ""}${pct}%`}
    </span>
  );
}
