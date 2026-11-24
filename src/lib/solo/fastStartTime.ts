/**
 * The start-time rules behind the start page's "Starts" control (a port of
 * binectics-mobile src/utils/fasting.ts `startProblem` / `timeOnDay`, #261).
 * Pure, so they are tested without a browser.
 */
import { CLOCK_SKEW_MS, START_MAX_PAST_MS } from "./fastingRules";

export type StartProblem = "future" | "too_early" | "before_last_end";

/** Whether `ms` can be a start time right now (not ahead of the clock, not over 36 hours back). */
export function startAllowedAt(ms: number, nowMs: number): boolean {
  return ms <= nowMs + CLOCK_SKEW_MS && nowMs - ms <= START_MAX_PAST_MS;
}

/**
 * Why a start (`startMs`, null = now) cannot be used, or null when it can:
 * ahead of the clock, over 36 hours back, or before the member's last fast
 * ended (`lastEndMs`; the API refuses that as FASTING_OVERLAP).
 */
export function startTimeProblem(startMs: number | null, nowMs: number, lastEndMs: number | null): StartProblem | null {
  const at = startMs ?? nowMs;
  if (startMs !== null && !startAllowedAt(startMs, nowMs)) return startMs > nowMs + CLOCK_SKEW_MS ? "future" : "too_early";
  if (lastEndMs !== null && at < lastEndMs) return "before_last_end";
  return null;
}

/** `hours:minutes` on the day `daysBack` days before `nowMs`, local time. */
export function timeOnDay(nowMs: number, daysBack: number, hours: number, minutes: number): number {
  const d = new Date(nowMs);
  d.setDate(d.getDate() - daysBack);
  d.setHours(hours, minutes, 0, 0);
  return d.getTime();
}

/** "20:30" for an `<input type="time">` value. */
export function timeInputValue(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Hours and minutes from an `<input type="time">` value, or null when it is empty or malformed. */
export function parseTimeInput(value: string): { hours: number; minutes: number } | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!m) return null;
  const hours = Number(m[1]);
  const minutes = Number(m[2]);
  if (hours > 23 || minutes > 59) return null;
  return { hours, minutes };
}

/** The last fast's end that limits a new start: only while it is inside the 36 hour window. */
export function startLimit(lastEndMs: number | null, nowMs: number): number | null {
  return lastEndMs !== null && lastEndMs > nowMs - START_MAX_PAST_MS ? lastEndMs : null;
}
