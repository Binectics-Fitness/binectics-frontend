"use client";

import { useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";

/* ─── Data ──────────────────────────────────────────────── */

const KPIS = [
  { label: "Today's consults", value: "4", delta: "2 remaining" },
  { label: "This week", value: "18", delta: "↑ 12% vs last week" },
  { label: "Completed", value: "1,042", delta: "All time" },
  { label: "No-shows", value: "2.1", unit: "%", delta: "Below benchmark", deltaColor: "var(--signal-ink)" },
];

type Filter = "Upcoming" | "Past" | "Cancelled";

const CONSULTATIONS = [
  { id: "cn1", client: "Linda Mokoena", initials: "LM", date: "May 26, 09:00", type: "Follow-up" as const, duration: "30 min", status: "Upcoming" as const },
  { id: "cn2", client: "Thabo Nkosi", initials: "TN", date: "May 26, 10:00", type: "Initial" as const, duration: "60 min", status: "Upcoming" as const },
  { id: "cn3", client: "Aisha Ogundimu", initials: "AO", date: "May 26, 14:00", type: "Review" as const, duration: "45 min", status: "Upcoming" as const },
  { id: "cn4", client: "Naledi Phiri", initials: "NP", date: "May 27, 09:30", type: "Follow-up" as const, duration: "30 min", status: "Upcoming" as const },
  { id: "cn5", client: "Jessica Smith", initials: "JS", date: "May 23, 11:00", type: "Follow-up" as const, duration: "30 min", status: "Past" as const },
  { id: "cn6", client: "David Kim", initials: "DK", date: "May 22, 15:00", type: "Initial" as const, duration: "60 min", status: "Past" as const },
  { id: "cn7", client: "Ryan Botha", initials: "RB", date: "May 21, 10:00", type: "Review" as const, duration: "45 min", status: "Cancelled" as const },
  { id: "cn8", client: "Chloe Mthembu", initials: "CM", date: "May 20, 09:00", type: "Follow-up" as const, duration: "30 min", status: "Past" as const },
];

const FILTERS: { label: Filter; count: string }[] = [
  { label: "Upcoming", count: "4" },
  { label: "Past", count: "3" },
  { label: "Cancelled", count: "1" },
];

/* ─── Helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "Upcoming" | "Past" | "Cancelled" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Upcoming: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    Past: { bg: "var(--bg-3)", color: "var(--fg-2)" },
    Cancelled: { bg: "var(--danger-soft)", color: "var(--danger)" },
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

function TypePill({ type }: { type: "Initial" | "Follow-up" | "Review" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Initial: { bg: "var(--dietitian-soft)", color: "var(--dietitian)" },
    "Follow-up": { bg: "var(--bg-2)", color: "var(--fg-2)" },
    Review: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
  };
  const s = map[type];
  return (
    <span
      className="font-mono text-[9.5px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]"
      style={{ background: s.bg, color: s.color }}
    >
      {type}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function DietitianConsultationsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("Upcoming");

  const filtered = CONSULTATIONS.filter((c) => c.status === activeFilter);

  return (
    <DietitianDashboardShell activeItem="Consultations" crumb="Consultations">
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Consultations
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Manage your consultation schedule and history
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
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[240px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search by client name..." style={{ color: "var(--ink)" }} readOnly />
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
                {["Client", "Date / time", "Type", "Duration", "Status"].map((h) => (
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
                    <div className="flex gap-2.5 items-center">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--dietitian-soft)", color: "var(--dietitian)" }}>
                        {c.initials}
                      </span>
                      <span className="font-medium" style={{ color: "var(--ink)" }}>{c.client}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{c.date}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <TypePill type={c.type} />
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{c.duration}</span>
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
    </DietitianDashboardShell>
  );
}
