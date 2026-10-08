import type { RevenueTimeseriesPoint } from "@/lib/api/earnings";
import type { OrgCheckInDashboardStats } from "@/lib/types";
import { minorToMajor } from "@/lib/money/minorMoney";

/**
 * The overview's revenue currency: one currency for the "Revenue · 30d"
 * headline, its sparkline and the Revenue card, so the three never disagree.
 *
 * Currencies are never mixed (no FX) and never chosen by comparing amounts:
 * 150,000 kobo is about a dollar, so "the biggest number" picked naira for a
 * dollar gym. The preferred currency (the API's revenue_currency, else the
 * org's own) wins when it has revenue; otherwise the first currency, by
 * code, that does. With no revenue at all it stays the preferred one.
 */
export function pickRevenueCurrency(
  preferred: string | null | undefined,
  withRevenue: Iterable<string>,
): string | null {
  const present = [...new Set(withRevenue)].sort();
  const want = preferred?.trim().toUpperCase() || null;
  if (want && (present.length === 0 || present.includes(want))) return want;
  return present[0] ?? want;
}

function windowKeys(now: Date, days: number): string[] {
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    keys.push(new Date(now.getTime() - i * 86_400_000).toISOString().slice(0, 10));
  }
  return keys;
}

/** Currencies with ledger rows in the last `days` UTC days. */
export function seriesCurrencies(
  points: readonly RevenueTimeseriesPoint[],
  now: Date,
  days = 30,
): string[] {
  const inWindow = new Set(windowKeys(now, days));
  return [...new Set(points.filter((p) => inWindow.has(p.date)).map((p) => p.currency))];
}

/**
 * Daily settled revenue for the overview's revenue sparkline, from the org
 * ledger timeseries (GET /transactions/organizations/:id/timeseries).
 *
 * The API only returns days that had transactions, keyed by UTC date, one
 * row per currency. A sparkline needs one bar per day, so each of the last
 * `days` UTC dates gets its own value and a day with no rows is a real 0.
 * Only one currency is drawn: `currency` when given, else the one
 * pickRevenueCurrency would choose with no preference.
 *
 * Returns null when there is no revenue to draw in that currency.
 */
export function dailyRevenueSpark(
  points: readonly RevenueTimeseriesPoint[],
  now: Date,
  days = 30,
  currency?: string | null,
): { currency: string; values: number[] } | null {
  const keys = windowKeys(now, days);
  const inWindow = new Set(keys);
  const chosen = currency ?? pickRevenueCurrency(null, seriesCurrencies(points, now, days));
  if (!chosen) return null;

  const byDate = new Map<string, number>();
  for (const p of points) {
    if (p.currency === chosen && inWindow.has(p.date)) {
      byDate.set(p.date, (byDate.get(p.date) ?? 0) + p.revenue_minor);
    }
  }
  if (byDate.size === 0) return null;
  return { currency: chosen, values: keys.map((k) => byDate.get(k) ?? 0) };
}

/** Currencies the dashboard-stats breakdown says had revenue. */
export function statsCurrencies(stats: OrgCheckInDashboardStats | null): string[] {
  return (stats?.revenue_by_currency ?? [])
    .filter((r) => r.today_minor !== 0 || r.week_minor !== 0 || r.month_minor !== 0)
    .map((r) => r.currency);
}

/**
 * The Revenue card's figures, in MAJOR units of `currency`.
 *
 * With the API's revenue_currency fields, every figure is read in its own
 * currency: `currency` is the overview's revenue currency, and any other
 * currency the gym was paid in is listed in `others` (this month), never
 * added in. An API that predates those fields sent major units in a
 * currency it didn't name; those are shown as before, in the org currency.
 */
export function revenueCardFigures(
  stats: OrgCheckInDashboardStats,
  currency: string | null,
  orgCurrency: string | null,
): {
  currency: string | null;
  today: number;
  week: number;
  month: number;
  others: Array<{ currency: string; month: number }>;
} {
  if (stats.revenue_currency === undefined) {
    return {
      currency: orgCurrency,
      today: stats.revenue_today,
      week: stats.revenue_week,
      month: stats.revenue_month,
      others: [],
    };
  }
  const rows = stats.revenue_by_currency ?? [];
  const own =
    rows.find((r) => r.currency === currency) ??
    (currency && currency === stats.revenue_currency
      ? {
          today_minor: stats.revenue_today_minor ?? 0,
          week_minor: stats.revenue_week_minor ?? 0,
          month_minor: stats.revenue_month_minor ?? 0,
        }
      : { today_minor: 0, week_minor: 0, month_minor: 0 });
  const major = (minor: number) => (currency ? minorToMajor(minor, currency) : 0);
  return {
    currency,
    today: major(own.today_minor),
    week: major(own.week_minor),
    month: major(own.month_minor),
    others: rows
      .filter((r) => r.currency !== currency && r.month_minor !== 0)
      .map((r) => ({ currency: r.currency, month: minorToMajor(r.month_minor, r.currency) })),
  };
}
