# Roadmap — WAR ON MEMECOINS production build

Phases land in order; each must be green (all tests pass, clean build, no dead references) before the next.
Every feature: implemented, unit-tested, fails gracefully when chain/Telegram/APIs are down, styled only with
HUD classes + theme tokens, and adds no client-side secrets.

## Phase 0 — Foundation & going public
- [x] Rename package to `war-on-nations`; remove template leftovers (README, top bar title)
- [x] Real README (vision, features, stack, local setup)
- [x] README live link (Telegram bot)
- [x] Public by default: no beta/invite gates; guests browse Coin Board, Top 100, Whale Radar, War Map; wallet only for balance actions; server rate limits kept
- [x] Burn address verified against the canonical TON blackhole (`0:000…0`, `src/lib/onchain/burn-address.ts`, tested)

## Phase 1 — $WARDOG economic engine
- [x] Pure pricing module `src/lib/money/wardog-pricing.ts`: 20% off when paying with WARDOG
- [x] Armory charges the discounted WARDOG price (server-side) and shows it
- [ ] War Map sector claims payable in WARDOG — needs jetton-payment settlement (money paths are off)
- [ ] Citadel fortifications payable in WARDOG — the fortification mechanic doesn't exist yet
- [x] "Get $WARDOG (20% OFF)" shortcut opens Quick Swap with WARDOG pre-selected when a WARDOG purchase is short
- [x] 50% burn / 50% War Vault split on every in-game WARDOG spend (Armory, syndicate buffs/shields, AI art) with a `wardog_burns` audit row per spend
- [ ] Execute queued burns on-chain from the Claim Treasury to the burn address — needs treasury signing set up (money paths)
- [x] Holder tiers 1k / 10k / 50k (pure, tested at 999/1000, 9999/10000, 49999/50000); tier badge in HUD and battle preview with "checking…" state
- [x] Battle Glory (+10/20/30%) and Apex Citadel Dominance (+10%) applied at Coin Board battle settlement
- [ ] Recon speed (+10%) and War Map defense (+5%) perks — hidden until recon missions and map defense exist

## Phase 1.5 — Master flag & Putya companion (live, `PUTYA_ENABLED = true`)
- [x] `src/lib/config/features.ts` with `PUTYA_ENABLED` master flag (now on)
- [x] Putya voice engine `src/lib/putya/voice.ts`: event-based lines, "Putya Mode" intensity, returns nothing while the flag is off (tested)
- [x] Putya HUD companion docked on the main game screen; speaks for daily claims, energy full, strikes, terrorist status and coin battles
- [x] Command Briefing delivered by Putya
- [x] Putya reacts to War Map sector captures and failed claims
- [x] Greetings on return and escalating Apocalypse presence (Putya calls out radiation at 50/75/90%)
- [x] Putya voices the live kill-feed toasts and the Telegram energy/daily reminders
- [x] Destress Tent (Putya dock + Base tab): rest = +1 energy & +2 Glory/min up to 1 h, 3 favor talks/day (+3 each) — pure `src/lib/putya/tent.ts`, tested
- [x] Favor ranks Recruit <60 / Confidante 60 / Empress 85 → HUD avatar frames, title badges, brag-card title, victory stickers
- [x] Combat audio & haptics: nuke detonation, sector capture, victory fanfare, alarms; Telegram haptics on strikes/alerts/wins (`src/lib/audio/combat-feedback.ts`, tested)
- [ ] $PUTYA economy hooks: holder perks, spend sinks with 50% burn / 50% War Vault, $PUTYA/$WARDOG pair

## Phase 2 — Citadel UI & on-chain money rails
- [x] CitadelCard: L0–L5, season boost, WARDOG cost with 20% badge + strikethrough, progress bar
- [x] Fortify gated to Leader/Officer + enough vault WARDOG; clear top-up / role messages
- [x] On-chain burn job for `wardog_burns` (fail-closed), scheduled every 15 min
- [ ] Burns actually sending — needs BURN_WALLET_MNEMONIC + money paths on (owner)
- [x] War Vault WARDOG vouchers next to USD₮/TON (one open voucher per player per asset)
- [ ] Holder perks: +10% recon speed (1k+), +5% sector defense (10k+) — switch on once Recon Drone / sector shields are live

## Phase 3 — Syndicate Armory & dual payments
- [x] Remove merge-era ShopPanel and dead references (keep legacy save fields; old Shop links open Packs)
- [x] Utility rules (pure, tested): Recon Drone 60 min, EMP Jammer 2 h, Bunker Overdrive +25%, crates 1/3/5 rolls — `src/lib/armory/utilities.ts`
- [x] Utility purchase + effects on server, Armory cards, crate opening animation in TacticalModal
- [x] Pay with WARDOG (20% off) or Telegram Stars; credit only after server-verified settlement (Stars webhook registers on the published https site)

## Phase 4 — Token intelligence
- [x] Venue badges (live liquidity venues from GeckoTerminal) in Token Detail
- [x] Universal Token Detail modal (Top 100): price, 24h move, volume, liquidity, momentum, chart link, in-game Trade for Quick Swap coins
- [x] Rally share to Telegram with momentum flavor text

## Phase 5 — Market-driven warfare & cabals
- [x] Market momentum engine (`src/lib/market/momentum.ts`, tested): +5% Surge ×1.10, +20% Overcharge ×1.25, −5% Radiation ×0.90, 2× volume Frenzy +0.15; applied at battle settlement
- [x] War Map market heat strip (faction 24h moves + momentum)
- [x] Dev Emblem, social links and War Chest top-donor leaderboard on the Syndicate page; donation log labels
- [x] Treaty rules (pure, tested): 24h–7d pacts, breach detection, Oathbreaker ×0.75 glory for 24h — `src/lib/syndicate/treaty.ts`
- [x] Treaty signing UI + storage, and applying the Oathbreaker penalty at settlement (nukes, battlefield strikes, weekly Glory)

## Phase 6 — Persistence & storytelling
- [ ] On-chain Season Artifacts at the end of each Apocalypse
- [x] War Correspondent dispatch on the War Room from live public data (`src/lib/war-room/dispatch.ts`, tested)
- [ ] AI-written faction-voice dispatches

## Phase 7 — Audio & feel
- [ ] Full Web Audio suite with lazy init
- [x] Master mute in TopBar (saved, `src/lib/audio/mute.ts`)
- [ ] Haptics on every major action

## Phase 8 — Memorability pass
- [ ] Cinematic first-time onboarding
- [x] Kill Feed / War Feed with personality (+ Putya lines when enabled)
- [ ] Apocalypse "last stand" moments, titles, frames, animated emblems, rare victory effects
- [ ] Big-win euphoria / big-loss sting; friction pass on money & combat actions

## Phase 9 — Final hardening
- [ ] Full test suite green, dead code removed, roadmap final
- [ ] E2E smoke: guest, wallet-connected, Telegram Mini App

---

## Earlier work (Meme Mayhem unified spec)
- [x] Collapsible command deck on home + Raid Squad share
- [x] 4-source coin logo lookup (TonAPI, STON.fi, DeDust, swap.coffee)
- [x] Top-100 / 50 USD₮ promo / 6h Death Clock rules (tested)
- [x] 60/25/15 vault split rules (tested)
- [x] Whale filter rules (tested)
- [x] Death Clock banner + promoted-slot payment screen
- [x] Live whale feed + vault split shown in HUD/Bunker
- [x] Syndicate rules: tiles, citadel, 60/40 fees, harvest, culling, survivor weight (tested)
- [x] Tactical War Map page (practice claims)
- [ ] Paid tile claims in GRAM via TonConnect — needs marketing wallet address
- [ ] TON/GRAM staking — needs a staking provider choice (Tonstakers/Hipo)
- [ ] AI harvest/culling execution — needs market price feed for RSI
- [x] War Map → Coin Board synergy: live Citadel Dominance boosts season points (tested)
- [x] Recon report on return, Rally-your-squad share, map tap/capture sounds

- [x] 12-race animal factions: roster, faction standings ladder, sector wording across UI/alerts/share

## War On Memecoins rebrand & completion
- [x] Rebrand to War On Memecoins (titles, share text, TonConnect manifest, package name, README, top bar)
- [x] Syndicate browse cards show X / TG / DC chips and Verified Dev badge
- [x] KOL Cabals leaderboard tab (reputation + socials + Verified Dev + members)
- [x] War Map zones carry memecoin-lore names (Doge Den, Pepe Swamps, Bonk Citadel…)
- [x] DEX venue badges on Whale Radar feed and battle preview quotes
- [x] Faction home-coin perk: +10% season points at settlement, shown in battle preview
- [x] Syndicate pacts: propose / accept / decline / withdraw, broken on strike (Oathbreaker)
- [x] Mobile check at 360×599 and 390×844: no sideways scroll, title fits
- [ ] Telegram bot handle / X account still @waronnations — rename needs the new bot and accounts
- [ ] Database views game.syndicates / game.syndicate_members (code still uses nation tables)
