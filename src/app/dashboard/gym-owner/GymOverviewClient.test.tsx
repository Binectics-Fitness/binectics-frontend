import { describe, expect, it, vi } from "vitest";
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
vi.mock("@/lib/api/checkins", () => ({
  checkinsService: {
    getOrgDashboardStats: async () => ({
      success: true,
      data: {
        today_check_ins: 3, week_check_ins: 9, month_check_ins: 40, active_members: 12,
        average_rating: 0, review_count: 0, revenue_today: 0, revenue_week: 50000, revenue_month: 50000,
        city: "Lagos", country_code: "NG", recent_check_ins: [],
      },
    }),
  },
}));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: { getOrgMembershipSubscriptions: async () => ({ success: true, data: [] }) },
}));
let seriesCurrency = "NGN";
vi.mock("@/lib/api/earnings", () => ({
  earningsService: {
    getOrgTimeseries: async () => ({
      success: true,
      data: [{ date: new Date().toISOString().slice(0, 10), revenue_minor: 9_005_000, currency: seriesCurrency }],
    }),
  },
}));

describe("Gym overview", () => {
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
});
