"use client";

import { useCallback, useEffect, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { progressService, ActivityType } from "@/lib/api/progress";
import type { ClientProfile, ActivityReport } from "@/lib/api/progress";
import {
  todayDateInput,
  validateWorkoutForm,
  type WorkoutFormInput,
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

const EMPTY_WORKOUT_FORM: WorkoutFormInput = {
  activityType: ActivityType.STRENGTH,
  title: "",
  duration: "",
  performedAt: "",
  caloriesBurned: "",
  notes: "",
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

export default function WorkoutLogPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [activities, setActivities] = useState<ActivityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<WorkoutFormInput>(EMPTY_WORKOUT_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const setField = <K extends keyof WorkoutFormInput>(
    key: K,
    value: WorkoutFormInput[K],
  ) => setForm((prev) => ({ ...prev, [key]: value }));

  /** Re-read the list from the server so a create shows the stored record. */
  const refetchActivities = useCallback(async (profileId: string) => {
    const activitiesRes = await progressService.getActivityReports(profileId, 50);
    setActivities(
      activitiesRes.success && activitiesRes.data ? activitiesRes.data : [],
    );
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer an existing profile (e.g. trainer-created); otherwise
        // get-or-create the SELF profile so a first-time member can log a
        // session without a provider having to add them as a client first.
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

        await refetchActivities(myProfile._id);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workout log");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [refetchActivities]);

  const openForm = () => {
    setForm({ ...EMPTY_WORKOUT_FORM, performedAt: todayDateInput() });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setFormError(null);
  };

  const onSubmit = async () => {
    if (!profile || saving) return;

    const validated = validateWorkoutForm(form);
    if (!validated.ok) {
      setFormError(validated.error);
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const res = await progressService.createActivityReport(
        profile._id,
        validated.value,
      );
      if (res.success) {
        await refetchActivities(profile._id);
        setFormOpen(false);
        setForm(EMPTY_WORKOUT_FORM);
        toast.success("Workout logged.");
      } else {
        setFormError(
          res.message || "Could not save the workout. Please try again.",
        );
      }
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Could not save the workout. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const last30Days = activities.filter((a) => {
    const actDate = new Date(a.performed_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return actDate >= thirtyDaysAgo;
  });

  const totalDurationMin = last30Days.reduce(
    (sum, a) => sum + (a.duration_minutes ?? 0),
    0
  );
  const totalCalories = last30Days.reduce(
    (sum, a) => sum + (a.calories_burned ?? 0),
    0
  );

  const heatmapDays = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 29 + i);
    const count = activities.filter(
      (a) =>
        new Date(a.performed_at).toDateString() === d.toDateString()
    ).length;
    return { date: d, count };
  });

  function heatmapColor(count: number): string {
    if (count === 0) return "oklch(0.95 0.005 80)";
    if (count === 1) return "var(--gym-soft)";
    if (count === 2) return "var(--signal-soft)";
    return "var(--signal)";
  }

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
            Workout log
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            {profile ? `${typeof profile.client_id === "object" ? `${profile.client_id.first_name} ${profile.client_id.last_name}` : profile.client_id} · ${activities.length} workouts logged` : "Loading..."}
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
            whiteSpace: "nowrap",
          }}
        >
          {formOpen ? "Cancel" : "+ Log workout"}
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
            Log a workout
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="workout-title" style={fieldLabelStyle}>
                Session
              </label>
              <input
                id="workout-title"
                type="text"
                value={form.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Push day · upper body"
                autoFocus
                style={fieldInputStyle}
              />
            </div>

            <div>
              <label htmlFor="workout-type" style={fieldLabelStyle}>
                Type
              </label>
              <select
                id="workout-type"
                value={form.activityType}
                onChange={(e) =>
                  setField("activityType", e.target.value as ActivityType)
                }
                style={fieldInputStyle}
              >
                {Object.values(ActivityType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="workout-date" style={fieldLabelStyle}>
                Date
              </label>
              <input
                id="workout-date"
                type="date"
                value={form.performedAt}
                max={todayDateInput()}
                onChange={(e) => setField("performedAt", e.target.value)}
                style={fieldInputStyle}
              />
            </div>

            <div>
              <label htmlFor="workout-duration" style={fieldLabelStyle}>
                Duration (minutes)
              </label>
              <input
                id="workout-duration"
                type="number"
                min="1"
                step="1"
                inputMode="numeric"
                placeholder="45"
                value={form.duration}
                onChange={(e) => setField("duration", e.target.value)}
                style={fieldInputStyle}
              />
            </div>

            <div>
              <label htmlFor="workout-calories" style={fieldLabelStyle}>
                Calories burned (optional)
              </label>
              <input
                id="workout-calories"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="kcal"
                value={form.caloriesBurned}
                onChange={(e) => setField("caloriesBurned", e.target.value)}
                style={fieldInputStyle}
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="workout-notes" style={fieldLabelStyle}>
                Notes (optional)
              </label>
              <textarea
                id="workout-notes"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Felt strong, added 5kg on bench."
                rows={2}
                style={{ ...fieldInputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          {formError && (
            <div
              style={{ color: "var(--danger)", fontSize: 12, marginTop: 10 }}
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
              {saving ? "Saving…" : "Save workout"}
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
            label: "Sessions · 30d",
            value: last30Days.length.toString(),
            delta: "Recent period",
          },
          {
            label: "Duration · week",
            value: `${totalDurationMin}`,
            delta: "Total min",
          },
          {
            label: "Calories · 30d",
            value: totalCalories.toString(),
            delta: "Burned",
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
          marginBottom: 14,
        }}
      >
        <h3
          style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}
        >
          Last 30 days
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(30, 1fr)",
            gap: 3,
            marginBottom: 14,
          }}
        >
          {heatmapDays.map((day, i) => (
            <div
              key={i}
              title={`${day.date.toDateString()}: ${day.count} workout${day.count !== 1 ? "s" : ""}`}
              style={{
                aspectRatio: "1",
                background: heatmapColor(day.count),
                borderRadius: 2,
              }}
            />
          ))}
        </div>
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
          Recent workouts
        </h3>

        {loading ? (
          <AsyncSpinner label="Loading workouts" />
        ) : activities.length === 0 ? (
          <EmptySlate message="No workouts logged yet." mt="mt-0" />
        ) : (
          <div className="overflow-x-auto">
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr>
                  {["Date", "Type", "Duration", "Notes"].map((th) => (
                    <th
                      key={th}
                      style={{
                        textAlign: "left",
                        padding: "10px 14px",
                        fontFamily: "ui-monospace, monospace",
                        fontSize: 10.5,
                        color: "var(--fg-3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        borderBottom: "1px solid var(--border)",
                        background: "var(--bg-2)",
                      }}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 20).map((activity) => (
                  <tr key={activity._id}>
                    <td
                      className="font-mono"
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {formatDate(activity.performed_at)}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {activity.activity_type}
                    </td>
                    <td
                      className="font-mono"
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {activity.duration_minutes} min
                      {activity.calories_burned && ` · ${activity.calories_burned} kcal`}
                    </td>
                    <td
                      style={{
                        padding: "11px 14px",
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {activity.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MemberDashboardShell>
  );
}
