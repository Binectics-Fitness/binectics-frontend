"use client";

import { useState } from "react";
import Link from "next/link";
import { TrainerDashboardShell } from "@/components/ds/TrainerDashboardShell";

/* ─── Data ──────────────────────────────────────────────── */

const KPIS = [
  { label: "Active clients", value: "42", delta: "+ 3 this month" },
  { label: "Total sessions", value: "1,248", delta: "↑ 8% MoM" },
  { label: "Avg retention", value: "7.4", unit: "mo", delta: "Above benchmark" },
  { label: "Client NPS", value: "72", delta: "Excellent" },
];

type Filter = "All" | "Active" | "Paused" | "Completed";

const CLIENTS = [
  { id: "c1", initials: "LM", name: "Linda Mokoena", package: "Studio 24-pack", sessions: 14, total: 24, next: "May 27, 08:00", status: "Active" as const },
  { id: "c2", initials: "TN", name: "Thabo Nkosi", package: "Online monthly", sessions: 8, total: 12, next: "May 26, 17:30", status: "Active" as const },
  { id: "c3", initials: "JS", name: "Jessica Smith", package: "Studio 12-pack", sessions: 12, total: 12, next: "-", status: "Completed" as const },
  { id: "c4", initials: "AO", name: "Aisha Ogundimu", package: "Studio 24-pack", sessions: 18, total: 24, next: "May 28, 07:00", status: "Active" as const },
  { id: "c5", initials: "RB", name: "Ryan Botha", package: "Online monthly", sessions: 4, total: 12, next: "-", status: "Paused" as const },
  { id: "c6", initials: "NP", name: "Naledi Phiri", package: "Studio 12-pack", sessions: 9, total: 12, next: "May 29, 09:00", status: "Active" as const },
  { id: "c7", initials: "DK", name: "David Kim", package: "Online monthly", sessions: 6, total: 12, next: "-", status: "Paused" as const },
  { id: "c8", initials: "CM", name: "Chloe Mthembu", package: "Studio 24-pack", sessions: 22, total: 24, next: "May 30, 08:00", status: "Active" as const },
];

const FILTERS: { label: Filter; count: string }[] = [
  { label: "All", count: "42" },
  { label: "Active", count: "34" },
  { label: "Paused", count: "5" },
  { label: "Completed", count: "3" },
];

/* ─── Helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "Active" | "Paused" | "Completed" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Active: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    Paused: { bg: "var(--bg-2)", color: "var(--fg-3)" },
    Completed: { bg: "var(--bg-3)", color: "var(--fg-2)" },
  };
  const s = map[status];
  return (
    <span
      className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {status}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function TrainerClientsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = activeFilter === "All"
    ? CLIENTS
    : CLIENTS.filter((c) => c.status === activeFilter);

  return (
    <TrainerDashboardShell activeItem="Clients" crumb="Clients">
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Clients
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          42 total clients across all packages
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>
              {kpi.value}{kpi.unit && <span className="font-mono text-[12px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{kpi.unit}</span>}
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[240px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search clients..." style={{ color: "var(--ink)" }} readOnly />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.label}
              onClick={() => setActiveFilter(f.label)}
              className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-[5px] rounded-full cursor-pointer"
              style={{
                background: activeFilter === f.label ? "var(--ink)" : "var(--bg)",
                color: activeFilter === f.label ? "var(--bg)" : "var(--fg-3)",
                border: activeFilter === f.label ? "1px solid var(--ink)" : "1px solid var(--border)",
              }}
            >
              {f.label} <span style={{ color: activeFilter === f.label ? "oklch(0.75 0.005 85)" : "var(--fg-4)", marginLeft: 4 }}>{f.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Package", "Sessions", "Next session", "Status"].map((h) => (
                  <th
                    key={h}
                    className="font-mono text-[10.5px] uppercase tracking-[0.04em] py-2.5 px-4.5 text-left"
                    style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)", fontWeight: 500 }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--bg-2)] cursor-pointer">
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <Link href={`/dashboard/trainer/clients/${c.id}`} className="flex gap-2.5 items-center no-underline" style={{ color: "inherit" }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
                        {c.initials}
                      </span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{c.name}</span>
                    </Link>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>{c.package}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[12px] tabular-nums" style={{ color: "var(--ink)" }}>{c.sessions} / {c.total}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: c.next === "-" ? "var(--fg-4)" : "var(--fg-2)" }}>{c.next}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </TrainerDashboardShell>
  );
}
