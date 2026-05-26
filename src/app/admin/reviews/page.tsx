"use client";

import { useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";

/* ─── Data ──────────────────────────────────────────────── */

const KPIS = [
  { label: "Flagged", value: "12", delta: "3 high priority", valueColor: "var(--danger)", deltaColor: "var(--danger)" },
  { label: "Auto-moderated", value: "84", delta: "Last 7 days", deltaColor: "var(--fg-3)" },
  { label: "Pending", value: "9", delta: "Avg 1.8 hrs wait" },
  { label: "Resolved today", value: "6", delta: "↑ 20% vs yesterday" },
];

type Filter = "All" | "Flagged" | "Auto-held" | "Resolved";

const REVIEWS = [
  { id: "RVW_001", reviewer: "Tunde Adebayo", rInitials: "TA", provider: "Iron Lab", rating: 1, flags: "Offensive language", date: "May 25", status: "Flagged" as const },
  { id: "RVW_002", reviewer: "Naledi Phiri", rInitials: "NP", provider: "Sarah Okafor", rating: 2, flags: "Suspected fake", date: "May 25", status: "Flagged" as const },
  { id: "RVW_003", reviewer: "anonymous_412", rInitials: "AN", provider: "FitZone Lagos", rating: 1, flags: "Spam content", date: "May 24", status: "Auto-held" as const },
  { id: "RVW_004", reviewer: "David Kim", rInitials: "DK", provider: "Peak Performance", rating: 3, flags: "Competitor mention", date: "May 24", status: "Flagged" as const },
  { id: "RVW_005", reviewer: "Jessica Smith", rInitials: "JS", provider: "Dr. Nadia Hassan", rating: 5, flags: "Incentivized", date: "May 23", status: "Auto-held" as const },
  { id: "RVW_006", reviewer: "Ryan Botha", rInitials: "RB", provider: "Wellness Hub", rating: 1, flags: "Personal attack", date: "May 23", status: "Resolved" as const },
  { id: "RVW_007", reviewer: "Aisha Ogundimu", rInitials: "AO", provider: "Reza Mahmoud", rating: 4, flags: "Duplicate", date: "May 22", status: "Resolved" as const },
  { id: "RVW_008", reviewer: "Chloe Mthembu", rInitials: "CM", provider: "Iron Lab", rating: 2, flags: "Misleading", date: "May 22", status: "Flagged" as const },
];

const FILTERS: { label: Filter; count: string }[] = [
  { label: "All", count: "12" },
  { label: "Flagged", count: "5" },
  { label: "Auto-held", count: "4" },
  { label: "Resolved", count: "3" },
];

/* ─── Helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "Flagged" | "Auto-held" | "Resolved" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Flagged: { bg: "var(--danger-soft)", color: "var(--danger)" },
    "Auto-held": { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
    Resolved: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
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

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width="12" height="12" viewBox="0 0 24 24" fill={n <= rating ? "var(--trainer)" : "none"} stroke={n <= rating ? "var(--trainer)" : "var(--fg-4)"} strokeWidth="1.5">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────── */

export default function AdminReviewsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");

  const filtered = activeFilter === "All"
    ? REVIEWS
    : REVIEWS.filter((r) => r.status === activeFilter);

  return (
    <AdminDashboardShell
      activeItem="Reviews"
      crumb="Reviews"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Export</button>
          <button className="btn-primary-v2">Bulk resolve</button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Reviews
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Flagged and auto-moderated reviews requiring manual action
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: kpi.valueColor || "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[280px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search by reviewer, provider, or RVW_ID..." style={{ color: "var(--ink)" }} readOnly />
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
                {["Reviewer", "Provider", "Rating", "Flags", "Date", "Status"].map((h) => (
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
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--bg-2)] cursor-pointer">
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex gap-2.5 items-center">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
                        {r.rInitials}
                      </span>
                      <div>
                        <div className="font-medium" style={{ color: "var(--ink)" }}>{r.reviewer}</div>
                        <div className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{r.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>{r.provider}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <RatingStars rating={r.rating} />
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11px] px-1.5 py-[2px] rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>{r.flags}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{r.date}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StatusBadge status={r.status} />
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
