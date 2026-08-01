/**
 * Pure validation + normalisation for the member self-log forms (meal log and
 * workout log). Kept out of the components so the rules are unit-testable and
 * identical on both pages: a blank optional number means "not recorded"
 * (undefined), not zero, and a date-only input is anchored to local noon so a
 * timezone shift can't slide the entry onto the previous day.
 */

import {
  ActivityType,
  MealType,
  MealRating,
  type CreateActivityReportRequest,
  type CreateMealFeedbackRequest,
} from "@/lib/api/progress";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

/** Longest a single logged session can plausibly be (24h), in minutes. */
const MAX_DURATION_MINUTES = 1440;
/** Guard against a fat-fingered calorie entry rather than a real one. */
const MAX_CALORIES = 20000;

/**
 * Turn a `<input type="date">` value into an ISO instant.
 *
 * Anchored at local noon: `new Date("2026-08-01")` parses as UTC midnight, so
 * anywhere west of Greenwich the entry would be stored as (and read back on)
 * 31 July. Noon leaves ~12 hours of slack in both directions.
 */
export function dateInputToIso(value: string, now: Date = new Date()): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return now.toISOString();
  const [, year, month, day] = match;
  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    12,
    0,
    0,
    0,
  ).toISOString();
}

/** Today in the `<input type="date">` format, in the viewer's own timezone. */
export function todayDateInput(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Parse an optional numeric field. Blank is a valid "not recorded" answer and
 * yields `undefined`; anything non-numeric or out of range is an error.
 */
function parseOptionalNumber(
  raw: string,
  label: string,
  max: number,
): ValidationResult<number | undefined> {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: undefined };

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { ok: false, error: `${label} must be a positive number.` };
  }
  if (parsed > max) {
    return { ok: false, error: `${label} looks too high — check the value.` };
  }
  return { ok: true, value: parsed };
}

export interface MealFormInput {
  mealType: MealType;
  description: string;
  /** `<input type="date">` value. */
  mealDate: string;
  /** Blank means "no rating". */
  rating: MealRating | "";
  /** Blank means "not counted". */
  calories: string;
}

export function validateMealForm(
  input: MealFormInput,
  now: Date = new Date(),
): ValidationResult<CreateMealFeedbackRequest> {
  const description = input.description.trim();
  if (!description) {
    return { ok: false, error: "Describe what you ate." };
  }
  if (description.length > 1000) {
    return { ok: false, error: "Keep the description under 1000 characters." };
  }

  const calories = parseOptionalNumber(input.calories, "Calories", MAX_CALORIES);
  if (!calories.ok) return calories;

  return {
    ok: true,
    value: {
      meal_date: dateInputToIso(input.mealDate, now),
      meal_type: input.mealType,
      description,
      ...(input.rating ? { rating: input.rating } : {}),
      ...(calories.value !== undefined ? { calories: calories.value } : {}),
    },
  };
}

export interface WorkoutFormInput {
  activityType: ActivityType;
  title: string;
  /** Required — minutes, as typed. */
  duration: string;
  /** `<input type="date">` value. */
  performedAt: string;
  /** Blank means "not counted". */
  caloriesBurned: string;
  notes: string;
}

export function validateWorkoutForm(
  input: WorkoutFormInput,
  now: Date = new Date(),
): ValidationResult<CreateActivityReportRequest> {
  const title = input.title.trim();
  if (!title) {
    return { ok: false, error: "Give the session a name." };
  }
  if (title.length > 200) {
    return { ok: false, error: "Keep the name under 200 characters." };
  }

  const duration = Number(input.duration.trim());
  if (!input.duration.trim() || !Number.isFinite(duration) || duration <= 0) {
    return { ok: false, error: "Enter how long you trained, in minutes." };
  }
  if (duration > MAX_DURATION_MINUTES) {
    return { ok: false, error: "A single session can't be longer than 24 hours." };
  }

  const burned = parseOptionalNumber(
    input.caloriesBurned,
    "Calories burned",
    MAX_CALORIES,
  );
  if (!burned.ok) return burned;

  const notes = input.notes.trim();

  return {
    ok: true,
    value: {
      activity_type: input.activityType,
      title,
      duration_minutes: duration,
      performed_at: dateInputToIso(input.performedAt, now),
      ...(burned.value !== undefined ? { calories_burned: burned.value } : {}),
      ...(notes ? { notes } : {}),
    },
  };
}
