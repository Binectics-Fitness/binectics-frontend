"use client";

import { useEffect, useMemo, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import OnboardingBanner from "@/components/OnboardingBanner";
import { NewPlanButton } from "./_actions";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  MembershipSubscriptionStatus,
  type CheckIn,
  type MembershipSubscription,
  type OrgCheckInDashboardStats,
} from "@/lib/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function checkInName(c: CheckIn): string {
  if (typeof c.member_user_id === "object" && c.member_user_id !== null) {
    return `${c.member_user_id.first_name} ${c.member_user_id.last_name}`.trim();
  }
  return "A member";
}

function checkInListing(c: CheckIn): string | null {
  if (typeof c.listing_id === "object" && c.listing_id !== null) return c.listing_id.headline;
  return null;
}

function memberName(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    return `${sub.member_user_id.first_name} ${sub.member_user_id.last_name}`.trim();
  }
  return "Unknown member";
}

function planName(sub: MembershipSubscription): string {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) return sub.plan_id.name;
  return "—";
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

const STATUS_STYLE: Record<MembershipSubscriptionStatus, { color: string; bg: string; label: string }> = {
  [MembershipSubscriptionStatus.ACTIVE]: { color: "var(--signal-ink)", bg: "var(--signal-soft)", label: "Active" },
  [MembershipSubscriptionStatus.PENDING_PAYMENT]: { color: "oklch(0.42 0.13 75)", bg: "var(--trainer-soft)", label: "Pending" },
  [MembershipSubscriptionStatus.EXPIRED]: { color: "var(--fg-3)", bg: "var(--bg-2)", label: "Expired" },
  [MembershipSubscriptionStatus.CANCELLED]: { color: "var(--danger)", bg: "var(--danger-soft)", label: "Cancelled" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-(--r-3) overflow-hidden ${className}`} style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      {children}
    </div>
  );
}

function CardHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
      <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>{title}</h3>
      {sub && <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{sub}</div>}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function GymOverviewClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const { fmtDate, fmtTime, fmtMoney } = useOrgFormat();
  // Org money renders in the org's own currency — never the visitor's region.
  const formatAmount = (n: number) => fmtMoney(n, currentOrg?.currency);

  const [stats, setStats] = useState<OrgCheckInDashboardStats | null>(null);
  const [subs, setSubs] = useState<MembershipSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    let active = true;

    const run = async () => {
      setLoading(true);
      const [statsRes, subsRes] = await Promise.allSettled([
        checkinsService.getOrgDashboardStats(currentOrg._id),
        marketplaceService.getOrgMembershipSubscriptions(currentOrg._id),
      ]);
      if (!active) return;

      let statsOk = false;
      if (statsRes.status === "fulfilled" && statsRes.value.success && statsRes.value.data) {
        setStats(statsRes.value.data);
        statsOk = true;
      }
      if (subsRes.status === "fulfilled" && subsRes.value.success && subsRes.value.data) {
        setSubs(subsRes.value.data);
      }
      setError(statsOk ? null : "We couldn't load your dashboard. Try again shortly.");
      setLoading(false);
    };

    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [currentOrg, orgLoading]);

  const recentMembers = useMemo(
    () =>
      [...subs]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 8),
    [subs],
  );

  const liveCheckIns = stats?.recent_check_ins ?? [];
  const attendance =
    stats && stats.active_members > 0 ? Math.round((stats.today_check_ins / stats.active_members) * 100) : null;

  const kpis = stats
    ? [
        { label: "Revenue · 30d", value: formatAmount(stats.revenue_month), sub: `${formatAmount(stats.revenue_today)} today` },
        { label: "Active members", value: String(stats.active_members), sub: `${stats.month_check_ins} check-ins · 30d` },
        { label: "Check-ins · today", value: String(stats.today_check_ins), sub: attendance != null ? `${attendance}% attendance` : "—" },
        { label: "Avg rating", value: stats.average_rating.toFixed(1), sub: `${stats.review_count} reviews` },
      ]
    : [];

  const headline = user?.first_name ? `Welcome back, ${user.first_name}` : "Overview";
  const location = stats?.city && stats?.country_code ? ` · ${stats.city}, ${stats.country_code}` : "";

  return (
    <GymDashboardShell activeItem="Overview" crumb="Overview" actions={<NewPlanButton />}>
      <OnboardingBanner />

      <div className="pb-1">
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{headline}</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {currentOrg ? `Here's how ${currentOrg.name} is doing${location}` : "Your gym performance overview"}
        </div>
      </div>

      {!currentOrg && !orgLoading ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          Select an organization to view its dashboard.
        </div>
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load dashboard</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading && !stats ? (
        <AsyncSpinner size="page" label="Loading your dashboard" />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="flex flex-col gap-2 min-h-[96px] rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{kpi.label}</div>
                <div className="text-[30px] font-medium leading-none" style={{ letterSpacing: "-0.022em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{kpi.value}</div>
                <div className="font-mono text-[11.5px]" style={{ color: "var(--signal-ink)" }}>{kpi.sub}</div>
              </div>
            ))}
          </div>

          {/* Revenue summary + Live check-ins */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
            <Card>
              <CardHead title="Revenue" sub="Settled to date" />
              <div className="flex flex-col">
                {[
                  { label: "Today", value: stats ? formatAmount(stats.revenue_today) : "—" },
                  { label: "This week", value: stats ? formatAmount(stats.revenue_week) : "—" },
                  { label: "This month", value: stats ? formatAmount(stats.revenue_month) : "—" },
                ].map((row, i, arr) => (
                  <div key={row.label} className="flex justify-between px-4.5 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>{row.label}</span>
                    <span className="font-mono text-[14px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <div>
                  <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Live check-ins</h3>
                  <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Most recent activity</div>
                </div>
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ background: "var(--signal-soft)", border: "1px solid oklch(0.88 0.05 148)", color: "var(--signal-ink)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />Live
                </span>
              </div>
              <div className="py-1 overflow-hidden" style={{ maxHeight: 320 }}>
                {liveCheckIns.length === 0 ? (
                  <div className="px-4.5 py-4"><EmptySlate message="No check-ins yet today." mt="mt-0" /></div>
                ) : (
                  liveCheckIns.slice(0, 8).map((c) => {
                    const listing = checkInListing(c);
                    return (
                      <div key={c._id} className="flex gap-3 px-4.5 py-2.5 items-start">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: "var(--signal)", boxShadow: "0 0 0 4px var(--signal-soft)" }} />
                        <span className="text-[13px] flex-1" style={{ color: "var(--ink)" }}>
                          <strong className="font-medium">{checkInName(c)}</strong> checked in{listing ? ` at ${listing}` : ""}
                        </span>
                        <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-3)" }}>{fmtTime(c.checked_in_at)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>

          {/* Recent members */}
          <Card>
            <div className="flex items-center justify-between px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <div>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Recent members</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Latest subscriptions</div>
              </div>
            </div>
            {recentMembers.length === 0 ? (
              <div className="px-4.5 py-4"><EmptySlate message="No members yet." hint="New subscriptions will appear here." mt="mt-0" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-[13.5px] min-w-[600px]">
                  <thead>
                    <tr>
                      {["Member", "Plan", "Status", "Joined", "Amount"].map((h, i) => (
                        <th key={h} className={`text-left font-medium font-mono text-[11px] uppercase tracking-[0.04em] px-4.5 py-3 ${i === 4 ? "text-right" : ""}`} style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentMembers.map((sub, idx) => {
                      const name = memberName(sub);
                      const last = idx === recentMembers.length - 1;
                      const st = STATUS_STYLE[sub.status];
                      const border = last ? "none" : "1px solid var(--border)";
                      return (
                        <tr key={sub._id} className="hover:bg-bg-2">
                          <td className="px-4.5 py-3" style={{ borderBottom: border, color: "var(--ink)" }}>
                            <div className="flex items-center gap-2.5">
                              <span className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>{initials(name)}</span>
                              {name}
                            </div>
                          </td>
                          <td className="px-4.5 py-3" style={{ borderBottom: border, color: "var(--ink)" }}>{planName(sub)}</td>
                          <td className="px-4.5 py-3" style={{ borderBottom: border }}>
                            <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ color: st?.color, background: st?.bg, border: `1px solid ${st?.color ?? "var(--border)"}` }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "currentColor" }} />{st?.label ?? sub.status}
                            </span>
                          </td>
                          <td className="px-4.5 py-3 font-mono text-[12px]" style={{ borderBottom: border, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{fmtDate(sub.created_at)}</td>
                          <td className="px-4.5 py-3 text-right font-mono" style={{ borderBottom: border, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{sub.amount_paid != null ? fmtMoney(sub.amount_paid, sub.currency ?? currentOrg?.currency) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </GymDashboardShell>
  );
}
