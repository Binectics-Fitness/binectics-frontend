import type { MyCheckInStatus } from "@/lib/types";
import {
  CHECKED_IN_TODAY,
  NO_VISITS_THIS_WEEK,
  lastVisit,
  visitsThisWeek,
} from "./visitsCopy";

/**
 * Gym visit counts (owner 19 Nov 2026: no platform streaks). Mirrors mobile
 * #255 (screens/home/oneToday.ts): weeks start on the member's Goals
 * week_start (Monday when unset or unread), in the browser's time zone.
 */
export type WeekStart = "monday" | "sunday";

/** The Goals setting as a WeekStart; anything else is Monday. */
export function toWeekStart(value: string | null | undefined): WeekStart {
  return value === "sunday" ? "sunday" : "monday";
}

/** For weekStrip(): 0 = Sunday, 1 = Monday. */
export function weekStartsOn(weekStart: WeekStart): 0 | 1 {
  return weekStart === "sunday" ? 0 : 1;
}

/** Midnight at the start of the week containing `now`. */
export function weekStartOf(now: Date, weekStart: WeekStart = "monday"): Date {
  const first = weekStartsOn(weekStart);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - ((start.getDay() - first + 7) % 7));
  return start;
}

const toTime = (c: string | { checked_in_at: string }) =>
  new Date(typeof c === "string" ? c : c.checked_in_at).getTime();

/** Check-ins from the start of this week up to now. Unparseable times are skipped, never guessed. */
export function countVisitsThisWeek(
  checkIns: readonly (string | { checked_in_at: string })[],
  now: Date,
  weekStart: WeekStart = "monday",
): number {
  const from = weekStartOf(now, weekStart).getTime();
  const to = now.getTime();
  return checkIns.filter((c) => {
    const at = toTime(c);
    return !Number.isNaN(at) && at >= from && at <= to;
  }).length;
}

/** Check-ins in the last `days` days (today and the days before it). */
export function countVisitsInDays(
  checkIns: readonly (string | { checked_in_at: string })[],
  now: Date,
  days: number,
): number {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1)).getTime();
  const to = now.getTime();
  return checkIns.filter((c) => {
    const at = toTime(c);
    return !Number.isNaN(at) && at >= from && at <= to;
  }).length;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "Tue 17 Nov". */
export function shortDay(at: Date): string {
  return `${WEEKDAY_SHORT[at.getDay()]} ${at.getDate()} ${MONTH_SHORT[at.getMonth()]}`;
}

export interface VisitsRow {
  title: string;
  meta?: string;
}

/**
 * The visits row (board H1-H4; mobile V1/V2). `weekCount` is null when this
 * week's history could not be read: the row then says only what it knows and
 * never guesses a count. Null when the stats read failed.
 */
export function visitsRow(input: {
  stats: Pick<MyCheckInStatus, "has_checked_in_today" | "last_check_in_at"> | null;
  weekCount: number | null;
}): VisitsRow | null {
  const { stats, weekCount } = input;
  if (!stats) return null;
  const today = !!stats.has_checked_in_today;
  // Today is in this week, so a check-in today is at least one this week.
  const count = weekCount === null ? null : today ? Math.max(weekCount, 1) : weekCount;
  const meta = count ? visitsThisWeek(count) : undefined;
  if (today) return { title: CHECKED_IN_TODAY, meta };
  const last = stats.last_check_in_at ? new Date(stats.last_check_in_at) : null;
  const lastDay = last && !Number.isNaN(last.getTime()) ? shortDay(last) : null;
  if (count) return lastDay ? { title: lastVisit(lastDay), meta } : { title: visitsThisWeek(count) };
  if (count === null && lastDay) return { title: lastVisit(lastDay) };
  if (count === null) return null;
  return { title: NO_VISITS_THIS_WEEK };
}
