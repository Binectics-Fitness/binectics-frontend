"use client";

import React from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const KPIS = [
  { label: "Plan", value: "Studio · 24-pack", delta: "14 / 24 used", small: true },
  { label: "Streak", value: "32 days", delta: "Personal best" },
  { label: "LTV", value: "R 18,400", delta: "Top 12% of members" },
  { label: "Last visit", value: "14:42 today", delta: "Sea Point · QR", small: true },
];

const ACTIVITY_COLORS = [
  0.9,0.5,0.5,0.65,0.9,0.65,0.65,0.5,0.5,0.8,0.9,0.65,0.9,0.65,0.5,0.65,0.9,0.5,0.9,0.65,0.5,0.8,0.8,0.5,0.5,0.5,0.8,0.8,0.65,0.65,
];

const RECENT_ACTIVITY = [
  { date: "Today 14:42", what: "QR check-in", location: "Sea Point" },
  { date: "Yesterday 17:00", what: "Strength class", location: "Sea Point" },
  { date: "23 May 06:00", what: "Open gym", location: "Sea Point" },
  { date: "22 May 17:00", what: "Strength class", location: "Foreshore" },
  { date: "21 May 18:00", what: "1-on-1 with Sarah", location: "Sea Point" },
];

const NOTES = [
  { text: "Targeting a half-marathon in October. Building strength alongside running.", author: "Sarah", date: "14 May" },
  { text: "Mild lower back tightness. Avoid heavy deadlifts for 2 weeks.", author: "Sarah", date: "2 May" },
  { text: "Loves Olympic lifting. Suggested Themba's class.", author: "Lerato", date: "22 Mar" },
];

export default function GymSingleMemberPage({ params }: { params: Promise<{ memberId: string }> }) {
  const { memberId } = React.use(params);
  void memberId;

  return (
    <GymDashboardShell activeItem="Members" crumb="Linda Mokoena">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-(--r-3) flex-shrink-0" style={{ background: "linear-gradient(135deg, oklch(0.85 0.04 80), oklch(0.72 0.06 60))" }} />
        <div className="flex-1">
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Linda Mokoena</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>linda@email.com &middot; joined 18 Mar 2025 &middot; Cape Town</p>
        </div>
        <div className="flex gap-2">
          <button className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Message</button>
          <button className="min-h-11 px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Edit plan</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium tracking-[-0.02em] tabular-nums mt-1 ${k.small ? "text-[18px]" : "text-[24px]"}`} style={{ color: "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Activity + Notes */}
      <div className="grid lg:grid-cols-[2fr_1fr] gap-3.5">
        {/* Activity */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Activity &middot; last 30 days</h3>

          {/* Activity grid */}
          <div className="overflow-x-auto mb-3.5">
            <div className="grid gap-[3px] min-w-[560px]" style={{ gridTemplateColumns: "repeat(30, 1fr)" }}>
              {ACTIVITY_COLORS.map((c, i) => {
                const chroma = c < 0.6 ? 0.18 : c < 0.75 ? 0.12 : c < 0.85 ? 0.6 : 0.2;
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-[2px]"
                    title={`Day ${i + 1}`}
                    style={{ background: `oklch(${c} ${chroma} 148)` }}
                  />
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {["Date", "What", "Location"].map((h) => (
                    <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RECENT_ACTIVITY.map((a, i) => (
                  <tr key={i} className="hover:bg-[var(--bg-2)]">
                    <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{a.date}</td>
                    <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{a.what}</td>
                    <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{a.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Notes &middot; 3</h3>
          {NOTES.map((n, i) => (
            <div key={i} className="text-[13px] leading-[1.55] py-2" style={{ color: "var(--fg-2)", borderBottom: i < NOTES.length - 1 ? "1px solid var(--border)" : "none" }}>
              &ldquo;{n.text}&rdquo;
              <br />
              <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)" }}>{n.author} &middot; {n.date}</span>
            </div>
          ))}
        </div>
      </div>
    </GymDashboardShell>
  );
}
