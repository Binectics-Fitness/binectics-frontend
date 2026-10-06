/**
 * Activity derivations for WeekStrip and ActivityHeatmap.
 *
 * Pure functions from dated events (check-ins, workouts, logs) to the states
 * the two components draw. Nothing here invents a number: a day is "done"
 * only if an event fell on it, and a heatmap level comes from the real count
 * for that day. Days are LOCAL calendar days.
 *
 * The mobile app mirrors this module (same names, same semantics), so keep
 * it small and free of web-only imports.
 */

/** An event's moment: an ISO timestamp or a Date. */
export type DatedEvent = string | Date;

/**
 * done     — at least one event that day (today included)
 * today    — today, no event yet
 * missed   — a past day with no event
 * upcoming — a future day
 */
export type DayState = "done" | "today" | "missed" | "upcoming";

export interface WeekDay {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  /** Short weekday, e.g. "Mon". */
  weekday: string;
  /** Day of the month, 1–31. */
  dayOfMonth: number;
  state: DayState;
  /** True for today whatever its state, so a done today can still be marked. */
  isToday: boolean;
  /** Events on that day. */
  count: number;
}

/** 0 = no events; 1–3 = rising intensity relative to the busiest day. */
export type HeatLevel = 0 | 1 | 2 | 3;

export interface HeatCell {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  count: number;
  level: HeatLevel;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Local YYYY-MM-DD for a moment. */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Events per local day. Unparseable moments are skipped, never guessed. */
export function countByDay(events: readonly DatedEvent[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const event of events) {
    const at = event instanceof Date ? event : new Date(event);
    if (Number.isNaN(at.getTime())) continue;
    const key = dayKey(at);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * The seven days of the week containing `now`, first day first.
 * `weekStartsOn` is 1 (Monday, the default) or 0 (Sunday).
 */
export function weekStrip(
  events: readonly DatedEvent[],
  now: Date = new Date(),
  weekStartsOn: 0 | 1 = 1,
): WeekDay[] {
  const counts = countByDay(events);
  const today = startOfDay(now);
  const todayKey = dayKey(today);
  const offset = (today.getDay() - weekStartsOn + 7) % 7;
  const start = addDays(today, -offset);

  const days: WeekDay[] = [];
  for (let i = 0; i < 7; i += 1) {
    const day = addDays(start, i);
    const key = dayKey(day);
    const count = counts.get(key) ?? 0;
    const isToday = key === todayKey;
    let state: DayState;
    if (count > 0) state = "done";
    else if (isToday) state = "today";
    else if (day.getTime() < today.getTime()) state = "missed";
    else state = "upcoming";
    days.push({
      date: key,
      weekday: WEEKDAY_SHORT[day.getDay()],
      dayOfMonth: day.getDate(),
      state,
      isToday,
      count,
    });
  }
  return days;
}

/**
 * Intensity for one day relative to the busiest day in the window:
 * 0 when there were no events, otherwise ceil(3 × count / max), so the
 * busiest day is always 3 and any active day is at least 1.
 */
export function heatLevel(count: number, max: number): HeatLevel {
  if (count <= 0 || max <= 0) return 0;
  const level = Math.ceil((3 * Math.min(count, max)) / max);
  return Math.max(1, Math.min(3, level)) as HeatLevel;
}

/**
 * One cell per day for the `days` days ending today, oldest first.
 * Events outside the window are ignored.
 */
export function heatmapCells(
  events: readonly DatedEvent[],
  days = 30,
  now: Date = new Date(),
): HeatCell[] {
  const counts = countByDay(events);
  const today = startOfDay(now);
  const window: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const key = dayKey(addDays(today, -i));
    window.push({ date: key, count: counts.get(key) ?? 0 });
  }
  const max = window.reduce((m, c) => Math.max(m, c.count), 0);
  return window.map((c) => ({ ...c, level: heatLevel(c.count, max) }));
}

/** Days in the cells with at least one event. */
export function activeDays(cells: readonly HeatCell[]): number {
  return cells.filter((c) => c.count > 0).length;
}
