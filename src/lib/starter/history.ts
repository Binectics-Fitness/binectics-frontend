import { addDaysLocal, formatTaskDay, taskDay } from "./model";
import { StarterTaskStatus, type StarterTask } from "./types";

/**
 * The member's own facts for their starter program: a plain week-by-week
 * list of what was done, done late, skipped and missed, and the numbers they
 * chose to log. Counts only. No streaks, points, scores or percentages.
 * Port of binectics-mobile src/utils/starterHistory.ts.
 */

export enum HistoryStatus {
  Done = "done",
  DoneLate = "done_late",
  Skipped = "skipped",
  Missed = "missed",
  Open = "open",
}

export interface StarterHistoryDay {
  day: string;
  items: StarterTask[];
}

export interface HistoryRow {
  id: string;
  title: string;
  dayLabel: string;
  status: HistoryStatus;
  statusLabel: string;
}

export interface HistoryWeek {
  week: number;
  /** "Week 2". */
  label: string;
  /** The first day of the week: "From Mon, Nov 9". */
  from: string;
  counts: { done: number; late: number; skipped: number; missed: number };
  /** "2 sessions done, 1 of them late · 1 missed": only the non-zero parts. */
  summary: string;
  rows: HistoryRow[];
}

/** The API serves at most 60 days of history; a starter lasts about a month. */
export const HISTORY_DAYS = 60;

const STATUS_LABELS: Record<HistoryStatus, string> = {
  [HistoryStatus.Done]: "Done",
  [HistoryStatus.DoneLate]: "Done late",
  [HistoryStatus.Skipped]: "Skipped",
  [HistoryStatus.Missed]: "Missed",
  [HistoryStatus.Open]: "Still open",
};

export function historyStatus(t: Pick<StarterTask, "status" | "completedLate">): HistoryStatus {
  if (t.status === StarterTaskStatus.Done) return t.completedLate ? HistoryStatus.DoneLate : HistoryStatus.Done;
  if (t.status === StarterTaskStatus.Skipped) return HistoryStatus.Skipped;
  if (t.status === StarterTaskStatus.Missed) return HistoryStatus.Missed;
  return HistoryStatus.Open;
}

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export function weekSummary(c: HistoryWeek["counts"], open: number): string {
  const parts: string[] = [];
  if (c.done > 0) {
    const done = `${c.done} ${plural(c.done, "session", "sessions")} done`;
    parts.push(c.late > 0 ? `${done}, ${c.late} of them late` : done);
  }
  if (c.skipped > 0) parts.push(`${c.skipped} skipped`);
  if (c.missed > 0) parts.push(`${c.missed} missed`);
  if (open > 0) parts.push(`${open} still open`);
  return parts.join(" · ") || "Nothing recorded";
}

/**
 * Groups past sessions by program week (week 1 starts on the program's first
 * day), newest week first, newest session first inside it. `extra` adds
 * sessions the history endpoint leaves out (today's, from the agenda); a
 * session in both lists is counted once.
 */
export function weeklyHistory(input: {
  days: readonly StarterHistoryDay[];
  extra?: readonly StarterTask[];
  startedAt: string | undefined;
}): HistoryWeek[] {
  const start = input.startedAt ? taskDay(input.startedAt) : null;
  const seen = new Set<string>();
  const tasks: StarterTask[] = [];
  for (const t of [...input.days.flatMap((d) => d.items), ...(input.extra ?? [])]) {
    if (seen.has(t.id)) continue;
    seen.add(t.id);
    tasks.push(t);
  }
  if (tasks.length === 0) return [];
  const first = start ?? taskDay(tasks.map((t) => t.scheduledFor).sort()[0]);
  const weekOf = (day: string) =>
    Math.max(
      1,
      Math.floor((Date.parse(`${day}T00:00:00Z`) - Date.parse(`${first}T00:00:00Z`)) / (7 * 86_400_000)) + 1,
    );

  const byWeek = new Map<number, StarterTask[]>();
  for (const t of tasks) {
    const w = weekOf(taskDay(t.scheduledFor));
    byWeek.set(w, [...(byWeek.get(w) ?? []), t]);
  }
  return [...byWeek.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([week, list]) => {
      const sorted = [...list].sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor));
      const counts = { done: 0, late: 0, skipped: 0, missed: 0 };
      let open = 0;
      const rows: HistoryRow[] = sorted.map((t) => {
        const status = historyStatus(t);
        if (status === HistoryStatus.Done || status === HistoryStatus.DoneLate) counts.done += 1;
        if (status === HistoryStatus.DoneLate) counts.late += 1;
        if (status === HistoryStatus.Skipped) counts.skipped += 1;
        if (status === HistoryStatus.Missed) counts.missed += 1;
        if (status === HistoryStatus.Open) open += 1;
        return {
          id: t.id,
          title: t.title || "Session",
          dayLabel: formatTaskDay(t.scheduledFor),
          status,
          statusLabel: STATUS_LABELS[status],
        };
      });
      return {
        week,
        label: `Week ${week}`,
        from: `From ${formatTaskDay(addDaysLocal(first, (week - 1) * 7))}`,
        counts,
        summary: weekSummary(counts, open),
        rows,
      };
    });
}

/** The fields of an activity entry the numbers list reads. */
export interface NumbersActivity {
  _id: string;
  title: string;
  duration_minutes: number;
  performed_at: string;
  notes?: string;
  /** "health_connect" / "healthkit" for an import; absent or "manual" = typed in Binectics. */
  source?: string;
}

export interface LoggedNumbers {
  id: string;
  title: string;
  dayLabel: string;
  minutes: number;
  lines: string[];
}

const isImported = (a: NumbersActivity) => !!a.source && a.source !== "manual";

/**
 * The member's own logged numbers for this program: activity entries whose
 * title is one of its sessions, logged on or after its first day, with the
 * sets and reps they typed in. Entries a connected app imported are left out.
 */
export function loggedNumbers(
  activities: readonly NumbersActivity[],
  input: { sessionTitles: readonly string[]; startedAt: string | undefined },
): LoggedNumbers[] {
  const titles = new Set(input.sessionTitles);
  const from = input.startedAt ? taskDay(input.startedAt) : null;
  return activities
    .filter((a) => !isImported(a) && !!a.notes && titles.has(a.title) && (!from || taskDay(a.performed_at) >= from))
    .sort((a, b) => b.performed_at.localeCompare(a.performed_at))
    .map((a) => ({
      id: a._id,
      title: a.title,
      dayLabel: formatTaskDay(a.performed_at),
      minutes: a.duration_minutes,
      lines: (a.notes ?? "").split("\n").filter((l) => l.trim().length > 0),
    }));
}
