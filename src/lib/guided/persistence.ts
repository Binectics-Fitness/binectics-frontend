/**
 * Ported from binectics-mobile src/guided/persistence.ts (feat/simplify-guided-start, mobile #299).
 * Same rules; localStorage instead of AsyncStorage. Writes happen synchronously inside the call, so a save from beforeunload lands.
 */
import { clearCache, getCached, setCache } from './storage';
import { reduce, type SessionState } from './engine';

/**
 * The active guided session, saved on the device so it survives the screen
 * being left, the app being backgrounded for a long time, or the tab being
 * closed. Keyed per member and occurrence; starts with the starter prefix, so
 * sign-out wipes it.
 *
 * What a restore means: timers are timestamps, so the saved state is exact up
 * to `seenAt`, the last moment the app was known to be running (a heartbeat
 * every few seconds, plus every state change). A restore NEVER lets the clock
 * run on through the gap (the member may have been away for an hour): the
 * session comes back PAUSED at `seenAt`, with the member's progress intact,
 * and they choose Resume or Start over. Nothing is recorded as done by
 * restoring, finishing or ending: only the summary's explicit button does.
 */
export const ACTIVE_TTL_MS = 12 * 60 * 60 * 1000;
const key = (userId: string) => `starter_guided_active_${userId}`;

export interface SavedSession {
  occurrenceId: string;
  state: SessionState;
  seenAt: number;
}

/**
 * Only a RUNNING or PAUSED run is written. A 'ready' intro never touches
 * storage (opening session B's intro must not delete session A's paused run),
 * and a 'completed' run clears only its own entry.
 */
export async function saveActive(userId: string, occurrenceId: string, state: SessionState, seenAt: number) {
  if (state.phase === 'ready') return;
  if (state.phase === 'completed') {
    await clearActive(userId, occurrenceId);
    return;
  }
  const entry: SavedSession = { occurrenceId, state, seenAt };
  await setCache(key(userId), entry, ACTIVE_TTL_MS);
}

export async function loadActive(userId: string, occurrenceId: string): Promise<SavedSession | null> {
  const saved = await getCached<SavedSession>(key(userId));
  if (!saved || saved.occurrenceId !== occurrenceId || !saved.state || typeof saved.seenAt !== 'number') return null;
  if (saved.state.phase === 'ready' || saved.state.phase === 'completed') return null;
  return saved;
}

/** Remove the saved run. With an occurrence id, only if that run is the one saved (never another session's). */
export async function clearActive(userId: string, occurrenceId?: string) {
  try {
    if (occurrenceId !== undefined) {
      const saved = await getCached<SavedSession>(key(userId));
      if (saved && saved.occurrenceId !== occurrenceId) return;
    }
    await clearCache(key(userId));
  } catch {
    /* nothing saved */
  }
}

/**
 * Same exercises, order AND dose (sets, reps, seconds, rest: all in the key)?
 * A changed plan is not resumable, so a coach's edit is never silently
 * replaced by the old numbers.
 */
export function samePlan(saved: SessionState, planKeys: readonly string[]): boolean {
  return saved.plan.length === planKeys.length && saved.plan.every((p, i) => p.key === planKeys[i]);
}

/** The saved state, paused at the moment the app was last seen. */
export function restoreAsPaused(saved: SavedSession): SessionState {
  const s = saved.state;
  if (s.pausedAt !== null) return s;
  return reduce(s, { type: 'pause', now: saved.seenAt });
}
