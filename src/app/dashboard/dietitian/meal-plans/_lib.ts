/**
 * Pure helpers for the dietitian meal-plan (diet plan) manager.
 * Kept free of React so they can be unit-tested directly
 * (see src/tests/unit/diet-plan-template-mapper.test.ts).
 */

import { MealSlot, DietPlanDeliveryType } from "@/lib/types";
import type {
  CreateDietDayRequest,
  CreateDietMealRequest,
  DayOfWeek,
  DietPlan,
} from "@/lib/api/progress";

export const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: "Breakfast",
  [MealSlot.MORNING_SNACK]: "Morning snack",
  [MealSlot.LUNCH]: "Lunch",
  [MealSlot.AFTERNOON_SNACK]: "Afternoon snack",
  [MealSlot.DINNER]: "Dinner",
  [MealSlot.EVENING_SNACK]: "Evening snack",
};

export const MEAL_SLOT_ORDER: MealSlot[] = [
  MealSlot.BREAKFAST,
  MealSlot.MORNING_SNACK,
  MealSlot.LUNCH,
  MealSlot.AFTERNOON_SNACK,
  MealSlot.DINNER,
  MealSlot.EVENING_SNACK,
];

/** One editable meal row as held in form state (strings for free inputs). */
export interface MealFormRow {
  meal_type: MealSlot;
  title: string;
  description: string;
  /** Foods for this meal — library picks and free text alike, one per entry. */
  foods: string[];
  /** Numeric string; "" means unset. */
  calories: string;
  notes: string;
}

export function emptyMealRow(slot: MealSlot = MealSlot.BREAKFAST): MealFormRow {
  return { meal_type: slot, title: "", description: "", foods: [], calories: "", notes: "" };
}

/** "oats, banana,, milk " → ["oats", "banana", "milk"] */
export function parseFoods(input: string): string[] {
  return input
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * Convert form rows into the API's CreateDietMealRequest[].
 * Rows without a title are dropped; `order` is re-derived from position;
 * blank/invalid calories are omitted rather than sent as NaN/0.
 */
export function mealRowsToRequests(rows: MealFormRow[]): CreateDietMealRequest[] {
  return rows
    .filter((r) => r.title.trim().length > 0)
    .map((r, index) => {
      const parsed = r.calories.trim() === "" ? NaN : Number(r.calories);
      const calories = Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
      return {
        meal_type: r.meal_type,
        title: r.title.trim(),
        description: r.description.trim() || undefined,
        foods: r.foods.map((f) => f.trim()).filter(Boolean),
        calories,
        notes: r.notes.trim() || undefined,
        // The API validates order >= 1 (1-based); index is 0-based, so the
        // first meal would fail "meals.0.order must not be less than 1".
        order: index + 1,
      };
    });
}

/** Prefill form rows from an existing plan (for the edit form). */
export function planToMealRows(plan: Pick<DietPlan, "meals">): MealFormRow[] {
  return [...(plan.meals ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((m) => ({
      meal_type: m.meal_type,
      title: m.title,
      description: m.description ?? "",
      foods: [...(m.foods ?? [])],
      calories: m.calories != null ? String(m.calories) : "",
      notes: m.notes ?? "",
    }));
}

// ─── Weekly (day-structured) plans — MEAL_PLAN_WEEKLY_SPEC ─────────────────

/** Canonical weekday display order (Monday-first, pinned by the spec). */
export const WEEKDAYS: Exclude<DayOfWeek, "every_day">[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const EVERY_DAY: DayOfWeek = "every_day";

export const DAY_LABELS: Record<DayOfWeek, string> = {
  every_day: "Every day",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/** The builder holds one row list per day; every key always present. */
export type DaysFormState = Record<DayOfWeek, MealFormRow[]>;

export function emptyDaysState(): DaysFormState {
  return {
    every_day: [],
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

/**
 * Form days → API days. Rows without a title are dropped, days without
 * meals are dropped, within-day order is re-derived from position.
 */
export function daysStateToRequests(state: DaysFormState): CreateDietDayRequest[] {
  const out: CreateDietDayRequest[] = [];
  for (const day of [EVERY_DAY, ...WEEKDAYS]) {
    const meals = mealRowsToRequests(state[day]);
    if (meals.length > 0) out.push({ day_of_week: day, meals });
  }
  return out;
}

/**
 * Prefill the day builder from a plan. Day-structured plans map directly; a
 * legacy flat plan (or not-yet-backfilled one) loads into "Every day".
 */
export function planToDaysState(
  plan: Pick<DietPlan, "meals" | "days">,
): DaysFormState {
  const state = emptyDaysState();
  const days = plan.days ?? [];
  if (days.length > 0) {
    for (const day of days) {
      state[day.day_of_week] = planToMealRows({ meals: day.meals });
    }
  } else {
    state.every_day = planToMealRows(plan);
  }
  return state;
}

/**
 * Weekday slots that also appear in "Every day" (collisions are additive by
 * design — the client sees both — so the builder shows a hint, spec H-2).
 */
export function everyDaySlotCollisions(
  state: DaysFormState,
): { day: DayOfWeek; slot: MealSlot }[] {
  const everyDaySlots = new Set(
    state.every_day.filter((m) => m.title.trim()).map((m) => m.meal_type),
  );
  const collisions: { day: DayOfWeek; slot: MealSlot }[] = [];
  for (const day of WEEKDAYS) {
    for (const row of state[day]) {
      if (row.title.trim() && everyDaySlots.has(row.meal_type)) {
        collisions.push({ day, slot: row.meal_type });
      }
    }
  }
  return collisions;
}

/** Meal count for the plan card: days when present, else the flat list. */
export function planMealCount(plan: Pick<DietPlan, "meals" | "days">): number {
  const days = plan.days ?? [];
  if (days.length > 0) return days.reduce((n, d) => n + d.meals.length, 0);
  return (plan.meals ?? []).length;
}

/**
 * Whether a template can be assigned to a client. Only PLATFORM plans carry
 * copyable meal content; document plans live in an attached file. The copy
 * itself is server-side (`assignDietPlanFromTemplate`) so it keeps the plan's
 * day structure — the old client-side payload rebuild flattened weekly plans.
 */
export function isAssignableTemplate(
  plan: Pick<DietPlan, "delivery_type">,
): boolean {
  return plan.delivery_type === DietPlanDeliveryType.PLATFORM;
}

/** Sum of the calories recorded on a plan's meals; null if none recorded. */
export function planTotalCalories(
  plan: Pick<DietPlan, "meals" | "days">,
): number | null {
  const days = plan.days ?? [];
  const meals = days.length > 0 ? days.flatMap((d) => d.meals) : plan.meals ?? [];
  const withCalories = meals.filter((m) => m.calories != null);
  if (withCalories.length === 0) return null;
  return withCalories.reduce((sum, m) => sum + (m.calories ?? 0), 0);
}

/** A template is a provider plan not yet tied to any client. */
export function isTemplatePlan(
  plan: Pick<DietPlan, "client_profile_id" | "client_id">,
): boolean {
  return plan.client_profile_id == null && plan.client_id == null;
}
