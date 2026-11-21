/**
 * Pure helpers the program builder still shares with the coach results view:
 * task type labels and the inline exercise payload. React-free so they can be
 * unit-tested directly (see src/tests/unit/program-exercise-payload.test.ts).
 */

import type { ProgramComponentType, ProgramExercise } from "@/lib/api/programs";
import {
  MAX_INLINE_EXERCISES,
  PROGRAM_EXERCISE_NAME_MAX,
  truncateName,
  type LibraryRef,
} from "@/lib/exercises/library";

export const COMPONENT_TYPE_LABELS: Record<ProgramComponentType, string> = {
  instruction: "Instruction",
  habit: "Habit",
  meal_plan: "Meal plan",
  measurement: "Measurement",
  form: "Form",
  workout_plan: "Workout plan",
};

/** One inline exercise as the builder holds it (numbers as strings). */
export interface ExerciseFormRow extends LibraryRef {
  name: string;
  sets: string;
  reps: string;
  seconds: string;
  rest_seconds: string;
  /** One cue per line. */
  cues: string;
}

/** Parse a non-negative integer string; undefined if blank/invalid. */
function toInt(v: string): number | undefined {
  const t = v.trim();
  if (t === "") return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : undefined;
}

function exerciseRowToPayload(row: ExerciseFormRow): ProgramExercise | null {
  const name = truncateName(row.name, PROGRAM_EXERCISE_NAME_MAX);
  if (!name) return null;
  const ex: ProgramExercise = { name };
  const sets = toInt(row.sets);
  if (sets !== undefined && sets >= 1) ex.sets = Math.min(20, sets);
  const reps = toInt(row.reps);
  if (reps !== undefined && reps >= 1) ex.reps = Math.min(100, reps);
  const seconds = toInt(row.seconds);
  if (seconds !== undefined && seconds >= 1) ex.seconds = Math.min(3600, seconds);
  const rest = toInt(row.rest_seconds);
  if (rest !== undefined) ex.rest_seconds = Math.min(600, rest);
  const cues = row.cues
    .split("\n")
    .map((c) => c.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, 6);
  if (cues.length > 0) ex.cues = cues;
  // Library fields only travel together with a real pick; a custom exercise
  // sends none of them.
  if (row.library_exercise_id) {
    ex.library_exercise_id = row.library_exercise_id;
    if (row.library_variant) ex.library_variant = row.library_variant;
    if (row.media_id) ex.media_id = row.media_id;
  }
  return ex;
}

/** Usable inline exercises (named), capped at what the API accepts. */
export function exerciseRowsToPayload(rows: ExerciseFormRow[]): ProgramExercise[] {
  return rows
    .map(exerciseRowToPayload)
    .filter((e): e is ProgramExercise => e !== null)
    .slice(0, MAX_INLINE_EXERCISES);
}
