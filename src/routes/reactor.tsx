import { createFileRoute, Link } from "@tanstack/react-router";
import { LOCKET_MASTER, TREASURY_WALLET, PARTNER_FEE_BPS, FEE_TO_LOCKET_SHARE } from "@/lib/reactor/locket";

export const Route = createFileRoute("/reactor")({
  head: () => ({
    meta: [
      { title: "Locket Reactor Core · War On Memecoins" },
      { name: "description", content: "How swap fees and slashed bonds feed the $LOCKET reactor and its reflections." },
      { property: "og:title", content: "Locket Reactor Core · War On Memecoins" },
      { property: "og:description", content: "Swap fees and slashed bonds feed $LOCKET reflections." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reactor,
});

function Reactor() {
  return (
    <main className="min-h-screen p-4 space-y-4">
      <Link to="/" className="hud-chip">← Back</Link>
      <section className="holo-panel p-4 space-y-3">
        <h1 className="hud-title">Locket Reactor Core</h1>
        <p className="hud-label">$LOCKET</p>
        <a className="break-all text-primary underline" href={`https://tonviewer.com/${LOCKET_MASTER}`} target="_blank" rel="noreferrer">{LOCKET_MASTER}</a>
        <div className="hud-card p-3">Swap fee: {PARTNER_FEE_BPS / 100}% · {FEE_TO_LOCKET_SHARE * 100}% goes to the reactor</div>
        <div className="hud-card p-3">Slashed call bonds: 100% to the reactor</div>
        <div className="hud-card p-3">Reflections: shared by map control + bunker defense</div>
        <div className="hud-card p-3">{TREASURY_WALLET ? "Fee routing live" : "Fee routing paused until the treasury wallet is set"}</div>
      </section>
    </main>
  );
}
