"use client";

import { useCallback, useEffect, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { progressService, MealType, MealRating } from "@/lib/api/progress";
import type { ClientProfile, MealFeedback } from "@/lib/api/progress";
import {
  todayDateInput,
  validateMealForm,
  type MealFormInput,
} from "@/lib/progress/logForms";

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

const EMPTY_MEAL_FORM: MealFormInput = {
  mealType: MealType.BREAKFAST,
  description: "",
  mealDate: "",
  rating: "",
  calories: "",
};

const MEAL_RATING_LABELS: Record<MealRating, string> = {
  [MealRating.GREAT]: "Great",
  [MealRating.GOOD]: "Good",
  [MealRating.OKAY]: "Okay",
  [MealRating.POOR]: "Poor",
};

const fieldLabelStyle = {
  fontFamily: "ui-monospace, monospace",
  fontSize: 10.5,
  color: "var(--fg-3)",
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
  display: "block",
  marginBottom: 5,
};

const fieldInputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "var(--r-2)",
  border: "1px solid var(--border-2)",
  fontSize: 13,
  background: "var(--bg)",
  color: "var(--ink)",
};

export default function MealLogPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [meals, setMeals] = useState<MealFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<MealFormInput>(EMPTY_MEAL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = <K extends keyof MealFormInput>(
    key: K,
    value: MealFormInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  /** Re-read the list from the server so a create shows the stored record. */
  const refetchMeals = useCallback(async (profileId: string) => {
    const mealsRes = await progressService.getMealFeedbacks(profileId, 50);
    setMeals(mealsRes.success && mealsRes.data ? mealsRes.data : []);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer an existing profile (e.g. dietitian-created); otherwise
        // get-or-create the SELF profile so a first-time member can log a meal
        // without a provider having to add them as a client first.
        const profileRes = await progressService.getMyOwnProfiles();
        let myProfile =
          profileRes.success && profileRes.data?.length
            ? profileRes.data[0]
            : null;
        if (!myProfile) {
          const created = await progressService.getOrCreateMyProfile();
          if (created.success && created.data) myProfile = created.data;
        }
        if (!myProfile) {
          setError("Could not set up your progress profile. Please try again.");
          setLoading(false);
          return;
        }
        setProfile(myProfile);

        await refetchMeals(myProfile._id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load meal log");
        setMeals([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [refetchMeals]);

  const openForm = () => {
    setForm({ ...EMPTY_MEAL_FORM, mealDate: todayDateInput() });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
  };

  const onSubmit = async () => {
    if (!profile || saving) return;

    const validated = validateMealForm(form);
    if (!validated.ok) {
      setFormError(validated.error);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const res = await progressService.createMealFeedback(
        profile._id,
        validated.value,
      );
      if (res.success) {
        await refetchMeals(profile._id);
        setFormOpen(false);
        setForm(EMPTY_MEAL_FORM);
        toast.success("Meal logged.");
      } else {
        setFormError(res.message || "Could not save the meal. Please try again.");
      }
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not save the meal. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

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
          type="button"
          onClick={formOpen ? closeForm : openForm}
          disabled={!profile || loading}
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "8px 14px",
            borderRadius: 6,
            border: 0,
            fontSize: 13,
            fontWeight: 500,
            cursor: !profile || loading ? "not-allowed" : "pointer",
            opacity: !profile || loading ? 0.5 : 1,
          }}
        >
          {formOpen ? "Cancel" : "+ Log meal"}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 22,
            marginBottom: 14,
          }}
        >
          <h3
            style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}
          >
            Log a meal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="meal-type" style={fieldLabelStyle}>
                Meal
              </label>
              <select
                id="meal-type"
                value={form.mealType}
                onChange={(e) => setField("mealType", e.target.value as MealType)}
                style={fieldInputStyle}
              >
                {Object.values(MealType).map((type) => (
                  <option key={type} value={type}>
                    {getMealIcon(type)} {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="meal-date" style={fieldLabelStyle}>
                Date
              </label>
              <input
                id="meal-date"
                type="date"
                value={form.mealDate}
                max={todayDateInput()}
                onChange={(e) => setField("mealDate", e.target.value)}
                style={fieldInputStyle}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="meal-description" style={fieldLabelStyle}>
                What did you eat?
              </label>
              <textarea
                id="meal-description"
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Grilled chicken, rice and a side salad"
                rows={2}
                autoFocus
                style={{ ...fieldInputStyle, resize: "vertical" }}
              />
            </div>

            <div>
              <label htmlFor="meal-calories" style={fieldLabelStyle}>
                Calories (optional)
              </label>
              <input
                id="meal-calories"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="kcal"
                value={form.calories}
                onChange={(e) => setField("calories", e.target.value)}
                style={fieldInputStyle}
              />
            </div>

            <div>
              <label htmlFor="meal-rating" style={fieldLabelStyle}>
                How did it feel? (optional)
              </label>
              <select
                id="meal-rating"
                value={form.rating}
                onChange={(e) =>
                  setField("rating", e.target.value as MealRating | "")
                }
                style={fieldInputStyle}
              >
                <option value="">No rating</option>
                {Object.values(MealRating).map((rating) => (
                  <option key={rating} value={rating}>
                    {MEAL_RATING_LABELS[rating]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formError && (
            <div
              style={{
                color: "var(--danger)",
                fontSize: 12,
                marginTop: 10,
              }}
              role="alert"
            >
              {formError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                background: "var(--ink)",
                color: "var(--bg)",
                padding: "8px 14px",
                borderRadius: 6,
                border: 0,
                fontSize: 13,
                fontWeight: 500,
                cursor: saving ? "wait" : "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : "Save meal"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              style={{
                background: "var(--bg)",
                color: "var(--fg-2)",
                padding: "8px 14px",
                borderRadius: 6,
                border: "1px solid var(--border)",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

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
            delta: todayMeals.length > 0 ? "Synced" : "-",
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
                {meal.calories ? `${meal.calories} kcal` : "-"} · {meal.rating || "unrated"}
              </div>
            </div>
          ))
        )}
      </div>
    </MemberDashboardShell>
  );
}
