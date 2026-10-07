import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/setup/test-utils";
import GymOverviewClient from "./GymOverviewClient";

const org = { _id: "org-1", name: "Dapo Fitness Hub", currency: "NGN", owner_id: "u-1" };

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: org, isLoading: false }),
  useOptionalOrganization: () => ({ currentOrg: org, organizations: [org], isLoading: false }),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u-1", role: "GYM_OWNER", first_name: "Dapo" } }),
}));
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
  useRoleGuard: () => ({ user: { id: "u-1", role: "GYM_OWNER" }, isAuthorized: true, isLoading: false }),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard/gym-owner",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/components/OnboardingBanner", () => ({ default: () => null }));
const legacyStats = {
  today_check_ins: 3, week_check_ins: 9, month_check_ins: 40, active_members: 12,
  average_rating: 0, review_count: 0, revenue_today: 0, revenue_week: 50000, revenue_month: 50000,
  city: "Lagos", country_code: "NG", recent_check_ins: [],
};
// Replaced per test; the default is an API that predates revenue_currency.
let statsData: Record<string, unknown> = legacyStats;
vi.mock("@/lib/api/checkins", () => ({
  checkinsService: {
    getOrgDashboardStats: async () => ({ success: true, data: statsData }),
  },
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: { getOrgMembershipSubscriptions: async () => ({ success: true, data: [] }) },
}));
let seriesCurrency = "NGN";
let seriesRows: Array<{ date: string; revenue_minor: number; currency: string }> | null = null;
vi.mock("@/lib/api/earnings", () => ({
  earningsService: {
    getOrgTimeseries: async () => ({
      success: true,
      data: seriesRows ?? [{ date: new Date().toISOString().slice(0, 10), revenue_minor: 9_005_000, currency: seriesCurrency }],
    }),
  },
}));

describe("Gym overview", () => {
  beforeEach(() => {
    statsData = legacyStats;
    seriesRows = null;
  });

  it("has one serif word and the gym's own place in the subtitle", async () => {
    renderWithProviders(<GymOverviewClient />);
    // The subtitle's place comes from the stats call, so wait for it.
    const subtitle = await screen.findAllByText("Here's how Dapo Fitness Hub is doing · Lagos, NG", {}, { timeout: 5000 });
    expect(subtitle.length).toBeGreaterThan(0);
    const [h1] = screen.getAllByRole("heading", { level: 1 });
    expect(h1.textContent).toBe("Welcome back, Dapo");
    expect(h1.querySelectorAll("em")).toHaveLength(1);
  });

  it("shows real KPIs: revenue with its daily sparkline, check-ins and attendance, no churn", async () => {
    renderWithProviders(<GymOverviewClient />);
    expect((await screen.findAllByText("25% attendance", {}, { timeout: 5000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("img", { name: /Settled revenue per day in NGN/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Revenue · 30d").length).toBeGreaterThan(0);
    expect(screen.getAllByText("No reviews yet").length).toBeGreaterThan(0);
    expect(screen.queryByText(/churn/i)).toBeNull();
  });

  it("takes Revenue · 30d from the same series and currency as the sparkline", async () => {
    seriesCurrency = "NGN";
    renderWithProviders(<GymOverviewClient />);
    // 9,005,000 kobo in the series, not the stats' revenue_month of 50,000.
    expect((await screen.findAllByText("₦90,050", {}, { timeout: 5000 })).length).toBeGreaterThan(0);
    expect(screen.queryAllByText("USD")).toHaveLength(0);
  });

  it("shows the currency code when the revenue isn't in the org's currency", async () => {
    seriesCurrency = "USD";
    renderWithProviders(<GymOverviewClient />);
    expect((await screen.findAllByText("USD", {}, { timeout: 5000 })).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/90,050/)[0].textContent).toMatch(/\$/);
    expect(screen.getAllByRole("img", { name: /in USD/ }).length).toBeGreaterThan(0);
  });

  it("formats This month in the API's revenue currency, from minor units", async () => {
    // A single-currency NGN gym on the new API: 4,250,000 kobo is ₦42,500.
    statsData = {
      ...legacyStats,
      revenue_today: 0, revenue_week: 42500, revenue_month: 42500,
      revenue_today_minor: 0, revenue_week_minor: 4_250_000, revenue_month_minor: 4_250_000,
      revenue_currency: "NGN",
      revenue_by_currency: [{ currency: "NGN", today_minor: 0, week_minor: 4_250_000, month_minor: 4_250_000 }],
    };
    seriesRows = [{ date: new Date().toISOString().slice(0, 10), revenue_minor: 4_250_000, currency: "NGN" }];
    renderWithProviders(<GymOverviewClient />);
    // Headline and This month agree, with no currency code: it is the org's.
    expect((await screen.findAllByText("₦42,500", {}, { timeout: 5000 })).length).toBeGreaterThanOrEqual(3);
    expect(screen.getAllByText("Settled to date").length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/This month · /)).toHaveLength(0);
  });

  it("keeps a mixed-currency gym in its own currency and lists the other apart", async () => {
    // ₦12,000 (1,200,000 kobo) and $50 (5,000 cents): the old rule headlined
    // whichever raw number was bigger. NGN is the org's currency.
    statsData = {
      ...legacyStats,
      revenue_today: 120, revenue_week: 12000, revenue_month: 12000,
      revenue_today_minor: 12_000, revenue_week_minor: 1_200_000, revenue_month_minor: 1_200_000,
      revenue_currency: "NGN",
      revenue_by_currency: [
        { currency: "NGN", today_minor: 12_000, week_minor: 1_200_000, month_minor: 1_200_000 },
        { currency: "USD", today_minor: 0, week_minor: 5_000, month_minor: 9_000_000 },
      ],
    };
    const today = new Date().toISOString().slice(0, 10);
    seriesRows = [
      { date: today, revenue_minor: 1_200_000, currency: "NGN" },
      { date: today, revenue_minor: 9_000_000, currency: "USD" },
    ];
    renderWithProviders(<GymOverviewClient />);
    expect((await screen.findAllByText("₦12,000", {}, { timeout: 5000 })).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByRole("img", { name: /in NGN/ }).length).toBeGreaterThan(0);
    // The dollars are reported under their own code, never added in.
    expect(screen.getAllByText("This month · USD").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$90,000").length).toBeGreaterThan(0);
    expect(screen.queryAllByText(/₦102,000|₦90,012,000/)).toHaveLength(0);
  });

  it("labels the card and headline alike when revenue is only in another currency", async () => {
    statsData = {
      ...legacyStats,
      revenue_today: 0, revenue_week: 0, revenue_month: 0,
      revenue_today_minor: 0, revenue_week_minor: 0, revenue_month_minor: 0,
      revenue_currency: "NGN",
      revenue_by_currency: [{ currency: "USD", today_minor: 0, week_minor: 9_900, month_minor: 9_900 }],
    };
    seriesRows = [{ date: new Date().toISOString().slice(0, 10), revenue_minor: 9_900, currency: "USD" }];
    renderWithProviders(<GymOverviewClient />);
    expect((await screen.findAllByText("Settled to date · USD", {}, { timeout: 5000 })).length).toBeGreaterThan(0);
    // $99 on the headline (with its USD unit) and on This month.
    expect(screen.getAllByText("$99").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("USD").length).toBeGreaterThan(0);
  });
});
