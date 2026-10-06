"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  ActivityHeatmap,
  AsyncSpinner,
  DSCard,
  DSStatCard,
  EmptySlate,
  Eyebrow,
  ListRow,
  PageHeader,
} from "@/components/ds";
import { toast } from "@/components/Toast";
import { progressService, ActivityType } from "@/lib/api/progress";
import type { ClientProfile, ActivityReport } from "@/lib/api/progress";
import {
  todayDateInput,
  validateWorkoutForm,
  type WorkoutFormInput,
} from "@/lib/progress/logForms";
import { heatmapCells } from "@/lib/ui/activity";
import { useClientNow } from "@/lib/ui/useClientNow";
import { workoutTotals } from "../_lib/logStats";
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

  // Day-level numbers need the viewer's clock, which only exists after
  // mount; until then the stat and heatmap blocks show a skeleton.
  const now = useClientNow();
  const stats = useMemo(() => (now ? workoutTotals(activities, now) : null), [activities, now]);
  const heatCells = useMemo(
    () => (now ? heatmapCells(activities.map((a) => a.performed_at), 30, now) : null),
    [activities, now],
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const opened = activities.find((a) => a._id === openId) ?? null;

  return (
    <MemberDashboardShell activeLabel="Activity">
      <PageHeader
        title={{ before: "Workout ", emphasis: "log" }}
        subtitle="Sessions you log, and any your coach logs for you."
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
            {formOpen ? "Cancel" : "+ Log workout"}
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

      {/* Stat pair: this week (Monday-first, the same week the heatmap and
          WeekStrip use), with the 30-day figure as context. No top set or
          volume: a workout record has no sets, reps or load. */}
      {loading || !stats ? (
        <div aria-hidden="true" className="grid grid-cols-2 gap-3 mb-3.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[92px] rounded-[var(--r-3)]" style={{ background: "var(--bg-2)" }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-3.5">
          <DSStatCard
            size="sm"
            label="Sessions · this week"
            value={stats.week.sessions}
            delta={`${stats.last30.sessions} in 30d`}
          />
          <DSStatCard
            size="sm"
            label="Minutes · this week"
            value={stats.week.minutes}
            unit="min"
            delta={`${stats.last30.minutes} min in 30d`}
          />
        </div>
      )}

      <DSCard className="p-4.5 mb-3.5">
        <Eyebrow className="mb-3">Last 30 days</Eyebrow>
        {loading || !heatCells ? (
          <div aria-hidden="true" className="h-[120px] rounded-[var(--r-2)]" style={{ background: "var(--bg-2)" }} />
        ) : (
          <ActivityHeatmap cells={heatCells} noun="workouts" nounOne="workout" columns={10} />
        )}
        {stats && stats.last30.calories > 0 && (
          <p className="font-mono text-[11px] mt-3" style={{ color: "var(--fg-3)" }}>
            {stats.last30.calories.toLocaleString()} kcal burned, from the sessions that recorded it
          </p>
        )}
      </DSCard>

      <section aria-labelledby="recent-workouts">
        <Eyebrow id="recent-workouts" as="h2" className="mb-2.5 px-1">
          Recent workouts
        </Eyebrow>
        {loading ? (
          <AsyncSpinner label="Loading workouts" />
        ) : activities.length === 0 ? (
          <EmptySlate message="No workouts logged yet." mt="mt-0" />
        ) : (
          <ul className="flex flex-col gap-1.5">
            {activities.slice(0, 20).map((activity) => (
              <li key={activity._id}>
                <ListRow
                  title={activity.title || activity.activity_type}
                  meta={[
                    formatDate(activity.performed_at),
                    activity.activity_type,
                    `${activity.duration_minutes} min`,
                    activity.calories_burned ? `${activity.calories_burned} kcal` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                  onClick={() => setOpenId(activity._id)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <LogDetailDrawer
        open={opened !== null}
        onClose={() => setOpenId(null)}
        title={opened?.title || "Workout"}
        fields={
          opened
            ? [
                { label: "Date", value: formatDate(opened.performed_at) },
                { label: "Type", value: opened.activity_type },
                { label: "Duration", value: `${opened.duration_minutes} min` },
                { label: "Calories burned", value: opened.calories_burned ? `${opened.calories_burned} kcal` : null },
                { label: "Intensity", value: opened.intensity != null ? `${opened.intensity} / 10` : null },
                { label: "Notes", value: opened.notes },
              ]
            : []
        }
      />
    </MemberDashboardShell>
  );
}
