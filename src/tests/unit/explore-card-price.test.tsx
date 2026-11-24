import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  EXPLORE_CARD_COPY,
  cadencePeriodLabel,
  cadencePerLabel,
  listingFromPrice,
} from "@/lib/marketplace/exploreCardCopy";

/**
 * Web Explore card (board binectics-plans/design/web-explore-card): the price
 * says what it buys, worded as mobile's listingFromPrice, and the two flags
 * from api #354.
 */
const base = { average_rating: 4.8, review_count: 12, country_code: "NG", currency: "NGN", verification_badge: "none", photos: [], accepting_clients: true, has_free_intro: false };
const LISTINGS = [
  { ...base, _id: "l1", account_type: "gym_owner", headline: "Ikoyi Fitness Club", organization: { _id: "o1", name: "Ikoyi Fitness Club" }, price_from_minor: 2500000, price_cadence: "recurring", price_period_days: 30 },
  { ...base, _id: "l2", account_type: "personal_trainer", headline: "x", professional: { _id: "p2", first_name: "Eze", last_name: "Okafor" }, price_from_minor: 1200000, price_cadence: "session", has_free_intro: true },
  { ...base, _id: "l3", account_type: "gym_owner", headline: "Lekki Body Lab", organization: { _id: "o3", name: "Lekki Body Lab" }, price_from_minor: 3000000, price_cadence: "one_off", price_period_days: 30 },
  { ...base, _id: "l4", account_type: "personal_trainer", headline: "x", professional: { _id: "p4", first_name: "Bisi", last_name: "Adeyemi" }, price_from_minor: 1000000, price_cadence: "session", accepting_clients: false },
  { ...base, _id: "l5", account_type: "dietitian", headline: "x", professional: { _id: "p5", first_name: "Ada", last_name: "Nwosu" }, price_from_minor: 800000 },
];

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/marketplace",
}));
vi.mock("@/contexts/RegionContext", () => ({
  useRegion: () => ({ formatAmount: (n: number) => String(n), currency: "NGN", currencies: [] }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: null, isLoading: false }) }));
vi.mock("@/components/MarketplaceAuthCluster", () => ({ MarketplaceAuthCluster: () => null }));
vi.mock("@/components/marketplace/SaveListingButton", () => ({ SaveListingButton: () => null }));
vi.mock("@/lib/api/marketplace", () => ({
  marketplaceService: {
    searchListings: vi.fn(async () => ({
      success: true,
      data: { listings: LISTINGS, pagination: { page: 1, limit: 20, total: 5, total_pages: 1 } },
    })),
  },
}));

describe("listingFromPrice (mobile utils/plans.ts wording)", () => {
  it("words each cadence as mobile does", () => {
    expect(listingFromPrice({ price_from_minor: 2500000, currency: "NGN", price_cadence: "recurring", price_period_days: 30 })).toBe("From ₦25,000/month");
    expect(listingFromPrice({ price_from_minor: 1200000, currency: "NGN", price_cadence: "session" })).toBe("From ₦12,000/session");
    expect(listingFromPrice({ price_from_minor: 3000000, currency: "NGN", price_cadence: "one_off", price_period_days: 30 })).toBe("From ₦30,000 · One-off · 1 month");
    expect(listingFromPrice({ price_from_minor: 3000000, currency: "NGN", price_cadence: "one_off" })).toBe("From ₦30,000 · One-off");
    expect(listingFromPrice({ price_from_minor: 800000, currency: "NGN" })).toBe("From ₦8,000");
    expect(listingFromPrice({ price_from_minor: 1999, currency: "USD", price_cadence: "recurring", price_period_days: 365 })).toBe("From $19.99/year");
  });
  it("names no price without an amount or a currency", () => {
    expect(listingFromPrice({ currency: "NGN" })).toBeNull();
    expect(listingFromPrice({ price_from_minor: 100 })).toBeNull();
  });
  it("words periods as mobile does", () => {
    expect([7, 30, 31, 90, 365, 1, 14].map(cadencePeriodLabel)).toEqual(["1 week", "1 month", "1 month", "3 months", "1 year", "1 day", "14 days"]);
    expect([7, 30, 90, 365].map(cadencePerLabel)).toEqual(["/week", "/month", "/3 months", "/year"]);
  });
});

describe("Explore card", () => {
  it("shows the cadence, the free first session tag and the not-taking line", async () => {
    const { default: MarketplacePage } = await import("@/app/marketplace/page");
    render(<MarketplacePage />);
    const prices = await screen.findAllByTestId("card-price");
    expect(prices.map((p) => p.textContent)).toEqual([
      "From ₦25,000/month",
      "From ₦12,000/session",
      "From ₦30,000 · One-off · 1 month",
      "From ₦10,000/session",
      "From ₦8,000",
    ]);
    expect(screen.queryByText(/\/ plan/)).toBeNull();
    const eze = screen.getByRole("link", { name: /Eze Okafor/ });
    expect(within(eze).getByText(EXPLORE_CARD_COPY.freeFirstSession)).toBeTruthy();
    expect(screen.getAllByText(EXPLORE_CARD_COPY.freeFirstSession)).toHaveLength(1);
    const bisi = screen.getByRole("link", { name: /Bisi Adeyemi/ });
    expect(within(bisi).getByText(EXPLORE_CARD_COPY.notTakingClients)).toBeTruthy();
    expect(screen.getAllByText(EXPLORE_CARD_COPY.notTakingClients)).toHaveLength(1);
  });
});
