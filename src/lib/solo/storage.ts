/**
 * Browser keys the solo screens may keep start with `solo:`; sign-out wipes
 * them all (called by clearAuthStorage). The only keys today are the
 * member's onboarding answers (startChoice.ts); the hide-daily-weights
 * choice lives on the server. Older builds kept it under
 * `solo:hide-daily-weights:<userId>`, and this sweep also removes that
 * leftover key.
 */
export const SOLO_STORAGE_PREFIX = "solo:";

/** Removes every `solo:` key (sign-out). Never throws. */
export function clearSoloStorage(): void {
  try {
    if (typeof window === "undefined") return;
    const s = window.localStorage;
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
