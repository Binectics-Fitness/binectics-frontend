"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddMemberButton } from "./_actions";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MembershipSubscriptionStatus,
  type MembershipSubscription,
} from "@/lib/types";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toast } from "@/components/Toast";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { useOrgMembershipPlans } from "@/lib/queries/marketplace";

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

const MORE_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
    <circle cx="12" cy="6" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="18" r="1.5"/>
  </svg>
);

function RowActions({
  sub,
  orgId,
  onUpdate,
}: {
  sub: MembershipSubscription;
  orgId: string;
  onUpdate: (updated: MembershipSubscription) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // The menu is position:fixed (the table's overflow-x-auto wrapper clips
  // absolutely-positioned children — the menu opened invisibly). Fixed
  // coordinates come from the trigger; scroll/resize close the menu so it
  // can't drift away from its button.
  const toggleMenu = () => {
    if (open) return setOpen(false);
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 4, left: Math.max(8, r.right - 210) });
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const isActive = sub.status === MembershipSubscriptionStatus.ACTIVE;
  const isPending = sub.status === MembershipSubscriptionStatus.PENDING_PAYMENT;
  const scheduledPlan =
    sub.next_plan_id && typeof sub.next_plan_id === "object" ? sub.next_plan_id : null;

  const run = async (fn: () => Promise<void>) => {
    setOpen(false);
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleMarkPaid = () =>
    run(async () => {
      const res = await marketplaceService.markSubscriptionPaid(orgId, sub._id);
      if (res.success && res.data) {
        onUpdate(res.data);
        toast.success("Marked as paid");
      } else toast.error(res.message ?? "Failed to mark as paid");
    });

  const handleResendInvite = () =>
    run(async () => {
      const res = await marketplaceService.resendMemberInvite(orgId, sub._id);
      if (res.success) toast.success("Invite email sent — the link lasts 7 days");
      else toast.error(res.message ?? "Couldn't send the invite");
    });

  const handleClearNextPlan = () =>
    run(async () => {
      const res = await marketplaceService.setSubscriptionNextPlan(orgId, sub._id, null);
      if (res.success && res.data) {
        onUpdate(res.data);
        toast.success("Scheduled plan change cleared");
      } else toast.error(res.message ?? "Couldn't clear the change");
    });

  const handleCancel = () =>
    run(async () => {
      if (
        !window.confirm(
          `Cancel ${getMemberName(sub)}'s membership? They lose access and the plan's member count drops.`,
        )
      )
        return;
      const res = await marketplaceService.cancelOrgSubscription(orgId, sub._id);
      if (res.success && res.data) {
        onUpdate(res.data);
        toast.success("Membership cancelled");
      } else toast.error(res.message ?? "Couldn't cancel the membership");
    });

  const item = "w-full text-left px-3.5 py-2 text-[13px] hover:bg-[var(--bg-2)] disabled:opacity-50";

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        aria-label="Member actions"
        onClick={toggleMenu}
        disabled={busy}
        className="w-5.5 h-5.5 rounded-(--r-1) flex items-center justify-center cursor-pointer disabled:opacity-50"
        style={{ color: "var(--fg-3)" }}
      >
        {MORE_ICON}
      </button>
      {open && menuPos && (
        <div
          className="z-50 min-w-[200px] rounded-(--r-2) py-1 shadow-md"
          style={{ position: "fixed", top: menuPos.top, left: menuPos.left, background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          <button type="button" className={item} style={{ color: "var(--ink)" }}
            onClick={() => { setOpen(false); router.push(`/dashboard/gym-owner/members/${sub._id}`); }}>
            View details
          </button>
          {(isActive || isPending) && (
            <button type="button" className={item} style={{ color: "var(--ink)" }} onClick={handleResendInvite}>
              Resend invite email
            </button>
          )}
          {isPending && (
            <button type="button" className={item} style={{ color: "var(--ink)" }} onClick={handleMarkPaid}>
              Mark as paid
            </button>
          )}
          {isActive && (
            <button type="button" className={item} style={{ color: "var(--ink)" }}
              onClick={() => { setOpen(false); setChangePlanOpen(true); }}>
              Change plan…
            </button>
          )}
          {isActive && scheduledPlan && (
            <button type="button" className={item} style={{ color: "var(--ink)" }} onClick={handleClearNextPlan}>
              Clear scheduled change ({scheduledPlan.name})
            </button>
          )}
          {(isActive || isPending) && (
            <button type="button" className={item} style={{ color: "var(--danger, #b00020)" }} onClick={handleCancel}>
              Cancel membership
            </button>
          )}
        </div>
      )}
      {changePlanOpen && (
        <ChangePlanModal
          sub={sub}
          orgId={orgId}
          onClose={() => setChangePlanOpen(false)}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

/** Schedule a plan switch that takes effect when the current period ends. */
function ChangePlanModal({
  sub,
  orgId,
  onClose,
  onUpdate,
}: {
  sub: MembershipSubscription;
  orgId: string;
  onClose: () => void;
  onUpdate: (updated: MembershipSubscription) => void;
}) {
  const { fmtDate } = useOrgFormat();
  const { data: plans = [] } = useOrgMembershipPlans(orgId);
  const currentPlanId = typeof sub.plan_id === "object" ? sub.plan_id._id : sub.plan_id;
  const options = plans.filter((p) => p.is_active && p._id !== currentPlanId);
  const [planId, setPlanId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    if (!planId) return setError("Pick a plan.");
    setSaving(true);
    setError(null);
    const res = await marketplaceService.setSubscriptionNextPlan(orgId, sub._id, planId);
    setSaving(false);
    if (res.success && res.data) {
      onUpdate(res.data);
      toast.success("Plan change scheduled for the next renewal");
      onClose();
    } else setError(res.message ?? "Couldn't schedule the change.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "oklch(0.2 0.02 260 / 0.4)" }} onClick={onClose}>
      <div className="w-full max-w-[440px] rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-[16px] font-medium" style={{ color: "var(--ink)" }}>Change plan</h2>
        <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: "var(--fg-3)" }}>
          {getMemberName(sub)} stays on <strong style={{ color: "var(--ink)" }}>{getPlanName(sub)}</strong> until the current period ends
          {sub.end_date ? ` on ${fmtDate(sub.end_date)}` : ""}, then renews onto the new plan. Auto-renew turns on so the switch happens.
        </p>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)}
          className="w-full h-10 rounded-(--r-2) px-3 text-[14px] mt-4"
          style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}>
          <option value="">Choose a plan…</option>
          {options.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
        {options.length === 0 && (
          <p className="text-[12px] mt-2" style={{ color: "var(--fg-3)" }}>No other active plans — create one on Plans &amp; pricing first.</p>
        )}
        {error && <p className="text-[12px] mt-2" style={{ color: "var(--danger, #b00020)" }}>{error}</p>}
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost-v2 sm" disabled={saving} onClick={onClose}>Cancel</button>
          <button className="btn-primary-v2 sm" disabled={saving || !planId} onClick={() => void onSave()}>
            {saving ? "Scheduling…" : "Schedule change"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GymMembersClient() {
  const { currentOrg } = useOrganization();
  const { fmtDate, fmtMoney } = useOrgFormat();
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<MembershipSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<MembershipSubscriptionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSubscriptionUpdate = (updated: MembershipSubscription) => {
    setSubscriptions((subs) => subs.map((s) => s._id === updated._id ? updated : s));
  };

  useEffect(() => {
    if (!currentOrg) return;
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const res = await marketplaceService.getOrgMembershipSubscriptions(currentOrg._id);
      if (!mounted) return;
      if (res.success && res.data) {
        setSubscriptions(res.data);
        setLoadError(null);
      } else {
        // Never masquerade as an empty gym — a failed load once rendered
        // "No members yet" while the API was 500ing (2026-07-10 regression).
        setLoadError(res.message || "Couldn't load members.");
      }
      setLoading(false);
    };

    void load();
    return () => { mounted = false; };
  }, [currentOrg, refreshKey]);

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
      organizationName={currentOrg?.name}
      organizationInitials={currentOrg ? getInitials(currentOrg.name) : "IL"}
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
                  fmtDate(s.created_at),
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
          <AddMemberButton onEnrolled={() => setRefreshKey((k) => k + 1)} />
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
              ) : loadError ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[13.5px]" style={{ color: "var(--danger, #b00020)" }}>
                    Couldn&apos;t load members — {loadError} <button className="btn-ghost-v2 sm ml-2" onClick={() => setRefreshKey((k) => k + 1)}>Retry</button>
                  </td>
                </tr>
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
                      onClick={() => router.push(`/dashboard/gym-owner/members/${sub._id}`)}
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
                      <td className="px-4.5 py-3" style={{ color: "var(--ink)" }}>
                        {plan}
                        {sub.next_plan_id && typeof sub.next_plan_id === "object" && (
                          <div className="font-mono text-[10.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                            → {sub.next_plan_id.name} at renewal
                          </div>
                        )}
                      </td>
                      <td className="px-4.5 py-3 hidden md:table-cell" style={{ color: "var(--fg-2)" }}>
                        {fmtDate(sub.created_at)}
                      </td>
                      <td className="px-4.5 py-3 hidden lg:table-cell" style={{ color: "var(--fg-2)" }}>
                        {sub.end_date ? fmtDate(sub.end_date) : "—"}
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
                        {fmtMoney(sub.amount_paid, sub.currency)}
                      </td>
                      <td className="px-4.5 py-3">
                        {currentOrg && (
                          <RowActions sub={sub} orgId={currentOrg._id} onUpdate={handleSubscriptionUpdate} />
                        )}
                      </td>
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
