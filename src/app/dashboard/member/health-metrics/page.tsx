import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Health Metrics",
  description: "Track your health metrics including weight, body composition, and vitals.",
};

const BODY_COMP_ROWS = [
  { metric: "Weight", today: "73.4 kg", m3: "75.2 kg", m6: "77.1 kg", trend: "↓ 3.7 kg", ok: true },
  { metric: "Body fat %", today: "18.2%", m3: "20.4%", m6: "22.1%", trend: "↓ 3.9%", ok: true },
  { metric: "Muscle mass", today: "29.8 kg", m3: "28.6 kg", m6: "28.4 kg", trend: "↑ 1.4 kg", ok: true },
  { metric: "Waist", today: "82 cm", m3: "86 cm", m6: "89 cm", trend: "↓ 7 cm", ok: true },
];

/* Hardcoded HR scatter data (30 points, y values) */
const HR_Y = [
  111.5, 81.8, 73.9, 78.6, 67.5, 73.3, 78.4, 107.5, 129.4, 136.9,
  132.6, 149.8, 140.3, 153.2, 130.1, 137.4, 122.1, 96.4, 82.5, 86.3,
  66.5, 89.1, 73.1, 99.0, 124.0, 136.5, 143.4, 167.2, 143.8, 130.9,
];

export default function HealthMetricsPage() {
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
        Health metrics
      </h1>
      <p style={{ color: "var(--fg-3)", marginBottom: 18 }}>
        From connected apps &middot; Apple Health + Garmin &middot; last sync 2m
        ago
      </p>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Resting HR · today", value: "52 bpm", delta: "↓ 4 vs 30d avg" },
          { label: "Sleep · last night", value: "7h 42m", delta: "Quality · 84%" },
          { label: "HRV · 7d avg", value: "68 ms", delta: "↑ 4 ms" },
          { label: "Recovery score", value: "82", delta: "Train as planned" },
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

      {/* Body composition table card */}
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
          Body composition &middot; last 6 months
        </h3>
        <div className="overflow-x-auto">
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {["Metric", "Today", "3 mo ago", "6 mo ago", "Trend"].map(
                (th) => (
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
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {BODY_COMP_ROWS.map((r) => (
              <tr key={r.metric}>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <strong>{r.metric}</strong>
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.today}
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.m3}
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.m6}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    className="font-mono"
                    style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      background: "var(--signal-soft)",
                      color: "var(--signal-ink)",
                    }}
                  >
                    {r.trend}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Resting HR chart card */}
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
          Resting HR &middot; last 30 days
        </h3>
        <svg viewBox="0 0 800 160" style={{ width: "100%", height: 160 }}>
          {HR_Y.map((y, i) => (
            <circle
              key={i}
              cx={30 + i * 25}
              cy={y}
              r="3"
              fill="var(--gym)"
            />
          ))}
          <g fontFamily="ui-monospace" fontSize="10" fill="oklch(0.55 0.008 80)">
            <text x="30" y="155">
              30 days ago
            </text>
            <text x="770" y="155" textAnchor="end">
              today
            </text>
          </g>
        </svg>
      </div>
    </MemberDashboardShell>
  );
}
