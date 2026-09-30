import { describe, it, expect, vi } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PlatformMetricsOverview } from "@/lib/api/admin";
import { formatRevenue, revenueHeadline, revenueRows } from "@/lib/admin/revenue";
import { AnalyticsClient } from "@/app/admin/analytics/AnalyticsClient";

/**
 * Admin revenue is shown per currency from revenue_by_currency, headlined by
 * the largest currency with "+N more currencies", never a USD rollup.
 */

const METRICS: PlatformMetricsOverview = {
  verifiedProviders: { total: 3, distinctCountries: 1, byCountry: [{ country_code: "NG", count: 3 }] },
  subscriptions: {
    activeCount: 5,
    primaryCurrency: "NGN",
    primaryRevenueMinor: 1_250_000_00,
    primaryAverageMinor: 31_250_000,
    byCurrency: [
      { currency: "NGN", count: 4, totalMinor: 1_250_000_00, averageMinor: 31_250_000 },
      { currency: "GHS", count: 1, totalMinor: 50_000, averageMinor: 50_000 },
    ],
  },
  conversion: { totalUsers: 10, payingUsers: 5, conversionRate: 50 },
  revenue_by_currency: [
    { currency: "GHS", amount_minor: 50_000, count: 1 },
    { currency: "NGN", amount_minor: 1_250_000_00, count: 4 },
  ],
};

vi.mock("@/components/ds/AdminDashboardShell", () => ({
  AdminDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/api/admin", () => ({
  adminService: { getPlatformMetrics: vi.fn(async () => ({ success: true, data: METRICS })) },
}));

describe("admin revenue", () => {
  it("orders rows largest first and headlines the largest currency", () => {
    const rows = revenueRows(METRICS);
    expect(rows.map((r) => r.currency)).toEqual(["NGN", "GHS"]);
    expect(revenueHeadline(rows)).toEqual({ value: "₦1,250,000", more: 1, moreLabel: "+1 more currency" });
    expect(formatRevenue(rows[1])).toMatch(/500/);
    expect(revenueHeadline([])).toEqual({ value: "-", more: 0, moreLabel: null });
  });

  it("falls back to byCurrency from an older API", () => {
    const { revenue_by_currency: _unused, ...older } = METRICS;
    void _unused;
    expect(revenueRows(older as PlatformMetricsOverview).map((r) => [r.currency, r.amount_minor])).toEqual([
      ["NGN", 1_250_000_00],
      ["GHS", 50_000],
    ]);
  });

  it("shows the headline per currency on the analytics page, with no USD rollup", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <AnalyticsClient />
      </QueryClientProvider>,
    );
    const label = await screen.findByText("Subscription revenue");
    expect(label.nextSibling?.textContent).toBe("₦1,250,000");
    expect(label.nextSibling?.nextSibling?.textContent).toBe("+1 more currency");
    expect(screen.queryByText(/USD equivalent/)).toBeNull();
  });
});
