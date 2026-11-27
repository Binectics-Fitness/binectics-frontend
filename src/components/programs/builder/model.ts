/**
 * The program builder page's model (owner-approved Create Program redesign,
 * 20 Nov 2026). React-free so it is unit-tested directly
 * (src/tests/unit/program-builder-model.test.ts).
 *
 * A program is a few things the client does for a number of weeks. The coach
 * sets weeks; the API keeps days. Task windows are held in days inside their
 * phase (`start`, `days`) so a program made on the old day-level builder
 * round-trips unchanged; the page shows them as weeks whenever they sit on
 * week boundaries, and as "starts day N (set before)" otherwise.
 *
 * The payload is today's CreateProgramTemplateDto, unchanged (03 §7).
 */

import type {
  ProgramAutoRule,
  ProgramBlock,
  ProgramCadence,
  ProgramComponentType,
  ProgramDefinitionPayload,
  ProgramGoalDef,
  ProgramTemplateVersion,
} from "@/lib/api/programs";
import { exerciseRowsToPayload, type ExerciseFormRow } from "../mapper";
import { BUILDER_COPY, TASK_TYPE_COPY } from "./copy";

// ── Task types ───────────────────────────────────────────────────────

export type TaskKind = "workout" | "habit" | "checkin" | "measure" | "meal" | "note";

/** Order of the "+ Add task" menu. Meal plans are for dietitians. */
export const TASK_KINDS: readonly TaskKind[] = ["workout", "habit", "checkin", "measure", "meal", "note"];

export const KIND_TO_API: Record<TaskKind, ProgramComponentType> = {
  workout: "workout_plan",
  habit: "habit",
  checkin: "form",
  measure: "measurement",
  meal: "meal_plan",
  note: "instruction",
};

const API_TO_KIND: Record<ProgramComponentType, TaskKind> = {
  workout_plan: "workout",
  habit: "habit",
  form: "checkin",
  measurement: "measure",
  meal_plan: "meal",
  instruction: "note",
};

/** Per-type cadence defaults (P1-4; 03 §3). */
export const KIND_DEFAULTS: Record<TaskKind, { cadence: ProgramCadence; n: number }> = {
  workout: { cadence: "n_per_week", n: 3 },
  habit: { cadence: "daily", n: 3 },
  checkin: { cadence: "weekly", n: 1 },
  measure: { cadence: "weekly", n: 1 },
  meal: { cadence: "daily", n: 1 },
  note: { cadence: "once", n: 1 },
};

/** Sets × reps a new exercise starts at (D5). */
export const DEFAULT_SETS = "3";
export const DEFAULT_REPS = "10";
/** Seconds a new timed exercise (a hold) starts at: 3 × 30 s. */
export const DEFAULT_TIMED_SECONDS = "30";

/** Days of the week a task lands on, n times a week (= API N_PER_WEEK_DAYS). */
export const N_PER_WEEK_DAYS: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 2, 4, 6],
  5: [0, 1, 3, 4, 6],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

// ── Colour by meaning ────────────────────────────────────────────────

/** Task-type colour (owner, 20 Nov 2026). CSS variables from globals.css. */
export type TaskTone = "move" | "habit" | "checkin" | "measure" | "meal" | "note" | "water" | "fast";

export const TASK_TONE_COLORS: Record<TaskTone, { soft: string; ink: string }> = {
  move: { soft: "var(--move-soft)", ink: "var(--move-ink)" },
  habit: { soft: "var(--habit-soft)", ink: "var(--habit-ink)" },
  checkin: { soft: "var(--checkin-soft)", ink: "var(--checkin-ink)" },
  measure: { soft: "var(--measure-soft)", ink: "var(--measure-ink)" },
  meal: { soft: "var(--meal-soft)", ink: "var(--meal-ink)" },
  note: { soft: "var(--note-soft)", ink: "var(--note-ink)" },
  water: { soft: "var(--water-soft)", ink: "var(--water-ink)" },
  fast: { soft: "var(--fast-soft)", ink: "var(--fast-ink)" },
};

const KIND_TONE: Record<TaskKind, TaskTone> = {
  workout: "move",
  habit: "habit",
  checkin: "checkin",
  measure: "measure",
  meal: "meal",
  note: "note",
};

/** A habit that ticks itself takes its source's colour: water, fast, health app = move. */
export function taskTone(t: Pick<BuilderTask, "kind" | "auto">): TaskTone {
  if (t.kind === "habit" && t.auto) return t.auto === "health" ? "move" : t.auto;
  return KIND_TONE[t.kind];
}

// ── Measurement metrics (chips; no typed keys) ───────────────────────

export const MEASURE_METRICS = [
  { key: "weight_kg", label: "Weight", unit: "kg" },
  { key: "waist_cm", label: "Waist", unit: "cm" },
  { key: "steps", label: "Steps", unit: "" },
  { key: "sleep_hours", label: "Sleep", unit: "h" },
] as const;

export function measureMetric(key: string) {
  return MEASURE_METRICS.find((m) => m.key === key);
}

/** Title a measurement starts with, and follows the chip while untouched. */
export function measureDefaultTitle(key: string): string {
  if (key === "weight_kg") return "Weigh in";
  const m = measureMetric(key);
  return m ? `Record ${m.label.toLowerCase()}` : "";
}

// ── Habit: ticks itself ──────────────────────────────────────────────

export type AutoSource = "" | "water" | "fast" | "health";
export type HealthKey = "steps" | "exmin" | "session" | "sleep";

/**
 * Health-app rules the API evaluates (binectics-api src/programs/auto-rule.ts
 * AUTO_RULE_BOUNDS). Sleep is asked in hours and sent in minutes.
 */
export const HEALTH_METRICS: Record<
  HealthKey,
  { metric: ProgramAutoRule["metric"]; lo: number; hi: number; label: string; suffix: string; unit: string; dflt: string; perUnit: number }
> = {
  steps: { metric: "steps", lo: 100, hi: 60000, label: "Steps", suffix: "steps a day", unit: "steps", dflt: "8000", perUnit: 1 },
  exmin: { metric: "exercise_minutes", lo: 5, hi: 600, label: "Active minutes", suffix: "minutes of exercise a day", unit: "minutes", dflt: "30", perUnit: 1 },
  session: { metric: "exercise_session", lo: 5, hi: 600, label: "A workout", suffix: "minutes or longer, one session", unit: "minutes", dflt: "20", perUnit: 1 },
  sleep: { metric: "sleep_minutes", lo: 1, hi: 16, label: "Sleep", suffix: "hours of sleep", unit: "hours", dflt: "7", perUnit: 60 },
};
export const HEALTH_KEYS: readonly HealthKey[] = ["steps", "exmin", "session", "sleep"];

/** Own-log bounds (API AUTO_RULE_BOUNDS for fasting_hours / water_glasses). */
export const OWN_LOG = {
  water: { metric: "water_glasses" as const, lo: 1, hi: 30, dflt: "8" },
  fast: { metric: "fasting_hours" as const, lo: 1, hi: 24, dflt: "16" },
};

function healthKeyOf(metric: string): HealthKey | null {
  return HEALTH_KEYS.find((k) => HEALTH_METRICS[k].metric === metric) ?? null;
}

/** A whole number within [lo, hi], or null. */
function wholeIn(raw: string, lo: number, hi: number): number | null {
  const t = raw.trim();
  if (!/^\d+$/.test(t)) return null;
  const n = Number(t);
  return n >= lo && n <= hi ? n : null;
}

// ── Model ────────────────────────────────────────────────────────────

export interface BuilderTask {
  key: string;
  kind: TaskKind;
  /** Index into BuilderProgram.phases. */
  phase: number;
  title: string;
  detail: string;
  cadence: ProgramCadence;
  /** Times a week (n_per_week). */
  n: number;
  /** First day of the task inside its phase (0-based). */
  start: number;
  /** How many days it runs; null = to the end of its phase. */
  days: number | null;
  // Content
  exercises: ExerciseFormRow[];
  workout_plan_id: string;
  form_id: string;
  meal_plan_id: string;
  /** The linked form or meal plan's name, sent as the title when the coach left it blank. */
  contentTitle: string;
  metric: string;
  /** Measurement target as typed; the API makes it the program goal for that metric (api #361). */
  target: string;
  // Ticks itself (habit)
  auto: AutoSource;
  autoN: string;
  hm: HealthKey;
  /** The rule this task was loaded with, so its extra fields survive a save. */
  ruleBase?: ProgramAutoRule;
  /** A rule this page doesn't edit (e.g. a measurement filled from a health app). */
  kept_auto_rule?: ProgramAutoRule;
}

export interface BuilderPhase {
  name: string;
  /** Length in days (the API's unit); the page edits it in weeks. */
  days: number;
}

export interface BuilderProgram {
  name: string;
  /** D2: phases are off by default; one phase then runs for the whole program. */
  split: boolean;
  phases: BuilderPhase[];
  tasks: BuilderTask[];
  catchUp: number;
  /** Settings → Description (shown on your listing): `goal_statement`. */
  about: string;
  cautions: string;
  /** D3: category stays, under Settings. */
  category: string;
  /** Fields the page no longer asks for, carried through untouched. */
  carried: { intensity?: string; indications?: string };
  /**
   * The version's goals, sent back as they are: the API keeps goals made from
   * a target (`from_block`) in step with the tasks' targets (api #361).
   */
  keptGoals: ProgramGoalDef[];
}

export const DEFAULT_WEEKS = 4;
export const MAX_WEEKS = 104;
export const DEFAULT_CATCH_UP = 1;

let seq = 0;
export function nextKey(): string {
  seq += 1;
  return `t${seq}`;
}

export const weeksOf = (days: number) => Math.max(1, Math.ceil(days / 7));
export const phaseDays = (p: BuilderProgram, i: number) => p.phases[i]?.days ?? 0;
export const phaseWeeks = (p: BuilderProgram, i: number) => weeksOf(phaseDays(p, i));
export const totalDays = (p: BuilderProgram) => p.phases.reduce((a, x) => a + x.days, 0);
export const totalWeeks = (p: BuilderProgram) => weeksOf(totalDays(p));
/** Days before phase i. */
export const phaseStartDay = (p: BuilderProgram, i: number) => p.phases.slice(0, i).reduce((a, x) => a + x.days, 0);

/** A fresh program from the New program dialog. */
export function newProgram(name: string, weeks: number): BuilderProgram {
  return {
    name,
    split: false,
    phases: [{ name: "Phase 1", days: weeks * 7 }],
    tasks: [],
    catchUp: DEFAULT_CATCH_UP,
    about: "",
    cautions: "",
    category: "",
    carried: {},
    keptGoals: [],
  };
}

/** The POST /programs body for the New program dialog (03 §7). */
export function createPayload(name: string, weeks: number): ProgramDefinitionPayload {
  return toPayload(newProgram(name.trim(), weeks));
}

function blankTask(kind: TaskKind, phase: number): BuilderTask {
  const d = KIND_DEFAULTS[kind];
  return {
    key: nextKey(),
    kind,
    phase,
    title: "",
    detail: "",
    cadence: d.cadence,
    n: d.n,
    start: 0,
    days: null,
    exercises: [],
    workout_plan_id: "",
    form_id: "",
    meal_plan_id: "",
    contentTitle: "",
    metric: kind === "measure" ? "weight_kg" : "",
    target: "",
    auto: "",
    autoN: "",
    hm: "steps",
  };
}

/**
 * A task as "+ Add task" makes it: the type's cadence, and prefilled where
 * the answer is known (Workout A/B/…, Weigh in, the coach's only form).
 */
export function newTask(
  kind: TaskKind,
  ctx: { phase: number; existing: BuilderTask[]; forms?: Array<{ id: string; title: string }> },
): BuilderTask {
  const t = blankTask(kind, ctx.phase);
  if (kind === "workout") {
    const n = ctx.existing.filter((x) => x.kind === "workout").length;
    t.title = `Workout ${"ABCDEFGHIJKLMNOPQRSTUVWXYZ"[n % 26]}`;
  }
  if (kind === "measure") t.title = measureDefaultTitle("weight_kg");
  if (kind === "checkin" && ctx.forms?.length === 1) {
    t.form_id = ctx.forms[0].id;
    t.contentTitle = ctx.forms[0].title;
  }
  return t;
}

/**
 * A new exercise from the library or a custom one, at 3 × 10 (D5), or at
 * 3 × 30 s when the library marks it timed (a hold).
 */
export function newExercise(name: string, ref: Partial<ExerciseFormRow> = {}, timed = false): ExerciseFormRow {
  return {
    name,
    sets: DEFAULT_SETS,
    reps: timed ? "" : DEFAULT_REPS,
    seconds: timed ? DEFAULT_TIMED_SECONDS : "",
    rest_seconds: "",
    cues: "",
    ...ref,
  };
}

/**
 * Whether a row is prescribed in seconds: it has seconds and no reps, or it
 * is a library hold whose reps were cleared. Rows saved before the marker
 * (reps set) keep showing reps.
 */
export function isTimedRow(e: Pick<ExerciseFormRow, "reps" | "seconds" | "library_exercise_id">, timedIds: ReadonlySet<string>): boolean {
  if (e.reps.trim() !== "") return false;
  return e.seconds.trim() !== "" || (!!e.library_exercise_id && timedIds.has(e.library_exercise_id));
}

// ── Windows (weeks on screen, days underneath) ───────────────────────

/** True when the task's window sits on week boundaries, so weeks can show it. */
export function onWeeks(t: Pick<BuilderTask, "start" | "days" | "cadence">): boolean {
  return t.start % 7 === 0 && (t.cadence === "once" || t.days == null || t.days % 7 === 0);
}

/** End day (exclusive) of the task inside its phase. */
function endDay(p: BuilderProgram, t: BuilderTask): number {
  const pd = phaseDays(p, t.phase);
  if (t.cadence === "once") return Math.min(pd, t.start + 1);
  return Math.min(pd, t.days == null ? pd : t.start + t.days);
}

export const fromWeek = (t: BuilderTask) => Math.floor(t.start / 7) + 1;
export function toWeek(p: BuilderProgram, t: BuilderTask): number {
  const pw = phaseWeeks(p, t.phase);
  if (t.days == null) return pw;
  return Math.min(pw, Math.max(fromWeek(t), fromWeek(t) + Math.ceil(t.days / 7) - 1));
}

/** Week stepper: move the start, keeping the end. */
export function setFromWeek(p: BuilderProgram, t: BuilderTask, from: number): Partial<BuilderTask> {
  const to = toWeek(p, t);
  const f = Math.max(1, Math.min(t.cadence === "once" ? phaseWeeks(p, t.phase) : to, from));
  return { start: (f - 1) * 7, days: t.days == null ? null : (to - f + 1) * 7 };
}

/** Week stepper: move the end. The phase's last week means "to the end". */
export function setToWeek(p: BuilderProgram, t: BuilderTask, to: number): Partial<BuilderTask> {
  const pw = phaseWeeks(p, t.phase);
  const f = fromWeek(t);
  const v = Math.max(f, Math.min(pw, to));
  return { days: v >= pw ? null : (v - f + 1) * 7 };
}

/** "Change to weeks" on a task set before in days: snap to the weeks it covers. */
export function snapToWeeks(p: BuilderProgram, t: BuilderTask): Partial<BuilderTask> {
  const from = Math.floor(t.start / 7) + 1;
  if (t.days == null) return { start: (from - 1) * 7, days: null };
  const to = Math.min(phaseWeeks(p, t.phase), Math.ceil((t.start + t.days) / 7));
  return { start: (from - 1) * 7, days: to >= phaseWeeks(p, t.phase) ? null : (to - from + 1) * 7 };
}

/** Days (relative to the phase) the task lands on. */
export function occurrenceDays(p: BuilderProgram, t: BuilderTask): number[] {
  const end = endDay(p, t);
  const out: number[] = [];
  if (t.start >= end) return out;
  if (t.cadence === "once") return [t.start];
  if (t.cadence === "daily") {
    for (let d = t.start; d < end; d++) out.push(d);
    return out;
  }
  if (t.cadence === "weekly") {
    for (let d = t.start; d < end; d += 7) out.push(d);
    return out;
  }
  if (t.cadence === "n_per_week") {
    const offs = N_PER_WEEK_DAYS[Math.max(1, Math.min(7, t.n))];
    for (let w = t.start; w < end; w += 7) for (const o of offs) if (w + o < end) out.push(w + o);
    return out;
  }
  return out; // custom: not drawn
}

export const count = (p: BuilderProgram, t: BuilderTask) => occurrenceDays(p, t).length;

/** Tasks per day of an absolute program week (1-based). */
export function weekPlan(p: BuilderProgram, week: number): BuilderTask[][] {
  const days: BuilderTask[][] = [[], [], [], [], [], [], []];
  const lo = (week - 1) * 7;
  for (const t of p.tasks) {
    const base = phaseStartDay(p, t.phase);
    for (const d of occurrenceDays(p, t)) {
      const abs = base + d;
      if (abs >= lo && abs < lo + 7) days[abs - lo].push(t);
    }
  }
  return days;
}

// ── Text ─────────────────────────────────────────────────────────────

const C = BUILDER_COPY;

function cadenceWord(t: BuilderTask): string {
  switch (t.cadence) {
    case "n_per_week":
      return t.n === 1 ? C.cadence.onceAWeek : C.cadence.timesAWeek(t.n);
    case "weekly":
      return C.cadence.weekly;
    case "daily":
      return C.cadence.daily;
    case "once":
      return C.cadence.once;
    default:
      return C.cadence.custom;
  }
}

/** "3 times a week", "Weekly · weeks 2–4", "Once · week 1". */
export function cadenceText(p: BuilderProgram, t: BuilderTask): string {
  if (!onWeeks(t)) return C.cadence.legacy(cadenceWord(t), t.start + 1);
  const from = fromWeek(t);
  if (t.cadence === "once") return C.cadence.onceInWeek(from);
  const to = toWeek(p, t);
  if (from === 1 && to === phaseWeeks(p, t.phase)) return cadenceWord(t);
  return C.cadence.inWeeks(cadenceWord(t), from, to);
}

export function taskLabel(t: BuilderTask): string {
  return t.title.trim() || t.contentTitle.trim() || C.plan.untitled(TASK_TYPE_COPY[t.kind].label);
}

/** The text a client sees for the task (title, else its form or plan). */
export function clientLabel(t: BuilderTask): string {
  return t.title.trim() || t.contentTitle.trim() || TASK_TYPE_COPY[t.kind].label;
}

export function totals(p: BuilderProgram): Array<[TaskKind, number]> {
  const by = new Map<TaskKind, number>();
  for (const t of p.tasks) by.set(t.kind, (by.get(t.kind) ?? 0) + count(p, t));
  return [...by.entries()];
}

/** "4 weeks · 12 workouts · 28 habit days". */
export function summaryLine(p: BuilderProgram): string {
  const parts = totals(p).map(([k, n]) => C.summary[k](n));
  return [C.create.weeks(totalWeeks(p)), ...parts].join(" · ");
}

export function startSummary(p: BuilderProgram): string {
  return C.start.summary(totalWeeks(p), totals(p).map(([k, n]) => C.startParts[k](n)));
}

// ── Validation (inline; P1-5) ────────────────────────────────────────

export type IssueKind = "title" | "form" | "meal" | "workout" | "number";
export interface TaskIssue {
  kind: IssueKind;
  /** Short reason on the task row. */
  row: string;
  /** Sentence under the field. */
  field: string;
}

export function taskIssue(t: BuilderTask): TaskIssue | null {
  // A form or meal plan task's title is optional: it takes the content's name.
  const optionalTitle = t.kind === "checkin" || t.kind === "meal";
  if (!t.title.trim() && !optionalTitle) return { kind: "title", row: C.issue.title, field: C.inspector.titleError };
  if (t.kind === "checkin" && !t.form_id) return { kind: "form", row: C.issue.form, field: C.checkin.error };
  if (t.kind === "meal" && !t.meal_plan_id) return { kind: "meal", row: C.issue.meal, field: C.meal.error };
  if (t.kind === "workout" && !t.workout_plan_id && exerciseRowsToPayload(t.exercises).length === 0) {
    return { kind: "workout", row: C.issue.workout, field: C.workout.error };
  }
  if (t.kind === "habit" && t.auto) {
    if (t.auto === "health") {
      const h = HEALTH_METRICS[t.hm];
      if (wholeIn(t.autoN, h.lo, h.hi) === null) {
        const msg = C.ticks.healthError(h.unit, h.lo, h.hi);
        return { kind: "number", row: msg, field: `${msg}.` };
      }
    } else if (wholeIn(t.autoN, OWN_LOG[t.auto].lo, OWN_LOG[t.auto].hi) === null) {
      const msg = t.auto === "water" ? C.ticks.waterError : C.ticks.fastError;
      return { kind: "number", row: msg, field: `${msg}.` };
    }
  }
  return null;
}

export const issueCount = (p: BuilderProgram) => p.tasks.filter((t) => taskIssue(t) !== null).length;

/** Why "Start a client" can't run yet, or null when it can. */
export function startBlocker(p: BuilderProgram): string | null {
  if (!p.name.trim()) return C.startBlocked.noName;
  if (p.tasks.length === 0) return C.startBlocked.noTasks;
  const n = issueCount(p);
  return n > 0 ? C.startBlocked.fix(n) : null;
}

// ── Version → model ──────────────────────────────────────────────────

function autoFromRule(type: ProgramComponentType, rule: ProgramAutoRule | undefined): Pick<BuilderTask, "auto" | "autoN" | "hm" | "ruleBase" | "kept_auto_rule"> {
  const none = { auto: "" as AutoSource, autoN: "", hm: "steps" as HealthKey };
  if (!rule) return none;
  if (type === "habit") {
    if (rule.metric === "water_glasses") return { auto: "water", autoN: String(rule.threshold ?? ""), hm: "steps", ruleBase: rule };
    if (rule.metric === "fasting_hours") return { auto: "fast", autoN: String(rule.threshold ?? ""), hm: "steps", ruleBase: rule };
    const hk = healthKeyOf(rule.metric);
    if (hk && rule.comparator === "gte" && typeof rule.threshold === "number") {
      const n = rule.threshold / HEALTH_METRICS[hk].perUnit;
      return { auto: "health", autoN: String(Math.round(n)), hm: hk, ruleBase: rule };
    }
  }
  return { ...none, kept_auto_rule: rule };
}

function blockToTask(b: ProgramBlock, phase: number): BuilderTask {
  const kind = API_TO_KIND[b.type] ?? "note";
  return {
    ...blankTask(kind, phase),
    title: b.title ?? "",
    detail: b.detail ?? "",
    cadence: b.cadence ?? "once",
    n: b.times_per_week ?? KIND_DEFAULTS[kind].n,
    start: b.start_offset_days ?? 0,
    days: b.duration_days ?? null,
    exercises: (b.exercises ?? []).map((e) => ({
      name: e.name,
      sets: e.sets == null ? "" : String(e.sets),
      reps: e.reps == null ? "" : String(e.reps),
      seconds: e.seconds == null ? "" : String(e.seconds),
      rest_seconds: e.rest_seconds == null ? "" : String(e.rest_seconds),
      cues: (e.cues ?? []).join("\n"),
      ...(e.library_exercise_id ? { library_exercise_id: e.library_exercise_id } : {}),
      ...(e.library_variant ? { library_variant: e.library_variant } : {}),
      ...(e.media_id ? { media_id: e.media_id } : {}),
    })),
    workout_plan_id: b.workout_plan_id ?? "",
    form_id: b.form_id ?? "",
    meal_plan_id: b.meal_plan_id ?? "",
    metric: b.metric ?? (kind === "measure" ? "weight_kg" : ""),
    target: b.target == null ? "" : String(b.target),
    ...autoFromRule(b.type, b.auto_rule),
  };
}

/** Fallback length for a lone phase saved without one (api #360: it runs for the program). */
function lonePhaseDays(v: ProgramTemplateVersion): number {
  if (v.duration_days && v.duration_days > 0) return v.duration_days;
  const ends = (v.phases?.[0]?.blocks ?? []).map((b) => (b.start_offset_days ?? 0) + (b.duration_days ?? 1));
  return Math.max(DEFAULT_WEEKS * 7, ...ends);
}

export function fromVersion(v: ProgramTemplateVersion): BuilderProgram {
  const sorted = [...(v.phases ?? [])].sort((a, b) => a.order - b.order);
  const phases: BuilderPhase[] = sorted.length
    ? sorted.map((ph) => ({
        name: ph.name,
        days: ph.duration_days && ph.duration_days > 0 ? ph.duration_days : sorted.length === 1 ? lonePhaseDays(v) : 7,
      }))
    : [{ name: "Phase 1", days: lonePhaseDays(v) }];
  const tasks: BuilderTask[] = [];
  sorted.forEach((ph, i) =>
    [...(ph.blocks ?? [])].sort((a, b) => a.order - b.order).forEach((b) => tasks.push(blockToTask(b, i))),
  );
  const keptGoals: ProgramGoalDef[] = [...(v.goals ?? [])];
  return {
    name: v.name,
    split: phases.length > 1,
    phases,
    tasks,
    catchUp: v.catch_up_days ?? DEFAULT_CATCH_UP,
    about: v.goal_statement ?? "",
    cautions: v.cautions ?? "",
    category: v.category ?? "",
    carried: {
      ...(v.intensity ? { intensity: v.intensity } : {}),
      ...(v.indications ? { indications: v.indications } : {}),
    },
    keptGoals,
  };
}

// ── Model → payload ──────────────────────────────────────────────────

function autoRule(t: BuilderTask): ProgramAutoRule | undefined {
  if (t.kind !== "habit") return t.kept_auto_rule;
  if (t.auto === "water" || t.auto === "fast") {
    const o = OWN_LOG[t.auto];
    const n = wholeIn(t.autoN, o.lo, o.hi);
    if (n === null) return undefined;
    return { metric: o.metric, comparator: "gte", threshold: n, window: "scheduled_day" };
  }
  if (t.auto === "health") {
    const h = HEALTH_METRICS[t.hm];
    const n = wholeIn(t.autoN, h.lo, h.hi);
    if (n === null) return undefined;
    const base = t.ruleBase && t.ruleBase.metric === h.metric ? t.ruleBase : undefined;
    return { ...(base ?? {}), metric: h.metric, comparator: "gte", threshold: n * h.perUnit };
  }
  return t.kept_auto_rule;
}

function taskToBlock(t: BuilderTask, order: number): ProgramBlock {
  const b: ProgramBlock = { type: KIND_TO_API[t.kind], order, cadence: t.cadence, start_offset_days: t.start };
  if (t.cadence !== "once" && t.days != null) b.duration_days = t.days;
  if (t.cadence === "n_per_week") b.times_per_week = Math.max(1, Math.min(7, t.n));
  const title = t.title.trim() || t.contentTitle.trim();
  if (title) b.title = title.slice(0, 200);
  if (t.detail.trim()) b.detail = t.detail.trim();
  if (t.kind === "workout") {
    if (t.workout_plan_id) b.workout_plan_id = t.workout_plan_id;
    else {
      const ex = exerciseRowsToPayload(t.exercises);
      if (ex.length) b.exercises = ex;
    }
  }
  if (t.kind === "checkin" && t.form_id) b.form_id = t.form_id;
  if (t.kind === "meal" && t.meal_plan_id) b.meal_plan_id = t.meal_plan_id;
  if (t.kind === "measure" && t.metric) {
    b.metric = t.metric;
    const target = Number(t.target.trim());
    if (t.target.trim() !== "" && Number.isFinite(target)) b.target = target;
  }
  const rule = autoRule(t);
  if (rule) b.auto_rule = rule;
  return b;
}

export function toPayload(p: BuilderProgram): ProgramDefinitionPayload {
  const phases = (p.split ? p.phases : [p.phases[0] ?? { name: "Phase 1", days: DEFAULT_WEEKS * 7 }]).map((ph, i) => ({
    name: ph.name.trim() || `Phase ${i + 1}`,
    order: i,
    duration_days: ph.days,
    blocks: p.tasks.filter((t) => (p.split ? t.phase === i : true)).map((t, j) => taskToBlock(t, j)),
  }));
  const strip = ({ _id, ...g }: ProgramGoalDef) => g; // eslint-disable-line @typescript-eslint/no-unused-vars
  const goals = p.keptGoals.map(strip);
  const out: ProgramDefinitionPayload = {
    name: p.name.trim(),
    duration_days: phases.reduce((a, x) => a + x.duration_days, 0),
    catch_up_days: p.catchUp,
    phases,
    goals,
  };
  if (p.about.trim()) out.goal_statement = p.about.trim();
  if (p.cautions.trim()) out.cautions = p.cautions.trim();
  if (p.category.trim()) out.category = p.category.trim();
  if (p.carried.intensity) out.intensity = p.carried.intensity;
  if (p.carried.indications) out.indications = p.carried.indications;
  return out;
}

// ── Phases (Settings) ────────────────────────────────────────────────

/** Settings → Split into phases / One block. One block folds every task into one window. */
export function setSplit(p: BuilderProgram, split: boolean): BuilderProgram {
  if (split === p.split) return p;
  if (split) return { ...p, split: true, phases: [{ name: p.phases[0]?.name || "Phase 1", days: totalDays(p) }] };
  const total = totalDays(p);
  return {
    ...p,
    split: false,
    phases: [{ name: p.phases[0]?.name || "Phase 1", days: total }],
    tasks: p.tasks.map((t) => {
      const base = phaseStartDay(p, t.phase);
      const end = phaseStartDay(p, t.phase) + phaseDays(p, t.phase);
      const days = t.days == null ? (end < total ? end - base - t.start : null) : t.days;
      return { ...t, phase: 0, start: base + t.start, days };
    }),
  };
}

/** Program length from the header/dialog when not split into phases. */
export function setWeeks(p: BuilderProgram, weeks: number): BuilderProgram {
  const w = Math.max(1, Math.min(MAX_WEEKS, weeks));
  return { ...p, phases: [{ ...(p.phases[0] ?? { name: "Phase 1" }), days: w * 7 }, ...p.phases.slice(1)] };
}
