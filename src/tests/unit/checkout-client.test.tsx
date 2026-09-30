import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "@/app/checkout/CheckoutClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { MembershipPlanType, type MarketplaceListing, type MarketplaceMembershipPlan } from "@/lib/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams("listing=l1&plan=p1"),
}));
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "u1", email: "ngozi@example.com", first_name: "Ngozi", last_name: "A" }, isLoading: false }),
}));
vi.mock("@/lib/payments/paystackInline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/paystackInline")>();
  return { ...actual, openPaystackCheckout: vi.fn() };
});

const listing = { _id: "l1", headline: "Iron Lab", professional_id: "pro-1" } as unknown as MarketplaceListing;
const plan: MarketplaceMembershipPlan = {
  _id: "p1",
  organization_id: "o1",
  created_by: "u2",
  name: "Monthly",
  plan_type: MembershipPlanType.SUBSCRIPTION,
  duration_days: 30,
  price_minor: 1_500_000,
  currency: "NGN",
  features: [],
  is_active: true,
  is_public: true,
  created_at: "",
  updated_at: "",
};
const checkout = {
  reference: "mbr_123",
  payment_reference: "paystack_mbr_123",
  access_code: "AC_mbr",
  authorization_url: "https://checkout.paystack.com/AC_mbr",
  amount_minor: 1_500_000,
  currency: "NGN",
  plan_id: "p1",
};

describe("plan checkout", () => {
  const open = vi.mocked(openPaystackCheckout);
  const start = vi.spyOn(marketplaceService, "startPlanCheckout");
  const subscribe = vi.spyOn(marketplaceService, "subscribeToListingPlan");

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(marketplaceService, "getListingById").mockResolvedValue({ success: true, data: listing });
    vi.spyOn(marketplaceService, "getPublicListingPlans").mockResolvedValue({ success: true, data: [plan] });
    start.mockResolvedValue({ success: true, data: checkout });
    subscribe.mockResolvedValue({ success: true, data: {} as never });
  });

  it("shows the plan price in its own currency and offers only Paystack", async () => {
    render(<CheckoutPage />);
    expect(await screen.findByRole("button", { name: "Pay ₦15,000 with Paystack" })).toBeInTheDocument();
    expect(screen.queryByText(/Stripe|Flutterwave|Card Payment/)).toBeNull();
  });

  it("starts the server checkout, opens its access code, then subscribes with the returned reference", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "mbr_123" });
    render(<CheckoutPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Pay .* with Paystack/ }));
    await waitFor(() => expect(subscribe).toHaveBeenCalled());
    expect(start).toHaveBeenCalledWith("l1", "p1");
    // Only the access code reaches Paystack: no amount, currency or key.
    expect(open.mock.calls[0]).toEqual(["AC_mbr"]);
    expect(subscribe).toHaveBeenCalledWith("l1", "p1", "paystack_mbr_123", 1_500_000);
    expect(push).toHaveBeenCalledWith("/checkout/success?listing=l1&plan=p1");
    expect(start.mock.invocationCallOrder[0]).toBeLessThan(open.mock.invocationCallOrder[0]);
    expect(open.mock.invocationCallOrder[0]).toBeLessThan(subscribe.mock.invocationCallOrder[0]);
  });

  it("subscribes to nothing when the popup is dismissed", async () => {
    open.mockResolvedValue({ closed: "dismissed" });
    render(<CheckoutPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Pay .* with Paystack/ }));
    await waitFor(() => expect(open).toHaveBeenCalled());
    expect(subscribe).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: /Pay .* with Paystack/ })).toBeEnabled());
  });

  it("shows why the API refused to start the payment, and opens nothing", async () => {
    start.mockResolvedValue({
      success: false,
      status: 400,
      code: "CURRENCY_NOT_SELECTABLE",
      message: "This price can't be paid right now.",
      details: { reasons: [{ code: "gateway_account_disabled", message: "Paystack can charge NGN, but it isn't enabled on our account" }] },
    });
    render(<CheckoutPage />);
    await userEvent.click(await screen.findByRole("button", { name: /Pay .* with Paystack/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This price can't be paid right now. Paystack can charge NGN, but it isn't enabled on our account.",
    );
    expect(open).not.toHaveBeenCalled();
    expect(subscribe).not.toHaveBeenCalled();
  });

  it("falls back to the hosted checkout when the popup can't load", async () => {
    open.mockRejectedValue(new PaystackUnavailableError());
    const assign = vi.fn();
    const original = window.location;
    Object.defineProperty(window, "location", { configurable: true, value: { ...original, assign } });
    try {
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("button", { name: /Pay .* with Paystack/ }));
      await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.paystack.com/AC_mbr"));
      expect(subscribe).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(window, "location", { configurable: true, value: original });
    }
  });
});
