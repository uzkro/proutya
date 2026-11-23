// src/components/game/tabs/EarnTab.tsx
import { ShoppingBag, Wallet, Users, Vault, ArrowLeftRight } from "lucide-react";
import { QuickSwapPanel } from "@/components/dex/QuickSwapPanel";
import { WarVaultPanel } from "@/components/vault/WarVaultPanel";
import { PacksPanel } from "@/components/packs/PacksPanel";
import { TabHero } from "@/components/game/TabHero";
import { SubTabBar } from "@/components/game/SubTabBar";
import {
  ClaimPanel,
  type ClaimBalanceSyncPayload,
} from "@/components/ClaimPanel";
import { ReferralPanel } from "@/components/Panels";
import { type useGame } from "@/lib/game-state";

// "shop" is kept as an alias so old links land on Packs; the merge-era shop is gone.
export type EarnSub = "vault" | "swap" | "shop" | "claim" | "recruit" | "packs";

export function EarnTab({
  earnSub,
  setEarnSub,
  game,
  authenticated,
  forceSync,
}: {
  earnSub: EarnSub;
  setEarnSub: (v: EarnSub) => void;
  game: ReturnType<typeof useGame>;
  authenticated: boolean;
  forceSync: () => Promise<unknown>;
}) {
  const { state } = game;
  const sub = earnSub === "shop" ? "packs" : earnSub;

  const handleClaimBalanceSync = (payload: ClaimBalanceSyncPayload) => {
    game.applyServerEconomy({
      wardogTokens: payload.wardogTokens,
      warcatTokens: payload.warcatTokens,
    });
  };

  return (
    <>
      <TabHero tab="earn" />
      <SubTabBar
        tabs={[
          { id: "vault" as const, label: "Vault", icon: Vault },
          { id: "swap" as const, label: "Swap", icon: ArrowLeftRight },
          { id: "claim" as const, label: "Claim", icon: Wallet },
          { id: "recruit" as const, label: "Recruit", icon: Users },
          { id: "packs" as const, label: "Packs", icon: ShoppingBag },
        ]}
        value={sub}
        onChange={setEarnSub}
      />
      {sub === "vault" && <WarVaultPanel authenticated={authenticated} />}
      {sub === "swap" && <QuickSwapPanel />}
      {sub === "packs" && <PacksPanel authenticated={authenticated} />}
      {sub === "claim" && (
        <ClaimPanel
          state={state}
          authenticated={authenticated}
          onBalanceSync={handleClaimBalanceSync}
        />
      )}
      {sub === "recruit" && (
        <ReferralPanel
          state={state}
          authenticated={authenticated}
          onCodeSync={(code) => {
            // Only patch referralCode — do not replace whole state snapshot
            game.hydrate({ ...game.state, referralCode: code });
          }}
          onServerReward={(json) => {
            try {
              const parsed = JSON.parse(json) as typeof state;
              game.applyServerState(parsed);
              void forceSync();
            } catch {
              /* ignore */
            }
          }}
        />
      )}
    </>
  );
}
