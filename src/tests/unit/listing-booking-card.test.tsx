import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ProviderPage from "@/app/marketplace/[listingId]/page";
import { marketplaceService } from "@/lib/api/marketplace";
import { MembershipPlanType, type MarketplaceMembershipPlan } from "@/lib/types";
import type { PlatformCurrency } from "@/lib/api/currencies";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useParams: () => ({ listingId: "l1" }),
  useRouter: () => ({ push, back: vi.fn(), replace: vi.fn() }),
}));

let authState: { user: { id: string } | null; isLoading: boolean } = { user: null, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));
vi.mock("@/components/MarketplaceAuthCluster", () => ({
  MarketplaceAuthCluster: () => null,
}));

const NGN: PlatformCurrency = {
  code: "NGN",
  name: "Nigerian naira",
  symbol: "₦",
  minor_unit: 2,
  selectable: { price: true, charge_card: true, charge_transfer: true } as PlatformCurrency["selectable"],
  suggested_for_countries: ["NG"],
  gateways: [{ gateway: "paystack", label: "Paystack", methods: ["card"] }],
};
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencies: () => ({ all: [NGN], data: [NGN] }),
}));

const listing = {
  _id: "l1",
  account_type: "dietitian",
  headline: "Nouriva",
  average_rating: 0,
  review_count: 0,
  organization_id: null,
  professional_id: { _id: "u1", first_name: "Ada", last_name: "Obi" },
};

const plan = (over: Partial<MarketplaceMembershipPlan>): MarketplaceMembershipPlan => ({
  _id: "p1",
  organization_id: "o1",
  created_by: "u1",
  name: "Plan",
  plan_type: MembershipPlanType.SUBSCRIPTION,
  duration_days: 30,
  price_minor: 0,
  currency: "NGN",
  features: [],
  is_active: true,
  is_public: true,
  created_at: "",
  updated_at: "",
  ...over,
});

const reset = plan({ _id: "p-reset", name: "Nourish and Reset", plan_type: MembershipPlanType.ONE_TIME, price_minor: 12_000_000 });
const eightWeek = plan({ _id: "p-8w", name: "8 WEEK PLAN", duration_days: 56, price_minor: 24_000_000 });
const usdMonthly = plan({ _id: "p-usd", name: "Remote monthly", price_minor: 4_500, currency: "USD" });

function givenPlans(plans: MarketplaceMembershipPlan[]) {
  vi.spyOn(marketplaceService, "getListingById").mockResolvedValue({ success: true, data: listing as never });
  vi.spyOn(marketplaceService, "getPublicListingPlans").mockResolvedValue({ success: true, data: plans });
  vi.spyOn(marketplaceService, "getListingReviews").mockResolvedValue({ success: true, data: { reviews: [] } as never });
}

async function bookingCard() {
  await screen.findByRole("heading", { level: 1 });
  return document.getElementById("booking-card") as HTMLElement;
}

describe("listing booking card", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState = { user: null, isLoading: false };
  });

  it("offers each plan as a radio, priced in the plan's own currency with its cadence", async () => {
    givenPlans([reset, eightWeek, usdMonthly]);
    render(<ProviderPage />);
    const card = within(await bookingCard());

    const group = card.getByRole("group", { name: "Plan" });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(3);
    expect(within(group).getByText("Nourish and Reset").closest("label")).toHaveTextContent(/₦120,000(\.00)? once/);
    expect(within(group).getByText("8 WEEK PLAN").closest("label")).toHaveTextContent(/₦240,000(\.00)? \/ 56 days/);
    expect(within(group).getByText("Remote monthly").closest("label")).toHaveTextContent(/\$45(\.00)? \/ month/);
  });

  it("keeps Continue disabled until a plan is chosen, then sends a signed-in member to checkout", async () => {
    authState = { user: { id: "m1" }, isLoading: false };
    givenPlans([reset, eightWeek]);
    render(<ProviderPage />);
    const card = within(await bookingCard());

    const cont = card.getByRole("button", { name: /Continue to checkout/ });
    expect(cont).toBeDisabled();
    expect(card.queryByText("Paid securely with Paystack")).toBeNull();

    await userEvent.click(card.getByRole("radio", { name: /8 WEEK PLAN/ }));
    expect(cont).toBeEnabled();
    expect(card.getByText("Paid securely with Paystack")).toBeInTheDocument();
    await userEvent.click(cont);
    expect(push).toHaveBeenCalledWith("/checkout?listing=l1&plan=p-8w");
  });

  it("sends a signed-out visitor to login with a return to the checkout", async () => {
    givenPlans([eightWeek]);
    render(<ProviderPage />);
    const card = within(await bookingCard());

    // One plan: already chosen.
    expect(card.getByRole("radio", { name: /8 WEEK PLAN/ })).toBeChecked();
    await userEvent.click(card.getByRole("button", { name: /Continue to checkout/ }));
    expect(push).toHaveBeenCalledWith(
      `/login?redirect=${encodeURIComponent("/checkout?listing=l1&plan=p-8w")}`,
    );
  });

  it("choosing a plan from the Plans section selects it in the card", async () => {
    givenPlans([reset, eightWeek]);
    render(<ProviderPage />);
    const card = within(await bookingCard());

    await userEvent.click(screen.getByRole("button", { name: "Choose Nourish and Reset" }));
    expect(card.getByRole("radio", { name: /Nourish and Reset/ })).toBeChecked();
    expect(screen.getByRole("button", { name: "Nourish and Reset chosen" })).toHaveAttribute("aria-pressed", "true");
  });

  it("with no plans says so and offers no checkout, and the session booking stays", async () => {
    givenPlans([]);
    render(<ProviderPage />);
    const card = within(await bookingCard());

    expect(card.getByText("No membership plans yet.")).toBeInTheDocument();
    expect(card.queryByRole("button", { name: /Continue to checkout/ })).toBeNull();
    expect(screen.getByRole("link", { name: "See available times" })).toBeInTheDocument();
  });

  it("drops the unverified mockup copy and the platform fee row", async () => {
    givenPlans([eightWeek]);
    render(<ProviderPage />);
    const card = within(await bookingCard());
    expect(screen.queryByText(/Cancel any time|24.hr review window/)).toBeNull();
    expect(card.queryByText("Platform fee")).toBeNull();
    expect(card.queryByText("Location")).toBeNull();
  });
});
