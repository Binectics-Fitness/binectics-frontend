import { describe, it, expect } from "vitest";
import {
  mealsToday,
  nextStreakMilestone,
  recentWeights,
  signedKg,
  weightChange30d,
  workoutTotals,
} from "@/app/dashboard/member/_lib/logStats";

// Wed 7 Oct 2026, 15:00 local. The week (Monday-first) is Mon 5 – Sun 11.
const NOW = new Date(2026, 9, 7, 15, 0, 0);
const at = (y: number, m: number, d: number, h = 9) => new Date(y, m - 1, d, h).toISOString();

describe("workoutTotals", () => {
  const activities = [
    { performed_at: at(2026, 10, 7), duration_minutes: 45, calories_burned: 300 },
    { performed_at: at(2026, 10, 5), duration_minutes: 30 },
    // Sunday before: last week, still inside 30 days.
    { performed_at: at(2026, 10, 4), duration_minutes: 60, calories_burned: 500 },
    // 29 days back is the oldest day in the window; 30 back is outside it.
    { performed_at: at(2026, 9, 8), duration_minutes: 20 },
    { performed_at: at(2026, 9, 7), duration_minutes: 90 },
  ];

  it("counts this week from Monday, not the 30-day window", () => {
    const { week } = workoutTotals(activities, NOW);
    expect(week).toEqual({ sessions: 2, minutes: 75, calories: 300 });
  });

  it("sums the 30 days ending today", () => {
    const { last30 } = workoutTotals(activities, NOW);
    expect(last30).toEqual({ sessions: 4, minutes: 155, calories: 800 });
  });

  it("drops records with an unreadable date instead of guessing", () => {
    const { last30 } = workoutTotals([{ performed_at: "not a date", duration_minutes: 10 }], NOW);
    expect(last30.sessions).toBe(0);
  });
});

describe("weightChange30d", () => {
  it("is latest minus the earliest log inside the window", () => {
    const logs = [
      { weight_kg: 73.4, recorded_at: at(2026, 10, 6) },
      { weight_kg: 74.0, recorded_at: at(2026, 9, 20) },
      { weight_kg: 75.2, recorded_at: at(2026, 9, 10) },
      { weight_kg: 80, recorded_at: at(2026, 8, 1) }, // outside
    ];
    const change = weightChange30d(logs, NOW);
    expect(change?.kg).toBeCloseTo(-1.8, 5);
    expect(change?.since).toBe(at(2026, 9, 10));
  });

  it("is null with fewer than two logs in the window", () => {
    expect(weightChange30d([{ weight_kg: 70, recorded_at: at(2026, 10, 1) }, { weight_kg: 72, recorded_at: at(2026, 7, 1) }], NOW)).toBeNull();
  });
});

describe("recentWeights / signedKg", () => {
  it("returns the latest n weights oldest first", () => {
    const logs = [3, 1, 2].map((d) => ({ weight_kg: 70 + d, recorded_at: at(2026, 10, d) }));
    expect(recentWeights(logs, 2)).toEqual([72, 73]);
  });

  it("signs with a real minus and never shows -0.0", () => {
    expect(signedKg(-1.84)).toBe("−1.8");
    expect(signedKg(0.4)).toBe("+0.4");
    expect(signedKg(-0.01)).toBe("0.0");
  });
});

describe("mealsToday", () => {
  it("counts today's meals and sums only the calories that were recorded", () => {
    const meals = [
      { meal_date: at(2026, 10, 7, 8), calories: 420 },
      { meal_date: at(2026, 10, 7, 13) },
      { meal_date: at(2026, 10, 7, 19), calories: 0 },
      { meal_date: at(2026, 10, 6, 19), calories: 900 },
    ];
    expect(mealsToday(meals, NOW)).toEqual({ count: 3, calories: 420, withCalories: 1 });
  });
});

describe("nextStreakMilestone", () => {
  it("is the first milestone above the streak", () => {
    expect(nextStreakMilestone(0)).toBe(1);
    expect(nextStreakMilestone(7)).toBe(30);
    expect(nextStreakMilestone(32)).toBe(50);
    expect(nextStreakMilestone(365)).toBeNull();
  });
});
