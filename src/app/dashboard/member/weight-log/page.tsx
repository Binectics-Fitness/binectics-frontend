"use client";

import { useEffect, useState } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { useAuth } from "@/contexts/AuthContext";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { progressService } from "@/lib/api/progress";
import type { ClientProfile, WeightLog } from "@/lib/api/progress";

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logWeight, setLogWeight] = useState("");
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);

  const onLogToday = async () => {
    if (!profile || logSaving) return;
    const weight = Number(logWeight);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 500) {
      setLogError("Enter a weight in kg (e.g. 73.4).");
      return;
    }
    setLogSaving(true);
    setLogError(null);
    const res = await progressService.createWeightLog(profile._id, {
      weight_kg: weight,
      recorded_at: new Date().toISOString(),
    });
    setLogSaving(false);
    if (res.success && res.data) {
      // The create response carries logged_by as a raw id; the list
      // endpoint populates it. Stamp the name locally — the logger is
      // the signed-in user by definition.
      const stamped = {
        ...(res.data as WeightLog),
        logged_by:
          user && typeof (res.data as WeightLog).logged_by === "string"
            ? { _id: (res.data as WeightLog).logged_by as string, first_name: user.first_name ?? "", last_name: user.last_name ?? "" }
            : (res.data as WeightLog).logged_by,
      } as WeightLog;
      setLogs((prev) => [stamped, ...prev]);
      setLogWeight("");
      setLogOpen(false);
    } else {
      setLogError(res.message || "Could not save the log. Please try again.");
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        // Prefer an existing profile (e.g. trainer-created); otherwise
        // get-or-create the SELF profile so first-time members can track
        // without anyone having to add them as a client first.
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

  // "Logged by" only carries information when a PROVIDER logged an entry
  // for the member (trainers/dietitians can). When every entry is the
  // member's own, the column is pure noise — hide it.
  const loggerId = (log: WeightLog) =>
    typeof log.logged_by === "string" ? log.logged_by : log.logged_by._id;
  const hasProviderLogs = logs.some(
    (log) => user && loggerId(log) !== user.id,
  );

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
            {profile
              ? `${
                  typeof profile.client_id === "object"
                    ? `${profile.client_id.first_name} ${profile.client_id.last_name}`
                    : `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim() || "My log"
                } · ${logs.length} ${logs.length === 1 ? "log" : "logs"} recorded`
              : "Loading..."}
          </p>
        </div>
        {logOpen ? (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
            <div>
              <input
                type="number"
                step="0.1"
                min="1"
                inputMode="decimal"
                placeholder="kg"
                value={logWeight}
                autoFocus
                onChange={(e) => setLogWeight(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void onLogToday(); }}
                style={{ width: 110, padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border-2)", fontSize: 13, background: "var(--bg)", color: "var(--ink)" }}
              />
              {logError && (
                <div style={{ color: "var(--danger)", fontSize: 12, marginTop: 4, maxWidth: 220 }}>{logError}</div>
              )}
            </div>
            <button
              onClick={() => void onLogToday()}
              disabled={logSaving || !logWeight}
              style={{ background: "var(--ink)", color: "var(--bg)", padding: "8px 14px", borderRadius: 6, border: 0, fontSize: 13, fontWeight: 500, cursor: logSaving ? "wait" : "pointer", opacity: logSaving || !logWeight ? 0.6 : 1 }}
            >
              {logSaving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setLogOpen(false); setLogError(null); }}
              disabled={logSaving}
              style={{ background: "var(--bg)", color: "var(--fg-2)", padding: "8px 14px", borderRadius: 6, border: "1px solid var(--border)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setLogOpen(true)}
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
            + Log today
          </button>
        )}
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
           <AsyncSpinner label="Loading logs" />
        ) : logs.length === 0 ? (
           <EmptySlate message="No weight logs yet." mt="mt-0" />
        ) : (
          <div className="overflow-x-auto">
            <table
              style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
            >
              <thead>
                <tr>
                  {["Date", "Weight", "Note", ...(hasProviderLogs ? ["Logged by"] : [])].map((th) => (
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
                  const isOwn = user ? loggerId(log) === user.id : false;
                  const loggedBy = isOwn
                    ? "You"
                    : typeof log.logged_by === "string"
                      ? "—"
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
                      {hasProviderLogs && (
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
                      )}
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
