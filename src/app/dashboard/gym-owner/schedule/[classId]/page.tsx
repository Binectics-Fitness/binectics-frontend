"use client";

import React from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const KPIS = [
  { label: "Booked", value: "12/14", delta: "2 spots left" },
  { label: "Waitlist", value: "3", delta: "Auto-promote on" },
  { label: "No-shows · last 4 weeks", value: "5%", delta: "↓ vs avg" },
  { label: "Revenue · per class", value: "R 980", delta: "↑ R 80 MoM" },
];

const ROSTER = [
  { name: "Linda Mokoena", plan: "Pro", streak: "32d", last4: "4/4", status: "on track" },
  { name: "Wei Chen", plan: "Studio", streak: "22d", last4: "3/4", status: "on track" },
  { name: "Sarah Okafor", plan: "Pro", streak: "8d", last4: "2/4", status: "on track" },
  { name: "Aman R.", plan: "24-pack", streak: "18d", last4: "4/4", status: "on track" },
  { name: "Folake A.", plan: "Pro", streak: "38d", last4: "4/4", status: "on track" },
  { name: "Mike K.", plan: "Studio", streak: "0d", last4: "1/4", status: "at risk" },
  { name: "Rashid J.", plan: "Studio", streak: "52d", last4: "4/4", status: "on track" },
  { name: "Camilla L.", plan: "Pro", streak: "14d", last4: "3/4", status: "on track" },
  { name: "Bisi O.", plan: "Day pass", streak: "2d", last4: "1/4", status: "at risk" },
  { name: "Themba D.", plan: "Pro", streak: "28d", last4: "4/4", status: "on track" },
  { name: "Nadia H.", plan: "Studio", streak: "11d", last4: "3/4", status: "on track" },
  { name: "Coach K.", plan: "Staff", streak: "—", last4: "4/4", status: "on track" },
];

const WAITLIST = [
  { name: "Nthabiseng K.", time: "Joined 9:18 yesterday" },
  { name: "Olu B.", time: "Joined 10:42 yesterday" },
  { name: "Reza M.", time: "Joined 14:08 today" },
];

export default function GymClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = React.use(params);
  void classId;

  return (
    <GymDashboardShell
      activeItem="Schedule"
      crumb="Strength · Wed 06:00"
      actions={
        <div className="flex gap-2">
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Cancel class</button>
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Edit class</button>
        </div>
      }
    >
      {/* Header */}
      <div>
        <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Strength &middot; Wed 06:00</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>60 min &middot; Sea Point &middot; capacity 14 &middot; coached by <strong style={{ color: "var(--ink)" }}>Themba M.</strong></p>
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

      {/* Roster table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 py-4">
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Roster &middot; 12 confirmed</h3>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13.5px]">
          <thead>
            <tr>
              {["Member", "Plan", "Streak", "Last 4 weeks", "Status"].map((h) => (
                <th key={h} className="text-left px-3.5 py-2.5 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROSTER.map((r) => (
              <tr key={r.name} className="hover:bg-[var(--bg-2)]">
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}><strong style={{ color: "var(--ink)" }}>{r.name}</strong></td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.plan}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.streak}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.last4}</td>
                <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                  <span
                    className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]"
                    style={r.status === "on track"
                      ? { background: "var(--signal-soft)", color: "var(--signal-ink)" }
                      : { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }
                    }
                  >
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* Waitlist + Recurrence */}
      <div className="grid lg:grid-cols-2 gap-3.5">
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Waitlist &middot; 3</h3>
          <div className="flex flex-col gap-2.5">
            {WAITLIST.map((w) => (
              <div key={w.name} className="flex justify-between items-center">
                <strong className="text-[13.5px]" style={{ color: "var(--ink)" }}>{w.name}</strong>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{w.time}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Recurrence</h3>
          <p className="text-[13.5px] mb-3.5" style={{ color: "var(--fg-2)" }}>
            Every Mon &middot; Wed &middot; Fri at 06:00 from 20 Jan onwards. 3 weeks ahead are auto-created.
          </p>
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Edit recurrence</button>
        </div>
      </div>
    </GymDashboardShell>
  );
}
