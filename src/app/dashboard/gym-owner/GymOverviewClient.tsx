"use client";

import { useEffect, useMemo, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { format } from "date-fns";
import {
  AsyncSpinner,
  DSCard,
  DSCardHead,
  DSStatCard,
  EmptySlate,
  PageHeader,
  StatusPill,
} from "@/components/ds";
import type { TitleParts } from "@/components/ds";
import OnboardingBanner from "@/components/OnboardingBanner";
import { NewPlanButton } from "./_actions";
import { checkinsService } from "@/lib/api/checkins";
import { earningsService, type RevenueTimeseriesPoint } from "@/lib/api/earnings";
import { marketplaceService } from "@/lib/api/marketplace";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  type CheckIn,
  type MembershipSubscription,
  type OrgCheckInDashboardStats,
} from "@/lib/types";
import { membershipStatusMeta } from "@/lib/constants/membershipStatus";
import { minorToMajor } from "@/lib/money/minorMoney";
import { useClientNow } from "@/lib/ui/useClientNow";
import { dailyRevenueSpark } from "./revenueSpark";

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
  return "-";
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function GymOverviewClient() {
  // Role guard: wrong-role accounts get redirected to their own dashboard.
  const { isAuthorized } = useRoleGuard(UserRole.GYM_OWNER);
  if (!isAuthorized) return null;
  return <GymOverviewContent />;
}

function GymOverviewContent() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { user } = useAuth();
  const { fmtDate, fmtTime, fmtMoney } = useOrgFormat();
  // Org money renders in the org's own currency — never the visitor's region.
  const formatAmount = (n: number) => fmtMoney(n, currentOrg?.currency);

  const [stats, setStats] = useState<OrgCheckInDashboardStats | null>(null);
  const [subs, setSubs] = useState<MembershipSubscription[]>([]);
  const [series, setSeries] = useState<RevenueTimeseriesPoint[]>([]);
  const now = useClientNow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgLoading || !currentOrg) return;
    let active = true;

    const run = async () => {
      setLoading(true);
      const [statsRes, subsRes, seriesRes] = await Promise.allSettled([
        checkinsService.getOrgDashboardStats(currentOrg._id),
        marketplaceService.getOrgMembershipSubscriptions(currentOrg._id),
        // Owner-only ledger; without it the revenue card just has no sparkline.
        earningsService.getOrgTimeseries(currentOrg._id, 30),
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
      // Cleared on failure so another org's series never lingers.
      setSeries(
        seriesRes.status === "fulfilled" && seriesRes.value.success && seriesRes.value.data ? seriesRes.value.data : [],
      );
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

  const spark = useMemo(() => (now ? dailyRevenueSpark(series, now) : null), [series, now]);

  // No churn card (the mock has one): there is no churn figure in the API.
  const kpis = stats
    ? [
        <DSStatCard
          key="revenue"
          label="Revenue · 30d"
          value={formatAmount(stats.revenue_month)}
          delta={`${formatAmount(stats.revenue_today)} today`}
          spark={spark?.values}
          sparkLabel={spark ? `Settled revenue per day in ${spark.currency}, last 30 days` : undefined}
        />,
        <DSStatCard
          key="members"
          label="Active members"
          value={stats.active_members}
          delta={`${stats.month_check_ins} check-ins · 30d`}
        />,
        <DSStatCard
          key="checkins"
          label="Check-ins · today"
          value={stats.today_check_ins}
          delta={attendance != null ? `${attendance}% attendance` : "No active members"}
        />,
        <DSStatCard
          key="rating"
          label="Avg rating"
          value={stats.review_count > 0 ? stats.average_rating.toFixed(1) : "–"}
          delta={stats.review_count > 0 ? `${stats.review_count} review${stats.review_count === 1 ? "" : "s"}` : "No reviews yet"}
        />,
      ]
    : [];

  const first = user?.first_name?.trim().split(/\s+/)[0];
  const title: TitleParts = first ? { before: "Welcome back, ", emphasis: first } : { emphasis: "Overview" };
  const place = stats?.city && stats?.country_code ? ` · ${stats.city}, ${stats.country_code}` : "";
  return (
    <GymDashboardShell activeItem="Overview" crumb="Overview" actions={<NewPlanButton />}>
      <OnboardingBanner />

      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader
        className="mb-0!"
        eyebrow={now ? format(now, "EEEE · d MMM") : undefined}
        title={title}
        subtitle={currentOrg ? `Here's how ${currentOrg.name} is doing${place}` : "Your gym performance overview"}
      />

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{kpis}</div>

          {/* Revenue summary + Live check-ins */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-3">
            <DSCard>
              <DSCardHead title="Revenue" subtitle="Settled to date" />
              <div className="flex flex-col">
                {[
                  { label: "Today", value: stats ? formatAmount(stats.revenue_today) : "-" },
                  { label: "This week", value: stats ? formatAmount(stats.revenue_week) : "-" },
                  { label: "This month", value: stats ? formatAmount(stats.revenue_month) : "-" },
                ].map((row, i, arr) => (
                  <div key={row.label} className="flex justify-between px-4.5 py-3.5" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>{row.label}</span>
                    <span className="font-mono text-[14px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </DSCard>

            <DSCard>
              <DSCardHead title="Live check-ins" subtitle="Most recent activity" action={<StatusPill tone="success" label="Live" />} />
              <div className="py-1 overflow-hidden" style={{ maxHeight: 320 }}>
                {liveCheckIns.length === 0 ? (
                  <div className="px-4.5 py-4"><EmptySlate message="No check-ins yet today." mt="mt-0" /></div>
                ) : (
                  liveCheckIns.slice(0, 8).map((c) => {
                    const listing = checkInListing(c);
                    return (
                      <div key={c._id} className="flex gap-3 px-4.5 py-2.5 items-start">
                        {/* A check-in is an event, not a success: the dot is neutral and
                            the "Live" pill above carries the colour. */}
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[7px]" style={{ background: "var(--fg-4)" }} />
                        <span className="text-[13px] flex-1" style={{ color: "var(--ink)" }}>
                          <strong className="font-medium">{checkInName(c)}</strong> checked in{listing ? ` at ${listing}` : ""}
                        </span>
                        <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--fg-3)" }}>{fmtTime(c.checked_in_at)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </DSCard>
          </div>

          {/* Recent members */}
          <DSCard>
            <DSCardHead title="Recent members" subtitle="Latest subscriptions" />
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
                      const st = membershipStatusMeta(sub.status);
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
                            <StatusPill tone={st.tone} label={st.label} title={st.hint} />
                          </td>
                          <td className="px-4.5 py-3 font-mono text-[12px]" style={{ borderBottom: border, color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>{fmtDate(sub.created_at)}</td>
                          <td className="px-4.5 py-3 text-right font-mono" style={{ borderBottom: border, color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{sub.amount_paid_minor != null ? fmtMoney(minorToMajor(sub.amount_paid_minor, sub.currency ?? currentOrg?.currency), sub.currency ?? currentOrg?.currency) : "-"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </DSCard>
        </>
      )}
    </GymDashboardShell>
  );
}
