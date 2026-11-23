import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Crown, Flag, Megaphone, Trophy, Users } from "lucide-react";
import type { GameState } from "@/lib/game-state";
import { getRankForGlory } from "@/lib/ranks";
import { haptic, tgUser } from "@/lib/telegram";
import { getNationLeaderboardFn, listNationsFn } from "@/lib/nations.functions";
import { rankKolSyndicates } from "@/lib/syndicate/kol";
import { raceStandings } from "@/lib/factions/races";

export interface LeaderboardServerEntry {
  rank: number;
  userId: number;
  username: string | null;
  firstName: string | null;
  glory: number;
  highestTier: number;
}

export type NationRank = Awaited<
  ReturnType<typeof getNationLeaderboardFn>
>[number];

export function LeaderboardPanel({
  state,
  serverEntries,
  myUserId,
  authenticated = false,
}: {
  state: GameState;
  serverEntries?: LeaderboardServerEntry[] | null;
  myUserId?: number | null;
  authenticated?: boolean;
}) {
  const meName = tgUser()?.first_name || "You";

  const rows = useMemo(() => {
    if (authenticated) {
      if (!serverEntries) return null;

      const mapped = serverEntries.map((e) => ({
        name:
          (e.firstName || e.username || `Warlord #${e.userId}`) +
          (e.userId === myUserId ? " (you)" : ""),
        glory: e.glory,
        tier: e.highestTier,
        isYou: e.userId === myUserId,
        userId: e.userId,
      }));

      const onBoard = mapped.some((r) => r.isYou);
      if (!onBoard && myUserId != null) {
        mapped.push({
          name: `${meName} (you)`,
          glory: state.glory,
          tier: state.highestTier,
          isYou: true,
          userId: myUserId,
        });
      }

      mapped.sort((a, b) => b.glory - a.glory || a.userId - b.userId);
      return mapped;
    }

    return [
      {
        name: `${meName} (you)`,
        glory: state.glory,
        tier: state.highestTier,
        isYou: true,
        userId: -1,
      },
    ];
  }, [
    authenticated,
    serverEntries,
    myUserId,
    state.glory,
    state.highestTier,
    meName,
  ]);

  const [view, setView] = useState<"players" | "nations" | "kol">("players");
  const [visible, setVisible] = useState(50);
  const [nationRows, setNationRows] = useState<NationRank[] | null>(null);

  useEffect(() => {
    if (view !== "nations" || !authenticated) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await getNationLeaderboardFn();
        if (!cancelled) setNationRows(res);
      } catch {
        if (!cancelled) setNationRows([]);
      }
    };
    void load();
    const id = setInterval(load, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [view, authenticated]);

  const myServerRow = serverEntries?.find((e) => e.userId === myUserId);
  const myRank = rows ? rows.findIndex((r) => r.isYou) + 1 : 0;
  const gloryDesync =
    authenticated &&
    myServerRow != null &&
    Math.abs(myServerRow.glory - state.glory) > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {(["players", "nations", "kol"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              haptic("light");
            }}
            className={`min-h-11 flex min-h-11 items-center justify-center gap-1.5 rounded-xl border py-2 text-[0.65rem] font-black uppercase tracking-widest transition-colors ${
              view === v
                ? "hud-card-active border-neon-amber/50 bg-neon-amber/10 text-neon-amber"
                : "border-border bg-background text-muted-foreground"
            }`}
          >
            {v === "players" ? (
              <Trophy className="h-3.5 w-3.5 shrink-0" />
            ) : v === "kol" ? (
              <Megaphone className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Flag className="h-3.5 w-3.5 shrink-0" />
            )}
            {v === "players" ? "Warlords" : v === "kol" ? "KOL Cabals" : "Factions"}
          </button>
        ))}
      </div>

      {view === "kol" ? (
        <KolRankList />
      ) : view === "nations" ? (
        <NationRankList rows={nationRows} authenticated={authenticated} />
      ) : (
        <>
          <div className="holo-panel holo-scan p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <Trophy className="h-5 w-5 shrink-0 text-neon-amber" />
                <h3 className="truncate hud-title">
                  Global Warlords
                </h3>
              </div>
              <div className="shrink-0 hud-chip text-neon-amber">
                Your rank:{" "}
                <span className="font-bold text-neon-amber">
                  {myRank > 0 ? `#${myRank}` : "—"}
                </span>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <div className="hud-card p-3">
                <div className="text-sm font-mono font-black neon-text-amber">
                  {state.glory.toLocaleString()}
                </div>
                <div className="hud-label">
                  Your glory (live)
                </div>
              </div>
              <div className="hud-card p-3">
                <div className="text-sm font-mono font-black text-foreground">
                  {(myServerRow?.glory ?? state.glory).toLocaleString()}
                </div>
                <div className="hud-label">
                  Board glory
                </div>
              </div>
            </div>

            {gloryDesync && (
              <p className="mt-2 text-center text-[0.6rem] text-neon-amber/90">
                Board updates a few seconds after sync — your live glory is correct.
              </p>
            )}
          </div>

          <div className="overflow-hidden holo-panel p-4">
            {rows === null ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Loading live ranks…
              </div>
            ) : rows.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                No warlords yet — merge to join
              </div>
            ) : (
              rows.slice(0, visible).map((r, i) => {
                const rank = i + 1;
                const medal =
                  rank === 1
                    ? "🥇"
                    : rank === 2
                      ? "🥈"
                      : rank === 3
                        ? "🥉"
                        : `#${rank}`;
                return (
                  <div
                    key={`${r.userId}-${i}`}
                    className={`flex items-center gap-3 hud-card p-3 mb-2 last:mb-0 ${
                      r.isYou ? "hud-card-active" : ""
                    }`}
                  >
                    <div className="w-8 shrink-0 text-center text-sm font-mono font-black neon-text-amber">
                      {medal}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className={`truncate text-sm font-bold ${
                          r.isYou ? "text-foreground" : "text-foreground"
                        }`}
                      >
                        {r.name}
                      </div>
                      <div className="hud-label">
                        {getRankForGlory(r.glory).name} · T{r.tier}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-mono font-black neon-text-amber">
                        {r.glory.toLocaleString()}
                      </div>
                      <div className="hud-label">
                        glory
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {rows && rows.length > visible && (
            <button
              onClick={() => {
                setVisible((v) => Math.min(v + 50, rows.length));
                haptic("light");
              }}
              className="min-h-11 w-full hud-card p-3 hud-label transition-colors hover:border-neon-amber/40 hover:text-neon-amber border border-border bg-transparent text-foreground"
            >
              Show more ({rows.length - visible} left)
            </button>
          )}

          <p className="text-center hud-label">
            {authenticated
              ? `Live · server-verified${rows ? ` · ${rows.length} commanders` : ""}`
              : "Local only · open in Telegram for the live board"}
          </p>
        </>
      )}
    </div>
  );
}

function NationRankList({
  rows,
  authenticated,
}: {
  rows: NationRank[] | null;
  authenticated: boolean;
}) {
  if (!authenticated) {
    return (
      <div className="holo-panel p-4 text-center text-sm text-muted-foreground">
        Open in Telegram to see the live faction standings
      </div>
    );
  }
  if (rows === null) {
    return (
      <div className="holo-panel p-4 text-center text-sm text-muted-foreground">
        Loading faction standings…
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="holo-panel p-4 text-center text-sm text-muted-foreground">
        No sectors on the board yet
      </div>
    );
  }
  const standings = raceStandings(rows);
  return (
    <div className="space-y-3">
    <div className="overflow-hidden holo-panel p-4" aria-label="Faction standings">
      <div className="hud-title mb-2 text-sm">12-Race Free-for-All</div>
      {standings.map((st, i) => (
        <div key={st.race.id} className="flex items-center gap-3 hud-card p-2 mb-1.5 last:mb-0">
          <div className="w-7 shrink-0 text-center text-xs font-mono font-black neon-text-amber">#{i + 1}</div>
          <div className="text-xl">{st.race.emblem}</div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold text-foreground">{st.race.name}</div>
            <div className="truncate hud-label">{st.race.perk} · {st.held}/{st.sectors} sectors held · {st.members} members</div>
          </div>
          <div className="shrink-0 text-right text-sm font-mono font-black neon-text-amber">{st.glory.toLocaleString()}</div>
        </div>
      ))}
    </div>
    <div className="overflow-hidden holo-panel p-4">
      <div className="hud-title mb-2 text-sm">Sector Citadels</div>
      {rows.map((n, i) => {
        const rank = i + 1;
        const medal =
          rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : `#${rank}`;
        return (
          <div
            key={n.id}
            className="flex items-center gap-3 hud-card p-3 mb-2 last:mb-0"
          >
            <div className="w-8 shrink-0 text-center text-sm font-mono font-black neon-text-amber">
              {medal}
            </div>
            <div className="text-xl">{n.emblem}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-foreground">
                {n.name}{" "}
                <span className="text-[0.6rem] text-muted-foreground">[{n.tag}]</span>
              </div>
              <div className="flex items-center gap-2 hud-label">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {n.memberCount}
                </span>
                {n.leaderName && (
                  <span className="inline-flex min-w-0 items-center gap-1 truncate">
                    <Crown className="h-3 w-3 text-neon-amber" /> {n.leaderName}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-sm font-mono font-black neon-text-amber">
                {n.totalGlory.toLocaleString()}
              </div>
              <div className="hud-label">
                glory
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}

function KolRankList() {
  const [rows, setRows] = useState<ReturnType<typeof rankKolSyndicates> | null>(null);
  useEffect(() => {
    let cancelled = false;
    listNationsFn()
      .then((r) => !cancelled && setRows(rankKolSyndicates(r as never)))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, []);
  if (rows === null) return <div className="holo-panel p-6 text-center text-sm text-muted-foreground">Loading cabals…</div>;
  if (!rows.length) return <div className="holo-panel p-6 text-center text-sm text-muted-foreground">No syndicates yet</div>;
  return (
    <div className="holo-panel p-4">
      <div className="hud-title mb-1 text-sm">KOL Cabal Rankings</div>
      <p className="hud-label mb-3">Ranked by Cabal reputation, linked socials and Verified Dev status.</p>
      {rows.map((n, i) => (
        <div key={n.id} className="mb-2 flex items-center gap-3 hud-card p-3 last:mb-0">
          <div className="w-8 shrink-0 text-center text-sm font-mono font-black neon-text-amber">#{i + 1}</div>
          <div className="text-xl">{n.emblem}</div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1 text-sm font-bold text-foreground">
              <span className="truncate">{n.name}</span>
              {n.devVerified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-primary" aria-label="Verified Dev" />}
            </div>
            <div className="truncate hud-label">{n.tier} · {n.socials}/3 socials · {n.memberCount} members</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-sm font-mono font-black neon-text-amber">{n.score.toLocaleString()}</div>
            <div className="hud-label">clout</div>
          </div>
        </div>
      ))}
    </div>
  );
}
