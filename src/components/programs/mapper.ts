/**
 * Pure helpers for the provider Program (Protocol) builder. React-free so they
 * can be unit-tested directly (see src/tests/unit/program-template-mapper.test.ts).
 *
 * The builder holds free inputs as strings; these mappers derive the 0-based
 * `order` from array position, drop empty rows, coerce numeric strings, and
 * omit blanks rather than sending empty strings the API would store.
 */

import type {
  ProgramBlock,
  ProgramCadence,
  ProgramComponentType,
  ProgramDefinitionPayload,
  ProgramGoalDef,
  ProgramPhase,
  ProgramTemplateVersion,
  GoalDirection,
} from "@/lib/api/programs";

export const COMPONENT_TYPE_LABELS: Record<ProgramComponentType, string> = {
  instruction: "Instruction",
  habit: "Habit",
  meal_plan: "Meal plan",
  measurement: "Measurement",
  form: "Form",
  workout_plan: "Workout plan",
};

export const COMPONENT_TYPE_ORDER: ProgramComponentType[] = [
  "instruction",
  "habit",
  "measurement",
  "meal_plan",
  "form",
];

export const CADENCE_LABELS: Record<ProgramCadence, string> = {
  once: "Once",
  daily: "Daily",
  weekly: "Weekly",
  n_per_week: "N per week",
  custom: "Custom",
};

export const CADENCE_ORDER: ProgramCadence[] = [
  "once",
  "daily",
  "weekly",
  "n_per_week",
];

export const DIRECTION_LABELS: Record<GoalDirection, string> = {
  reach: "Reach",
  reduce: "Reduce",
  maintain: "Maintain",
};

export const DIRECTION_ORDER: GoalDirection[] = ["reach", "reduce", "maintain"];

/** Matches the API default: a task can still be done the day after. */
export const DEFAULT_CATCH_UP_DAYS = 1;
export const MAX_CATCH_UP_DAYS = 7;

export const INTENSITY_OPTIONS = ["gentle", "standard", "intensive"];

// ── Form state (strings for free inputs) ─────────────────────────────

export interface BlockFormRow {
  type: ProgramComponentType;
  cadence: ProgramCadence;
  title: string;
  detail: string;
  metric: string;
  /** DietPlan id for meal_plan blocks; "" when none picked. */
  meal_plan_id: string;
  /** Form id for form blocks; "" when none picked. */
  form_id: string;
  /** Carried through untouched so editing a program never drops the link. */
  workout_plan_id: string;
  start_offset_days: string;
  duration_days: string;
  times_per_week: string;
}

export interface PhaseFormRow {
  name: string;
  duration_days: string;
  blocks: BlockFormRow[];
}

export interface GoalFormRow {
  label: string;
  metric: string;
  direction: GoalDirection;
  target: string;
  target_offset_days: string;
}

export interface ProgramFormState {
  name: string;
  category: string;
  goal_statement: string;
  duration_days: string;
  intensity: string;
  indications: string;
  cautions: string;
  catch_up_days: string;
  phases: PhaseFormRow[];
  goals: GoalFormRow[];
}

export function emptyBlockRow(
  type: ProgramComponentType = "instruction",
): BlockFormRow {
  return {
    type,
    cadence: "once",
    title: "",
    detail: "",
    metric: "",
    meal_plan_id: "",
    form_id: "",
    workout_plan_id: "",
    start_offset_days: "",
    duration_days: "",
    times_per_week: "",
  };
}

export function emptyPhaseRow(): PhaseFormRow {
  return { name: "", duration_days: "", blocks: [emptyBlockRow()] };
}

export function emptyGoalRow(): GoalFormRow {
  return {
    label: "",
    metric: "",
    direction: "reduce",
    target: "",
    target_offset_days: "",
  };
}

export const EMPTY_PROGRAM_FORM: ProgramFormState = {
  name: "",
  category: "",
  goal_statement: "",
  duration_days: "",
  intensity: "",
  indications: "",
  cautions: "",
  catch_up_days: String(DEFAULT_CATCH_UP_DAYS),
  phases: [emptyPhaseRow()],
  goals: [],
};

/** Parse a non-negative integer string; undefined if blank/invalid. */
function toInt(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

/** Parse a number (may be fractional, e.g. a goal target); undefined if blank. */
function toNum(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

function blockRowToPayload(row: BlockFormRow, order: number): ProgramBlock {
  const block: ProgramBlock = { type: row.type, order, cadence: row.cadence };
  const start = toInt(row.start_offset_days);
  if (start !== undefined) block.start_offset_days = start;
  const dur = toInt(row.duration_days);
  if (dur !== undefined && dur >= 1) block.duration_days = dur;
  if (row.cadence === "n_per_week") {
    const n = toInt(row.times_per_week);
    if (n !== undefined) block.times_per_week = Math.min(7, Math.max(1, n));
  }
  if (row.title.trim()) block.title = row.title.trim();
  if (row.detail.trim()) block.detail = row.detail.trim();
  if (row.type === "measurement" && row.metric.trim()) {
    block.metric = row.metric.trim();
  }
  if (row.type === "meal_plan" && row.meal_plan_id.trim()) {
    block.meal_plan_id = row.meal_plan_id.trim();
  }
  if (row.type === "form" && row.form_id.trim()) {
    block.form_id = row.form_id.trim();
  }
  if (row.type === "workout_plan" && row.workout_plan_id.trim()) {
    block.workout_plan_id = row.workout_plan_id.trim();
  }
  return block;
}

/**
 * A block is meaningful once it has a title, or is a measurement with a metric,
 * or links the content its type needs (a meal plan, a form, a workout plan).
 */
function blockHasContent(row: BlockFormRow): boolean {
  return (
    row.title.trim().length > 0 ||
    (row.type === "measurement" && row.metric.trim().length > 0) ||
    (row.type === "meal_plan" && row.meal_plan_id.trim().length > 0) ||
    (row.type === "form" && row.form_id.trim().length > 0) ||
    (row.type === "workout_plan" && row.workout_plan_id.trim().length > 0)
  );
}

/**
 * Blocks whose type needs linked content but have none: a form task with no
 * form can never be completed by the client. Returned as "phase N, task M"
 * labels so the builder can say which ones.
 */
export function blocksMissingContent(rows: PhaseFormRow[]): string[] {
  const missing: string[] = [];
  rows.forEach((phase, pi) =>
    phase.blocks.forEach((b, bi) => {
      if (!blockHasContent(b)) return; // an empty row is dropped, not an error
      const unlinked =
        (b.type === "form" && !b.form_id.trim()) ||
        (b.type === "meal_plan" && !b.meal_plan_id.trim()) ||
        (b.type === "workout_plan" && !b.workout_plan_id.trim());
      if (unlinked) missing.push(`phase ${pi + 1}, task ${bi + 1}`);
    }),
  );
  return missing;
}

/** A phase counts once it has a name or at least one usable block. */
export function phaseRowsToPayload(rows: PhaseFormRow[]): ProgramPhase[] {
  return rows
    .map((phase, phaseIndex) => {
      const blocks = phase.blocks
        .filter(blockHasContent)
        .map((b, i) => blockRowToPayload(b, i));
      return { phase, phaseIndex, blocks };
    })
    .filter((p) => p.phase.name.trim().length > 0 || p.blocks.length > 0)
    .map(({ phase, phaseIndex, blocks }) => {
      const out: ProgramPhase = {
        name: phase.name.trim() || `Phase ${phaseIndex + 1}`,
        order: phaseIndex,
        blocks,
      };
      const dur = toInt(phase.duration_days);
      if (dur !== undefined && dur >= 1) out.duration_days = dur;
      return out;
    });
}

export function goalRowsToPayload(rows: GoalFormRow[]): ProgramGoalDef[] {
  return rows
    .filter((g) => g.label.trim().length > 0)
    .map((g) => {
      const goal: ProgramGoalDef = {
        label: g.label.trim(),
        direction: g.direction,
      };
      if (g.metric.trim()) goal.metric = g.metric.trim();
      const target = toNum(g.target);
      if (target !== undefined) goal.target = target;
      const offset = toInt(g.target_offset_days);
      if (offset !== undefined) goal.target_offset_days = offset;
      return goal;
    });
}

export function formToPayload(form: ProgramFormState): ProgramDefinitionPayload {
  const payload: ProgramDefinitionPayload = {
    name: form.name.trim(),
    phases: phaseRowsToPayload(form.phases),
    goals: goalRowsToPayload(form.goals),
  };
  if (form.category.trim()) payload.category = form.category.trim();
  if (form.goal_statement.trim()) payload.goal_statement = form.goal_statement.trim();
  const dur = toInt(form.duration_days);
  if (dur !== undefined && dur >= 1) payload.duration_days = dur;
  if (form.intensity.trim()) payload.intensity = form.intensity.trim();
  if (form.indications.trim()) payload.indications = form.indications.trim();
  if (form.cautions.trim()) payload.cautions = form.cautions.trim();
  const catchUp = toInt(form.catch_up_days);
  if (catchUp !== undefined) {
    payload.catch_up_days = Math.min(MAX_CATCH_UP_DAYS, catchUp);
  }
  return payload;
}

// ── Prefill (version → form) ─────────────────────────────────────────

function numToStr(n: number | undefined | null): string {
  return n == null ? "" : String(n);
}

export function versionToForm(v: ProgramTemplateVersion): ProgramFormState {
  const phases = [...(v.phases ?? [])]
    .sort((a, b) => a.order - b.order)
    .map<PhaseFormRow>((p) => ({
      name: p.name,
      duration_days: numToStr(p.duration_days),
      blocks: [...(p.blocks ?? [])]
        .sort((a, b) => a.order - b.order)
        .map<BlockFormRow>((b) => ({
          type: b.type,
          cadence: b.cadence ?? "once",
          title: b.title ?? "",
          detail: b.detail ?? "",
          metric: b.metric ?? "",
          meal_plan_id: b.meal_plan_id ?? "",
          form_id: b.form_id ?? "",
          workout_plan_id: b.workout_plan_id ?? "",
          start_offset_days: numToStr(b.start_offset_days),
          duration_days: numToStr(b.duration_days),
          times_per_week: numToStr(b.times_per_week),
        })),
    }));
  return {
    name: v.name,
    category: v.category ?? "",
    goal_statement: v.goal_statement ?? "",
    duration_days: numToStr(v.duration_days),
    intensity: v.intensity ?? "",
    indications: v.indications ?? "",
    cautions: v.cautions ?? "",
    catch_up_days: String(v.catch_up_days ?? DEFAULT_CATCH_UP_DAYS),
    phases: phases.length > 0 ? phases : [emptyPhaseRow()],
    goals: (v.goals ?? []).map<GoalFormRow>((g) => ({
      label: g.label,
      metric: g.metric ?? "",
      direction: g.direction,
      target: numToStr(g.target),
      target_offset_days: numToStr(g.target_offset_days),
    })),
  };
}

/** Total scheduled days across phases (for a template summary line). */
export function totalDurationDays(v: ProgramTemplateVersion): number {
  return (v.phases ?? []).reduce((sum, p) => {
    if (p.duration_days && p.duration_days > 0) return sum + p.duration_days;
    const ends = (p.blocks ?? []).map(
      (b) => (b.start_offset_days ?? 0) + (b.duration_days ?? 1),
    );
    return sum + Math.max(1, ...(ends.length ? ends : [1]));
  }, 0);
}
