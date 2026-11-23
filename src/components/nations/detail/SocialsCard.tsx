// KOL hub: a Syndicate's X / Telegram / Discord links, Dev badge, Cabal tier, and the leader editor.
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, ExternalLink, Megaphone, Pencil } from "lucide-react";
import { toast } from "sonner";
import { TacticalModal } from "@/components/ui/TacticalModal";
import { getDiplomacyFn, setSocialsFn } from "@/lib/syndicate.functions";
import { getReputationTier } from "@/lib/constants";
import { getErrorMessage } from "../errors";

type Diplomacy = Awaited<ReturnType<typeof getDiplomacyFn>>;

const ERR: Record<string, string> = {
  invalid_telegram: "Telegram must be a t.me link",
  invalid_x: "X must be an @handle or x.com link",
  invalid_discord: "Discord must be a discord.gg or discord.com/invite link",
  authority_required: "Only the Leader or an Officer can edit socials",
  not_a_member: "Join this syndicate first",
};

export function SocialsCard({ nationId, reputation, canEdit }: { nationId: number; reputation?: number; canEdit: boolean }) {
  const [d, setD] = useState<Diplomacy>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ x: "", tg: "", discord: "" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    getDiplomacyFn({ data: { nationId } }).then(setD).catch(() => setD(null));
  }, [nationId]);
  useEffect(load, [load]);

  const x = d?.xHandle?.replace(/^@/, "") ?? "";
  const links = [
    x && { label: `@${x}`, href: `https://x.com/${x}`, kind: "X" },
    d?.tgLink && { label: "Telegram", href: d.tgLink, kind: "TG" },
    d?.discordLink && { label: "Discord", href: d.discordLink, kind: "DC" },
  ].filter(Boolean) as { label: string; href: string; kind: string }[];

  const tier = typeof reputation === "number" ? getReputationTier(reputation).tier : null;
  if (!d && !canEdit) return null;

  const save = async () => {
    setBusy(true);
    try {
      await setSocialsFn({ data: form });
      toast.success("Socials updated");
      setOpen(false);
      load();
    } catch (e) {
      const m = getErrorMessage(e);
      toast.error(Object.entries(ERR).find(([k]) => m.includes(k))?.[1] ?? "Could not save socials");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`hud-card mt-3 space-y-2 p-3 ${d?.devVerified ? "hud-card-active" : ""}`}>
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-primary" />
        <span className="hud-title text-sm">KOL Hub</span>
        {d?.devVerified && (
          <span className="hud-chip flex items-center gap-1 text-primary"><BadgeCheck className="h-3 w-3" /> Verified Dev</span>
        )}
        {tier && <span className="hud-chip text-[10px]">{tier}</span>}
        {canEdit && (
          <button
            type="button"
            aria-label="Edit socials"
            className="hud-chip ml-auto flex min-h-8 items-center gap-1"
            onClick={() => {
              setForm({ x: x ? `@${x}` : "", tg: d?.tgLink ?? "", discord: d?.discordLink ?? "" });
              setOpen(true);
            }}
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>
      {links.length ? (
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <a key={l.kind} href={l.href} target="_blank" rel="noopener noreferrer" className="hud-chip flex min-h-8 items-center gap-1 text-xs font-bold">
              <span className="hud-label">{l.kind}</span> {l.label} <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          {canEdit ? "Link your X, Telegram and Discord so recruits can find your cabal." : "No socials linked yet."}
        </p>
      )}

      <TacticalModal open={open} onClose={() => setOpen(false)} title="Edit socials" badge="KOL Hub" tone="cyan" sound="none" layer="top">
        <div className="space-y-3">
          {([
            ["x", "X handle", "@yourcabal or x.com/yourcabal"],
            ["tg", "Telegram", "t.me/yourcabal"],
            ["discord", "Discord", "discord.gg/yourcabal"],
          ] as const).map(([k, label, ph]) => (
            <label key={k} className="block space-y-1">
              <span className="hud-label">{label}</span>
              <input
                className="hud-input w-full text-sm"
                value={form[k]}
                placeholder={ph}
                maxLength={120}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              />
            </label>
          ))}
          <p className="text-[11px] text-muted-foreground">Leave a field empty to remove it. Only t.me, x.com and discord links are accepted.</p>
          <button type="button" disabled={busy} onClick={save} className="hit-cta cta-deploy w-full py-3 text-sm disabled:opacity-50">
            {busy ? "Saving…" : "Save socials"}
          </button>
        </div>
      </TacticalModal>
    </div>
  );
}
