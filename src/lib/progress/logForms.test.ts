import { describe, it, expect } from "vitest";
import { ActivityType, MealType, MealRating } from "@/lib/api/progress";
import {
  dateInputToIso,
  todayDateInput,
  validateMealForm,
  validateWorkoutForm,
  type MealFormInput,
  type WorkoutFormInput,
} from "./logForms";

const NOW = new Date(2026, 7, 1, 9, 30, 0);

function mealForm(overrides: Partial<MealFormInput> = {}): MealFormInput {
  return {
    mealType: MealType.LUNCH,
    description: "Grilled chicken and rice",
    mealDate: "2026-08-01",
    rating: "",
    calories: "",
    ...overrides,
  };
}

function workoutForm(overrides: Partial<WorkoutFormInput> = {}): WorkoutFormInput {
  return {
    activityType: ActivityType.STRENGTH,
    title: "Push day",
    duration: "45",
    performedAt: "2026-08-01",
    caloriesBurned: "",
    notes: "",
    ...overrides,
  };
}

describe("dateInputToIso", () => {
  it("anchors a date-only value at local noon so it cannot slip a day", () => {
    const iso = dateInputToIso("2026-08-01", NOW);
    const parsed = new Date(iso);
    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(7);
    expect(parsed.getDate()).toBe(1);
    expect(parsed.getHours()).toBe(12);
  });

  it("falls back to now for a blank or malformed value", () => {
    expect(dateInputToIso("", NOW)).toBe(NOW.toISOString());
    expect(dateInputToIso("not-a-date", NOW)).toBe(NOW.toISOString());
  });
});

describe("todayDateInput", () => {
  it("formats the local date, not the UTC one", () => {
    expect(todayDateInput(new Date(2026, 0, 5, 23, 45))).toBe("2026-01-05");
  });
});

describe("validateMealForm", () => {
  it("accepts a minimal meal and omits the optional fields", () => {
    const result = validateMealForm(mealForm(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.meal_type).toBe(MealType.LUNCH);
    expect(result.value.description).toBe("Grilled chicken and rice");
    expect(result.value).not.toHaveProperty("calories");
    expect(result.value).not.toHaveProperty("rating");
  });

  it("trims the description and rejects a blank one", () => {
    const result = validateMealForm(mealForm({ description: "   " }), NOW);
    expect(result).toEqual({ ok: false, error: "Describe what you ate." });
  });

  it("rejects an over-long description", () => {
    const result = validateMealForm(
      mealForm({ description: "a".repeat(1001) }),
      NOW,
    );
    expect(result.ok).toBe(false);
  });

  it("passes through a rating and calorie count when given", () => {
    const result = validateMealForm(
      mealForm({ rating: MealRating.GREAT, calories: "620" }),
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.rating).toBe(MealRating.GREAT);
    expect(result.value.calories).toBe(620);
  });

  it("treats a blank calorie field as not recorded rather than zero", () => {
    const result = validateMealForm(mealForm({ calories: "  " }), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.calories).toBeUndefined();
  });

  it("rejects a negative or non-numeric calorie count", () => {
    expect(validateMealForm(mealForm({ calories: "-5" }), NOW).ok).toBe(false);
    expect(validateMealForm(mealForm({ calories: "lots" }), NOW).ok).toBe(false);
  });

  it("rejects an implausible calorie count", () => {
    expect(validateMealForm(mealForm({ calories: "99999" }), NOW).ok).toBe(false);
  });
});

describe("validateWorkoutForm", () => {
  it("accepts a minimal workout and omits the optional fields", () => {
    const result = validateWorkoutForm(workoutForm(), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.activity_type).toBe(ActivityType.STRENGTH);
    expect(result.value.title).toBe("Push day");
    expect(result.value.duration_minutes).toBe(45);
    expect(result.value).not.toHaveProperty("calories_burned");
    expect(result.value).not.toHaveProperty("notes");
  });

  it("requires a title", () => {
    const result = validateWorkoutForm(workoutForm({ title: "  " }), NOW);
    expect(result).toEqual({ ok: false, error: "Give the session a name." });
  });

  it("requires a positive duration", () => {
    for (const duration of ["", "0", "-10", "abc"]) {
      const result = validateWorkoutForm(workoutForm({ duration }), NOW);
      expect(result).toEqual({
        ok: false,
        error: "Enter how long you trained, in minutes.",
      });
    }
  });

  it("rejects a session longer than 24 hours", () => {
    const result = validateWorkoutForm(workoutForm({ duration: "1441" }), NOW);
    expect(result.ok).toBe(false);
  });

  it("accepts exactly 24 hours", () => {
    expect(validateWorkoutForm(workoutForm({ duration: "1440" }), NOW).ok).toBe(true);
  });

  it("trims notes and includes calories burned when given", () => {
    const result = validateWorkoutForm(
      workoutForm({ caloriesBurned: "410", notes: "  felt strong  " }),
      NOW,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.calories_burned).toBe(410);
    expect(result.value.notes).toBe("felt strong");
  });

  it("drops whitespace-only notes instead of sending them", () => {
    const result = validateWorkoutForm(workoutForm({ notes: "   " }), NOW);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).not.toHaveProperty("notes");
  });
});
