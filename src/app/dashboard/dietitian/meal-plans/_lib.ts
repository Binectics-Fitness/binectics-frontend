/**
 * Pure helpers for the dietitian meal-plan (diet plan) manager.
 * Kept free of React so they can be unit-tested directly
 * (see src/tests/unit/diet-plan-template-mapper.test.ts).
 */

import { MealSlot, DietPlanDeliveryType } from "@/lib/types";
import type {
  CreateDietMealRequest,
  CreateDietPlanRequest,
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

/**
 * Map a provider template plan to the payload for creating a per-client
 * diet plan (a copy — the client gets their own independent plan).
 * Only PLATFORM plans carry copyable meal content; document plans live in
 * an attached file that the copy APIs cannot duplicate.
 */
export function templateToClientPlanPayload(
  plan: Pick<
    DietPlan,
    "title" | "description" | "delivery_type" | "meals" | "dietitian_notes"
  >,
): CreateDietPlanRequest {
  if (plan.delivery_type !== DietPlanDeliveryType.PLATFORM) {
    throw new Error(
      "Only platform meal plans can be assigned from a template, document plans have no copyable content.",
    );
  }
  const meals: CreateDietMealRequest[] = [...(plan.meals ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((m, index) => ({
      meal_type: m.meal_type,
      title: m.title,
      description: m.description || undefined,
      foods: [...(m.foods ?? [])],
      calories: m.calories,
      notes: m.notes || undefined,
      order: index + 1, // 1-based; the API rejects order < 1
    }));
  return {
    title: plan.title,
    description: plan.description || undefined,
    delivery_type: DietPlanDeliveryType.PLATFORM,
    meals,
    dietitian_notes: plan.dietitian_notes || undefined,
  };
}

/** Sum of the calories recorded on a plan's meals; null if none recorded. */
export function planTotalCalories(plan: Pick<DietPlan, "meals">): number | null {
  const withCalories = (plan.meals ?? []).filter((m) => m.calories != null);
  if (withCalories.length === 0) return null;
  return withCalories.reduce((sum, m) => sum + (m.calories ?? 0), 0);
}

/** A template is a provider plan not yet tied to any client. */
export function isTemplatePlan(
  plan: Pick<DietPlan, "client_profile_id" | "client_id">,
): boolean {
  return plan.client_profile_id == null && plan.client_id == null;
}
