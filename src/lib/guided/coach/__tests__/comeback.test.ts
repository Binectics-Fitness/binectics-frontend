/**
 * Ported from binectics-mobile src/guided/coach/__tests__/comeback.test.ts (feat/simplify-guided-start, mobile #299).
 * Keep the behaviour identical to the mobile file; change both together.
 */
import { COMEBACK_AFTER_DAYS, isComeback, lastCompletedAt, loadLastDone, markSessionDone } from '../comeback';
import type { ProgramTask } from '../comeback';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-10-31T12:00:00Z');
const task = (over: Partial<ProgramTask>): ProgramTask =>
  ({ id: 't', component_type: 'workout_plan', scheduled_for: '2026-10-20', status: 'done', ...over }) as ProgramTask;

describe('lastCompletedAt', () => {
  it('is null for a member with nothing finished (a new member is never "back")', () => {
    expect(lastCompletedAt([], null)).toBeNull();
    expect(lastCompletedAt(null, null)).toBeNull();
    expect(lastCompletedAt([task({ status: 'pending' }), task({ status: 'missed' }), task({ status: 'skipped' })], null)).toBeNull();
    expect(isComeback(null, NOW)).toBe(false);
  });

  it('takes the latest finished workout and ignores other kinds and unreadable dates', () => {
    const tasks = [
      task({ scheduled_for: '2026-10-10' }),
      task({ scheduled_for: '2026-10-25' }),
      task({ scheduled_for: '2026-10-30', component_type: 'meal_plan' as never }),
      task({ scheduled_for: 'not a date' }),
      task({ scheduled_for: '' }),
    ];
    // A bare date counts to the end of that day.
    expect(lastCompletedAt(tasks, null)).toBe(Date.parse('2026-10-25') + DAY - 1);
  });

  it('prefers the local marker when it is newer, and the snapshot when it is', () => {
    const tasks = [task({ scheduled_for: '2026-10-25' })];
    expect(lastCompletedAt(tasks, NOW - 1000)).toBe(NOW - 1000);
    expect(lastCompletedAt(tasks, Date.parse('2026-10-01'))).toBe(Date.parse('2026-10-25') + DAY - 1);
  });
});

describe('a task finished late', () => {
  const dueEnd = Date.parse('2026-10-10') + DAY - 1;

  it('uses its real completion time when the server sent one', () => {
    const t = task({ scheduled_for: '2026-10-10', completed_late: true, completed_at: '2026-10-30T09:00:00Z' });
    expect(lastCompletedAt([t], null, NOW)).toBe(Date.parse('2026-10-30T09:00:00Z'));
    expect(isComeback(lastCompletedAt([t], null, NOW), NOW)).toBe(false);
    // An on-time task with a real time uses it too.
    expect(lastCompletedAt([task({ completed_at: '2026-10-29T09:00:00Z' })], null)).toBe(Date.parse('2026-10-29T09:00:00Z'));
  });

  it('without one, is capped at due day + the catch-up window: no false "not a comeback"', () => {
    // Saved copy refreshed a moment ago (Today just loaded), task still in the agenda, due 3 weeks ago.
    const late = task({ scheduled_for: '2026-10-10', completed_late: true });
    expect(lastCompletedAt([late], null, NOW - 1000, 1)).toBe(dueEnd + DAY);
    expect(isComeback(lastCompletedAt([late], null, NOW - 1000, 1), NOW)).toBe(true); // a genuine comeback is not hidden
    expect(lastCompletedAt([late], null, NOW - 1000, 3)).toBe(dueEnd + 3 * DAY);
  });

  it('is never dated after the saved copy was read, and the true side still holds', () => {
    const recent = task({ scheduled_for: '2026-10-29', completed_late: true });
    // Window would allow 10-31 end of day, but the copy was read on 10-30.
    const readAt = Date.parse('2026-10-30T08:00:00Z');
    expect(lastCompletedAt([recent], null, readAt, 7)).toBe(readAt);
    expect(isComeback(lastCompletedAt([recent], null, readAt, 7), NOW)).toBe(false);
  });

  it('without a read time or a real time, falls back to the window', () => {
    const late = task({ scheduled_for: '2026-10-10', completed_late: true });
    expect(lastCompletedAt([late], null, null, 1)).toBe(dueEnd + DAY);
  });
});

describe('isComeback', () => {
  it('is true only after MORE than 3 days', () => {
    expect(COMEBACK_AFTER_DAYS).toBe(3);
    expect(isComeback(NOW - 3 * DAY, NOW)).toBe(false);
    expect(isComeback(NOW - 3 * DAY - 1, NOW)).toBe(true);
    expect(isComeback(NOW - DAY, NOW)).toBe(false);
    expect(isComeback(NOW - 20 * DAY, NOW)).toBe(true);
  });
  it('a finish in the future (clock change) is not a comeback', () => {
    expect(isComeback(NOW + DAY, NOW)).toBe(false);
  });
});

describe('the local marker', () => {
  it('round-trips per member and tolerates no member', async () => {
    expect(await loadLastDone('cb1')).toBeNull();
    await markSessionDone('cb1', 12345);
    expect(await loadLastDone('cb1')).toBe(12345);
    expect(await loadLastDone('cb2')).toBeNull();
    expect(await loadLastDone(null)).toBeNull();
    await expect(markSessionDone(undefined)).resolves.toBeUndefined();
  });
});
