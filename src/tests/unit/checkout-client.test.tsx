import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutPage from "@/app/checkout/CheckoutClient";
import { marketplaceService } from "@/lib/api/marketplace";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { MembershipPlanType, type MarketplaceListing, type MarketplaceMembershipPlan } from "@/lib/types";
import { memberBillingService } from "@/lib/api/memberBilling";

const push = vi.fn();
// One router for the whole run, as Next keeps it: a new object per render
// would re-run the page's load effect on every render.
const router = { push, back: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("listing=l1&plan=p1"),
}));
// One user object for the whole run, as the real AuthContext keeps it.
const authState = { user: { id: "u1", email: "ngozi@example.com", first_name: "Ngozi", last_name: "A" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
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

const CONSENT_TEXT =
  "Renew automatically. I authorise Iron Lab to charge this card ₦15,000.00 every 30 days for my Monthly membership, starting 7 Nov 2026, until I turn auto-renew off. Payments go to Iron Lab's own Paystack account.";
const offered = {
  offered: true as const,
  text_version: "mbr-renew-v1",
  text: CONSENT_TEXT,
  text_sha256: "a".repeat(64),
  rendered: {
    merchant_name: "Iron Lab",
    plan_name: "Monthly",
    collected_by: "provider" as const,
    amount_minor: 1_500_000,
    currency: "NGN",
    interval_days: 30,
    first_charge_at: "2026-11-07T00:00:00.000Z",
    reminder_hours: 72,
    price_notice_days: 7,
  },
};

describe("plan checkout", () => {
  const open = vi.mocked(openPaystackCheckout);
  const start = vi.spyOn(marketplaceService, "startPlanCheckout");
  const subscribe = vi.spyOn(marketplaceService, "subscribeToListingPlan");
  const consent = vi.spyOn(memberBillingService, "getPlanAutoRenewConsent");

  beforeEach(() => {
    vi.clearAllMocks();
    consent.mockResolvedValue({ success: true, data: { offered: false, reason: "no_provider_account" } });
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

  it("says so when the plans can't be loaded, instead of a blank page", async () => {
    vi.spyOn(marketplaceService, "getPublicListingPlans").mockResolvedValue({ success: false, message: "Network error" } as never);
    render(<CheckoutPage />);
    expect(await screen.findByText("We couldn't load this plan. Check your connection and try again.")).toBeInTheDocument();
  });

  it("says a plan is gone when the listing no longer offers it", async () => {
    vi.spyOn(marketplaceService, "getPublicListingPlans").mockResolvedValue({ success: true, data: [] });
    render(<CheckoutPage />);
    expect(await screen.findByText(/This plan isn't available anymore/)).toBeInTheDocument();
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

  describe("auto-renew consent", () => {
    it("shows no box when the API doesn't offer auto-renew", async () => {
      render(<CheckoutPage />);
      await screen.findByRole("button", { name: /Pay .* with Paystack/ });
      expect(consent).toHaveBeenCalledWith("l1", "p1");
      expect(screen.queryByRole("checkbox")).toBeNull();
      expect(screen.queryByText(/Renew automatically/)).toBeNull();
    });

    it("shows no box when the consent can't be read", async () => {
      consent.mockResolvedValue({ success: false, message: "Network error" });
      render(<CheckoutPage />);
      await screen.findByRole("button", { name: /Pay .* with Paystack/ });
      expect(screen.queryByRole("checkbox")).toBeNull();
    });

    it("shows the API's text word for word beside an unticked box", async () => {
      consent.mockResolvedValue({ success: true, data: offered });
      render(<CheckoutPage />);
      const box = await screen.findByRole("checkbox", { name: CONSENT_TEXT });
      expect(box).not.toBeChecked();
      expect(screen.getByText(CONSENT_TEXT)).toBeInTheDocument();
    });

    it("pays once, with no renewal, when the box is left unticked", async () => {
      consent.mockResolvedValue({ success: true, data: offered });
      open.mockResolvedValue({ closed: "callback", reference: "mbr_123" });
      render(<CheckoutPage />);
      await screen.findByRole("checkbox");
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      await waitFor(() => expect(subscribe).toHaveBeenCalled());
      expect(start).toHaveBeenCalledWith("l1", "p1");
      expect(start.mock.calls[0]).toHaveLength(2);
      expect(push).toHaveBeenCalledWith("/checkout/success?listing=l1&plan=p1");
    });

    it("sends the text's version and hash when the box is ticked, and says auto-renew is on", async () => {
      consent.mockResolvedValue({ success: true, data: offered });
      open.mockResolvedValue({ closed: "callback", reference: "mbr_123" });
      subscribe.mockResolvedValue({
        success: true,
        data: { auto_renew: true, collection_method: "card_auto" } as never,
      });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("checkbox"));
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      await waitFor(() => expect(subscribe).toHaveBeenCalled());
      expect(start).toHaveBeenCalledWith("l1", "p1", {
        save_card: true,
        text_version: "mbr-renew-v1",
        text_sha256: "a".repeat(64),
        channel: "web",
      });
      expect(push).toHaveBeenCalledWith("/checkout/success?listing=l1&plan=p1&renewal=on");
    });

    it("tells the success page when the card couldn't be saved", async () => {
      consent.mockResolvedValue({ success: true, data: offered });
      open.mockResolvedValue({ closed: "callback", reference: "mbr_123" });
      subscribe.mockResolvedValue({
        success: true,
        data: { auto_renew: false, collection_method: "offline" } as never,
      });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("checkbox"));
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      await waitFor(() =>
        expect(push).toHaveBeenCalledWith("/checkout/success?listing=l1&plan=p1&renewal=not_saved"),
      );
    });

    it("passes the API's reason the card wasn't saved to the success page", async () => {
      consent.mockResolvedValue({ success: true, data: offered });
      open.mockResolvedValue({ closed: "callback", reference: "mbr_123" });
      subscribe.mockResolvedValue({
        success: true,
        data: { auto_renew: false, collection_method: "offline", card_not_saved_reason: "terms_mismatch" } as never,
      });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("checkbox"));
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      await waitFor(() =>
        expect(push).toHaveBeenCalledWith(
          "/checkout/success?listing=l1&plan=p1&renewal=not_saved&reason=terms_mismatch",
        ),
      );
    });

    it("says a saved-card renewal is processing (RENEWAL_CHARGE_IN_PROGRESS) and opens nothing", async () => {
      start.mockResolvedValue({
        success: false,
        status: 409,
        code: "RENEWAL_CHARGE_IN_PROGRESS",
        message: "A renewal payment from the saved card is being processed right now.",
      });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("button", { name: /Pay .* with Paystack/ }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "A renewal payment from your saved card is being processed right now. Check back in a few minutes before paying again.",
      );
      expect(open).not.toHaveBeenCalled();
    });

    it("on 409 CONSENT_TEXT_CHANGED shows the new terms, unticked, and opens nothing", async () => {
      const changed = { ...offered, text: "Renew automatically. New price ₦18,000.00 every 30 days.", text_sha256: "b".repeat(64) };
      consent.mockResolvedValue({ success: true, data: offered });
      start.mockResolvedValue({
        success: false,
        status: 409,
        code: "CONSENT_TEXT_CHANGED",
        message: "The renewal terms changed since you opened this page. Please review them again.",
        details: { consent: changed },
      });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("checkbox"));
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      const box = await screen.findByRole("checkbox", { name: changed.text });
      expect(box).not.toBeChecked();
      expect(screen.getByRole("status")).toHaveTextContent(/renewal terms changed/);
      expect(screen.queryByText(CONSENT_TEXT)).toBeNull();
      expect(open).not.toHaveBeenCalled();
    });

    it("on 409 without the new terms in the body, reads them again", async () => {
      const changed = { ...offered, text: "Renew automatically. Changed.", text_sha256: "c".repeat(64) };
      consent.mockResolvedValueOnce({ success: true, data: offered }).mockResolvedValueOnce({ success: true, data: changed });
      start.mockResolvedValue({ success: false, status: 409, code: "CONSENT_TEXT_CHANGED", message: "changed" });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("checkbox"));
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      expect(await screen.findByRole("checkbox", { name: changed.text })).not.toBeChecked();
      expect(consent).toHaveBeenCalledTimes(2);
    });

    it("on 400 AUTO_RENEW_NOT_AVAILABLE shows why and hides the box", async () => {
      consent.mockResolvedValue({ success: true, data: offered });
      start.mockResolvedValue({
        success: false,
        status: 400,
        code: "AUTO_RENEW_NOT_AVAILABLE",
        message: "Automatic renewal is not available for this plan.",
        details: { reason: "no_provider_account" },
      });
      render(<CheckoutPage />);
      await userEvent.click(await screen.findByRole("checkbox"));
      await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
      expect(await screen.findByRole("alert")).toHaveTextContent(
        "This provider doesn't take automatic card payments yet.",
      );
      expect(screen.queryByRole("checkbox")).toBeNull();
      expect(open).not.toHaveBeenCalled();
    });
  });
});
