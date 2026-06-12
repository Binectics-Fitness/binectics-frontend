"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { adminService, type PlatformMetricsOverview, type FeedbackSummary } from "@/lib/api/admin";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatCur(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${Math.round(amount).toLocaleString()}`;
  }
}

function pct(rate: number): string {
  const v = rate <= 1 ? rate * 100 : rate;
  return `${v.toFixed(1)}%`;
}

export default function AdminOverviewClient() {
  const [metrics, setMetrics] = useState<PlatformMetricsOverview | null>(null);
  const [feedback, setFeedback] = useState<FeedbackSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const [mRes, fRes] = await Promise.allSettled([
        adminService.getPlatformMetrics(),
        adminService.getFeedbackSummary(),
      ]);
      if (!active) return;
      let ok = false;
      if (mRes.status === "fulfilled" && mRes.value.success && mRes.value.data) {
        setMetrics(mRes.value.data);
        ok = true;
      }
      if (fRes.status === "fulfilled" && fRes.value.success && fRes.value.data) {
        setFeedback(fRes.value.data);
      }
      setError(ok ? null : "We couldn't load platform metrics. Try again shortly.");
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  const byCountry = useMemo(() => {
    const rows = metrics?.verifiedProviders.byCountry ?? [];
    return [...rows].sort((a, b) => b.count - a.count).slice(0, 8);
  }, [metrics]);
  const maxCountry = byCountry[0]?.count ?? 1;

  const byCurrency = useMemo(() => {
    const rows = metrics?.subscriptions.byCurrency ?? [];
    return [...rows].sort((a, b) => b.total - a.total).slice(0, 8);
  }, [metrics]);

  const kpis = metrics
    ? [
        { l: "Subscription revenue", v: USD.format(metrics.subscriptions.totalRevenueUsd), d: `${USD.format(metrics.subscriptions.averageValueUsd)} avg` },
        { l: "Verified providers", v: metrics.verifiedProviders.total.toLocaleString(), d: `${metrics.verifiedProviders.distinctCountries} countries` },
        { l: "Active subscriptions", v: metrics.subscriptions.activeCount.toLocaleString(), d: "Currently active" },
        { l: "Total users", v: metrics.conversion.totalUsers.toLocaleString(), d: `${metrics.conversion.payingUsers.toLocaleString()} paying` },
        { l: "Conversion rate", v: pct(metrics.conversion.conversionRate), d: "Paying / total" },
        { l: "Countries live", v: String(metrics.verifiedProviders.distinctCountries), d: "With verified providers" },
      ]
    : [];

  return (
    <AdminDashboardShell activeItem="Overview" crumb="Overview">
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Platform overview</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>Providers, subscriptions, and member feedback</div>
      </div>

      {error ? (
        <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}>
          <div className="font-medium">Couldn&apos;t load metrics</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>{error}</div>
        </div>
      ) : null}

      {loading && !metrics ? (
        <AsyncSpinner size="page" label="Loading platform metrics" />
      ) : metrics ? (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {kpis.map((s) => (
              <div key={s.l} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.l}</div>
                <div className="text-[22px] font-medium" style={{ letterSpacing: "-0.018em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{s.d}</div>
              </div>
            ))}
          </div>

          {/* Providers by country + Revenue by currency */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-3 items-start">
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Verified providers · by country</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Top {byCountry.length} of {metrics.verifiedProviders.distinctCountries}</div>
              </div>
              {byCountry.length === 0 ? (
                <div className="px-4.5 py-4"><EmptySlate message="No verified providers yet." mt="mt-0" /></div>
              ) : (
                byCountry.map((c, i) => (
                  <div key={c.country_code} className="grid gap-3 px-4.5 py-2.5 items-center text-[13px]" style={{ gridTemplateColumns: "60px 1fr 48px", borderBottom: i < byCountry.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <span className="font-mono text-[11px] tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{c.country_code}</span>
                    <span className="h-1.5 rounded-sm overflow-hidden" style={{ background: "var(--bg-3)" }}>
                      <span className="block h-full" style={{ width: `${Math.max((c.count / maxCountry) * 100, 4)}%`, background: "var(--ink)" }} />
                    </span>
                    <span className="font-mono text-[12px] text-right" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Revenue · by currency</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>Active subscriptions</div>
              </div>
              {byCurrency.length === 0 ? (
                <div className="px-4.5 py-4"><EmptySlate message="No revenue recorded yet." mt="mt-0" /></div>
              ) : (
                byCurrency.map((c, i) => (
                  <div key={c.currency} className="flex justify-between items-center px-4.5 py-3" style={{ borderBottom: i < byCurrency.length - 1 ? "1px solid var(--border)" : "none" }}>
                    <div>
                      <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{c.currency}</div>
                      <div className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{c.count} subscription{c.count === 1 ? "" : "s"}</div>
                    </div>
                    <span className="font-mono text-[14px]" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{formatCur(c.total, c.currency)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Member feedback */}
          {feedback && feedback.responseCount > 0 && (
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[14px] font-medium" style={{ letterSpacing: "-0.005em", color: "var(--ink)" }}>Member feedback</h3>
                <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>{feedback.responseCount} responses</div>
              </div>
              <div className="grid grid-cols-3 gap-3 p-4.5">
                {[
                  { l: "Positive", v: pct(feedback.positivePercentage) },
                  { l: "Avg score", v: feedback.averageScore.toFixed(1) },
                  { l: "Responses", v: feedback.responseCount.toLocaleString() },
                ].map((s) => (
                  <div key={s.l}>
                    <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.l}</div>
                    <div className="text-[22px] font-medium mt-1" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </AdminDashboardShell>
  );
}
