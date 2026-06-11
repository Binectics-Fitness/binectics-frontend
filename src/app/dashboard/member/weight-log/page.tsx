"use client";

import { useEffect, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, WeightLog } from "@/lib/api/progress";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weight Log",
  description: "Track your weight over time with charts and trends.",
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

export default function WeightLogPage() {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
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

        const logsRes = await progressService.getWeightLogs(myProfile._id, 50);
        setLogs(logsRes.success && logsRes.data ? logsRes.data : []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load weight log");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const latestLog = logs.length > 0 ? logs[0] : null;
  const oldestLog = logs.length > 0 ? logs[logs.length - 1] : null;
  const changeKgValue =
    latestLog && oldestLog
      ? latestLog.weight_kg - oldestLog.weight_kg
      : null;
  const changeKg = changeKgValue !== null ? changeKgValue.toFixed(1) : null;

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
            Weight
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            {profile ? `${typeof profile.client_id === "object" ? `${profile.client_id.first_name} ${profile.client_id.last_name}` : profile.client_id} · ${logs.length} logs recorded` : "Loading..."}
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
          + Log today (coming soon)
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
            label: "Current",
            value: latestLog ? `${latestLog.weight_kg.toFixed(1)} kg` : "—",
            delta: latestLog ? formatDate(latestLog.recorded_at) : "—",
          },
          {
            label: "Change",
            value: changeKgValue ? `${changeKgValue > 0 ? "+" : ""}${changeKg}` : "—",
            delta: changeKgValue ? (changeKgValue < 0 ? "↓ Loss" : "↑ Gain") : "—",
          },
          {
            label: "Logs",
            value: logs.length.toString(),
            delta: "Total recorded",
          },
          {
            label: "Status",
            value: loading ? "..." : logs.length > 0 ? "Active" : "No logs",
            delta: logs.length > 0 ? "Latest synced" : "—",
          },
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

      {!loading && logs.length > 0 && (
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
            Last 12 records · trend
          </h3>
          <svg viewBox="0 0 800 200" style={{ width: "100%", height: 200 }}>
            <defs>
              <linearGradient id="wt" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="oklch(0.55 0.16 148)" stopOpacity="0.3" />
                <stop offset="1" stopColor="oklch(0.55 0.16 148)" stopOpacity="0" />
              </linearGradient>
            </defs>
            {(() => {
              const displayLogs = logs.slice(0, 12).reverse();
              const weights = displayLogs.map((l) => l.weight_kg);
              const minW = Math.min(...weights);
              const maxW = Math.max(...weights);
              const range = maxW - minW || 1;
              const points = displayLogs
                .map(
                  (log, i) =>
                    `${40 + (i / (displayLogs.length - 1 || 1)) * 720} ${150 - ((log.weight_kg - minW) / range) * 120}`
                )
                .join(" L ");
              return (
                <>
                  <path d={`M ${points} L 760 200 L 40 200 Z`} fill="url(#wt)" />
                  <path d={`M ${points}`} fill="none" stroke="oklch(0.55 0.16 148)" strokeWidth="2.5" />
                  <g fontFamily="ui-monospace" fontSize="10" fill="oklch(0.55 0.008 80)">
                    <text x="40" y="190">{displayLogs[0]?.recorded_at.slice(0, 10)}</text>
                    <text x="400" y="190" textAnchor="middle">
                      Mid
                    </text>
                    <text x="760" y="190" textAnchor="end">
                      {displayLogs[displayLogs.length - 1]?.recorded_at.slice(0, 10)}
                    </text>
                    <text x="20" y="60" textAnchor="end">
                      {maxW.toFixed(1)}
                    </text>
                    <text x="20" y="156" textAnchor="end">
                      {minW.toFixed(1)}
                    </text>
                  </g>
                </>
              );
            })()}
          </svg>
        </div>
      )}

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
          Recent
        </h3>
        {loading ? (
          <div style={{ color: "var(--fg-3)", fontSize: 13 }}>Loading logs...</div>
        ) : logs.length === 0 ? (
          <div style={{ color: "var(--fg-3)", fontSize: 13 }}>No weight logs yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr>
                  {["Date", "Weight", "Note", "Logged by"].map((th) => (
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
                {logs.map((log) => {
                  const loggedBy =
                    typeof log.logged_by === "string"
                      ? log.logged_by
                      : `${log.logged_by.first_name} ${log.logged_by.last_name}`;
                  return (
                    <tr key={log._id}>
                      <td
                        className="font-mono"
                        style={{
                          padding: "11px 14px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {formatDate(log.recorded_at)}
                      </td>
                      <td
                        className="font-mono"
                        style={{
                          padding: "11px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontWeight: 600,
                        }}
                      >
                        {log.weight_kg.toFixed(1)} kg
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          borderBottom: "1px solid var(--border)",
                        }}
                      >
                        {log.note || "—"}
                      </td>
                      <td
                        style={{
                          padding: "11px 14px",
                          borderBottom: "1px solid var(--border)",
                          fontSize: 12,
                          color: "var(--fg-3)",
                        }}
                      >
                        {loggedBy}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MemberDashboardShell>
  );
}
