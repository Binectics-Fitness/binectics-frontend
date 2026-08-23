import { describe, it, expect } from "vitest";
import {
  normalizeFood,
  shoppingList,
  isoWeekKey,
  mealsForWeekday,
  planDays,
  isWeeklyPlan,
  todayWeekday,
  WEEKDAYS,
} from "@/lib/progress/weeklyPlan";
import { MealSlot } from "@/lib/types";
import type { DietMeal } from "@/lib/api/progress";

// Pins the client-facing rendering rule from MEAL_PLAN_WEEKLY_SPEC §3:
// meals(D) = every_day.meals ++ dayEntry(D).meals, ordered by slot then
// within-day order; collisions are additive (client sees both).

const meal = (
  title: string,
  meal_type: MealSlot,
  order = 1,
): DietMeal => ({ title, meal_type, foods: [], order });

const weeklyPlan = {
  meals: [],
  days: [
    {
      day_of_week: "every_day" as const,
      meals: [meal("Base breakfast", MealSlot.BREAKFAST), meal("Vitamins", MealSlot.MORNING_SNACK)],
    },
    {
      day_of_week: "monday" as const,
      meals: [meal("Mon dinner", MealSlot.DINNER), meal("Mon breakfast", MealSlot.BREAKFAST)],
    },
  ],
};

describe("mealsForWeekday", () => {
  it("merges every-day and day-specific meals, ordered by slot", () => {
    const monday = mealsForWeekday(weeklyPlan, "monday");
    expect(monday.map((m) => m.title)).toEqual([
      "Base breakfast", // every-day first within the colliding slot
      "Mon breakfast", // collision is additive: both breakfasts shown
      "Vitamins",
      "Mon dinner",
    ]);
  });

  it("an empty weekday shows just the every-day menu", () => {
    const tuesday = mealsForWeekday(weeklyPlan, "tuesday");
    expect(tuesday.map((m) => m.title)).toEqual(["Base breakfast", "Vitamins"]);
  });

  it("reads a legacy flat plan as an every-day menu", () => {
    const legacy = { meals: [meal("Wrap", MealSlot.LUNCH)] };
    expect(mealsForWeekday(legacy, "wednesday").map((m) => m.title)).toEqual(["Wrap"]);
    expect(planDays(legacy)[0].day_of_week).toBe("every_day");
    expect(isWeeklyPlan(legacy)).toBe(false);
  });

  it("detects weekly plans only when a weekday entry exists", () => {
    expect(isWeeklyPlan(weeklyPlan)).toBe(true);
    expect(
      isWeeklyPlan({ meals: [], days: [{ day_of_week: "every_day", meals: [] }] }),
    ).toBe(false);
  });
});

describe("todayWeekday", () => {
  it("maps JS getDay (Sunday-first) onto the Monday-first week", () => {
    expect(todayWeekday(new Date("2026-08-10T12:00:00Z"))).toBe("monday");
    expect(todayWeekday(new Date("2026-08-16T12:00:00Z"))).toBe("sunday");
    expect(WEEKDAYS).toHaveLength(7);
  });
});

// SHARED VECTORS — mobile's utils/__tests__/weeklyPlan.test.ts must mirror
// these exactly (MEAL_PLAN_WEEKLY_SPEC §8 pinned normalization).
describe("shoppingList", () => {
  const withFoods = {
    meals: [],
    days: [
      {
        day_of_week: "every_day" as const,
        meals: [{ ...meal("Oats", MealSlot.BREAKFAST), foods: ["100g  Rolled OATS ", "almond milk"] }],
      },
      {
        day_of_week: "friday" as const,
        meals: [{ ...meal("Treat", MealSlot.DINNER), foods: ["Almond Milk", "salmon"] }],
      },
    ],
  };

  it("pins the normalization algorithm (shared vector)", () => {
    expect(normalizeFood("  100g  Rolled OATS ")).toBe("100g rolled oats");
    expect(normalizeFood("Jalape\u00f1o  Peppers")).toBe("jalape\u00f1o peppers");
  });

  it("groups by normalized food, preserves provenance, flags daily", () => {
    const items = shoppingList(withFoods, [], []);
    const milk = items.find((i) => i.food === "almond milk")!;
    expect(milk.occurrences).toHaveLength(2);
    expect(milk.daily).toBe(true);
    expect(milk.occurrences[0].raw).toBe("almond milk");
    expect(items.find((i) => i.food === "salmon")!.daily).toBe(false);
  });

  it("marks have/checked from the provided keys", () => {
    const items = shoppingList(withFoods, ["salmon"], ["almond milk"]);
    expect(items.find((i) => i.food === "salmon")!.have).toBe(true);
    expect(items.find((i) => i.food === "almond milk")!.checked).toBe(true);
  });

  it("isoWeekKey is stable within a week and formats as YYYY-Www", () => {
    expect(isoWeekKey(new Date(2026, 7, 10))).toBe(isoWeekKey(new Date(2026, 7, 16)));
    expect(isoWeekKey(new Date(2026, 7, 10))).toMatch(/^\d{4}-W\d{2}$/);
    expect(isoWeekKey(new Date(2026, 7, 17))).not.toBe(isoWeekKey(new Date(2026, 7, 16)));
  });
});
