import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Weight Log",
  description: "Track your weight over time with charts and trends.",
};

const WEIGHT_ROWS = [
  { date: "Today", weight: "73.4 kg", note: "Felt lighter", photo: false, bold: true },
  { date: "Sun 18 May", weight: "73.7 kg", note: "—", photo: true, bold: false },
  { date: "Sun 11 May", weight: "74.2 kg", note: "Travel week, no change", photo: false, bold: false },
  { date: "Sun 4 May", weight: "74.6 kg", note: "—", photo: true, bold: false },
  { date: "Sun 27 Apr", weight: "75.2 kg", note: "Starting weight", photo: true, bold: false },
];

export default function WeightLogPage() {
  return (
    <MemberDashboardShell activeLabel="Activity">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3"
        style={{
          marginBottom: 18,
        }}
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
            Tracked weekly &middot; sharing on with Sarah
          </p>
        </div>
        <button
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            padding: "8px 14px",
            borderRadius: 6,
            border: 0,
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          + Log today
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Today", value: "73.4 kg", delta: "↓ 0.3 vs last week" },
          { label: "Change · 30d", value: "−1.8 kg", delta: "Goal: −5 kg by Sep" },
          { label: "Body fat · est.", value: "18.2%", delta: "Smart scale" },
          { label: "Hydration", value: "60%", delta: "Recent" },
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

      {/* Chart card */}
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
          Last 12 weeks
        </h3>
        <svg viewBox="0 0 800 200" style={{ width: "100%", height: 200 }}>
          <defs>
            <linearGradient id="wt" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="oklch(0.55 0.16 148)" stopOpacity="0.3" />
              <stop offset="1" stopColor="oklch(0.55 0.16 148)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 40 60 L 100 55 L 160 70 L 220 65 L 280 80 L 340 85 L 400 95 L 460 110 L 520 120 L 580 130 L 640 140 L 700 145 L 760 152 L 760 200 L 40 200 Z"
            fill="url(#wt)"
          />
          <path
            d="M 40 60 L 100 55 L 160 70 L 220 65 L 280 80 L 340 85 L 400 95 L 460 110 L 520 120 L 580 130 L 640 140 L 700 145 L 760 152"
            fill="none"
            stroke="oklch(0.55 0.16 148)"
            strokeWidth="2.5"
          />
          <g fontFamily="ui-monospace" fontSize="10" fill="oklch(0.55 0.008 80)">
            <text x="40" y="190">12 wk ago</text>
            <text x="400" y="190" textAnchor="middle">6 wk</text>
            <text x="760" y="190" textAnchor="end">today</text>
            <text x="20" y="64" textAnchor="end">75.2</text>
            <text x="20" y="156" textAnchor="end">73.4</text>
          </g>
        </svg>
      </div>

      {/* Recent table card */}
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
        <div className="overflow-x-auto">
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {["Date", "Weight", "Note", "Photo"].map((th) => (
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
            {WEIGHT_ROWS.map((r) => (
              <tr key={r.date}>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.date}
                </td>
                <td
                  className="font-mono"
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                    fontWeight: r.bold ? 600 : 400,
                  }}
                >
                  {r.weight}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.note}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.photo ? "📷" : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </MemberDashboardShell>
  );
}
