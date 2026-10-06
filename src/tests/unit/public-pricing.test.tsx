import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";
import type { PublicProviderPlanOption } from "@/lib/api/providerBilling";
import { ProviderPricing } from "@/components/pricing/ProviderPricing";
import { MemberPricing } from "@/components/pricing/MemberPricing";
import {
  hasYearlyPrices,
  planFeatureLines,
  planPriceView,
  yearlySavingPercent,
} from "@/lib/pricing/publicPlans";
import { SEEDED_CURRENCIES } from "../setup/currencyFixtures";

/**
 * The pricing pages render the public plan catalogue as the API returns it:
 * amounts in the currency they came in, the API's reason when a price can't
 * be shown, and no member tiers at all.
 */

vi.mock("@/contexts/RegionContext", () => ({
  useRegion: () => ({ country: "US", isDetected: true }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencyList: () => ({ data: SEEDED_CURRENCIES, isPending: false, isError: false }),
}));

const LIMITS = { max_active_members: 10, max_membership_plans: 3, max_staff_members: 0, max_listings: 1 };
const FEATURES = {
  analytics_enabled: false,
  consultations_enabled: true,
  journals_enabled: true,
  qr_checkin_enabled: true,
  white_label_enabled: false,
  custom_domain_enabled: false,
  branded_email_enabled: false,
};

function plan(over: Partial<PublicProviderPlanOption>): PublicProviderPlanOption {
  return {
    code: "free" as PublicProviderPlanOption["code"],
    name: "Free",
    description: "Get started.",
    sort_order: 0,
    limits: LIMITS,
    features: FEATURES,
    prices: { month: null, year: null },
    is_self_serve: true,
    market_code: "NG",
    currency: null,
    price_unavailable_reason: null,
    ...over,
  };
}

const CATALOGUE: PublicProviderPlanOption[] = [
  plan({ prices: { month: { amount_minor: 0, currency: "NGN", minor_unit: 2 }, year: null }, currency: "NGN" }),
  plan({
    code: "pro" as PublicProviderPlanOption["code"],
    name: "Pro",
    description: "Grow your business.",
    sort_order: 1,
    limits: { ...LIMITS, max_active_members: 250 },
    prices: {
      month: { amount_minor: 500_000, currency: "NGN", minor_unit: 2 },
      year: { amount_minor: 5_000_000, currency: "NGN", minor_unit: 2 },
    },
    currency: "NGN",
  }),
  plan({
    code: "enterprise" as PublicProviderPlanOption["code"],
    name: "Enterprise",
    description: "Unlimited.",
    sort_order: 2,
    limits: { max_active_members: null, max_membership_plans: null, max_staff_members: null, max_listings: null },
    is_self_serve: false,
  }),
];

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe("planPriceView", () => {
  it("formats the amount in the currency the API returned", () => {
    const view = planPriceView(CATALOGUE[1], "month", SEEDED_CURRENCIES);
    expect(view.price).toBe("₦5,000");
    expect(view.priceSub).toBe("/ month");
    expect(planPriceView(CATALOGUE[1], "year").price).toBe("₦50,000");
  });

  it("shows the API's reason when a paid price is hidden", () => {
    const view = planPriceView(
      plan({ price_unavailable_reason: "Plans can't be paid in USD right now." }),
      "month",
    );
    expect(view.price).toBe("Unavailable");
    expect(view.priceSub).toBe("Plans can't be paid in USD right now.");
  });

  it("reads a zero price as free and a negotiated plan as custom", () => {
    expect(planPriceView(CATALOGUE[0], "month").price).toBe("Free");
    expect(planPriceView(CATALOGUE[2], "month").price).toBe("Custom");
  });

  it("derives the yearly saving and limits from the plan itself", () => {
    expect(yearlySavingPercent(CATALOGUE[1])).toBe(17);
    expect(hasYearlyPrices(CATALOGUE)).toBe(true);
    expect(planFeatureLines(CATALOGUE[1])).toContain("Up to 250 active members");
    expect(planFeatureLines(CATALOGUE[2])).toContain("Unlimited active members");
    expect(planFeatureLines(CATALOGUE[0])).toEqual(
      expect.arrayContaining(["Up to 10 active members", "No staff seats", "1 marketplace listing"]),
    );
  });
});

describe("ProviderPricing", () => {
  let get: ReturnType<typeof vi.spyOn>;
  afterEach(() => get.mockRestore());

  it("asks for the naira catalogue whatever the visitor's country, and renders it", async () => {
    get = vi.spyOn(apiClient, "get").mockResolvedValue({ success: true, data: CATALOGUE });
    render(<ProviderPricing />, { wrapper });

    expect(await screen.findByText("₦5,000")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith(
      "/provider-billing/plans?country=NG&audience=personal_trainer",
      false,
    );
    expect(screen.getByText("Custom")).toBeInTheDocument();
    expect(screen.getByText("Prices in NGN")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Gyms" }));
    await waitFor(() =>
      expect(get).toHaveBeenCalledWith("/provider-billing/plans?country=NG&audience=gym_owner", false),
    );
  });

  it("shows the reason when a price is null", async () => {
    get = vi.spyOn(apiClient, "get").mockResolvedValue({
      success: true,
      data: [
        plan({
          code: "pro" as PublicProviderPlanOption["code"],
          name: "Pro",
          price_unavailable_reason: "Plans can't be paid in USD right now.",
        }),
      ],
    });
    render(<ProviderPricing />, { wrapper });
    expect(await screen.findByText("Plans can't be paid in USD right now.")).toBeInTheDocument();
    expect(screen.queryByText(/\$/)).toBeNull();
  });

  it("falls back to neutral copy when the catalogue can't be read", async () => {
    get = vi.spyOn(apiClient, "get").mockResolvedValue({ success: false, message: "down" });
    render(<ProviderPricing />, { wrapper });
    expect(await screen.findByRole("link", { name: "See plans in your dashboard" }, { timeout: 4000 })).toBeInTheDocument();
    expect(screen.getByText("Prices are loading")).toBeInTheDocument();
  });
});

describe("MemberPricing", () => {
  it("has no tier and no price", () => {
    const { container } = render(<MemberPricing />);
    const text = container.textContent ?? "";
    expect(text).not.toMatch(/Premium|Family/);
    expect(text).not.toMatch(/[₦$£€]|\d/);
    expect(within(container).getByText("Joining is free.")).toBeInTheDocument();
    expect(text).toMatch(/in their currency/);
  });
});
