import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meal Log",
  description: "Track your daily meals and nutrition intake.",
};

const MEALS = [
  { time: "07:42", name: "Breakfast", desc: "Oats + banana + whey", macros: "420 kcal · 32P 58C 8F", planned: false },
  { time: "11:18", name: "Mid-morning snack", desc: "Greek yogurt + almonds", macros: "220 kcal · 18P 12C 14F", planned: false },
  { time: "13:30", name: "Lunch", desc: "Jollof rice (low-oil) + grilled chicken", macros: "480 kcal · 38P 52C 14F", planned: false },
  { time: "16:00", name: "Snack", desc: "Apple + handful of cashews", macros: "180 kcal · 4P 22C 8F", planned: false },
  { time: "—", name: "Dinner · planned", desc: "Egusi soup + brown rice", macros: "520 kcal · 20P 56C 18F", planned: true },
];

export default function MealLogPage() {
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
            Meals &middot; today
          </h1>
          <p style={{ color: "var(--fg-3)", marginTop: 6 }}>
            Day 12 of PCOS protocol &middot; Dr Nadia Hassan
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
          + Log meal
        </button>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" style={{ marginBottom: 14 }}>
        {[
          { label: "Kcal · today", value: "1,420 / 1,650", delta: "86%" },
          { label: "Protein", value: "112 / 142g", delta: "79%" },
          { label: "Carbs", value: "138 / 160g", delta: "86%" },
          { label: "Fat", value: "44 / 52g", delta: "85%" },
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
              className="font-mono"
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

      {/* Today's log card */}
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
          Today&apos;s log
        </h3>

        {MEALS.map((meal, i) => (
          <div
            key={meal.name}
            className="grid grid-cols-[1fr] sm:grid-cols-[60px_1fr_180px] gap-3.5"
            style={{
              padding: "12px 0",
              borderBottom:
                i < MEALS.length - 1 ? "1px solid var(--border)" : "0",
              opacity: meal.planned ? 0.5 : 1,
            }}
          >
            <span
              className="font-mono"
              style={{
                fontSize: 11,
                color: "var(--fg-3)",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {meal.time}
            </span>
            <div>
              <strong
                style={{ fontSize: 13.5, color: "var(--ink)" }}
              >
                {meal.name}
              </strong>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--fg-2)",
                  marginTop: 2,
                }}
              >
                {meal.desc}
              </div>
            </div>
            <div
              className="font-mono"
              style={{
                fontSize: 11.5,
                color: "var(--fg-3)",
                textAlign: "right",
                alignSelf: "center",
              }}
            >
              {meal.macros}
            </div>
          </div>
        ))}
      </div>
    </MemberDashboardShell>
  );
}
