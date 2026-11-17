import type { SeriesPoint } from "@/lib/api/memberSeries";
import type { WaterSpan } from "./glanceCopy";

/**
 * Pure rules behind the glance cards. Days are the browser's LOCAL calendar
 * days as "YYYY-MM-DD" (the API is sent the same zone, so both sides name the
 * same day). A day the API returned no point for is a GAP: it stays null here
 * and is never turned into a zero, a mark or a count.
 */

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const LONG_DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const INITIALS = ["S", "M", "T", "W", "T", "F", "S"];

const two = (n: number) => String(n).padStart(2, "0");

/** The local "YYYY-MM-DD" of an instant. */
export function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())}`;
}

/** A local noon Date for a "YYYY-MM-DD" (noon, so a DST shift never changes the day). */
export function dateOfDay(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12, 0, 0, 0);
}

export function addDaysTo(day: string, n: number): string {
  const d = dateOfDay(day);
  d.setDate(d.getDate() + n);
  return dayKeyOf(d);
}

/** Whole calendar days from a to b (b - a). */
export function dayDiffBetween(a: string, b: string): number {
  return Math.round((dateOfDay(b).getTime() - dateOfDay(a).getTime()) / 86_400_000);
}

/** "Fri 20 Nov". */
export function dayLabel(day: string): string {
  const d = dateOfDay(day);
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "Thursday 19 Nov". */
export function longDayLabel(day: string): string {
  const d = dateOfDay(day);
  return `${LONG_DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export const dayInitial = (day: string): string => INITIALS[dateOfDay(day).getDay()];

/** The `n` local days ending at `today`, oldest first. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDaysTo(today, -(n - 1 - i)));
}

export const windowOf = (today: string, n: number): { from: string; to: string } => ({
  from: addDaysTo(today, -(n - 1)),
  to: today,
});

// ─── Fasting ────────────────────────────────────────────────────────────────

export interface FastDay {
  day: string;
  label: string;
  initial: string;
  /** Hours fasted on the day (fasts that ENDED that day, added up); null = nothing recorded (a gap). */
  hours: number | null;
  /** How many fasts ended that day. */
  count: number;
}

/** One cell per day, oldest first. A day with no (or a zero) point is a gap. */
export function fastDays(points: SeriesPoint[], today: string, span: number): FastDay[] {
  const byDay = new Map(points.map((p) => [p.start_day, p]));
  return lastDays(today, span).map((day) => {
    const p = byDay.get(day);
    const has = !!p && Number.isFinite(p.value) && p.value > 0;
    return { day, label: dayLabel(day), initial: dayInitial(day), hours: has ? p.value : null, count: has ? p.n : 0 };
  });
}

/** The mean over the days that have a fast. Days without one are not in it. */
export function fastAverage(cells: FastDay[]): { average: number | null; days: number } {
  const have = cells.filter((c): c is FastDay & { hours: number } => c.hours !== null);
  if (have.length === 0) return { average: null, days: 0 };
  return { average: have.reduce((s, c) => s + c.hours, 0) / have.length, days: have.length };
}

/** A bar's height as a percent of the track, on a shared 0 to `maxHours` scale. */
export const barPercent = (hours: number, maxHours: number): number =>
  Math.max(2, Math.round((Math.min(hours, maxHours) / maxHours) * 100));

/** Where the own-window band sits on the same scale, as percents of the track. */
export function bandGeometry(min: number, max: number, maxHours: number): { bottom: number; height: number } {
  const lo = (Math.min(min, maxHours) / maxHours) * 100;
  const hi = (Math.min(max, maxHours) / maxHours) * 100;
  return { bottom: lo, height: Math.max(2, hi - lo) };
}

// ─── Water ──────────────────────────────────────────────────────────────────

export interface WaterStats {
  average: number | null;
  /** Days with at least one glass counted. */
  days: number;
  /** The week before (only for the `week` span), when it has counted days. */
  previous: number | null;
}

const meanOf = (xs: number[]): number | null => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/**
 * The usual day. Only days with at least one glass count (a day nobody logged
 * is a gap, not a zero). Today's number comes from the live count (it
 * includes taps just made); every other day is the server's.
 */
export function waterStats(points: SeriesPoint[], today: string, span: WaterSpan, todayCount: number | null): WaterStats {
  const byDay = new Map<string, number>();
  for (const p of points) if (Number.isFinite(p.value) && p.value > 0) byDay.set(p.start_day, p.value);
  if (todayCount !== null) {
    if (todayCount > 0) byDay.set(today, todayCount);
    else byDay.delete(today);
  }
  const within = (from: string, to: string) =>
    [...byDay.entries()].filter(([d]) => d >= from && d <= to).map(([, v]) => v);
  if (span === "weeks4") {
    const v = within(addDaysTo(today, -27), today);
    return { average: meanOf(v), days: v.length, previous: null };
  }
  const now = within(addDaysTo(today, -6), today);
  const before = within(addDaysTo(today, -13), addDaysTo(today, -7));
  return { average: meanOf(now), days: now.length, previous: meanOf(before) };
}

/** Where the fill ends on a rail, 0 to 100. Position only: it is never printed as a number. */
export const railPosition = (value: number, aim: number): number =>
  aim <= 0 ? 0 : Math.max(0, Math.min(100, (value / aim) * 100));

// ─── Weight (daily list) ────────────────────────────────────────────────────

export interface DailyWeight {
  day: string;
  label: string;
  kg: number;
}

/** The newest `n` days with a weigh-in, newest first. */
export function latestWeighIns(points: SeriesPoint[], n = 5): DailyWeight[] {
  return [...points]
    .filter((p) => Number.isFinite(p.value))
    .sort((a, b) => (a.start_day < b.start_day ? 1 : a.start_day > b.start_day ? -1 : 0))
    .slice(0, n)
    .map((p) => ({ day: p.start_day, label: dayLabel(p.start_day), kg: p.value }));
}

// ─── Steppers ───────────────────────────────────────────────────────────────

export const roundHalf = (n: number): number => Math.round(n * 2) / 2;
export const clampTo = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
