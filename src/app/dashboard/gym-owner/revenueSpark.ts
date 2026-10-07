import type { RevenueTimeseriesPoint } from "@/lib/api/earnings";

/**
 * Daily settled revenue for the overview's revenue sparkline, from the org
 * ledger timeseries (GET /transactions/organizations/:id/timeseries).
 *
 * The API only returns days that had transactions, keyed by UTC date, one
 * row per currency. A sparkline needs one bar per day, so each of the last
 * `days` UTC dates gets its own value and a day with no rows is a real 0.
 * Currencies are never mixed (no FX): the series is the currency with the
 * most revenue in the window, the same rule the dashboard-stats revenue
 * figure uses to pick its currency.
 *
 * Returns null when there is no revenue to draw at all.
 */
export function dailyRevenueSpark(
  points: readonly RevenueTimeseriesPoint[],
  now: Date,
  days = 30,
): { currency: string; values: number[] } | null {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10));
  }
  const inWindow = new Set(keys);

  const totals = new Map<string, number>();
  for (const p of points) {
    if (!inWindow.has(p.date)) continue;
    totals.set(p.currency, (totals.get(p.currency) ?? 0) + p.revenue_minor);
  }
  let currency: string | null = null;
  for (const [c, total] of totals) {
    if (currency === null || total > (totals.get(currency) ?? 0)) currency = c;
  }
  if (currency === null) return null;

  const byDate = new Map<string, number>();
  for (const p of points) {
    if (p.currency === currency && inWindow.has(p.date)) {
      byDate.set(p.date, (byDate.get(p.date) ?? 0) + p.revenue_minor);
    }
  }
  return { currency, values: keys.map((k) => byDate.get(k) ?? 0) };
}
