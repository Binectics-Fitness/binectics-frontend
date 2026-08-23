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

// ─── Shopping list v1 (MEAL_PLAN_WEEKLY_SPEC §8) ─────────────────────────────

/**
 * Pinned normalization — MUST stay byte-for-byte identical to the mobile
 * twin (utils/weeklyPlan.ts): trim → collapse whitespace → toLowerCase()
 * (no locale variant). Exclusion/check state is keyed on this.
 */
export function normalizeFood(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

export interface ShoppingOccurrence {
  day: DayOfWeek;
  slot: MealSlot;
  raw: string;
}

export interface ShoppingItem {
  /** Normalized key; render occurrences[0].raw for display. */
  food: string;
  occurrences: ShoppingOccurrence[];
  /** Appears in the every-day menu (render "daily", never a x7 count). */
  daily: boolean;
  checked: boolean;
  have: boolean;
}

/**
 * The week's groceries: every food across all days, grouped by normalized
 * text with provenance preserved. Grouping only — prose foods cannot sum
 * quantities. `have` items are returned (not dropped) so the UI can offer
 * un-hiding; callers filter for display.
 */
export function shoppingList(
  plan: Pick<DietPlan, "meals" | "days">,
  have: string[],
  checked: string[],
): ShoppingItem[] {
  const haveSet = new Set(have);
  const checkedSet = new Set(checked);
  const byFood = new Map<string, ShoppingItem>();
  for (const day of planDays(plan)) {
    for (const meal of day.meals) {
      for (const raw of meal.foods) {
        const food = normalizeFood(raw);
        if (!food) continue;
        let item = byFood.get(food);
        if (!item) {
          item = {
            food,
            occurrences: [],
            daily: false,
            checked: checkedSet.has(food),
            have: haveSet.has(food),
          };
          byFood.set(food, item);
        }
        item.occurrences.push({ day: day.day_of_week, slot: meal.meal_type, raw });
        if (day.day_of_week === "every_day") item.daily = true;
      }
    }
  }
  return [...byFood.values()];
}

/** Device-local ISO week key, e.g. "2026-W34" (checked state resets weekly). */
export function isoWeekKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // ISO week: Thursday of the current week determines the year/week number.
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const week = 1 + Math.round(((d.getTime() - jan4.getTime()) / 86400000 - 3 + ((jan4.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}
