"use client";

import React from "react";
import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

/**
 * Trainer Single Session — Linda · 21 May
 * Hardcoded to match trainer-single-session.html prototype.
 * Dynamic route params are Promises in Next.js 16 — use React.use(params).
 */

const KPIS = [
  { label: "Top set · back squat", value: "92.5 kg", delta: "↑ PR from 90 kg" },
  { label: "Volume · session", value: "14,820 kg", delta: "Above avg" },
  { label: "RPE · avg", value: "8.2", delta: "On target" },
  { label: "Duration", value: "62 min", delta: "Started 18:02" },
];

const SETS = [
  { exercise: "Back squat", set: "1", weight: "75 kg", reps: "5", rpe: "7" },
  { exercise: "Back squat", set: "2", weight: "82.5 kg", reps: "5", rpe: "7.5" },
  { exercise: "Back squat", set: "3", weight: "87.5 kg", reps: "5", rpe: "8" },
  { exercise: "Back squat", set: "4 · PR", weight: "92.5 kg", reps: "3", rpe: "9" },
  { exercise: "Romanian deadlift", set: "1", weight: "65 kg", reps: "8", rpe: "7" },
  { exercise: "Romanian deadlift", set: "2", weight: "65 kg", reps: "8", rpe: "7.5" },
  { exercise: "Bulgarian split squat", set: "1", weight: "20 kg DB", reps: "10/leg", rpe: "7" },
  { exercise: "Plank · weighted", set: "1", weight: "10 kg", reps: "45 s", rpe: "—" },
];

export default function SingleSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  React.use(params);

  return (
    <TrainerDashboardShell
      activeItem="Calendar"
      crumb="Calendar"
      actions={<><button className="btn-ghost-v2 sm">Reschedule</button><button className="btn-primary-v2 sm">Open client</button></>}
    >
      {/* Breadcrumb override */}
      <div className="text-[13px] -mt-2 mb-1" style={{ color: "var(--fg-3)" }}>
        <Link href="/dashboard/trainer/sessions" className="hover:underline" style={{ color: "var(--fg-3)", textDecoration: "none" }}>Sessions log</Link>
        <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
        <span className="font-medium" style={{ color: "var(--ink)" }}>Linda · 21 May</span>
      </div>

      {/* Page head */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-2">
        <div>
          <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>Session &middot; Linda Mokoena</h1>
          <p className="text-[13.5px] mt-1.5 flex items-center gap-2" style={{ color: "var(--fg-3)" }}>
            Wed 21 May &middot; 18:00–19:00 &middot; Sea Point &middot; 1-on-1 &middot;{" "}
            <span className="inline-flex font-mono text-[10px] px-2 py-[2px] rounded-full uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>Completed</span>
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Sets table + Coach notes — 2fr 1fr */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Sets logged */}
        <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <div className="px-5.5 py-4">
            <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Sets logged</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13.5px] min-w-[500px]">
              <thead>
                <tr>
                  {["Exercise", "Set", "Weight", "Reps", "RPE"].map((h) => (
                    <th key={h} className="text-left font-medium font-mono text-[10.5px] uppercase tracking-[0.04em] px-3.5 py-2.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SETS.map((s, idx) => (
                  <tr key={`${s.exercise}-${s.set}`} className="hover:bg-bg-2">
                    <td className="px-3.5 py-3" style={{ borderBottom: idx < SETS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}><strong className="font-medium">{s.exercise}</strong></td>
                    <td className="px-3.5 py-3" style={{ borderBottom: idx < SETS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{s.set}</td>
                    <td className="px-3.5 py-3 font-mono" style={{ borderBottom: idx < SETS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.weight}</td>
                    <td className="px-3.5 py-3 font-mono" style={{ borderBottom: idx < SETS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.reps}</td>
                    <td className="px-3.5 py-3 font-mono" style={{ borderBottom: idx < SETS.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.rpe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Coach notes + Next session */}
        <div className="flex flex-col gap-3.5">
          {/* Coach notes */}
          <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Coach notes</h3>
            <p className="text-[13px] leading-relaxed mb-3" style={{ color: "var(--fg-2)" }}>
              &ldquo;PR day — Linda hit 92.5 squat clean. Energy good, sleep noted 8h. Form started to break on rep 4 of working set, called it. Schedule deload week 9.&rdquo;
            </p>
            <button className="btn-ghost-v2 sm">Edit note</button>
          </div>

          {/* Next session */}
          <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Next session</h3>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
              <strong className="font-medium" style={{ color: "var(--ink)" }}>Mon 26 May · 18:00</strong><br />
              Upper body &middot; pause bench focus.
            </p>
          </div>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
