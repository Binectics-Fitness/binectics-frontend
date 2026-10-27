import {
  StarterStartOn,
  StarterTaskStatus,
  type StarterExercise,
  type StarterProgram,
  type StarterTask,
} from "./types";

/**
 * Pure helpers for the Starter Program screens. Plain counts only: no
 * streaks, scores or percentages (owner ruling).
 */

// ─── Dates (YYYY-MM-DD strings, no time-zone surprises) ───

export const taskDay = (scheduledFor: string): string => scheduledFor.slice(0, 10);

/** The member's local calendar day as YYYY-MM-DD. */
export function localToday(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysLocal(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** "Mon, Oct 26": noon UTC formatted in UTC, stable for every device zone. */
export function formatTaskDay(scheduledFor: string, locale: string = "en-US"): string {
  const [y, m, d] = taskDay(scheduledFor).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * The member-local YYYY-MM-DD a start choice means. "Next Monday" is always
 * a later Monday (a Monday member gets seven days ahead), inside the API's
 * today..today+14 window.
 */
export function starterStartDate(startOn: StarterStartOn, now: Date = new Date()): string {
  const today = localToday(now);
  if (startOn === StarterStartOn.Today) return today;
  const dow = now.getDay(); // 0 Sunday .. 6 Saturday
  const ahead = (8 - dow) % 7 || 7;
  return addDaysLocal(today, ahead);
}

/** "Day 3 of 28", "Starts Mon, Nov 2" or "Finished · 28 days". */
export function programDayLabel(
  startedAt: string | undefined,
  endsAt: string | null | undefined,
  today: string,
): string | null {
  if (!startedAt) return null;
  const start = Date.parse(`${taskDay(startedAt)}T00:00:00Z`);
  const now = Date.parse(`${today}T00:00:00Z`);
  const day = Math.floor((now - start) / 86_400_000) + 1;
  if (day < 1) return `Starts ${formatTaskDay(startedAt)}`;
  if (!endsAt) return `Day ${day}`;
  const total = Math.round((Date.parse(`${taskDay(endsAt)}T00:00:00Z`) - start) / 86_400_000);
  return day > total ? `Finished · ${total} days` : `Day ${day} of ${total}`;
}

// ─── Exercises ───

/** "3 x 10", "2 x 30 sec"; empty when the template gave no numbers. */
export function exerciseDose(e: StarterExercise): string {
  const amount = e.reps !== undefined ? `${e.reps}` : e.seconds !== undefined ? `${e.seconds} sec` : "";
  if (e.sets !== undefined && amount) return `${e.sets} x ${amount}`;
  return amount || (e.sets !== undefined ? `${e.sets} sets` : "");
}

/** "Rest 45 sec" or null. */
export function restLine(e: StarterExercise): string | null {
  return e.restSeconds ? `Rest ${e.restSeconds} sec` : null;
}

/** Seconds-based exercises (plank, hold) are timed: no weight or reps to log. */
export const isTimedExercise = (e: StarterExercise): boolean =>
  e.seconds !== undefined && e.reps === undefined;

export function exerciseCountLabel(n: number): string | null {
  if (n <= 0) return null;
  return `${n} exercise${n === 1 ? "" : "s"}`;
}

export function minutesLabel(minutes: number | null | undefined): string | null {
  return minutes && minutes > 0 ? `about ${minutes} minutes` : null;
}

/** "Week 2 of 4 · 2 of 3 sessions done in the last 7 days"; null with no facts. */
export function starterProgressLine(program: Pick<StarterProgram, "progress"> | null): string | null {
  const p = program?.progress;
  if (!p) return null;
  const parts: string[] = [];
  if (p.day != null && p.day >= 1) {
    const week = Math.ceil(p.day / 7);
    const weeks = p.totalDays ? Math.ceil(p.totalDays / 7) : null;
    parts.push(weeks && week <= weeks ? `Week ${week} of ${weeks}` : `Week ${week}`);
  }
  if (p.last7 && p.last7.scheduled > 0) {
    const { done, scheduled } = p.last7;
    const noun = scheduled === 1 ? "session" : "sessions";
    // The API counts only sessions already due, so in the first days "of 1"
    // is a true count, not a short plan.
    const window = p.day != null && p.day <= 7 ? "so far" : "in the last 7 days";
    parts.push(`${done} of ${scheduled} ${noun} done ${window}`);
  }
  return parts.join(" · ") || null;
}

// ─── Today ───

export type StarterTodayState = "pending" | "done" | "skipped" | "rest" | "waiting";

export interface CatchUpRow {
  task: StarterTask;
  state: "open" | "done_late" | "missed";
  note: string;
}

export interface StarterTodayModel {
  state: StarterTodayState;
  task: StarterTask | null;
  dayLabel: string | null;
  progressLine: string | null;
  restNote: string | null;
  catchUp: CatchUpRow[];
  /** The next few sessions after today, soonest first. */
  upcoming: StarterTask[];
}

export function starterTodayModel(input: {
  tasks: readonly StarterTask[];
  program: StarterProgram | null;
  today: string;
}): StarterTodayModel {
  const { tasks, program, today } = input;
  const todays = tasks.filter((t) => taskDay(t.scheduledFor) === today);
  const task = todays[0] ?? null;
  const later = tasks
    .filter((t) => taskDay(t.scheduledFor) > today)
    .sort((a, b) => a.scheduledFor.localeCompare(b.scheduledFor));
  const next = later[0];

  const window = program?.catchUpDays;
  const catchUp: CatchUpRow[] = tasks
    .filter((t) => taskDay(t.scheduledFor) < today)
    .sort((a, b) => b.scheduledFor.localeCompare(a.scheduledFor))
    .flatMap((t): CatchUpRow[] => {
      if (t.status === StarterTaskStatus.Skipped) return [];
      const until = window ? addDaysLocal(taskDay(t.scheduledFor), window) : null;
      if (t.status === StarterTaskStatus.Pending) {
        if (until && until < today) return [];
        return [
          {
            task: t,
            state: "open",
            note: until
              ? `From ${formatTaskDay(t.scheduledFor)}. You can still do it until ${formatTaskDay(until)}.`
              : `From ${formatTaskDay(t.scheduledFor)}.`,
          },
        ];
      }
      if (t.status === StarterTaskStatus.Missed) {
        return [{ task: t, state: "missed", note: `${formatTaskDay(t.scheduledFor)}.` }];
      }
      return t.completedLate
        ? [{ task: t, state: "done_late", note: `${formatTaskDay(t.scheduledFor)}.` }]
        : [];
    })
    .slice(0, 3);

  const dayLabel = program ? programDayLabel(program.startedAt, program.endsAt, today) : null;
  const base = {
    task,
    dayLabel,
    progressLine: starterProgressLine(program),
    catchUp,
    upcoming: later.slice(0, 4),
  };

  if (task) {
    const s = task.status;
    const nextLine = next ? `Next session ${formatTaskDay(next.scheduledFor)}.` : null;
    return {
      ...base,
      state:
        s === StarterTaskStatus.Done ? "done" : s === StarterTaskStatus.Skipped ? "skipped" : "pending",
      restNote: s === StarterTaskStatus.Pending ? null : nextLine,
    };
  }
  if (dayLabel?.startsWith("Starts")) return { ...base, state: "waiting", restNote: null };
  return {
    ...base,
    state: "rest",
    restNote: next ? `Rest day. Next session ${formatTaskDay(next.scheduledFor)}.` : "Rest day.",
  };
}

/** The member's live starter program, if any. */
export function activeStarterProgram(
  programs: readonly StarterProgram[] | null | undefined,
): StarterProgram | null {
  return (programs ?? []).find((p) => p.status === "active") ?? null;
}

// ─── Optional numbers ───

export interface SetEntry {
  weight: string;
  reps: string;
}

export interface ExerciseEntries {
  [exerciseIndex: number]: SetEntry[];
}

const num = (s: string): number | null => {
  const n = Number(s.replace(",", ".").trim());
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

/**
 * The notes line for the member's own log, from what they chose to type.
 * Rows with neither weight nor reps are left out; null when nothing was
 * entered (so a numbers-free Finish logs nothing).
 */
export function numbersNotes(
  exercises: readonly StarterExercise[],
  entries: ExerciseEntries,
): string | null {
  const lines: string[] = [];
  exercises.forEach((e, i) => {
    if (isTimedExercise(e)) return;
    const sets = (entries[i] ?? [])
      .map((s) => {
        const w = num(s.weight);
        const r = num(s.reps);
        if (w === null && r === null) return null;
        if (w !== null && r !== null) return `${w} kg x ${r}`;
        return w !== null ? `${w} kg` : `${r} reps`;
      })
      .filter((x): x is string => x !== null);
    if (sets.length) lines.push(`${e.name}: ${sets.join(", ")}`);
  });
  return lines.length ? lines.join("\n").slice(0, 2000) : null;
}

/** Whole minutes between 1 and 600, or null. */
export function parseMinutes(s: string): number | null {
  const n = Number(s.trim());
  return Number.isInteger(n) && n >= 1 && n <= 600 ? n : null;
}

/** Blank rows for an exercise's numbers form (1 to 10 sets). */
export const blankSets = (e: StarterExercise): SetEntry[] =>
  Array.from({ length: Math.min(Math.max(e.sets ?? 1, 1), 10) }, () => ({ weight: "", reps: "" }));
