import { describe, it, expect } from "vitest";
import {
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
