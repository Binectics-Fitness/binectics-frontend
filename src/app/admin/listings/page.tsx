"use client";

import { useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { ApproveListingModal } from "@/components/ds/modals/ApproveListingModal";
import { RejectListingModal } from "@/components/ds/modals/RejectListingModal";

/* ─── Data ──────────────────────────────────────────────── */

const KPIS = [
  { label: "Pending review", value: "38", delta: "12 high priority", valueColor: "var(--danger)", deltaColor: "var(--danger)" },
  { label: "Approved today", value: "14", delta: "↑ 6% vs yesterday" },
  { label: "Rejected", value: "7", delta: "Last 7 days", deltaColor: "var(--fg-3)" },
  { label: "Avg review time", value: "2.4", unit: "hrs", delta: "Within SLA" },
];

type Filter = "All" | "Pending" | "Approved" | "Rejected" | "Flagged";

const LISTINGS = [
  { id: "LST_001", provider: "Iron Lab", initials: "IL", type: "Gym" as const, submitted: "May 24", country: "ZA", status: "Pending" as const },
  { id: "LST_002", provider: "Sarah Okafor", initials: "SO", type: "Trainer" as const, submitted: "May 24", country: "ZA", status: "Pending" as const },
  { id: "LST_003", provider: "FitZone Lagos", initials: "FZ", type: "Gym" as const, submitted: "May 23", country: "NG", status: "Approved" as const },
  { id: "LST_004", provider: "Dr. Nadia Hassan", initials: "NH", type: "Dietitian" as const, submitted: "May 23", country: "NG", status: "Pending" as const },
  { id: "LST_005", provider: "Peak Performance", initials: "PP", type: "Gym" as const, submitted: "May 22", country: "GB", status: "Flagged" as const },
  { id: "LST_006", provider: "Reza Mahmoud", initials: "RM", type: "Trainer" as const, submitted: "May 22", country: "AE", status: "Rejected" as const },
  { id: "LST_007", provider: "Wellness Hub", initials: "WH", type: "Gym" as const, submitted: "May 21", country: "IN", status: "Approved" as const },
  { id: "LST_008", provider: "Aisha Diallo", initials: "AD", type: "Dietitian" as const, submitted: "May 21", country: "GH", status: "Pending" as const },
];

const FILTERS: { label: Filter; count: string }[] = [
  { label: "All", count: "38" },
  { label: "Pending", count: "22" },
  { label: "Approved", count: "8" },
  { label: "Rejected", count: "5" },
  { label: "Flagged", count: "3" },
];

/* ─── Helpers ────────────────────────────────────────────── */

function StatusBadge({ status }: { status: "Pending" | "Approved" | "Rejected" | "Flagged" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Pending: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
    Approved: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
    Rejected: { bg: "var(--danger-soft)", color: "var(--danger)" },
    Flagged: { bg: "var(--danger-soft)", color: "var(--danger)" },
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

function TypePill({ type }: { type: "Gym" | "Trainer" | "Dietitian" }) {
  const map: Record<string, { bg: string; color: string }> = {
    Gym: { bg: "var(--gym-soft)", color: "var(--gym)" },
    Trainer: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
    Dietitian: { bg: "var(--dietitian-soft)", color: "var(--dietitian)" },
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

export default function AdminListingsPage() {
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null);

  const filtered = activeFilter === "All"
    ? LISTINGS
    : LISTINGS.filter((l) => l.status === activeFilter);

  return (
    <AdminDashboardShell
      activeItem="Listings"
      crumb="Listings"
      actions={
        <div className="flex items-center gap-2">
          <button className="btn-ghost-v2">Export</button>
          <button className="btn-primary-v2">Review next</button>
        </div>
      }
    >
      {/* Heading */}
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Listings
        </h1>
        <p className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          Moderation queue for new and updated provider listings
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPIS.map((kpi) => (
          <div key={kpi.label} className="rounded-(--r-3) p-[14px_16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
            <div className="text-[22px] font-medium mt-1" style={{ color: kpi.valueColor || "var(--ink)", letterSpacing: "-0.018em", fontVariantNumeric: "tabular-nums" }}>
              {kpi.value}{kpi.unit && <span className="font-mono text-[12px] font-normal ml-1" style={{ color: "var(--fg-3)" }}>{kpi.unit}</span>}
            </div>
            <div className="font-mono text-[11px] mt-1" style={{ color: kpi.deltaColor || "var(--signal-ink)" }}>{kpi.delta}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="rounded-(--r-3) p-[10px_14px] flex gap-3.5 items-center flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex-1 min-w-[280px] flex items-center gap-2 h-8 px-3 rounded-(--r-2)" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--fg-3)" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input className="flex-1 border-0 bg-transparent text-[13px] outline-none" placeholder="Search by provider name or LST_ID..." style={{ color: "var(--ink)" }} readOnly />
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
                {["Provider", "Type", "Submitted", "Country", "Status", "Actions"].map((h) => (
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
              {filtered.map((l) => (
                <tr key={l.id} className="hover:bg-[var(--bg-2)] cursor-pointer">
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex gap-2.5 items-center">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
                        {l.initials}
                      </span>
                      <div>
                        <div className="font-medium" style={{ color: "var(--ink)" }}>{l.provider}</div>
                        <div className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{l.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <TypePill type={l.type} />
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-2)" }}>{l.submitted}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <span className="font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{l.country}</span>
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="py-3 px-4.5" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex gap-1.5">
                      <button onClick={() => setApproveTarget({ id: l.id, name: l.provider })} className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1) cursor-pointer" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)", border: "none" }}>Approve</button>
                      <button onClick={() => setRejectTarget({ id: l.id, name: l.provider })} className="font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1) cursor-pointer" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "none" }}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ApproveListingModal
        open={approveTarget !== null}
        onClose={() => setApproveTarget(null)}
        listingName={approveTarget?.name}
      />
      <RejectListingModal
        open={rejectTarget !== null}
        onClose={() => setRejectTarget(null)}
        listingName={rejectTarget?.name}
      />
    </AdminDashboardShell>
  );
}
