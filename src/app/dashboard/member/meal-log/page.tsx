"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, DSStatCard, EmptySlate, Eyebrow, ListRow, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import { progressService, MealType, MealRating } from "@/lib/api/progress";
import type { ClientProfile, MealFeedback } from "@/lib/api/progress";
import {
  todayDateInput,
  validateMealForm,
  type MealFormInput,
} from "@/lib/progress/logForms";
import { useClientNow } from "@/lib/ui/useClientNow";
import { mealsToday } from "../_lib/logStats";
import { LogDetailDrawer } from "../_components/LogDetailDrawer";

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

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: "Breakfast",
  [MealType.LUNCH]: "Lunch",
  [MealType.DINNER]: "Dinner",
  [MealType.SNACK]: "Snack",
};

/** "breakfast" → "Breakfast"; an unknown type is shown as stored. */
const mealTypeLabel = (type: string) => MEAL_TYPE_LABELS[type as MealType] ?? type;

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

  // "Today" is the viewer's day, known only after mount (null on the server).
  const now = useClientNow();
  const today = useMemo(() => (now ? mealsToday(meals, now) : null), [meals, now]);
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = meals.find((m) => m._id === openId) ?? null;

  return (
    <MemberDashboardShell activeLabel="Activity">
      <PageHeader
        title={{ before: "Meal ", emphasis: "log" }}
        subtitle="Meals you log, and any your dietitian logs for you."
        actions={
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
              whiteSpace: "nowrap",
            }}
          >
            {formOpen ? "Cancel" : "+ Log meal"}
          </button>
        }
      />

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
                    {MEAL_TYPE_LABELS[type]}
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

      {/* Stat pair for today. No calorie target: none is set anywhere, so
          the old "/ 2000" was invented. */}
      {loading || !today ? (
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 mb-3.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[92px] rounded-[var(--r-3)]" style={{ background: "var(--bg-2)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <DSStatCard
            size="sm"
            label="Meals · today"
            value={today.count}
          />
          <DSStatCard
            size="sm"
            label="Kcal · today"
            value={today.withCalories > 0 ? today.calories.toLocaleString() : "-"}
            unit={today.withCalories > 0 ? "kcal" : undefined}
            delta={
              today.withCalories === 0
                ? "No calories recorded today"
                : today.withCalories < today.count
                  ? `From ${today.withCalories} of ${today.count} meals`
                  : undefined
            }
          />
        </div>
      )}

      <section aria-labelledby="recent-meals">
        <Eyebrow id="recent-meals" as="h2" className="mb-2.5 px-1">
          Recent meals
        </Eyebrow>
        {loading ? (
          <AsyncSpinner label="Loading meals" />
        ) : meals.length === 0 ? (
          <EmptySlate message="No meals logged yet." mt="mt-0" />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {meals.slice(0, 20).map((meal) => (
              <li key={meal._id}>
                <ListRow
                  title={meal.description || mealTypeLabel(meal.meal_type)}
                  meta={[
                    formatDate(meal.meal_date),
                    mealTypeLabel(meal.meal_type),
                    meal.calories ? `${meal.calories} kcal` : null,
                    meal.rating ? MEAL_RATING_LABELS[meal.rating] : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onClick={() => setOpenId(meal._id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <LogDetailDrawer
        open={opened !== null}
        onClose={() => setOpenId(null)}
        title={opened ? mealTypeLabel(opened.meal_type) : "Meal"}
        fields={
          opened
            ? [
                { label: "Date", value: formatDate(opened.meal_date) },
                { label: "What you ate", value: opened.description },
                { label: "Calories", value: opened.calories ? `${opened.calories} kcal` : null },
                { label: "How it felt", value: opened.rating ? MEAL_RATING_LABELS[opened.rating] : null },
                { label: "Notes", value: opened.feedback },
              ]
            : []
        }
      />
    </MemberDashboardShell>
  );
}
