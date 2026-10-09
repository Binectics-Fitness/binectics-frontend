/**
 * Numbers for the member log pages (workouts, weight, meals, streaks).
 *
 * Pure functions over the records the API returned, so every figure on
 * those pages is a count or sum of real entries. `now` is the viewer's
 * clock from useClientNow(); days are LOCAL calendar days, the same way
 * WeekStrip and ActivityHeatmap bucket them (src/lib/ui/activity.ts).
 */
import { dayKey, heatmapCells, toDate, weekStrip, type DatedEvent } from "@/lib/ui/activity";

/** Local day keys of the current Monday-first week. */
export function weekDayKeys(now: Date): Set<string> {
  return new Set(weekStrip([], now).map((d) => d.date));
}

/** Local day keys of the `days` days ending today. */
export function windowDayKeys(now: Date, days: number): Set<string> {
  return new Set(heatmapCells([], days, now).map((c) => c.date));
}

/** Records whose moment falls on one of `keys`. Unparseable moments are dropped. */
export function onDays<T>(items: readonly T[], at: (item: T) => DatedEvent, keys: Set<string>): T[] {
  return items.filter((item) => {
    const d = toDate(at(item));
    return d !== null && keys.has(dayKey(d));
  });
}

/**
 * True when a newest-first page of `limit` records may have cut the window
 * short: the page is full and its oldest record is still inside the
 * `days`-day window, so older records in the window may not have loaded.
 */
export function mayBeTruncated<T>(
  items: readonly T[],
  at: (item: T) => DatedEvent,
  limit: number,
  now: Date,
  days = 30,
): boolean {
  if (items.length < limit) return false;
  return onDays(items, at, windowDayKeys(now, days)).length === items.length;
}

export interface WorkoutLike {
  performed_at: string;
  duration_minutes?: number | null;
  calories_burned?: number | null;
}

export interface WorkoutTotals {
  sessions: number;
  minutes: number;
  calories: number;
}

function totals(items: readonly WorkoutLike[]): WorkoutTotals {
  return {
    sessions: items.length,
    minutes: items.reduce((sum, a) => sum + (a.duration_minutes ?? 0), 0),
    calories: items.reduce((sum, a) => sum + (a.calories_burned ?? 0), 0),
  };
}

/** Sessions, minutes and calories this week and over the last 30 days. */
export function workoutTotals(
  activities: readonly WorkoutLike[],
  now: Date,
): { week: WorkoutTotals; last30: WorkoutTotals } {
  return {
    week: totals(onDays(activities, (a) => a.performed_at, weekDayKeys(now))),
    last30: totals(onDays(activities, (a) => a.performed_at, windowDayKeys(now, 30))),
  };
}

export interface WeightLike {
  weight_kg: number;
  recorded_at: string;
}

export interface WeightChange {
  /** Latest minus earliest log in the window, kg. */
  kg: number;
  /** The earliest log in the window, the baseline. */
  since: string;
}

/**
 * Change over the last 30 days: latest log minus the earliest log in the
 * window. Null unless the window holds at least two logs (one is not a change).
 */
export function weightChange30d(logs: readonly WeightLike[], now: Date): WeightChange | null {
  const inWindow = onDays(logs, (l) => l.recorded_at, windowDayKeys(now, 30)).sort((a, b) =>
    a.recorded_at.localeCompare(b.recorded_at),
  );
  if (inWindow.length < 2) return null;
  const first = inWindow[0];
  const last = inWindow[inWindow.length - 1];
  return { kg: last.weight_kg - first.weight_kg, since: first.recorded_at };
}

/** Oldest-first weights of the most recent `n` logs, for a sparkline. */
export function recentWeights(logs: readonly WeightLike[], n = 12): number[] {
  return [...logs]
    .sort((a, b) => a.recorded_at.localeCompare(b.recorded_at))
    .slice(-n)
    .map((l) => l.weight_kg);
}

/** "+0.4", "−1.8" (real minus sign), "0.0". */
export function signedKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  if (rounded === 0) return "0.0";
  return `${rounded > 0 ? "+" : "−"}${Math.abs(rounded).toFixed(1)}`;
}

export interface MealLike {
  meal_date: string;
  calories?: number | null;
}

/** Meals logged today, and calories over the ones that recorded any. */
export function mealsToday(meals: readonly MealLike[], now: Date): {
  count: number;
  calories: number;
  withCalories: number;
} {
  const today = onDays(meals, (m) => m.meal_date, new Set([dayKey(now)]));
  const counted = today.filter((m) => typeof m.calories === "number" && m.calories > 0);
  return {
    count: today.length,
    calories: counted.reduce((sum, m) => sum + (m.calories ?? 0), 0),
    withCalories: counted.length,
  };
}

/**
 * Streak milestones, in days: the API's list (binectics-api
 * src/nudges/nudge-rules.ts STREAK_MILESTONES), which sends a
 * STREAK_MILESTONE notification when a check-in reaches one. The badges are
 * drawn here from the API's streaks; mobile celebrates the same days.
 */
export const STREAK_MILESTONES = [7, 30, 50, 100, 365] as const;
/** Lifetime check-in milestones. */
export const SESSION_MILESTONES = [10, 50, 100, 250, 500] as const;

/** The first milestone above `days`, or null past the last one. */
export function nextStreakMilestone(days: number): number | null {
  return STREAK_MILESTONES.find((m) => m > days) ?? null;
}
