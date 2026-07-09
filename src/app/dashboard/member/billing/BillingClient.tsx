"use client";

import { useMemo } from "react";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  useMySubscriptions,
  useCancelSubscription,
} from "@/lib/queries/marketplace";
import { formatCurrencyAmount } from "@/lib/constants/regions";
import { formatDate } from "@/utils/format";
import {
  MembershipSubscriptionStatus,
  type MembershipSubscription,
} from "@/lib/types";

const STATUS_META: Record<MembershipSubscriptionStatus, { label: string; style: React.CSSProperties }> = {
  [MembershipSubscriptionStatus.ACTIVE]: { label: "Active", style: { background: "var(--signal-soft)", color: "var(--signal-ink)" } },
  [MembershipSubscriptionStatus.PENDING_PAYMENT]: { label: "Pending payment", style: { background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" } },
  [MembershipSubscriptionStatus.EXPIRED]: { label: "Expired", style: { background: "var(--bg-2)", color: "var(--fg-3)" } },
  [MembershipSubscriptionStatus.CANCELLED]: { label: "Cancelled", style: { background: "var(--bg-2)", color: "var(--fg-3)" } },
};

const planOf = (s: MembershipSubscription) =>
  typeof s.plan_id === "object" ? s.plan_id : null;
const listingOf = (s: MembershipSubscription) =>
  typeof s.listing_id === "object" ? s.listing_id : null;

/**
 * Member billing: real membership subscriptions (plans, amounts, renewal
 * dates, cancel). Replaces the fabricated card-on-file / transactions
 * mockup — payment methods and a full transaction ledger have no member
 * endpoints yet, so they are omitted rather than invented.
 */
export function BillingClient() {
  const { data: subs = [], isLoading } = useMySubscriptions();
  const cancel = useCancelSubscription();

  const active = subs.filter((s) => s.status === MembershipSubscriptionStatus.ACTIVE);

  // Sum lifetime spend per currency (subscriptions can span currencies).
  const totalsByCurrency = useMemo(() => {
    const map = new Map<string, number>();
    subs.forEach((s) => map.set(s.currency, (map.get(s.currency) ?? 0) + s.amount_paid));
    return [...map.entries()].map(([cur, amt]) => formatCurrencyAmount(amt, cur)).join(" + ") || "—";
  }, [subs]);

  const nextRenewal = useMemo(() => {
    const upcoming = active
      .map((s) => s.end_date)
      .filter((d): d is string => !!d && new Date(d) > new Date())
      .sort();
    return upcoming[0] ? formatDate(upcoming[0]) : "—";
  }, [active]);

  const kpis = [
    { label: "Active plans", value: String(active.length), delta: `${subs.length} total` },
    { label: "Total paid", value: totalsByCurrency, delta: "across all plans", small: totalsByCurrency.length > 10 },
    { label: "Next renewal", value: nextRenewal, delta: active.find((s) => s.auto_renew) ? "auto-renews" : "manual renewal", small: true },
  ];

  const onCancel = (s: MembershipSubscription) => {
    const plan = planOf(s);
    if (window.confirm(`Cancel your ${plan?.name ?? "membership"} subscription? You keep access until ${s.end_date ? formatDate(s.end_date) : "the end of the period"}.`)) {
      void cancel.mutateAsync(s._id);
    }
  };

  return (
    <MemberDashboardShell activeLabel="Home">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Billing</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {kpis.map((k) => (
          <div key={k.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
            <div className={`font-medium ${k.small ? "text-[18px]" : "text-[24px]"}`} style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
            <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Subscriptions */}
      <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <div className="px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Memberships</h3>
        </div>
        {isLoading && <div className="px-5.5 py-6 text-[13px]" style={{ color: "var(--fg-3)" }}>Loading your memberships…</div>}
        {!isLoading && subs.length === 0 && (
          <div className="px-5.5 py-10 text-center text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            No memberships yet — join a gym from the marketplace and it will appear here.
          </div>
        )}
        {subs.map((s, i) => {
          const plan = planOf(s);
          const listing = listingOf(s);
          const meta = STATUS_META[s.status];
          return (
            <div key={s._id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5.5 py-4" style={{ borderBottom: i < subs.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{plan?.name ?? "Membership"}</span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={meta.style}>{meta.label}</span>
                </div>
                <div className="font-mono text-[11px] mt-1" style={{ color: "var(--fg-3)" }}>
                  {listing?.headline ?? ""}
                  {listing?.city ? ` · ${listing.city}` : ""}
                  {` · started ${formatDate(s.start_date)}`}
                  {s.end_date ? ` · ${s.status === MembershipSubscriptionStatus.ACTIVE ? "renews/ends" : "ended"} ${formatDate(s.end_date)}` : ""}
                </div>
              </div>
              <span className="font-mono text-[13.5px] shrink-0" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                {formatCurrencyAmount(s.amount_paid, s.currency)}
              </span>
              {s.status === MembershipSubscriptionStatus.ACTIVE && (
                <button className="btn-ghost-v2 sm shrink-0" disabled={cancel.isPending} onClick={() => onCancel(s)}>
                  Cancel
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>
        Payment methods and a full transaction ledger are coming — for now this shows your memberships and what you&rsquo;ve paid for them.
      </p>
    </MemberDashboardShell>
  );
}
