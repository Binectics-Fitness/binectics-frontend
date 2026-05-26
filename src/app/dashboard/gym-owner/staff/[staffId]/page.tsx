"use client";

import React from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";

const KPIS = [
  { label: "Classes this week", value: "12", delta: "82% utilization" },
  { label: "Member rating", value: "4.9", delta: "142 reviews" },
  { label: "Payout · MTD", value: "R 22,400", delta: "Next Tue" },
  { label: "Cert renewal", value: "14 Jun 2026", delta: "21 days · USAW L2", warn: true, small: true },
];

const ROLE_ROWS = [
  { key: "Role", value: "Coach · senior" },
  { key: "Locations", value: "Sea Point · Foreshore" },
  { key: "Classes", value: "Olympic · Strength · Mobility" },
  { key: "1-on-1", value: "Yes · R 1,200 / session" },
  { key: "Payroll", value: "Contractor · monthly" },
  { key: "Permissions", value: "Schedule own · view members · message clients" },
];

const CERTS = [
  { name: "USAW Level 2", field: "Olympic weightlifting", status: "Renews 14 Jun", warn: true },
  { name: "NSCA-CSCS", field: "Strength & conditioning", status: "Valid · 2028", warn: false },
  { name: "CPR + First Aid", field: "Resuscitation Council SA", status: "Valid · 2027", warn: false },
];

export default function GymSingleStaffPage({ params }: { params: Promise<{ staffId: string }> }) {
  const { staffId } = React.use(params);
  void staffId;

  return (
    <GymDashboardShell activeItem="Staff" crumb="Themba Mokoena">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row gap-4.5 items-start sm:items-center">
        <div className="w-[72px] h-[72px] rounded-(--r-3) flex-shrink-0" style={{ background: "linear-gradient(135deg, oklch(0.85 0.05 60), oklch(0.72 0.08 40))" }} />
        <div className="flex-1">
          <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Themba Mokoena</h1>
          <p className="text-[13.5px] mt-1" style={{ color: "var(--fg-3)" }}>Olympic specialist &middot; joined 18 Aug 2024 &middot; contractor</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] cursor-pointer" style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--ink)" }}>Message</button>
          <button className="px-3.5 py-2 rounded-(--r-2) text-[13px] font-medium cursor-pointer" style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}>Edit role</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {KPIS.map((k) => (
          <div key={k.label} className="rounded-(--r-3) p-3.5 px-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium tracking-[-0.02em] tabular-nums mt-1 ${k.small ? "text-[18px]" : "text-[24px]"}`} style={{ color: k.warn ? "oklch(0.45 0.16 75)" : "var(--ink)" }}>{k.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: k.warn ? "oklch(0.45 0.16 75)" : "var(--signal-ink)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Role & Scope + Certifications */}
      <div className="grid lg:grid-cols-2 gap-3.5">
        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Role &amp; scope</h3>
          <table className="w-full border-collapse text-[13.5px]">
            <tbody>
              {ROLE_ROWS.map((r) => (
                <tr key={r.key}>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}><strong style={{ color: "var(--ink)" }}>{r.key}</strong></td>
                  <td className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Certifications &middot; 3</h3>
          <div className="flex flex-col gap-2.5">
            {CERTS.map((c) => (
              <div key={c.name} className="flex justify-between items-center p-2.5 px-3.5 rounded-(--r-2)" style={{ background: "var(--bg-2)" }}>
                <div>
                  <strong className="text-[13.5px]" style={{ color: "var(--ink)" }}>{c.name}</strong>
                  <br />
                  <span className="font-mono text-[10.5px] uppercase" style={{ color: "var(--fg-3)" }}>{c.field}</span>
                </div>
                <span
                  className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]"
                  style={c.warn
                    ? { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }
                    : { background: "var(--signal-soft)", color: "var(--signal-ink)" }
                  }
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GymDashboardShell>
  );
}
