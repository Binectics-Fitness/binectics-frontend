import type { ProgressReportSnapshot } from "@/lib/api/progressReports";

/**
 * Helpers for progress report periods and the figures shown beside a report.
 * Periods are calendar days (YYYY-MM-DD), the form the API takes.
 */

export type PeriodPresetKey = "last-30" | "last-90" | "last-month" | "this-month" | "custom";

export interface Period {
  start: string;
  end: string;
}

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** The calendar day it is for the viewer. */
export function todayYmd(now: Date): string {
  return ymd(now);
}

export const PERIOD_PRESETS: { key: Exclude<PeriodPresetKey, "custom">; label: string }[] = [
  { key: "last-30", label: "Last 30 days" },
  { key: "last-90", label: "Last 90 days" },
  { key: "last-month", label: "Last month" },
  { key: "this-month", label: "This month" },
];

/** The days a preset covers, ending today at the latest. */
export function presetPeriod(key: Exclude<PeriodPresetKey, "custom">, now: Date): Period {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (key) {
    case "last-30":
      return { start: ymd(new Date(y, m, d - 29)), end: ymd(now) };
    case "last-90":
      return { start: ymd(new Date(y, m, d - 89)), end: ymd(now) };
    case "last-month":
      return { start: ymd(new Date(y, m - 1, 1)), end: ymd(new Date(y, m, 0)) };
    case "this-month":
      return { start: ymd(new Date(y, m, 1)), end: ymd(now) };
  }
}

/** Why a period can't be used, or null. Mirrors the API's checks. */
export function periodProblem(p: Period, now: Date): string | null {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(p.start) || !re.test(p.end)) return "Pick a start and an end date.";
  if (p.end < p.start) return "The end date is before the start date.";
  if (p.end > todayYmd(now)) return "The period can't end in the future.";
  const days = (Date.parse(`${p.end}T00:00:00Z`) - Date.parse(`${p.start}T00:00:00Z`)) / 86_400_000 + 1;
  if (days > 366) return "A report covers at most a year.";
  return null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-01".."2026-09-30" -> "1 Sep to 30 Sep 2026". */
export function formatPeriod(start: string, end: string): string {
  const part = (s: string, withYear: boolean) => {
    const [y, m, d] = s.split("-");
    return `${Number(d)} ${MONTHS[Number(m) - 1] ?? m}${withYear ? ` ${y}` : ""}`;
  };
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${part(start, !sameYear)} to ${part(end, true)}`;
}

export interface Highlight {
  label: string;
  value: string;
}

/**
 * The figures a report holds, for a list row or a preview. Only figures the
 * report actually has: a section with nothing behind it is left out, never
 * shown as zero or a dash.
 */
export function reportHighlights(s: ProgressReportSnapshot): Highlight[] {
  const out: Highlight[] = [];
  const t = s.programs.totals;
  if (s.programs.adherence_pct != null) out.push({ label: "Adherence", value: `${s.programs.adherence_pct}%` });
  if (t.due > 0) out.push({ label: "Tasks done", value: `${t.done} of ${t.due}` });
  if (s.weight.change_kg != null) {
    const c = Math.round(s.weight.change_kg * 10) / 10;
    out.push({ label: "Weight change", value: `${c > 0 ? "+" : ""}${c.toFixed(1)} kg` });
  }
  const checkins = s.attendance.checkins;
  if (checkins && checkins.visits > 0) out.push({ label: "Gym visits", value: String(checkins.visits) });
  const sessions = s.attendance.sessions;
  if (sessions.completed + sessions.no_show + sessions.cancelled > 0) {
    out.push({ label: "Sessions done", value: String(sessions.completed) });
  }
  if (s.journal.total > 0) out.push({ label: "Journal entries", value: String(s.journal.total) });
  return out;
}
