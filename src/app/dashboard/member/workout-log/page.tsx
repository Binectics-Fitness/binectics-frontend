import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

const HEATMAP_COLORS = [
  "oklch(0.95 0.005 80)", "var(--gym-soft)", "var(--signal-soft)", "var(--signal-soft)",
  "var(--signal-soft)", "var(--signal)", "var(--signal-soft)", "var(--signal-soft)",
  "var(--gym-soft)", "var(--signal-soft)", "var(--signal)", "var(--gym-soft)",
  "oklch(0.95 0.005 80)", "oklch(0.95 0.005 80)", "var(--signal)", "var(--signal)",
  "var(--gym-soft)", "var(--signal-soft)", "var(--signal-soft)", "var(--signal-soft)",
  "var(--signal)", "var(--signal)", "var(--signal)", "var(--signal)",
  "oklch(0.95 0.005 80)", "var(--signal)", "var(--signal)", "var(--gym-soft)",
  "var(--signal-soft)", "var(--signal)",
];

const WORKOUT_ROWS = [
  { date: "Wed 21 May", type: "Strength · lower", topSet: "92.5 × 3 squat", notes: "PR day — felt strong" },
  { date: "Mon 19 May", type: "Strength · upper", topSet: "62.5 × 5 bench", notes: "Solid" },
  { date: "Sat 17 May", type: "Conditioning", topSet: "Row · 5k 22:14", notes: "Fast pace" },
  { date: "Wed 14 May", type: "Strength · lower", topSet: "87.5 × 5 squat", notes: "Built towards PR" },
  { date: "Mon 12 May", type: "Strength · upper", topSet: "60 × 5 bench", notes: "Smooth" },
];

export default function WorkoutLogPage() {
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
        Adherence against Sarah&apos;s program &middot; 32-day streak &middot;
        96% completed
      </p>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Sessions · 30d", value: "22", delta: "Plan target 24" },
          { label: "Top set · squat", value: "92.5 kg", delta: "↑ PR from 87.5" },
          { label: "Total volume · week", value: "14,820 kg", delta: "Above avg" },
          { label: "Adherence · 30d", value: "96%", delta: "↑ 4 pts" },
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

      {/* Heatmap + table card */}
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
          Last 30 days
        </h3>

        {/* Heatmap grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(30, 1fr)",
            gap: 3,
            marginBottom: 14,
          }}
        >
          {HEATMAP_COLORS.map((bg, i) => (
            <div
              key={i}
              title={`Day ${i + 1}`}
              style={{ aspectRatio: "1", background: bg, borderRadius: 2 }}
            />
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <thead>
            <tr>
              {["Date", "Type", "Top set", "Notes"].map((th) => (
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
            {WORKOUT_ROWS.map((r) => (
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
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.type}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.topSet}
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {r.notes}
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
