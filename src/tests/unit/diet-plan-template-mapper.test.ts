import { describe, it, expect } from "vitest";
import {
  parseFoods,
  mealRowsToRequests,
  templateToClientPlanPayload,
  planTotalCalories,
  isTemplatePlan,
  type MealFormRow,
} from "@/app/dashboard/dietitian/meal-plans/_lib";
import { MealSlot, DietPlanDeliveryType } from "@/lib/types";

// Regression guards for the meal-plan template pipeline:
//
// 1. Assigning a template must produce an independent, well-formed
//    CreateDietPlanRequest — meal order re-derived and contiguous, so a
//    template with gappy/duplicated `order` values never creates a broken
//    per-client plan.
// 2. Document-based plans have no copyable meal content (the file itself
//    cannot be duplicated through the JSON create API), so mapping one is
//    a programming error and must throw rather than silently create an
//    empty plan for the client.
// 3. Form rows are user input: blank rows, stray commas, and empty calorie
//    fields must be cleaned up — never sent as "" / NaN / 0.

const row = (overrides: Partial<MealFormRow> = {}): MealFormRow => ({
  meal_type: MealSlot.BREAKFAST,
  title: "Oats bowl",
  description: "",
  foods: "",
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
    expect(out.map((m) => m.order)).toEqual([0, 1]);
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
      row({ title: "  Lunch  ", description: "  ", foods: " rice , beans ", notes: " keep hydrated " }),
    ]);
    expect(out[0].title).toBe("Lunch");
    expect(out[0].description).toBeUndefined();
    expect(out[0].foods).toEqual(["rice", "beans"]);
    expect(out[0].notes).toBe("keep hydrated");
  });
});

describe("templateToClientPlanPayload", () => {
  const template = {
    title: "Cutting protocol",
    description: "12-week deficit",
    delivery_type: DietPlanDeliveryType.PLATFORM,
    dietitian_notes: "Weigh in weekly",
    meals: [
      { meal_type: MealSlot.DINNER, title: "Dinner", foods: ["fish"], calories: 600, order: 7 },
      { meal_type: MealSlot.BREAKFAST, title: "Breakfast", foods: ["oats"], calories: 400, order: 2 },
    ],
  };

  it("copies content sorted by order with contiguous re-derived order", () => {
    const payload = templateToClientPlanPayload(template);
    expect(payload.delivery_type).toBe(DietPlanDeliveryType.PLATFORM);
    expect(payload.title).toBe("Cutting protocol");
    expect(payload.dietitian_notes).toBe("Weigh in weekly");
    expect(payload.meals?.map((m) => m.title)).toEqual(["Breakfast", "Dinner"]);
    expect(payload.meals?.map((m) => m.order)).toEqual([0, 1]);
  });

  it("deep-copies the foods arrays so the client plan is independent", () => {
    const payload = templateToClientPlanPayload(template);
    payload.meals?.[0].foods?.push("mutated");
    expect(template.meals[1].foods).toEqual(["oats"]);
  });

  it("throws for document-based plans, their content is not copyable", () => {
    expect(() =>
      templateToClientPlanPayload({ ...template, delivery_type: DietPlanDeliveryType.DOCUMENT }),
    ).toThrow(/document/i);
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
