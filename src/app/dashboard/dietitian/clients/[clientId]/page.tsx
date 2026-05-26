"use client";

import React from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

const KPIS = [
  { label: "Adherence · 30d", value: "88%", delta: "↑ 6 pts" },
  { label: "Weight · since start", value: "−4.2 kg", delta: "From 78 → 73.8 kg" },
  { label: "HOMA-IR", value: "2.1", delta: "↓ from 3.4 baseline" },
  { label: "Logs · this week", value: "19/21", delta: "3 photo uploads" },
];

const MACROS = [
  { macro: "Kcal", target: "1,650", avg: "1,684 · +2%", trend: "on target", ok: true },
  { macro: "Protein", target: "142 g", avg: "138 g · −3%", trend: "on target", ok: true },
  { macro: "Carbs", target: "160 g", avg: "182 g · +14%", trend: "slightly over", ok: false },
  { macro: "Fat", target: "52 g", avg: "48 g · −8%", trend: "on target", ok: true },
];

const ADHERENCE_BARS = [54,65,59,37,42,49,36,50,72,79,73,51,49,37];

const NOTES = [
  { text: "Carbs creeping up -- likely jollof portions. Will discuss Friday.", time: "Today" },
  { text: "Cycle returned · 32-day length · first time in 14 months.", time: "Week 8" },
  { text: "Bloods retest scheduled wk 16.", time: "Week 4" },
];

function barColor(pct: number) {
  if (pct >= 70) return "var(--signal)";
  if (pct >= 50) return "oklch(0.65 0.18 75)";
  return "var(--danger)";
}

export default function DietitianSingleClientPage({ params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = React.use(params);
  void clientId;

  return (
    <DietitianDashboardShell activeItem="Clients" crumb="Folake Adebayo">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <div className="w-[72px] h-[72px] rounded-(--r-3) flex-shrink-0" style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 300), oklch(0.72 0.06 280))" }} />
        <div className="flex-1">
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Folake Adebayo</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>PCOS protocol &middot; week 12 of 16 &middot; Lagos &middot; joined 18 Feb 2026</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Send plan</button>
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Start consult</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className="text-[24px] font-medium tracking-[-0.02em] tabular-nums mt-1" style={{ color: "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Macro adherence + Notes */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-3.5">
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Macro adherence &middot; last 14 days</h3>

          {/* Adherence bars */}
          <div className="grid gap-1 mb-3.5 h-[80px]" style={{ gridTemplateColumns: "repeat(14, 1fr)" }}>
            {ADHERENCE_BARS.map((pct, i) => (
              <div
                key={i}
                className="rounded-[2px] self-end"
                title={`Day ${i + 1}: ${pct}%`}
                style={{ height: `${pct}%`, background: barColor(pct) }}
              />
            ))}
          </div>

          <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {["Macro", "Target", "7-day avg", "Trend"].map((h) => (
                  <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MACROS.map((m) => (
                <tr key={m.macro} className="hover:bg-[var(--bg-2)]">
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}><strong style={{ color: "var(--ink)" }}>{m.macro}</strong></td>
                  <td className="px-3.5 py-3 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{m.target}</td>
                  <td className="px-3.5 py-3 font-mono" style={{ borderBottom: "1px solid var(--border)" }}>{m.avg}</td>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={m.ok ? { background: "var(--signal-soft)", color: "var(--signal-ink)" } : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }}>{m.trend}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Notes &middot; {NOTES.length}</h3>
          {NOTES.map((n, i) => (
            <div key={i} className="text-[13px] leading-[1.55] py-2" style={{ color: "var(--fg-2)", borderBottom: i < NOTES.length - 1 ? "1px solid var(--border)" : "none" }}>
              &ldquo;{n.text}&rdquo;
              <br />
              <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)" }}>{n.time}</span>
            </div>
          ))}
        </div>
      </div>
    </DietitianDashboardShell>
  );
}
