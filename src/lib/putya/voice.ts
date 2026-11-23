// Putya's voice: every line she can say, by game event and mood.
// Tone rule (Telegram-safe): cheeky, flirty-teasing, warlord swagger — never explicit.
import { PUTYA_ENABLED } from "@/lib/config/features";

export type PutyaMood = "doting" | "sassy" | "cold";

export type PutyaEvent =
  | "victory"
  | "defeat"
  | "capture"
  | "pump"
  | "dump"
  | "apocalypse"
  | "greeting"
  | "briefing"
  | "energyFull"
  | "dailyClaim"
  | "questDone"
  | "nukeLaunched"
  | "terrorist"
  | "nukeIncoming"
  | "killFeed"
  | "jailed"
  | "battleWin"
  | "battleLoss"
  | "whale"
  | "idle"
  | "tap"
  | "swap";

type Pool = { calm: string[]; wild: string[]; doting?: string[]; cold?: string[] };

const LINES: Record<PutyaEvent, Pool> = {
  victory: {
    calm: ["Nice work, soldier.", "That's my good boy."],
    wild: ["THEY'RE CRYING, PUP. I LOVE IT.", "Again. Do it again. For me."],
    doting: ["Look at you go. I knew I picked right.", "My favorite warlord strikes again."],
    cold: ["Finally. Took you long enough.", "One win. Don't let it go to your head."],
  },
  defeat: {
    calm: ["Shake it off, pup.", "We lost a sector, not the war."],
    wild: ["Ouch. Kiss it better later — counterattack NOW.", "You let them do that to us?"],
    doting: ["Hey. Chin up. You're still my champion.", "Bad round. Good soldier. Go again."],
    cold: ["Embarrassing. Fix it.", "I'm pretending I didn't see that."],
  },
  capture: {
    calm: ["New ground. Hold it.", "Flag's up, soldier."],
    wild: ["Mine now. Ours. Whatever.", "Plant it deep, warlord."],
    doting: ["Another flag for us. You spoil me.", "That's the energy I fell for."],
    cold: ["Hold it this time, okay?", "Cute flag. Keep it standing."],
  },
  pump: {
    calm: ["Chart's green. Push.", "Momentum's ours."],
    wild: ["GREEN CANDLES. I'm feeling dangerous.", "Pump it, pup!"],
    doting: ["Green chart, my favorite commander — what a day.", "We're printing, babe. Stay close."],
    cold: ["It's pumping. You're not. Interesting.", "Green candles and you're just… watching?"],
  },
  dump: {
    calm: ["Red day. Dig in.", "Weak hands fold. Not us."],
    wild: ["Who sold?! Names. Now.", "Blood on the chart, babe."],
    doting: ["Red day. I've got you. Diamond feathers.", "They panic. We don't. Right, pup?"],
    cold: ["Red everywhere. Don't you dare paper-hand.", "Dumping. Try not to cry on my uniform."],
  },
  apocalypse: {
    calm: ["Radiation's rising. Stay close.", "Last week. Make it count."],
    wild: ["The sky's on fire and you look cute.", "Last stand, soldier. Don't you dare die on me."],
    doting: ["End of the world? Fine. I'm spending it with you.", "Bunker's warm, commander. Hold the line."],
    cold: ["World's ending. You're still idle. Bold.", "Radiation's up. Your effort isn't."],
  },
  greeting: {
    calm: ["Back for duty, soldier?", "Missed you, pup."],
    wild: ["Finally. The war got boring without you.", "Took you long enough, good boy."],
    doting: ["There's my commander. I saved you a seat.", "You came back. Of course you did."],
    cold: ["Oh. You remembered me.", "Look who finally showed up."],
  },
  briefing: {
    calm: ["Briefing's ready. Coffee's not. Let's go.", "Today's intel is fresh, soldier."],
    wild: ["Sit. Listen. I made you a battle plan.", "Daily briefing, pup. Eyes on me."],
    doting: ["I prepped your briefing myself. You're welcome.", "Intel's in. You'll love today's front."],
    cold: ["Briefing's ready. Try to actually read it.", "Intel's up. Don't make me repeat it."],
  },
  energyFull: {
    calm: ["Energy's capped. Don't waste it.", "Full tank, soldier. Spend it."],
    wild: ["You're FULL and doing NOTHING? Go fight.", "Max energy. Make it hurt."],
    doting: ["Full energy, champ. Go show them who I back.", "Tank's full. Make me proud."],
    cold: ["Capped again. Wasting energy is so unattractive.", "Full energy just sitting there. Tragic."],
  },
  dailyClaim: {
    calm: ["Supply drop secured.", "Daily rations, delivered."],
    wild: ["Streak alive. I like consistent commanders.", "Loot secured. Now go earn it."],
    doting: ["Streak's going strong. I noticed.", "Look at you, showing up every day."],
    cold: ["Claimed. The bare minimum. Noted.", "Fine, take your drop."],
  },
  questDone: {
    calm: ["Mission complete. Collect.", "Objective cleared."],
    wild: ["Checklist destroyed. Mmm, productive.", "Task done. Next."],
    doting: ["Another mission down. You're on fire.", "Efficient. I like that in a warlord."],
    cold: ["One mission. Want a medal?", "Done. Finally."],
  },
  nukeLaunched: {
    calm: ["Strike confirmed. Impact on target.", "Payload delivered."],
    wild: ["BOOM. I felt that in my feathers.", "Risky. I like dangerous commanders."],
    doting: ["That's the confidence I adore.", "Clean strike, my love-of-war."],
    cold: ["Loud. Let's see if it mattered.", "Nice fireworks. Now follow up."],
  },
  terrorist: {
    calm: ["You're on the watchlist now. Lie low.", "Rogue status. Careful, pup."],
    wild: ["Wanted poster looks good on you.", "Rogue? Ooh. Bad influence."],
    doting: ["Rogue status… I'll still cover for you.", "Every legend has a wanted poster."],
    cold: ["Rogue. Reckless. Typical.", "Congrats, you're a problem now."],
  },
  nukeIncoming: {
    calm: ["Strike reported on the map.", "Someone just got hit. Eyes up."],
    wild: ["Somebody got nuked. Popcorn, pup?", "Mushroom cloud on the radar, babe."],
    doting: ["Strike out there. Stay close to me.", "Big hit on the map. We're fine. I've got you."],
    cold: ["A strike. Not yours, obviously.", "Others are fighting. Just saying."],
  },
  killFeed: {
    calm: ["Contact on the battlefield.", "Ops report in."],
    wild: ["Messy. I love messy.", "Brutal. Take notes."],
    doting: ["You'd have done it cleaner.", "Not bad. You're better."],
    cold: ["Someone's actually playing.", "That could've been you. It wasn't."],
  },
  jailed: {
    calm: ["Protected leader. Instant jail.", "Rookie mistake. Into the cell."],
    wild: ["LOL. Straight to jail.", "Touching a protected leader? Bold. Dumb."],
    doting: ["Don't ever do that, okay? I need you free.", "Rookie move. Not you though."],
    cold: ["Even you know better. I hope.", "Jailed. Learn from it."],
  },
  battleWin: {
    calm: ["Battlefield cleared. Good shooting.", "Mission success, soldier."],
    wild: ["You absolute menace. Again!", "That aim? Dangerous. Do it again."],
    doting: ["That was gorgeous shooting.", "My champion walks away untouched."],
    cold: ["Okay. That one was decent.", "Fine. You can shoot. Sometimes."],
  },
  battleLoss: {
    calm: ["Down, not out. Reload.", "Regroup. Next round's ours."],
    wild: ["They got you. Make them regret it.", "Get up. Get mad. Go again."],
    doting: ["Rough round. I still believe in you.", "Next one's yours. I can feel it."],
    cold: ["That was painful to watch.", "Practice. Please."],
  },
  whale: {
    calm: ["Whale movement on the order book.", "Big money just moved."],
    wild: ["Babe, look what just hit the order book.", "WHALE ALERT. My feathers are shaking."],
    doting: ["Whale in the water. I spotted it for you.", "Big wallet moving. Want my take?"],
    cold: ["Whales move. You don't.", "Big buyer showed up. Not you."],
  },
  idle: {
    calm: ["Waiting on your orders, commander.", "Quiet front. Make some noise."],
    wild: ["I'm bored. Start a war.", "Entertain me, pup."],
    doting: ["Just watching you plan. Carry on.", "Take your time. I'm not going anywhere."],
    cold: ["Staring at the chart won't move it.", "Are we playing or sightseeing?"],
  },
  tap: {
    calm: ["Yes, commander?", "Reporting for duty."],
    wild: ["Poke me again and see what happens.", "Careful with the feathers, pup."],
    doting: ["Hi you.", "Need me? I'm right here."],
    cold: ["What.", "Don't touch the uniform."],
  },
  swap: {
    calm: ["Position adjusted.", "Swap confirmed."],
    wild: ["Rotating like a pro. Hot.", "New bag, who dis."],
    doting: ["Smart move, as always.", "Clean rotation, commander."],
    cold: ["Swapped. Hope you meant that.", "Bold rotation. We'll see."],
  },
};

export type PutyaLineOptions = { wild?: boolean; seed?: number; enabled?: boolean; mood?: PutyaMood };

/** Returns a Putya line, or null while Putya is switched off. `seed` keeps picks deterministic. */
export function putyaLine(event: PutyaEvent, opts: PutyaLineOptions = {}): string | null {
  if (!(opts.enabled ?? PUTYA_ENABLED)) return null;
  const pools = LINES[event];
  const moodPool = opts.mood === "doting" ? pools.doting : opts.mood === "cold" ? pools.cold : undefined;
  const pool = moodPool && !opts.wild ? moodPool : pools[opts.wild ? "wild" : "calm"];
  const i = Math.abs(Math.floor(opts.seed ?? 0)) % pool.length;
  return pool[i] ?? null;
}

/** Every event Putya has a voice for — used by tests to keep pools complete. */
export const PUTYA_EVENTS = Object.keys(LINES) as PutyaEvent[];

/** All lines for one event (all moods), for audits. */
export function allPutyaLines(event: PutyaEvent): string[] {
  const p = LINES[event];
  return [...p.calm, ...p.wild, ...(p.doting ?? []), ...(p.cold ?? [])];
}
