/**
 * Pure helpers for the member-facing weekly meal plan view
 * (MEAL_PLAN_WEEKLY_SPEC §3). React-free so they can be unit-tested directly.
 *
 * The rendering rule: for a weekday D the client sees
 *   meals(D) = every_day.meals ++ dayEntry(D).meals
 * ordered by meal slot then within-day order. Collisions (a slot filled by
 * both) are additive by design — the client sees both meals.
 */

import { MealSlot } from "@/lib/types";
import type { DayOfWeek, DietDay, DietMeal, DietPlan } from "@/lib/api/progress";

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

export const WEEKDAY_LABELS: Record<Exclude<DayOfWeek, "every_day">, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export const SLOT_ORDER: MealSlot[] = [
  MealSlot.BREAKFAST,
  MealSlot.MORNING_SNACK,
  MealSlot.LUNCH,
  MealSlot.AFTERNOON_SNACK,
  MealSlot.DINNER,
  MealSlot.EVENING_SNACK,
];

export const SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: "Breakfast",
  [MealSlot.MORNING_SNACK]: "Morning snack",
  [MealSlot.LUNCH]: "Lunch",
  [MealSlot.AFTERNOON_SNACK]: "Afternoon snack",
  [MealSlot.DINNER]: "Dinner",
  [MealSlot.EVENING_SNACK]: "Evening snack",
};

/**
 * A plan's days, with a legacy flat plan (or not-yet-backfilled one) read as
 * a single every-day menu.
 */
export function planDays(plan: Pick<DietPlan, "meals" | "days">): DietDay[] {
  const days = plan.days ?? [];
  if (days.length > 0) return days;
  const meals = plan.meals ?? [];
  return meals.length > 0 ? [{ day_of_week: "every_day", meals }] : [];
}

/** True when the plan varies by weekday (anything beyond an every-day menu). */
export function isWeeklyPlan(plan: Pick<DietPlan, "meals" | "days">): boolean {
  return planDays(plan).some((d) => d.day_of_week !== "every_day");
}

function slotRank(slot: MealSlot): number {
  const i = SLOT_ORDER.indexOf(slot);
  return i === -1 ? SLOT_ORDER.length : i;
}

/** The meals a client sees on a given weekday: every-day base + that day's. */
export function mealsForWeekday(
  plan: Pick<DietPlan, "meals" | "days">,
  weekday: Exclude<DayOfWeek, "every_day">,
): DietMeal[] {
  const days = planDays(plan);
  const everyDay = days.find((d) => d.day_of_week === "every_day")?.meals ?? [];
  const specific = days.find((d) => d.day_of_week === weekday)?.meals ?? [];
  return [...everyDay, ...specific].sort(
    (a, b) => slotRank(a.meal_type) - slotRank(b.meal_type) || a.order - b.order,
  );
}

/** Today's weekday key (for pre-selecting the current day in the view). */
export function todayWeekday(now = new Date()): Exclude<DayOfWeek, "every_day"> {
  // getDay(): 0 = Sunday … 6 = Saturday; WEEKDAYS is Monday-first.
  return WEEKDAYS[(now.getDay() + 6) % 7];
}
