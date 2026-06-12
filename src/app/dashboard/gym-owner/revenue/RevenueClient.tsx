"use client";

import { useEffect, useMemo, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { checkinsService } from "@/lib/api/checkins";
import { marketplaceService } from "@/lib/api/marketplace";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRegion } from "@/contexts/RegionContext";
import {
  MembershipSubscriptionStatus,
  type MembershipSubscription,
  type OrgCheckInDashboardStats,
} from "@/lib/types";

const MIX_COLORS = ["var(--ink)", "var(--signal)", "var(--gym)", "var(--trainer)", "var(--dietitian)", "var(--fg-3)"];

function planName(sub: MembershipSubscription): string {
  if (typeof sub.plan_id === "object" && sub.plan_id !== null) return sub.plan_id.name;
  return "Other";
}

export default function RevenueClient() {
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const { formatAmount } = useRegion();
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
      let ok = false;
      if (statsRes.status === "fulfilled" && statsRes.value.success && statsRes.value.data) {
        setStats(statsRes.value.data);
        ok = true;
      }
      if (subsRes.status === "fulfilled" && subsRes.value.success && subsRes.value.data) {
        setSubs(subsRes.value.data);
      }
      setError(ok ? null : "We couldn't load revenue. Try again shortly.");
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [currentOrg, orgLoading]);

  const activeSubs = useMemo(() => subs.filter((s) => s.status === MembershipSubscriptionStatus.ACTIVE), [subs]);

  const mix = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of subs) {
      map.set(planName(s), (map.get(planName(s)) ?? 0) + (s.amount_paid ?? 0));
    }
    const rows = [...map.entries()].map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total);
    const sum = rows.reduce((a, r) => a + r.total, 0);
    return { rows: rows.slice(0, 6), sum };
  }, [subs]);

  const kpis = stats
    ? [
        { label: "Revenue · 30d", value: formatAmount(stats.revenue_month) },
        { label: "Revenue · 7d", value: formatAmount(stats.revenue_week) },
        { label: "Revenue · today", value: formatAmount(stats.revenue_today) },
        { label: "Active members", value: stats.active_members.toLocaleString() },
        { label: "Active subscriptions", value: activeSubs.length.toLocaleString() },
      ]
    : [];

  return (
    <GymDashboardShell activeItem="Revenue" crumb="Revenue">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Revenue</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>
          {currentOrg ? `${currentOrg.name} · settled revenue` : "Your gym revenue"}
        </div>
      </div>

      {!currentOrg && !orgLoading ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--fg-2)" }}>
          Select an organization to view its revenue.
        </div>
      ) : error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load revenue</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading && !stats ? (
        <AsyncSpinner size="page" label="Loading revenue" />
      ) : stats ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-(--r-3) px-4.5 py-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
                <div className="text-[24px] font-medium mt-1.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Revenue by plan */}
          <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Revenue by plan</h3>
              <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>From subscription payments</div>
            </div>
            {mix.rows.length === 0 || mix.sum === 0 ? (
              <div className="px-4.5 py-4"><EmptySlate message="No subscription revenue yet." mt="mt-0" /></div>
            ) : (
              <div className="p-4.5">
                <div className="flex h-3 rounded-1.5 overflow-hidden gap-0.5">
                  {mix.rows.map((r, i) => (
                    <div key={r.label} style={{ flex: Math.max(r.total, 1), background: MIX_COLORS[i % MIX_COLORS.length] }} />
                  ))}
                </div>
                <div className="flex flex-col gap-2 mt-4 text-[13px]">
                  {mix.rows.map((r, i) => (
                    <div key={r.label} className="flex justify-between">
                      <span style={{ color: "var(--ink)" }}>
                        <span className="inline-block w-2 h-2 rounded-sm mr-2 align-middle" style={{ background: MIX_COLORS[i % MIX_COLORS.length] }} />{r.label}
                      </span>
                      <span className="font-mono" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(r.total)} · {Math.round((r.total / mix.sum) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </GymDashboardShell>
  );
}
