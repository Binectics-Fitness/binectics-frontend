"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { adminService, type PlatformMetricsOverview } from "@/lib/api/admin";
import { formatCurrency } from "@/utils/format";

/**
 * Platform analytics from GET /admin/metrics/overview: verified providers by
 * country, subscription value, and free→paid conversion. Replaces the
 * fabricated chart mockup. Admin surface — viewer-relative formatting.
 */
export function AnalyticsClient() {
  const { data: metrics = null, isLoading } = useQuery<PlatformMetricsOverview | null>({
    queryKey: ["admin", "platformMetrics"],
    queryFn: async () => {
      const res = await adminService.getPlatformMetrics();
      return res.success && res.data ? res.data : null;
    },
  });

  const kpis = metrics
    ? [
        { label: "Verified providers", value: metrics.verifiedProviders.total.toLocaleString(), delta: `${metrics.verifiedProviders.distinctCountries} countries` },
        { label: "Active subscriptions", value: metrics.subscriptions.activeCount.toLocaleString(), delta: `avg ${formatCurrency(metrics.subscriptions.averageValueUsd, "USD")}` },
        { label: "Subscription revenue", value: formatCurrency(metrics.subscriptions.totalRevenueUsd, "USD"), delta: "USD equivalent" },
        { label: "Free → paid conversion", value: `${(metrics.conversion.conversionRate * 100).toFixed(1)}%`, delta: `${metrics.conversion.payingUsers.toLocaleString()} of ${metrics.conversion.totalUsers.toLocaleString()} users` },
      ]
    : [];

  const maxCountry = Math.max(...(metrics?.verifiedProviders.byCountry.map((c) => c.count) ?? [1]), 1);

  return (
    <AdminDashboardShell activeItem="Analytics" crumb="Analytics">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Analytics</h1>

      {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading platform metrics…</p>}
      {!isLoading && !metrics && (
        <div className="rounded-(--r-3) px-6 py-10 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>Couldn&rsquo;t load platform metrics — check your admin permissions and try again.</p>
        </div>
      )}

      {metrics && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
                <div className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-3.5 items-start">
            {/* Providers by country */}
            <div className="rounded-(--r-3) p-5.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h3 className="text-[15px] font-medium mb-3.5" style={{ color: "var(--ink)" }}>Verified providers by country</h3>
              {metrics.verifiedProviders.byCountry.length === 0 && (
                <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>No verified providers yet.</p>
              )}
              <div className="flex flex-col gap-2.5">
                {metrics.verifiedProviders.byCountry.map((c) => (
                  <div key={c.country_code} className="flex items-center gap-3">
                    <span className="font-mono text-[11.5px] uppercase w-8 shrink-0" style={{ color: "var(--ink)" }}>{c.country_code || "—"}</span>
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--bg-3)" }}>
                      <div className="h-full rounded-full" style={{ width: `${(c.count / maxCountry) * 100}%`, background: "var(--signal)" }} />
                    </div>
                    <span className="font-mono text-[12px] w-10 text-right shrink-0" style={{ color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{c.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subscription value by currency */}
            <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div className="px-5.5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Subscription value by currency</h3>
              </div>
              {metrics.subscriptions.byCurrency.length === 0 ? (
                <p className="px-5.5 py-6 text-[13px]" style={{ color: "var(--fg-3)" }}>No active subscriptions yet.</p>
              ) : (
                <table className="w-full text-[13px]">
                  <thead>
                    <tr>
                      {["Currency", "Count", "Total", "Average"].map((h) => (
                        <th key={h} className="text-left font-mono text-[10.5px] uppercase tracking-[0.04em] px-5.5 py-2.5" style={{ color: "var(--fg-3)", borderBottom: "1px solid var(--border)", background: "var(--bg-2)" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.subscriptions.byCurrency.map((c, i, a) => (
                      <tr key={c.currency}>
                        <td className="px-5.5 py-3 font-mono" style={{ borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)" }}>{c.currency}</td>
                        <td className="px-5.5 py-3 font-mono" style={{ borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{c.count.toLocaleString()}</td>
                        <td className="px-5.5 py-3 font-mono" style={{ borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none", color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(c.total, c.currency)}</td>
                        <td className="px-5.5 py-3 font-mono" style={{ borderBottom: i < a.length - 1 ? "1px solid var(--border)" : "none", color: "var(--fg-2)", fontVariantNumeric: "tabular-nums" }}>{formatCurrency(c.average, c.currency)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </AdminDashboardShell>
  );
}
