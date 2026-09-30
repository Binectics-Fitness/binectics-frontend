/**
 * Platform revenue for admin surfaces, per currency and never summed across
 * currencies (there are no FX rates). Reads `revenue_by_currency` from
 * GET /admin/metrics/overview, falling back to `subscriptions.byCurrency`
 * from an API that predates it.
 */

import type { PlatformMetricsOverview } from "@/lib/api/admin";
import type { PlatformCurrency } from "@/lib/api/currencies";
import { formatMinor } from "@/lib/currencies/helpers";

export interface RevenueRow {
  currency: string;
  amount_minor: number;
  count: number;
}

/** Revenue rows, largest amount first (a display order, not an FX claim). */
export function revenueRows(metrics: Pick<PlatformMetricsOverview, "revenue_by_currency" | "subscriptions"> | null | undefined): RevenueRow[] {
  if (!metrics) return [];
  const rows: RevenueRow[] =
    metrics.revenue_by_currency ??
    (metrics.subscriptions?.byCurrency ?? []).map((b) => ({
      currency: b.currency,
      amount_minor: b.totalMinor,
      count: b.count,
    }));
  return rows
    .filter((r) => typeof r.currency === "string" && r.currency)
    .sort((a, b) => b.amount_minor - a.amount_minor || a.currency.localeCompare(b.currency));
}

/** One line per currency: "₦1,250,000". */
export function formatRevenue(row: RevenueRow, list?: readonly PlatformCurrency[] | null): string {
  return formatMinor(row.currency, row.amount_minor, { list });
}

/**
 * The headline: the largest currency's total, plus how many other currencies
 * there are. `value` is "-" with no revenue.
 */
export function revenueHeadline(
  rows: readonly RevenueRow[],
  list?: readonly PlatformCurrency[] | null,
): { value: string; more: number; moreLabel: string | null } {
  const top = rows[0];
  if (!top) return { value: "-", more: 0, moreLabel: null };
  const more = rows.length - 1;
  return {
    value: formatRevenue(top, list),
    more,
    moreLabel: more > 0 ? `+${more} more currenc${more === 1 ? "y" : "ies"}` : null,
  };
}
