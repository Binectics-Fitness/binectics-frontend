import { describe, it, expect } from "vitest";
import {
  parseFoods,
  mealRowsToRequests,
  daysStateToRequests,
  planToDaysState,
  everyDaySlotCollisions,
  planMealCount,
  emptyDaysState,
  isAssignableTemplate,
  planTotalCalories,
  isTemplatePlan,
  type MealFormRow,
} from "@/app/dashboard/dietitian/meal-plans/_lib";
import { MealSlot, DietPlanDeliveryType } from "@/lib/types";

// Regression guards for the meal-plan builder pipeline (weekly plans):
//
// 1. The day builder must produce well-formed days[] — empty rows and empty
//    days dropped, within-day order re-derived and contiguous.
// 2. Prefill must round-trip: a day-structured plan loads its days; a legacy
//    flat plan loads into "Every day".
// 3. Template assignment is a SERVER-side copy (assignDietPlanFromTemplate);
//    the client only decides assignability (platform vs document).
// 4. Form rows are user input: blank rows, stray commas, and empty calorie
//    fields must be cleaned up — never sent as "" / NaN / 0.

const row = (overrides: Partial<MealFormRow> = {}): MealFormRow => ({
  meal_type: MealSlot.BREAKFAST,
  title: "Oats bowl",
  description: "",
  foods: [],
  calories: "",
  notes: "",
  ...overrides,
});

describe("parseFoods", () => {
  it("splits on commas, trims, and drops empties", () => {
    expect(parseFoods(" oats, banana,, almond milk ,")).toEqual(["oats", "banana", "almond milk"]);
    expect(parseFoods("")).toEqual([]);
    expect(parseFoods("  ,  ,")).toEqual([]);
  });
});

describe("mealRowsToRequests", () => {
  it("drops title-less rows and re-derives contiguous order", () => {
    const out = mealRowsToRequests([
      row({ title: "Breakfast", meal_type: MealSlot.BREAKFAST }),
      row({ title: "   " }), // blank row the user added but never filled
      row({ title: "Dinner", meal_type: MealSlot.DINNER }),
    ]);
    expect(out).toHaveLength(2);
    // 1-based: the API rejects order < 1 ("meals.0.order must not be less than 1").
    expect(out.map((m) => m.order)).toEqual([1, 2]);
    expect(out[1].meal_type).toBe(MealSlot.DINNER);
  });

  it("omits blank or invalid calories instead of sending NaN/negative", () => {
    const out = mealRowsToRequests([
      row({ calories: "" }),
      row({ calories: "abc" }),
      row({ calories: "-50" }),
      row({ calories: "450" }),
    ]);
    expect(out[0].calories).toBeUndefined();
    expect(out[1].calories).toBeUndefined();
    expect(out[2].calories).toBeUndefined();
    expect(out[3].calories).toBe(450);
  });

  it("trims text fields and omits empty optionals", () => {
    const out = mealRowsToRequests([
      row({ title: "  Lunch  ", description: "  ", foods: [" rice ", " beans "], notes: " keep hydrated " }),
    ]);
    expect(out[0].title).toBe("Lunch");
    expect(out[0].description).toBeUndefined();
    expect(out[0].foods).toEqual(["rice", "beans"]);
    expect(out[0].notes).toBe("keep hydrated");
  });
});

describe("daysStateToRequests", () => {
  it("drops empty days and rows, re-derives within-day order, every_day first", () => {
    const state = emptyDaysState();
    state.every_day = [row({ title: "Vitamins", meal_type: MealSlot.BREAKFAST })];
    state.monday = [
      row({ title: "  " }), // never filled
      row({ title: "Mon dinner", meal_type: MealSlot.DINNER }),
      row({ title: "Mon supper", meal_type: MealSlot.EVENING_SNACK }),
    ];
    // tuesday..sunday left empty → dropped

    const out = daysStateToRequests(state);
    expect(out.map((d) => d.day_of_week)).toEqual(["every_day", "monday"]);
    expect(out[1].meals.map((m) => m.order)).toEqual([1, 2]);
    expect(out[1].meals[0].title).toBe("Mon dinner");
  });

  it("an all-empty builder produces no days", () => {
    expect(daysStateToRequests(emptyDaysState())).toEqual([]);
  });
});

describe("planToDaysState", () => {
  it("loads a day-structured plan into its days", () => {
    const state = planToDaysState({
      meals: [],
      days: [
        {
          day_of_week: "monday",
          meals: [{ meal_type: MealSlot.DINNER, title: "Salmon", foods: ["fish"], order: 1 }],
        },
      ],
    });
    expect(state.monday[0].title).toBe("Salmon");
    expect(state.every_day).toEqual([]);
    expect(state.tuesday).toEqual([]);
  });

  it("loads a legacy flat plan into Every day", () => {
    const state = planToDaysState({
      meals: [{ meal_type: MealSlot.LUNCH, title: "Wrap", foods: [], order: 1 }],
    });
    expect(state.every_day[0].title).toBe("Wrap");
    expect(state.monday).toEqual([]);
  });

  it("round-trips: state -> requests -> equivalent state shape", () => {
    const state = emptyDaysState();
    state.every_day = [row({ title: "Oats", meal_type: MealSlot.BREAKFAST })];
    state.friday = [row({ title: "Treat", meal_type: MealSlot.DINNER })];
    const requests = daysStateToRequests(state);
    const back = planToDaysState({
      meals: [],
      days: requests.map((d) => ({
        day_of_week: d.day_of_week,
        meals: d.meals.map((m) => ({ ...m, foods: m.foods ?? [] })),
      })),
    });
    expect(back.every_day.map((m) => m.title)).toEqual(["Oats"]);
    expect(back.friday.map((m) => m.title)).toEqual(["Treat"]);
  });
});

describe("everyDaySlotCollisions", () => {
  it("flags weekday slots that every_day also fills (additive, shown to provider)", () => {
    const state = emptyDaysState();
    state.every_day = [row({ title: "Base breakfast", meal_type: MealSlot.BREAKFAST })];
    state.monday = [
      row({ title: "Mon breakfast", meal_type: MealSlot.BREAKFAST }),
      row({ title: "Mon dinner", meal_type: MealSlot.DINNER }),
    ];
    expect(everyDaySlotCollisions(state)).toEqual([{ day: "monday", slot: MealSlot.BREAKFAST }]);
  });

  it("ignores title-less rows on both sides", () => {
    const state = emptyDaysState();
    state.every_day = [row({ title: " ", meal_type: MealSlot.BREAKFAST })];
    state.monday = [row({ title: "Mon breakfast", meal_type: MealSlot.BREAKFAST })];
    expect(everyDaySlotCollisions(state)).toEqual([]);
  });
});

describe("planMealCount / isAssignableTemplate", () => {
  it("counts from days when present, else the flat list", () => {
    expect(
      planMealCount({
        meals: [{ meal_type: MealSlot.LUNCH, title: "x", foods: [], order: 1 }],
        days: [
          { day_of_week: "every_day", meals: [{ meal_type: MealSlot.LUNCH, title: "x", foods: [], order: 1 }] },
          { day_of_week: "monday", meals: [{ meal_type: MealSlot.DINNER, title: "y", foods: [], order: 1 }] },
        ],
      }),
    ).toBe(2);
    expect(
      planMealCount({ meals: [{ meal_type: MealSlot.LUNCH, title: "x", foods: [], order: 1 }] }),
    ).toBe(1);
  });

  it("only platform plans are assignable from a template", () => {
    expect(isAssignableTemplate({ delivery_type: DietPlanDeliveryType.PLATFORM })).toBe(true);
    expect(isAssignableTemplate({ delivery_type: DietPlanDeliveryType.DOCUMENT })).toBe(false);
  });
});

describe("planTotalCalories / isTemplatePlan", () => {
  it("sums only recorded calories, null when none recorded", () => {
    expect(
      planTotalCalories({
        meals: [
          { meal_type: MealSlot.LUNCH, title: "a", foods: [], calories: 500, order: 0 },
          { meal_type: MealSlot.DINNER, title: "b", foods: [], order: 1 },
        ],
      }),
    ).toBe(500);
    expect(
      planTotalCalories({ meals: [{ meal_type: MealSlot.LUNCH, title: "a", foods: [], order: 0 }] }),
    ).toBeNull();
    expect(planTotalCalories({ meals: [] })).toBeNull();
  });

  it("treats a plan as a template only when it has no client", () => {
    expect(isTemplatePlan({ client_profile_id: null, client_id: null })).toBe(true);
    expect(isTemplatePlan({ client_profile_id: undefined, client_id: undefined })).toBe(true);
    expect(isTemplatePlan({ client_profile_id: "abc", client_id: "def" })).toBe(false);
  });
});
