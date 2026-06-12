"use client";

import { useEffect, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { progressService, MealType } from "@/lib/api/progress";
import type { ClientProfile, MealFeedback } from "@/lib/api/progress";

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const today = new Date();
  const isToday =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  if (isToday) return "Today";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function getMealIcon(mealType: string): string {
  switch (mealType) {
    case MealType.BREAKFAST:
      return "🍳";
    case MealType.LUNCH:
      return "🍽️";
    case MealType.DINNER:
      return "🍜";
    case MealType.SNACK:
      return "🍎";
    default:
      return "🍽️";
  }
}

export default function MealLogPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [meals, setMeals] = useState<MealFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await progressService.getMyOwnProfiles();
        if (!profileRes.success || !profileRes.data?.length) {
          setError("No profile found. Please create one first.");
          setLoading(false);
          return;
        }

        const myProfile = profileRes.data[0];
        setProfile(myProfile);

        const mealsRes = await progressService.getMealFeedbacks(myProfile._id, 50);
        setMeals(mealsRes.success && mealsRes.data ? mealsRes.data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meal log");
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const todayMeals = meals.filter(
    (m) =>
      new Date(m.meal_date).toDateString() ===
      new Date().toDateString()
  );
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.calories ?? 0), 0);

  return (
    <MemberDashboardShell activeLabel="Activity">
      <div
        className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3"
        style={{ marginBottom: 18 }}
      >
        <div>
          <h1
            style={{
              fontSize: 30,
              letterSpacing: "-0.024em",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            Meals
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            {profile ? `${typeof profile.client_id === "object" ? `${profile.client_id.first_name} ${profile.client_id.last_name}` : profile.client_id} · ${meals.length} meals logged` : "Loading.."}
          </p>
        </div>
        <button
          disabled
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "8px 14px",
            borderRadius: 6,
            border: 0,
            fontSize: 13,
            fontWeight: 500,
            cursor: "not-allowed",
            opacity: 0.5,
          }}
        >
          + Log meal (coming soon)
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "var(--danger-soft)",
            border: "1px solid oklch(0.92 0.05 25)",
            borderRadius: 10,
            padding: 14,
            color: "var(--danger)",
            fontSize: 13,
            marginBottom: 14,
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          {
            label: "Kcal · today",
            value: `${totalCalories} / 2000`,
            delta: `${((totalCalories / 2000) * 100).toFixed(0)}%`,
          },
          { label: "Meals logged", value: meals.length.toString(), delta: "Total" },
          {
            label: "Today",
            value: todayMeals.length.toString(),
            delta: todayMeals.length > 0 ? "Synced" : "—",
          },
          { label: "Status", value: loading ? "..." : "Active", delta: "Tracking" },
        ].map((kpi) => (
          <div
            key={kpi.label}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div
              className="font-mono"
              style={{
                fontSize: 10.5,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {kpi.label}
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 24,
                fontWeight: 500,
                color: "var(--ink)",
                letterSpacing: "-0.02em",
                marginTop: 4,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {kpi.value}
            </div>
            <div
              className="font-mono"
              style={{ fontSize: 11, color: "var(--signal-ink)", marginTop: 4 }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 22,
        }}
      >
        <h3
          style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}
        >
          Recent meals
        </h3>

        {loading ? (
           <AsyncSpinner label="Loading meals" />
        ) : meals.length === 0 ? (
           <EmptySlate message="No meals logged yet." mt="mt-0" />
        ) : (
          meals.slice(0, 20).map((meal, i) => (
            <div
              key={meal._id}
              className="grid grid-cols-[1fr] sm:grid-cols-[60px_1fr_180px] gap-3.5"
              style={{
                padding: "12px 0",
                borderBottom:
                  i < Math.min(meals.length - 1, 19) ? "1px solid var(--border)" : "0",
              }}
            >
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--fg-3)",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {formatDate(meal.meal_date)}
              </span>
              <div>
                <strong
                  style={{ fontSize: 13.5, color: "var(--ink)" }}
                >
                  {getMealIcon(meal.meal_type)} {meal.meal_type}
                </strong>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--fg-2)",
                    marginTop: 2,
                  }}
                >
                  {meal.description}
                </div>
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 11.5,
                  color: "var(--fg-3)",
                  textAlign: "right",
                  alignSelf: "center",
                }}
              >
                {meal.calories ? `${meal.calories} kcal` : "—"} · {meal.rating || "unrated"}
              </div>
            </div>
          ))
        )}
      </div>
    </MemberDashboardShell>
  );
}
