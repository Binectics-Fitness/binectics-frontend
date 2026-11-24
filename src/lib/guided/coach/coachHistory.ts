/**
 * Ported from binectics-mobile src/guided/coach/coachHistory.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { getCached, setCache } from '../storage';
import { EMPTY_HISTORY, startSession, type OnceHistory } from './selector';

/**
 * The persisted counter behind "a once line at most once per 5 sessions".
 * Per member, under the starter prefix, so sign-out wipes it with the rest of
 * the starter data. A preference-like record, not a cache: ~10 year TTL.
 */
const TTL = 10 * 365 * 24 * 60 * 60 * 1000;
const key = (userId: string) => `starter_coach_lines_${userId}`;

function sanitize(raw: unknown): OnceHistory {
  const r = (raw ?? {}) as Partial<OnceHistory>;
  const sessions = typeof r.sessions === 'number' && Number.isFinite(r.sessions) && r.sessions >= 0 ? Math.floor(r.sessions) : 0;
  const lastShown: Record<string, number> = {};
  if (r.lastShown && typeof r.lastShown === 'object') {
    for (const [id, n] of Object.entries(r.lastShown)) {
      if (typeof n === 'number' && Number.isFinite(n)) lastShown[id] = n;
    }
  }
  return { sessions, lastShown };
}

export async function loadCoachHistory(userId: string | null | undefined): Promise<OnceHistory> {
  if (!userId) return EMPTY_HISTORY;
  try {
    return sanitize(await getCached<OnceHistory>(key(userId)));
  } catch {
    return EMPTY_HISTORY;
  }
}

export async function saveCoachHistory(userId: string | null | undefined, history: OnceHistory): Promise<void> {
  if (!userId) return;
  await setCache(key(userId), history, TTL);
}

/** Load, count this session, save, and return the history to seed the selector with. */
export async function beginCoachSession(userId: string | null | undefined): Promise<OnceHistory> {
  const next = startSession(await loadCoachHistory(userId));
  await saveCoachHistory(userId, next).catch(() => undefined);
  return next;
}
