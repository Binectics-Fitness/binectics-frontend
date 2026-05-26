import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";

const WEEK_DAYS = [
  { day: "Mon", date: 19, done: true },
  { day: "Tue", date: 20, done: true },
  { day: "Wed", date: 21, done: true },
  { day: "Thu", date: 22, done: false },
  { day: "Fri", date: 23, done: true },
  { day: "Sat", date: 24, done: false },
  { day: "Sun", date: 25, done: false, isToday: true },
];

export default function MemberHomePage() {
  return (
    <MemberDashboardShell activeLabel="Home">
      {/* Greeting */}
      <div style={{ marginBottom: 18 }}>
        <div
          className="font-mono"
          style={{
            fontSize: 11,
            color: "var(--fg-3)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Sunday &middot; 25 May &middot; Cape Town
        </div>
        <h1
          style={{
            fontSize: 30,
            letterSpacing: "-0.024em",
            fontWeight: 500,
            marginTop: 6,
            color: "var(--ink)",
          }}
        >
          Hey, <em style={{ fontStyle: "italic" }}>Tunde</em>.
        </h1>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Streak", value: "32 days", delta: "↑ personal best" },
          { label: "This week", value: "4 / 5", delta: "1 more to hit goal" },
          {
            label: "Next session",
            value: "Wed 08:30",
            delta: "with Sarah · Sea Point",
            small: true,
          },
          {
            label: "Weight",
            value: "73.4 kg",
            delta: "↓ 1.8 kg · 4 weeks",
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
                fontSize: kpi.small ? 18 : 24,
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

      {/* Two-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-3.5">
        {/* Left column */}
        <div>
          {/* Next up card */}
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
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 14,
                color: "var(--ink)",
              }}
            >
              Next up
            </h3>
            <div
              style={{
                display: "flex",
                gap: 14,
                alignItems: "center",
                padding: 16,
                background: "var(--bg-2)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 8,
                  background:
                    "linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40))",
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: "var(--ink)",
                  }}
                >
                  Strength session &middot; Sarah Okafor
                </div>
                <div
                  className="font-mono"
                  style={{
                    fontSize: 11,
                    color: "var(--fg-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    marginTop: 3,
                  }}
                >
                  Wed 28 May &middot; 08:30 &middot; 60 min &middot; Iron Lab
                  Sea Point
                </div>
              </div>
              <Link
                href="/dashboard/bookings"
                style={{
                  background: "var(--ink)",
                  color: "var(--bg)",
                  padding: "8px 14px",
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                Details
              </Link>
            </div>
          </div>

          {/* Week plan card */}
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
              style={{
                fontSize: 14,
                fontWeight: 500,
                marginBottom: 14,
                color: "var(--ink)",
              }}
            >
              This week&apos;s plan &middot; 4/5
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7, 1fr)",
                gap: 4,
              }}
            >
              {WEEK_DAYS.map((d) => (
                <div
                  key={d.day}
                  style={{
                    aspectRatio: "1",
                    background: d.isToday
                      ? "var(--ink)"
                      : d.done
                        ? "var(--signal-soft)"
                        : "var(--bg-2)",
                    color: d.isToday
                      ? "var(--bg)"
                      : d.done
                        ? "var(--signal-ink)"
                        : "var(--fg-3)",
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 8,
                  }}
                >
                  <div
                    className="font-mono"
                    style={{
                      fontSize: 9.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      opacity: 0.7,
                    }}
                  >
                    {d.day}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 500 }}>{d.date}</div>
                  {d.done && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 12l5 5L20 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column — quick log */}
        <div>
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
              Quick log
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 8 }}
            >
              {[
                {
                  href: "/dashboard/member/weight-log",
                  label: "Log weight",
                },
                {
                  href: "/dashboard/member/meal-log",
                  label: "Log meal",
                },
                {
                  href: "/dashboard/member/workout-log",
                  label: "Log workout",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    background: "transparent",
                    border: "1px solid var(--border)",
                    padding: "8px 14px",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "var(--ink)",
                    textDecoration: "none",
                    textAlign: "center",
                    display: "block",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MemberDashboardShell>
  );
}
