/**
 * "Hide daily weights for good": a per-account choice kept ONLY in this
 * browser (localStorage), never on the server. The key starts with `solo:` so
 * sign-out wipes it with any other solo data (see clearSoloStorage, called by
 * clearAuthStorage). It stores the single word "1": no weight, no date.
 */
export const SOLO_STORAGE_PREFIX = "solo:";
const HIDE_KEY = (userId: string) => `${SOLO_STORAGE_PREFIX}hide-daily-weights:${userId}`;

function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readHideDailyWeights(userId: string | null | undefined): boolean {
  if (!userId) return false;
  try {
    return store()?.getItem(HIDE_KEY(userId)) === "1";
  } catch {
    return false;
  }
}

export function writeHideDailyWeights(userId: string | null | undefined, hide: boolean): void {
  if (!userId) return;
  try {
    const s = store();
    if (!s) return;
    if (hide) s.setItem(HIDE_KEY(userId), "1");
    else s.removeItem(HIDE_KEY(userId));
  } catch {
    /* storage blocked: the choice lasts for this visit only */
  }
}

/** Removes every `solo:` key (sign-out). Never throws. */
export function clearSoloStorage(): void {
  try {
    const s = store();
    if (!s) return;
    const doomed: string[] = [];
    for (let i = 0; i < s.length; i += 1) {
      const k = s.key(i);
      if (k && k.startsWith(SOLO_STORAGE_PREFIX)) doomed.push(k);
    }
    doomed.forEach((k) => s.removeItem(k));
  } catch {
    /* nothing to wipe */
  }
}
