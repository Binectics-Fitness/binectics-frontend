"use client";

import AdminSidebar from "@/components/AdminSidebar";
import { adminService } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";

const KPI_TARGETS = {
  verifiedBusinesses: 100,
  countries: 3,
  averageSubscriptionValue: 25,
  conversionRate: 10,
  satisfaction: 60,
} as const;

function formatCurrency(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function KpiCard({
  label,
  value,
  target,
  helper,
  hit,
}: {
  label: string;
  value: string;
  target: string;
  helper?: string;
  hit: boolean;
}) {
  return (
    <div className="bg-white p-6 shadow-[var(--shadow-card)] rounded-2xl">
      <p className="text-sm font-medium text-foreground/60">{label}</p>
      <p className="text-3xl font-black text-foreground mt-2">{value}</p>
      <p
        className={`text-sm mt-2 font-semibold ${
          hit ? "text-primary-600" : "text-amber-600"
        }`}
      >
        {hit ? "✓ KPI met" : "→ Target: " + target}
      </p>
      {helper && (
        <p className="text-xs text-foreground/50 mt-1">{helper}</p>
      )}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const metricsQuery = useQuery({
    queryKey: ["admin", "platform-metrics"],
    queryFn: () => adminService.getPlatformMetrics(),
    staleTime: 60_000,
  });

  const feedbackQuery = useQuery({
    queryKey: ["admin", "feedback-summary"],
    queryFn: () => adminService.getFeedbackSummary(),
    staleTime: 60_000,
  });

  const metrics = metricsQuery.data?.data;
  const feedback = feedbackQuery.data?.data;

  const verifiedTotal = metrics?.verifiedProviders.total ?? 0;
  const distinctCountries = metrics?.verifiedProviders.distinctCountries ?? 0;
  const avgValue = metrics?.subscriptions.averageValueUsd ?? 0;
  const conversion = metrics?.conversion.conversionRate ?? 0;
  const satisfaction = feedback?.positivePercentage ?? 0;

  const loading = metricsQuery.isLoading || feedbackQuery.isLoading;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 md:ml-64">
        <header className="bg-white border-b border-neutral-200">
          <div className="px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6">
            <h1 className="text-3xl font-black text-foreground">
              Platform Analytics
            </h1>
            <p className="mt-1 text-sm text-foreground/60">
              Live KPIs against MVP targets — verified businesses, subscription
              value, conversion, and user satisfaction.
            </p>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8">
          {loading && (
            <p className="text-sm text-foreground/60 mb-4">Loading metrics…</p>
          )}
          {(metricsQuery.isError || feedbackQuery.isError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 text-sm">
              Failed to load some metrics. Try refreshing.
            </div>
          )}

          <h2 className="text-xl font-bold text-foreground mb-4">MVP KPIs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <KpiCard
              label="Verified Businesses"
              value={verifiedTotal.toLocaleString()}
              target={`${KPI_TARGETS.verifiedBusinesses}+`}
              hit={verifiedTotal >= KPI_TARGETS.verifiedBusinesses}
              helper={`${distinctCountries} countries (target: ${KPI_TARGETS.countries}+)`}
            />
            <KpiCard
              label="Avg. Subscription Value (USD)"
              value={formatCurrency(avgValue)}
              target={`≥ $${KPI_TARGETS.averageSubscriptionValue}`}
              hit={avgValue >= KPI_TARGETS.averageSubscriptionValue}
              helper={`${metrics?.subscriptions.activeCount ?? 0} active subscriptions`}
            />
            <KpiCard
              label="Free → Paid Conversion"
              value={`${conversion.toFixed(1)}%`}
              target={`≥ ${KPI_TARGETS.conversionRate}%`}
              hit={conversion >= KPI_TARGETS.conversionRate}
              helper={`${metrics?.conversion.payingUsers ?? 0} paying / ${metrics?.conversion.totalUsers ?? 0} total users`}
            />
            <KpiCard
              label="User Satisfaction (CSAT)"
              value={
                feedback && feedback.responseCount > 0
                  ? `${satisfaction.toFixed(1)}%`
                  : "—"
              }
              target={`≥ ${KPI_TARGETS.satisfaction}%`}
              hit={satisfaction >= KPI_TARGETS.satisfaction}
              helper={
                feedback
                  ? `${feedback.responseCount} responses · avg ${feedback.averageScore}/5`
                  : "No responses yet"
              }
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-white p-6 shadow-[var(--shadow-card)] rounded-2xl">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Verified Businesses by Country
              </h2>
              {!metrics || metrics.verifiedProviders.byCountry.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  No verified businesses yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {metrics.verifiedProviders.byCountry
                    .slice(0, 10)
                    .map((row) => {
                      const pct = verifiedTotal
                        ? (row.count / verifiedTotal) * 100
                        : 0;
                      return (
                        <div key={row.country_code}>
                          <div className="flex items-center justify-between mb-1 text-sm">
                            <p className="font-semibold text-foreground">
                              {row.country_code}
                            </p>
                            <p className="text-foreground/60">
                              {row.count} ({pct.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-accent-blue-500 h-2"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            <div className="bg-white p-6 shadow-[var(--shadow-card)] rounded-2xl">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Active Subscriptions by Currency
              </h2>
              {!metrics || metrics.subscriptions.byCurrency.length === 0 ? (
                <p className="text-sm text-foreground/60">
                  No active paid subscriptions yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {metrics.subscriptions.byCurrency.map((row) => (
                    <div
                      key={row.currency}
                      className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-bold text-foreground">
                          {row.currency}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {row.count} subscriptions
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(row.total, row.currency)}
                        </p>
                        <p className="text-xs text-foreground/60">
                          avg {formatCurrency(row.average, row.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 shadow-[var(--shadow-card)] rounded-2xl">
            <h2 className="text-xl font-bold text-foreground mb-6">
              User Feedback (CSAT)
            </h2>
            {!feedback || feedback.responseCount === 0 ? (
              <p className="text-sm text-foreground/60">
                No feedback responses collected yet. The in-app prompt fires
                every 14 days for active dashboard users.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm font-medium text-foreground/60 mb-3">
                    Score distribution
                  </p>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const count = feedback.scoreDistribution[String(s)] ?? 0;
                      const pct = feedback.responseCount
                        ? (count / feedback.responseCount) * 100
                        : 0;
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <span className="w-8 text-sm font-semibold">
                            {s}★
                          </span>
                          <div className="flex-1 bg-neutral-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-2 ${s >= 4 ? "bg-primary-500" : s === 3 ? "bg-accent-yellow-500" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-sm text-foreground/60 w-16 text-right">
                            {count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground/60 mb-3">
                    Recent comments
                  </p>
                  {feedback.recentComments.length === 0 ? (
                    <p className="text-sm text-foreground/60">
                      No comments yet.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {feedback.recentComments.map((c, i) => (
                        <div
                          key={i}
                          className="border-l-4 pl-3 py-1 border-neutral-200"
                        >
                          <p className="text-xs text-foreground/60 mb-1">
                            {c.score}★ ·{" "}
                            {new Date(c.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-foreground">{c.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
