"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

const KPIS = [
  { label: "Open", value: "7", delta: "3 past SLA", valueColor: "var(--danger)", deltaColor: "var(--danger)" },
  { label: "Avg resolution", value: "18h", delta: "↓ 2h vs last week", deltaColor: "var(--signal-ink)" },
  { label: "Escalated", value: "2", delta: "Awaiting legal" },
  { label: "Resolved (30d)", value: "34", delta: "89% satisfaction" },
];

type Filter = "All" | "Open" | "Escalated" | "Resolved";

const DISPUTES = [
  { id: "DSP-2401", member: "Pier Botha", mInit: "PB", provider: "Iron Lab", amount: "R 1,200", reason: "Cancelled session refund", sla: "1h 12m", opened: "32h ago", status: "Open" as const },
  { id: "DSP-2399", member: "Tunde Adebayo", mInit: "TA", provider: "Sarah Okafor", amount: "₦ 45,000", reason: "Service not as described", sla: "3h 40m", opened: "2d ago", status: "Open" as const },
  { id: "DSP-2397", member: "Chloe Mthembu", mInit: "CM", provider: "Peak Performance", amount: "R 800", reason: "Double-charged", sla: "Overdue", opened: "4d ago", status: "Escalated" as const },
  { id: "DSP-2395", member: "David Kim", mInit: "DK", provider: "FitZone Lagos", amount: "₦ 32,000", reason: "Trainer no-show", sla: "Overdue", opened: "5d ago", status: "Escalated" as const },
  { id: "DSP-2394", member: "Ryan Botha", mInit: "RB", provider: "Wellness Hub", amount: "R 600", reason: "Plan downgrade refund", sla: "—", opened: "6d ago", status: "Open" as const },
  { id: "DSP-2392", member: "Naledi Phiri", mInit: "NP", provider: "Iron Lab", amount: "R 1,800", reason: "Facility closure", sla: "—", opened: "7d ago", status: "Open" as const },
  { id: "DSP-2390", member: "Aisha Ogundimu", mInit: "AO", provider: "Marcus Bell", amount: "₦ 28,000", reason: "Cancelled session refund", sla: "—", opened: "8d ago", status: "Resolved" as const },
  { id: "DSP-2388", member: "Jessica Smith", mInit: "JS", provider: "Dr. Nadia Hassan", amount: "د.إ 340", reason: "Meal plan not delivered", sla: "—", opened: "10d ago", status: "Resolved" as const },
  { id: "DSP-2385", member: "Sipho Dlamini", mInit: "SD", provider: "Peak Performance", amount: "R 2,400", reason: "Service not as described", sla: "—", opened: "12d ago", status: "Resolved" as const },
];

const FILTERS: { label: Filter; count: string }[] = [
  { label: "All", count: "9" },
  { label: "Open", count: "4" },
  { label: "Escalated", count: "2" },
  { label: "Resolved", count: "3" },
];

function StatusBadge({ status }: { status: "Open" | "Escalated" | "Resolved" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Open: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
    Escalated: { bg: "var(--danger-soft)", color: "var(--danger)" },
    Resolved: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  };
  const s = map[status];
  return (
    <span className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]" style={{ background: s.bg, color: s.color }}>
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {status}
    </span>
  );
}

export default function DisputesPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = activeFilter === "All" ? DISPUTES : DISPUTES.filter((d) => d.status === activeFilter);

  return (
    <AdminDashboardShell
      activeItem="Disputes"
      crumb="Disputes"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Export</button>
          <button className="btn-primary-v2">Bulk resolve</button>
        </div>
      }
    >
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Disputes</h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Payment and service disputes requiring admin resolution</p>
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
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search disputes..." style={{ color: "var(--ink)" }} readOnly />
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
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Member</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden md:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Provider</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Reason</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Amount</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden sm:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>SLA</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Opened</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}>Status</th>
                <th className="font-mono text-[10.5px] uppercase tracking-[0.04em] text-left px-3.5 py-2.5 whitespace-nowrap" style={{ color: "var(--fg-3)", fontWeight: 400 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-bg-2" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-3.5 py-3 font-mono text-[12px] whitespace-nowrap" style={{ color: "var(--fg-3)" }}>{d.id}</td>
                  <td className="px-3.5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium shrink-0" style={{ background: "var(--bg-3)", color: "var(--ink)" }}>{d.mInit}</span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{d.member}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 whitespace-nowrap hidden md:table-cell" style={{ color: "var(--fg-2)" }}>{d.provider}</td>
                  <td className="px-3.5 py-3 hidden lg:table-cell" style={{ color: "var(--fg-2)", maxWidth: 200 }}>{d.reason}</td>
                  <td className="px-3.5 py-3 font-mono text-[12px] whitespace-nowrap" style={{ color: "var(--ink)" }}>{d.amount}</td>
                  <td className="px-3.5 py-3 font-mono text-[11px] whitespace-nowrap hidden sm:table-cell" style={{ color: d.sla === "Overdue" ? "var(--danger)" : "var(--fg-3)" }}>{d.sla}</td>
                  <td className="px-3.5 py-3 font-mono text-[11px] whitespace-nowrap hidden lg:table-cell" style={{ color: "var(--fg-3)" }}>{d.opened}</td>
                  <td className="px-3.5 py-3"><StatusBadge status={d.status} /></td>
                  <td className="px-3.5 py-3">
                    <Link href={`/admin/disputes/${d.id}`} className="btn-ghost-v2 sm text-[12px]" style={{ padding: "4px 10px" }}>View</Link>
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
