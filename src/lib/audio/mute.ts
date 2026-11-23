// Master mute for every game sound, saved on this device.
export const MUTE_KEY = "won:muted";
type Store = Pick<Storage, "getItem" | "setItem">;
const listeners = new Set<(m: boolean) => void>();
let cached: boolean | null = null;

function store(): Store | null {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
}

export function readMuted(s: Store | null = store()): boolean {
  try { return s?.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function isMuted(): boolean {
  if (cached === null) cached = readMuted();
  return cached;
}

export function setMuted(m: boolean, s: Store | null = store()) {
  cached = m;
  try { s?.setItem(MUTE_KEY, m ? "1" : "0"); } catch { /* storage blocked */ }
  listeners.forEach((l) => l(m));
}

export function onMuteChange(l: (m: boolean) => void): () => void {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
