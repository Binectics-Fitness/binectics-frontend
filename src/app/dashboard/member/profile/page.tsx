import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile",
  description: "View and edit your member profile information.",
};

const GOALS = [
  { label: "Primary", value: "Two Oceans half-marathon · 25 Oct" },
  { label: "Strength", value: "100 kg back squat by August" },
  { label: "Body comp", value: "Lose 5 kg · maintain muscle" },
];

export default function MemberPublicProfilePage() {
  return (
    <MemberDashboardShell activeLabel="Home">
      {/* Info banner */}
      <div
        style={{
          background: "oklch(0.96 0.06 75)",
          border: "1px solid oklch(0.88 0.07 75)",
          borderRadius: 10,
          padding: "12px 16px",
          marginBottom: 18,
          fontSize: 13,
          color: "oklch(0.32 0.16 75)",
          display: "flex",
          gap: 10,
          alignItems: "center",
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4M12 16h.01" />
        </svg>
        This is what providers see when you book them.{" "}
        <Link
          href="/dashboard/settings"
          style={{
            marginLeft: 6,
            color: "var(--ink)",
            textDecoration: "underline",
          }}
        >
          Edit what&apos;s shared
        </Link>
      </div>

      {/* Profile header */}
      <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-8">
        {/* Avatar placeholder */}
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, oklch(0.85 0.04 120), oklch(0.72 0.06 100))",
          }}
        />

        <div>
          <h1
            style={{
              fontSize: 30,
              letterSpacing: "-0.024em",
              fontWeight: 500,
              color: "var(--ink)",
            }}
          >
            Tunde Adebayo
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            Cape Town &middot; she/her &middot; joined Jan 2025
          </p>

          {/* Badges */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 14,
              flexWrap: "wrap",
            }}
          >
            {[
              "Verified email",
              "No-show free · 18 months",
              "5★ avg given",
            ].map((badge) => (
              <span
                key={badge}
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
                {badge}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p
            style={{
              fontSize: 14,
              color: "var(--fg-2)",
              lineHeight: 1.55,
              marginTop: 18,
              maxWidth: "56ch",
            }}
          >
            &ldquo;Training for the Two Oceans half-marathon in October.
            Strength work with Sarah, dietitian-led nutrition. I&apos;ll always
            tell you in advance if I can&apos;t make it.&rdquo;
          </p>
        </div>
      </div>

      {/* KPI row */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        style={{
          marginTop: 28,
        }}
      >
        {[
          { label: "Sessions completed", value: "412", delta: "98% attendance" },
          { label: "Active streak", value: "32 days", delta: "PB" },
          { label: "Reviews given", value: "28", delta: "4.9 avg given" },
          { label: "Cancellations", value: "3", delta: "All > 48h notice" },
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

      {/* Goals card */}
      <div
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 22,
          marginTop: 14,
        }}
      >
        <h3
          style={{ fontSize: 14, fontWeight: 500, marginBottom: 14, color: "var(--ink)" }}
        >
          Goals (shared with providers)
        </h3>
        <table
          style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
        >
          <tbody>
            {GOALS.map((g) => (
              <tr key={g.label}>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <strong>{g.label}</strong>
                </td>
                <td
                  style={{
                    padding: "11px 14px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {g.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MemberDashboardShell>
  );
}
