// Syndicate pacts: view active/pending treaties, propose a pact, accept or decline incoming ones.
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Coins, Handshake, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { getDiplomacyFn, proposeTreatyFn, respondTreatyFn } from "@/lib/syndicate.functions";
import { TREATY_MAX_HOURS, TREATY_MIN_HOURS } from "@/lib/syndicate/treaty";
import { getErrorMessage } from "../errors";

type Diplomacy = Awaited<ReturnType<typeof getDiplomacyFn>>;
const DAYS = Array.from({ length: TREATY_MAX_HOURS / 24 - TREATY_MIN_HOURS / 24 + 1 }, (_, i) => i + TREATY_MIN_HOURS / 24);

function left(iso: string | null) {
  if (!iso) return "";
  const h = Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3_600_000));
  return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h left` : `${h}h left`;
}

export function TreatySection({ nationId, myNationId, myRole }: { nationId: number; myNationId: number | null; myRole: string | null }) {
  const [d, setD] = useState<Diplomacy>(null);
  const [days, setDays] = useState(3);
  const [busy, setBusy] = useState(false);
  const command = myRole === "leader" || myRole === "officer";
  const own = myNationId === nationId;

  const load = useCallback(() => {
    getDiplomacyFn({ data: { nationId } }).then(setD).catch(() => setD(null));
  }, [nationId]);
  useEffect(load, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try { await fn(); toast.success(ok); load(); } catch (e) { toast.error(getErrorMessage(e)); } finally { setBusy(false); }
  };

  if (!d) return null;
  const treaties = d.treaties.filter((t) => t.status !== "declined");
  const allied = treaties.some((t) => t.otherId === myNationId && (t.status === "active" || t.status === "pending"));

  return (
    <div className="hud-card space-y-3 p-3">
      <div className="flex items-center gap-2">
        <Handshake className="h-4 w-4 text-primary" />
        <span className="hud-title text-sm">Pacts</span>
        {d.devVerified && (
          <span className="hud-chip flex items-center gap-1 text-primary" title="Verified dev team">
            <BadgeCheck className="h-3 w-3" /> Dev
          </span>
        )}
        {d.oathbreakerUntil && (
          <span className="hud-chip ml-auto flex items-center gap-1 text-destructive">
            <ShieldAlert className="h-3 w-3" /> Oathbreaker · −25% Glory · {left(d.oathbreakerUntil)}
          </span>
        )}
      </div>

      {treaties.length === 0 ? (
        <p className="text-xs text-muted-foreground">No pacts. Attacking a pact partner breaks it and costs −25% Glory for 24h.</p>
      ) : (
        <ul className="space-y-2">
          {treaties.map((t) => (
            <li key={t.id} className="flex items-center gap-2 text-xs">
              <span className="font-semibold">[{t.otherTag}] {t.otherName}</span>
              <span className="hud-label ml-auto">
                {t.status === "active" ? left(t.endsAt) : t.status === "pending" ? `pending · ${t.hours / 24}d` : t.brokenByUs ? "broken by us" : "broken"}
              </span>
              {own && command && t.status === "pending" && (
                <>
                  {t.incoming && (
                    <button disabled={busy} className="hit-cta cta-deploy px-2 py-1 text-xs" onClick={() => run(() => respondTreatyFn({ data: { treatyId: t.id, accept: true } }), "Pact signed")}>Accept</button>
                  )}
                  <button disabled={busy} className="hit-cta cta-amber px-2 py-1 text-xs" onClick={() => run(() => respondTreatyFn({ data: { treatyId: t.id, accept: false } }), t.incoming ? "Declined" : "Withdrawn")}>{t.incoming ? "Decline" : "Withdraw"}</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!own && command && myNationId && !allied && (
        <div className="flex items-center gap-2">
          <select className="hud-input flex-1 text-xs" value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Pact length">
            {DAYS.map((n) => <option key={n} value={n}>{n} day{n > 1 ? "s" : ""}</option>)}
          </select>
          <button disabled={busy} className="hit-cta cta-deploy px-3 py-2 text-xs" onClick={() => run(() => proposeTreatyFn({ data: { partnerId: nationId, hours: days * 24 } }), "Pact proposed")}>Propose pact</button>
        </div>
      )}
      <div className="space-y-2 border-t border-border pt-3">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-primary" />
          <span className="hud-title text-sm">War Chest · Top donors</span>
        </div>
        {d.donors.length === 0 ? (
          <p className="text-xs text-muted-foreground">No donations yet. Be the first to fill the vault.</p>
        ) : (
          <ol className="space-y-1">
            {d.donors.map((x) => (
              <li key={x.rank} className="flex items-center gap-2 text-xs">
                <span className="hud-label w-5">#{x.rank}</span>
                <span className="truncate font-semibold">{x.name}</span>
                <span className="ml-auto font-mono">{Math.round(x.wardog).toLocaleString()} WARDOG{x.warcat > 0 ? ` · ${Math.round(x.warcat).toLocaleString()} WARCAT` : ""}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
