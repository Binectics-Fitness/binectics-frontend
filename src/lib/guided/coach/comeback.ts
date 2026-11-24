/**
 * Ported from binectics-mobile src/guided/coach/comeback.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { getCached, setCache } from '../storage';

/**
 * The few fields of a finished task this needs, in the mobile ProgramTask's
 * names so the logic stays byte-for-byte with mobile. The web maps its
 * StarterTask onto it (see toComebackTask); every starter task is a workout.
 */
export interface ProgramTask {
  status: string;
  component_type?: string;
  scheduled_for: string;
  completed_at?: string | null;
  completed_late?: boolean;
}

/**
 * "Welcome back" logic: was the member's last finished session more than
 * COMEBACK_AFTER_DAYS ago? No network: it reads the starter snapshot that is
 * already on the device, plus a small marker written when a guided session is
 * marked done here (so a session finished a moment ago counts even if the
 * snapshot has not been refreshed yet).
 *
 * No known finished session (a new member) is never a comeback: nobody is
 * "back" on their first day.
 */
export const COMEBACK_AFTER_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;
const TTL = 10 * 365 * DAY_MS;
const key = (userId: string) => `starter_coach_lastdone_${userId}`;

/** The day a finished task was due, as a time: a bare date counts to the END of that day (never a false comeback). */
function dueTime(scheduledFor: string): number | null {
  if (!scheduledFor) return null;
  const t = Date.parse(scheduledFor);
  if (!Number.isFinite(t)) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(scheduledFor) ? t + DAY_MS - 1 : t;
}

/**
 * Latest finish we know of: finished workouts in the saved tasks, or the local marker. null = none known.
 *
 * Best date for a done task: its real settle time (`completed_at`, the occurrence's last update). Without
 * one, a task finished on time is dated by its due day (end of day); one finished late (`completed_late`)
 * was done some time after its day but within the catch-up window, so it is dated at most due day +
 * `catchUpDays` (and never after `savedAt`, when the copy was read). Capping at the window, not at the
 * last refresh, keeps a late-finished workout from hiding a genuine comeback for as long as it stays in
 * the agenda.
 */
export function lastCompletedAt(
  tasks: readonly ProgramTask[] | null | undefined,
  marker: number | null,
  savedAt: number | null = null,
  catchUpDays = 1,
): number | null {
  let best: number | null = marker !== null && Number.isFinite(marker) ? marker : null;
  for (const t of tasks ?? []) {
    if (t.status !== 'done' || t.component_type !== 'workout_plan') continue;
    const due = dueTime(t.scheduled_for);
    const real = t.completed_at ? Date.parse(t.completed_at) : NaN;
    let at: number | null;
    if (Number.isFinite(real)) {
      at = real;
    } else if (t.completed_late && due !== null) {
      const cap = due + Math.max(0, catchUpDays) * DAY_MS;
      at = savedAt !== null && Number.isFinite(savedAt) ? Math.min(cap, Math.max(due, savedAt)) : cap;
    } else {
      at = due;
    }
    if (at !== null && (best === null || at > best)) best = at;
  }
  return best;
}

/** More than COMEBACK_AFTER_DAYS since the last finish (exactly 3 days is not yet a comeback). */
export function isComeback(lastDoneAt: number | null, now: number): boolean {
  return lastDoneAt !== null && now - lastDoneAt > COMEBACK_AFTER_DAYS * DAY_MS;
}

export async function loadLastDone(userId: string | null | undefined): Promise<number | null> {
  if (!userId) return null;
  try {
    const v = await getCached<number>(key(userId));
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

/** Remember that a guided session was just marked done. */
export async function markSessionDone(userId: string | null | undefined, at = Date.now()): Promise<void> {
  if (!userId) return;
  await setCache(key(userId), at, TTL).catch(() => undefined);
}

/** A web StarterTask in the shape above. */
export function toComebackTask(t: { status: string; scheduledFor: string; completedLate?: boolean }): ProgramTask {
  return { status: t.status, component_type: 'workout_plan', scheduled_for: t.scheduledFor, completed_late: t.completedLate };
}
