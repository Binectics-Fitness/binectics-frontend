"use client";

import { useEffect, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, ActivityReport } from "@/lib/api/progress";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workout Log",
  description: "Log and review your workout history.",
};

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

export default function WorkoutLogPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [activities, setActivities] = useState<ActivityReport[]>([]);
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

        const activitiesRes = await progressService.getActivityReports(
          myProfile._id,
          50
        );
        setActivities(
          activitiesRes.success && activitiesRes.data ? activitiesRes.data : []
        );
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load workout log");
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

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
      <h1
        style={{
          fontSize: 30,
          letterSpacing: "-0.024em",
          fontWeight: 500,
          marginBottom: 6,
          color: "var(--ink)",
        }}
      >
        Workout log
      </h1>
      <p style={{ color: "var(--fg-3)", marginBottom: 18 }}>
        {profile ? `${typeof profile.client_id === "object" ? `${profile.client_id.first_name} ${profile.client_id.last_name}` : profile.client_id} · ${activities.length} workouts logged` : "Loading..."}
      </p>

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
          <div style={{ color: "var(--fg-3)", fontSize: 13 }}>
            Loading workouts...
          </div>
        ) : activities.length === 0 ? (
          <div style={{ color: "var(--fg-3)", fontSize: 13 }}>No workouts logged yet.</div>
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
                      {activity.notes || "—"}
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
