"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

const KPIS = [
  { label: "Active flags", value: "4", delta: "2 high risk", valueColor: "var(--danger)", deltaColor: "var(--danger)" },
  { label: "Under watch", value: "11", delta: "Auto-monitored" },
  { label: "Frozen (30d)", value: "3", delta: "↑ 1 this week", deltaColor: "var(--fg-3)" },
  { label: "False positives", value: "18%", delta: "Industry avg 22%", deltaColor: "var(--signal-ink)" },
];

type Filter = "All" | "High" | "Medium" | "Watch" | "Cleared";

const CASES = [
  { id: "FRD-2026-04841", user: "Reza Mohammadi", uInit: "RM", type: "Refund abuse", signal: "11 refunds in 30d · 79% rate", accounts: 3, amount: "د.إ 3,220", risk: "High" as const, flagged: "2d ago" },
  { id: "FRD-2026-04838", user: "anonymous_519", uInit: "AN", type: "Velocity fraud", signal: "8 accounts, same card last-4", accounts: 8, amount: "₦ 180,000", risk: "High" as const, flagged: "3d ago" },
  { id: "FRD-2026-04835", user: "Jake Martinez", uInit: "JM", type: "Chargeback pattern", signal: "3 chargebacks in 14d", accounts: 1, amount: "R 4,600", risk: "Medium" as const, flagged: "5d ago" },
  { id: "FRD-2026-04831", user: "Priya Patel", uInit: "PP", type: "Credential misuse", signal: "Listing uses revoked cert ID", accounts: 1, amount: "—", risk: "Medium" as const, flagged: "7d ago" },
  { id: "FRD-2026-04828", user: "Marcus Bell", uInit: "MB", type: "Refund abuse", signal: "5 refunds in 21d · 62% rate", accounts: 1, amount: "R 2,100", risk: "Watch" as const, flagged: "10d ago" },
  { id: "FRD-2026-04825", user: "Naledi Phiri", uInit: "NP", type: "IP anomaly", signal: "Login from 4 countries in 48h", accounts: 1, amount: "—", risk: "Watch" as const, flagged: "12d ago" },
  { id: "FRD-2026-04820", user: "Sipho Dlamini", uInit: "SD", type: "Velocity fraud", signal: "4 accounts, same device", accounts: 4, amount: "R 1,800", risk: "Cleared" as const, flagged: "15d ago" },
  { id: "FRD-2026-04818", user: "Chloe Mthembu", uInit: "CM", type: "Promo abuse", signal: "Referral code reuse across 3 emails", accounts: 3, amount: "R 450", risk: "Cleared" as const, flagged: "18d ago" },
];

const FILTERS: { label: Filter; count: string }[] = [
  { label: "All", count: "8" },
  { label: "High", count: "2" },
  { label: "Medium", count: "2" },
  { label: "Watch", count: "2" },
  { label: "Cleared", count: "2" },
];

function RiskBadge({ risk }: { risk: "High" | "Medium" | "Watch" | "Cleared" }) {
  const map: Record<string, { bg: string; color: string }> = {
    High: { bg: "var(--danger-soft)", color: "var(--danger)" },
    Medium: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
    Watch: { bg: "var(--bg-3)", color: "var(--fg-2)" },
    Cleared: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  };
  const s = map[risk];
  return (
    <span className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]" style={{ background: s.bg, color: s.color }}>
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {risk}
    </span>
  );
}

export default function FraudPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = activeFilter === "All" ? CASES : CASES.filter((c) => c.risk === activeFilter);

  return (
    <AdminDashboardShell
      activeItem="Fraud"
      crumb="Fraud"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Export</button>
          <button className="btn-primary-v2">Run scan</button>
        </div>
      }
    >
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Fraud</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Flagged accounts and suspicious activity patterns</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: kpi.valueColor || "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-0 sm:min-w-[280px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search fraud cases..." style={{ color: "var(--ink)" }} readOnly />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: activeFilter === f.label ? "var(--ink)" : "transparent",
                color: activeFilter === f.label ? "var(--bg)" : "var(--fg-3)",
                border: activeFilter === f.label ? "none" : "1px solid var(--border)",
              }}
            >
              {f.label} · {f.count}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--bg-2)", borderBottom: "1px solid var(--border)" }}>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>ID</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>User</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden md:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Type</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Signal</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Linked accts</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Exposure</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Flagged</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Risk</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-bg-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-3.5 py-3 font-mono text-[12px] whitespace-nowrap" style={{ color: "var(--fg-3)" }}>{c.id}</td>
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0" style={{ background: "var(--bg-3)", color: "var(--ink)" }}>{c.uInit}</span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{c.user}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap hidden md:table-cell" style={{ color: "var(--fg-2)" }}>{c.type}</td>
                  <td className="px-3.5 py-3 text-[12px] hidden lg:table-cell" style={{ color: "var(--fg-2)", maxWidth: 220 }}>{c.signal}</td>
                  <td className="px-3.5 py-3 font-mono text-[12px] text-center hidden sm:table-cell" style={{ color: c.accounts > 1 ? "var(--danger)" : "var(--fg-3)" }}>{c.accounts}</td>
                  <td className="px-3.5 py-3 font-mono text-[12px] whitespace-nowrap" style={{ color: "var(--ink)" }}>{c.amount}</td>
                  <td className="px-3.5 py-3 font-mono text-[11px] whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--fg-3)" }}>{c.flagged}</td>
                  <td className="px-3.5 py-3"><RiskBadge risk={c.risk} /></td>
                  <td className="px-3.5 py-3">
                    <Link href={`/admin/fraud/${c.id}`} className="btn-ghost-v2 sm text-[12px]" style={{ padding: "4px 10px" }}>View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminDashboardShell>
  );
}
