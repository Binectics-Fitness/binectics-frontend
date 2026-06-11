"use client";

import { useEffect, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddMemberButton } from "./_actions";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MembershipSubscriptionStatus,
  type MembershipSubscription,
} from "@/lib/types";
import { useOrganization } from "@/contexts/OrganizationContext";
import { format } from "date-fns";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMemberName(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return `${sub.member_user_id.first_name} ${sub.member_user_id.last_name}`.trim();
  }
  return "Unknown";
}

function getMemberEmail(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return sub.member_user_id.email;
  }
  return "—";
}

function getPlanName(sub: MembershipSubscription): string {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) {
    return sub.plan_id.name;
  }
  return "—";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase();
}

const STATUS_STYLE: Record<MembershipSubscriptionStatus, { color: string; bg: string; label: string }> = {
  [MembershipSubscriptionStatus.ACTIVE]:          { color: "var(--signal-ink)", bg: "var(--signal-soft)", label: "Active" },
  [MembershipSubscriptionStatus.PENDING_PAYMENT]: { color: "oklch(0.42 0.13 75)", bg: "var(--trainer-soft)", label: "Pending" },
  [MembershipSubscriptionStatus.EXPIRED]:         { color: "var(--fg-3)", bg: "var(--bg-2)", label: "Expired" },
  [MembershipSubscriptionStatus.CANCELLED]:       { color: "var(--danger)", bg: "var(--danger-soft)", label: "Cancelled" },
};

const FILTERS: { label: string; value: MembershipSubscriptionStatus | "all" }[] = [
  { label: "All",      value: "all" },
  { label: "Active",   value: MembershipSubscriptionStatus.ACTIVE },
  { label: "Pending",  value: MembershipSubscriptionStatus.PENDING_PAYMENT },
  { label: "Expired",  value: MembershipSubscriptionStatus.EXPIRED },
  { label: "Cancelled",value: MembershipSubscriptionStatus.CANCELLED },
];

function More() {
  return (
    <span className="w-5.5 h-5.5 rounded-(--r-1) flex items-center justify-center cursor-pointer" style={{ color: "var(--fg-3)" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/></svg>
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GymMembersClient() {
  const { currentOrg } = useOrganization();
  const [subscriptions, setSubscriptions] = useState<MembershipSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<MembershipSubscriptionStatus | "all">("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!currentOrg) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const res = await marketplaceService.getOrgMembershipSubscriptions(currentOrg._id);
      if (!mounted) return;
      if (res.success && res.data) setSubscriptions(res.data);
      setLoading(false);
    };

    void load();
    return () => { mounted = false; };
  }, [currentOrg]);

  const filtered = subscriptions.filter((sub) => {
    if (filter !== "all" && sub.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const name = getMemberName(sub).toLowerCase();
      const email = getMemberEmail(sub).toLowerCase();
      const plan = getPlanName(sub).toLowerCase();
      if (!name.includes(q) && !email.includes(q) && !plan.includes(q)) return false;
    }
    return true;
  });

  const counts = {
    all: subscriptions.length,
    [MembershipSubscriptionStatus.ACTIVE]: subscriptions.filter((s) => s.status === MembershipSubscriptionStatus.ACTIVE).length,
    [MembershipSubscriptionStatus.PENDING_PAYMENT]: subscriptions.filter((s) => s.status === MembershipSubscriptionStatus.PENDING_PAYMENT).length,
    [MembershipSubscriptionStatus.EXPIRED]: subscriptions.filter((s) => s.status === MembershipSubscriptionStatus.EXPIRED).length,
    [MembershipSubscriptionStatus.CANCELLED]: subscriptions.filter((s) => s.status === MembershipSubscriptionStatus.CANCELLED).length,
  };

  const activeCount = counts[MembershipSubscriptionStatus.ACTIVE];

  return (
    <GymDashboardShell
      activeItem="Members"
      crumb="Members"
      actions={
        <>
          <button
            className="w-8 h-8 rounded-(--r-2) flex items-center justify-center"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
            aria-label="Export members"
            onClick={() => {
              const rows = [
                ["Name", "Email", "Plan", "Status", "Joined", "Amount", "Currency"],
                ...filtered.map((s) => [
                  getMemberName(s),
                  getMemberEmail(s),
                  getPlanName(s),
                  STATUS_STYLE[s.status]?.label ?? s.status,
                  format(new Date(s.created_at), "dd MMM yyyy"),
                  s.amount_paid.toString(),
                  s.currency,
                ]),
              ];
              const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
              const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              const a = document.createElement("a");
              a.href = url;
              a.download = "members.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
          </button>
          <AddMemberButton />
        </>
      }
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Members</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {loading
            ? "Loading…"
            : `${subscriptions.length} member${subscriptions.length === 1 ? "" : "s"} · ${activeCount} active`}
        </div>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3.5 p-3.5 rounded-(--r-3) flex-wrap" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 h-8 px-3 rounded-(--r-2) flex-1 min-w-[200px]" style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--fg-3)", flexShrink: 0 }}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or plan…"
            className="bg-transparent text-[13px] flex-1 outline-none"
            style={{ color: "var(--ink)" }}
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {FILTERS.map((f) => {
            const on = filter === f.value;
            const count = counts[f.value as keyof typeof counts] ?? 0;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className="inline-flex items-center gap-1 font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.75 py-1.5 rounded-full cursor-pointer shrink-0 border"
                style={{
                  background: on ? "var(--ink)" : "var(--bg)",
                  borderColor: on ? "var(--ink)" : "var(--border)",
                  color: on ? "var(--bg)" : "var(--fg-3)",
                }}
              >
                {f.label} <span style={{ color: on ? "oklch(0.75 0.005 85)" : "var(--fg-4)" }}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px] min-w-[780px]" style={{ fontVariantNumeric: "tabular-nums" }}>
            <thead>
              <tr className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>
                <th className="px-4.5 py-2.75 text-left font-medium">Member</th>
                <th className="px-4.5 py-2.75 text-left font-medium">Plan</th>
                <th className="px-4.5 py-2.75 text-left font-medium hidden md:table-cell">Joined</th>
                <th className="px-4.5 py-2.75 text-left font-medium hidden lg:table-cell">Expires</th>
                <th className="px-4.5 py-2.75 text-left font-medium">Status</th>
                <th className="px-4.5 py-2.75 text-right font-medium">Amount</th>
                <th className="px-4.5 py-2.75 w-[22px]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4.5 py-3.5">
                        <div className="h-3.5 rounded animate-pulse" style={{ background: "var(--bg-2)", width: j === 0 ? "140px" : j === 5 ? "60px" : "90px" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
                    {search || filter !== "all" ? "No members match your filters." : "No members yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((sub, i) => {
                  const name = getMemberName(sub);
                  const email = getMemberEmail(sub);
                  const plan = getPlanName(sub);
                  const statusStyle = STATUS_STYLE[sub.status] ?? STATUS_STYLE[MembershipSubscriptionStatus.EXPIRED];
                  return (
                    <tr
                      key={sub._id}
                      className="cursor-pointer"
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid var(--border)" : "none" }}
                    >
                      <td className="px-4.5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7.5 h-7.5 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
                            {getInitials(name)}
                          </span>
                          <div>
                            <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.005em" }}>{name}</div>
                            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4.5 py-3" style={{ color: "var(--ink)" }}>{plan}</td>
                      <td className="px-4.5 py-3 hidden md:table-cell" style={{ color: "var(--fg-2)" }}>
                        {format(new Date(sub.created_at), "dd MMM yyyy")}
                      </td>
                      <td className="px-4.5 py-3 hidden lg:table-cell" style={{ color: "var(--fg-2)" }}>
                        {sub.end_date ? format(new Date(sub.end_date), "dd MMM yyyy") : "—"}
                      </td>
                      <td className="px-4.5 py-3">
                        <span
                          className="inline-flex items-center gap-1.25 font-mono text-[10.5px] uppercase tracking-[0.05em] px-2 py-0.5 rounded-full"
                          style={{ color: statusStyle.color, background: statusStyle.bg }}
                        >
                          <span className="w-1.25 h-1.25 rounded-full bg-current" />
                          {statusStyle.label}
                        </span>
                      </td>
                      <td className="px-4.5 py-3 text-right font-mono font-medium" style={{ color: "var(--ink)" }}>
                        {sub.currency} {sub.amount_paid.toLocaleString()}
                      </td>
                      <td className="px-4.5 py-3"><More /></td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
            <span className="font-mono text-[11.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
              Showing <strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>{filtered.length}</strong> of <strong className="text-[13px] font-medium" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", textTransform: "none", letterSpacing: "-0.005em" }}>{subscriptions.length}</strong> members
            </span>
          </div>
        )}
      </div>
    </GymDashboardShell>
  );
}
