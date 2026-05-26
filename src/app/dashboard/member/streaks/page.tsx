import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

const EARNED_BADGES = [
  { name: "First step", sub: "Day 1" },
  { name: "Week one", sub: "Day 7" },
  { name: "Month one", sub: "Day 30" },
  { name: "First PR", sub: "Strength" },
  { name: "10 sessions", sub: "—" },
  { name: "100 sessions", sub: "—" },
];

const LOCKED_BADGES = [
  { name: "50 day streak", sub: "—" },
  { name: "100 day streak", sub: "—" },
  { name: "365 days", sub: "—" },
  { name: "First marathon", sub: "—" },
  { name: "Year one", sub: "—" },
  { name: "1000 sessions", sub: "—" },
];

export default function MemberStreaksPage() {
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
        Activity
      </h1>
      <p style={{ color: "var(--fg-3)", marginBottom: 18 }}>
        Your streak, milestones, and lifetime stats
      </p>

      {/* Streak hero card */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--ink), oklch(0.30 0.05 60))",
          borderRadius: 16,
          padding: 32,
          color: "var(--bg)",
          marginBottom: 14,
        }}
      >
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "oklch(0.75 0.005 85)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Current streak
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 500,
            letterSpacing: "-0.03em",
            marginTop: 6,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          32 days
        </div>
        <div
          style={{
            fontSize: 14,
            color: "oklch(0.85 0.005 85)",
            marginTop: 6,
          }}
        >
          Personal best &middot; started 24 Apr 2026
        </div>
        {/* Progress bar */}
        <div
          style={{
            height: 8,
            background: "oklch(0.30 0.008 80)",
            borderRadius: 4,
            marginTop: 22,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: "64%",
              background: "var(--signal)",
              borderRadius: 4,
            }}
          />
        </div>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "oklch(0.75 0.005 85)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            marginTop: 8,
          }}
        >
          18 days to your next milestone &middot; 50
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          {
            label: "Lifetime sessions",
            value: "412",
            delta: "Joined Jan 2025",
          },
          {
            label: "Longest streak",
            value: "32 days",
            delta: "Current = best",
          },
          {
            label: "Hours trained",
            value: "218",
            delta: "Avg 32 min/session",
          },
          {
            label: "Calories burned",
            value: "82.4k",
            delta: "Approximated",
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
              style={{
                fontSize: 11,
                color: "var(--signal-ink)",
                marginTop: 4,
              }}
            >
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Badges card */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 22,
        }}
      >
        <h3
          style={{
            fontSize: 14,
            fontWeight: 500,
            marginBottom: 14,
            color: "var(--ink)",
          }}
        >
          Badges &middot; 8 earned
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {EARNED_BADGES.map((b) => (
            <div
              key={b.name}
              style={{
                aspectRatio: "1",
                background: "var(--ink)",
                color: "var(--bg)",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}
              >
                {b.name}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  opacity: 0.7,
                  marginTop: 4,
                }}
              >
                {b.sub}
              </div>
            </div>
          ))}
          {LOCKED_BADGES.map((b) => (
            <div
              key={b.name}
              style={{
                aspectRatio: "1",
                background: "var(--bg-2)",
                color: "var(--fg-4)",
                borderRadius: 12,
                padding: 14,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                opacity: 0.5,
              }}
            >
              <div
                style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}
              >
                {b.name}
              </div>
              <div
                className="font-mono"
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  opacity: 0.7,
                  marginTop: 4,
                }}
              >
                {b.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MemberDashboardShell>
  );
}
