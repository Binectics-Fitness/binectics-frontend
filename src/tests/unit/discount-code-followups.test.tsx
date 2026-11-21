import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DiscountCodesClient } from "@/app/dashboard/discount-codes/DiscountCodesClient";
import CheckoutPage from "@/app/checkout/CheckoutClient";
import { couponsService, CouponDiscountType, CouponKind, type Coupon, type CouponQuote } from "@/lib/api/coupons";
import { renewalsLabel } from "@/lib/coupons/couponUi";
import { marketplaceService } from "@/lib/api/marketplace";
import { memberBillingService } from "@/lib/api/memberBilling";
import { openPaystackCheckout } from "@/lib/payments/paystackInline";
import { MembershipPlanType, type MarketplaceListing, type MarketplaceMembershipPlan } from "@/lib/types";
import { GYM_NAV_ACCESS, TeamPermission as P, allows, gymPageRule, gymViewer } from "@/lib/gymStaffNav";
import { ChargeRefundPanel } from "@/components/refunds/ChargeRefundPanel";
import { refundsService, type ChargeRefundQuote } from "@/lib/api/refunds";
import { renderWithProviders } from "@/tests/setup/test-utils";

vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "org1" }, isLoading: false }),
}));
vi.mock("@/components/ds/WorkspaceShell", () => ({
  WorkspaceShell: ({ children, actions }: { children: React.ReactNode; actions?: React.ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({
    data: [{ code: "NGN", name: "Naira", symbol: "₦", minor_unit: 2, selectable: true, route: "platform", reasons: [], payable: {} }],
    providerHint: "Your own payment account",
  }),
}));
const router = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  useSearchParams: () => new URLSearchParams("listing=l1&plan=p1"),
}));
const authState = { user: { id: "u1", email: "ngozi@example.com", first_name: "Ngozi", last_name: "A" }, isLoading: false };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState }));
vi.mock("@/lib/payments/paystackInline", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/paystackInline")>();
  return { ...actual, openPaystackCheckout: vi.fn() };
});

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: "c1", organization_id: "org1", code: "SAVE10", label: null,
  discount_type: CouponDiscountType.PERCENT, percent_off: 10, amounts_minor: [], min_order_minor: [],
  applies_to: [CouponKind.MEMBERSHIP, CouponKind.BOOKING], expires_at: null, max_redemptions: 5,
  max_per_user: 1, apply_to_renewals: 0, return_on_refund: false,
  used_count: 2, redeemed_count: 2, is_active: true, is_expired: false, created_at: null, ...over,
});

describe("provider UI: renewals and give-back settings", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("both settings default to off: nothing extra is sent when the provider leaves them alone", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [] });
    const create = vi.spyOn(couponsService, "create").mockResolvedValue({ success: true, data: coupon({ code: "WELCOME10" }) });
    render(<DiscountCodesClient />);
    await userEvent.click(await screen.findByRole("button", { name: "New code" }));
    expect((await screen.findByLabelText(/Apply to the first N renewals/)) as HTMLInputElement).toHaveValue("0");
    expect(screen.getByLabelText(/Give the code back when the payment is refunded/)).not.toBeChecked();
    await userEvent.type(screen.getByPlaceholderText("WELCOME10"), "welcome10");
    await userEvent.click(screen.getByRole("button", { name: "Create code" }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    const input = create.mock.calls[0][1];
    expect(input).not.toHaveProperty("apply_to_renewals");
    expect(input).not.toHaveProperty("return_on_refund");
  });

  it("sends the renewals count and the give-back flag when the provider sets them", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [] });
    const create = vi.spyOn(couponsService, "create").mockResolvedValue({ success: true, data: coupon() });
    render(<DiscountCodesClient />);
    await userEvent.click(await screen.findByRole("button", { name: "New code" }));
    const n = await screen.findByLabelText(/Apply to the first N renewals/);
    await userEvent.clear(n);
    await userEvent.type(n, "3");
    await userEvent.click(screen.getByLabelText(/Give the code back when the payment is refunded/));
    await userEvent.type(screen.getByPlaceholderText("WELCOME10"), "spring");
    await userEvent.click(screen.getByRole("button", { name: "Create code" }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][1]).toMatchObject({ apply_to_renewals: 3, return_on_refund: true });
  });

  it("a 100% code cannot be set to carry into renewals", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [] });
    render(<DiscountCodesClient />);
    await userEvent.click(await screen.findByRole("button", { name: "New code" }));
    const pct = screen.getByLabelText("Percent off");
    await userEvent.clear(pct);
    await userEvent.type(pct, "100");
    const n = screen.getByLabelText(/Apply to the first N renewals/);
    await userEvent.clear(n);
    await userEvent.type(n, "1");
    await userEvent.type(screen.getByPlaceholderText("WELCOME10"), "free1");
    expect(await screen.findByText(/A 100% code can't carry into renewals/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create code" })).toBeDisabled();
  });

  it("the list says which codes carry into renewals and which are given back", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({
      success: true,
      data: [coupon({ apply_to_renewals: 2, return_on_refund: true }), coupon({ id: "c2", code: "PLAIN" })],
    });
    render(<DiscountCodesClient />);
    expect(await screen.findByText(/Also on the first 2 renewals/)).toBeInTheDocument();
    expect(screen.getByText(/Given back on a full refund/)).toBeInTheDocument();
    expect(screen.getAllByText(/Also on the first/)).toHaveLength(1);
    expect(renewalsLabel({ apply_to_renewals: 1 })).toBe("Also on the first renewal");
    expect(renewalsLabel({ apply_to_renewals: 0 })).toBeNull();
  });
});

describe("nav: Discount codes only for people who can manage", () => {
  const staff = (perms: string[]) => gymViewer({ is_owner: false, owner_id: "boss", my_permissions: perms }, "u1");
  it("shows it to the owner and to staff holding coupons:manage, hides it from everyone else", () => {
    const rule = GYM_NAV_ACCESS["Discount codes"];
    expect(allows(gymViewer({ is_owner: true }, "u1"), rule)).toBe(true);
    expect(allows(staff([P.COUPONS_MANAGE]), rule)).toBe(true);
    expect(allows(staff([P.MARKETPLACE_MANAGE_LISTING, P.BOOKINGS_MANAGE, P.VIEW_MEMBERS]), rule)).toBe(false);
    expect(allows(staff([]), rule)).toBe(false);
  });
  it("a deep link to the page asks for the same permission", () => {
    expect(gymPageRule("/dashboard/discount-codes")).toEqual({ all: [P.COUPONS_MANAGE] });
  });
});

describe("refund dialog explains the code", () => {
  let orgQuote: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    orgQuote = vi.spyOn(refundsService, "orgQuote");
  });
  const quote = (discount_code: ChargeRefundQuote["charge"]["discount_code"]): ChargeRefundQuote => ({
    charge: {
      id: "tx1", type: "subscription", amount_minor: 4_050_000, currency: "NGN", occurred_at: "2026-10-01T10:00:00Z",
      reference_type: "membership_subscription", reference_id: "s1", member_user_id: "m1", discount_code,
    },
    payment_rail: "provider", action: "refund", refundable_minor: 4_050_000, refunded_minor: 0, refunds: [],
  });
  it("says a full refund gives the code back when the code is set to", async () => {
    orgQuote.mockResolvedValue({ success: true, data: quote({ code: "SAVE10", gives_back_on_full_refund: true }) });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    const note = await screen.findByTestId("refund-code-note");
    expect(note).toHaveTextContent("SAVE10");
    expect(note).toHaveTextContent("gives the code back");
    expect(note).toHaveTextContent("A partial refund does not");
  });
  it("says it does not by default, and shows nothing when no code was used", async () => {
    orgQuote.mockResolvedValue({ success: true, data: quote({ code: "SAVE10", gives_back_on_full_refund: false }) });
    const a = renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    expect(await screen.findByTestId("refund-code-note")).toHaveTextContent("does not give the code back");
    a.unmount();
    orgQuote.mockResolvedValue({ success: true, data: quote(null) });
    renderWithProviders(<ChargeRefundPanel mode="provider" orgId="o1" chargeId="tx1" />);
    await screen.findByTestId("charge-refund-panel");
    expect(screen.queryByTestId("refund-code-note")).toBeNull();
  });
});

describe("checkout: a code that carries into renewals", () => {
  const open = vi.mocked(openPaystackCheckout);
  let start: ReturnType<typeof vi.spyOn>;
  let consent: ReturnType<typeof vi.spyOn>;
  const listing = { _id: "l1", headline: "Iron Lab", professional_id: "pro-1" } as unknown as MarketplaceListing;
  const plan: MarketplaceMembershipPlan = {
    _id: "p1", organization_id: "o1", created_by: "u2", name: "Monthly", plan_type: MembershipPlanType.SUBSCRIPTION,
    duration_days: 30, price_minor: 1_500_000, currency: "NGN", features: [], is_active: true, is_public: true, created_at: "", updated_at: "",
  };
  const offered = (text: string, version: string, sha: string) => ({
    offered: true as const, text_version: version, text, text_sha256: sha,
    rendered: {
      merchant_name: "Iron Lab", plan_name: "Monthly", collected_by: "provider" as const, amount_minor: 1_500_000, currency: "NGN",
      interval_days: 30, first_charge_at: "2026-11-07T00:00:00.000Z", reminder_hours: 72, price_notice_days: 7,
    },
  });
  const plain = offered("Renew automatically. PLAIN TEXT", "mbr-renew-v1", "a".repeat(64));
  const withCode = offered("Renew automatically. My first 2 renewal charges are discounted with code SAVE10 (10% off each).", "mbr-renew-v1-code", "b".repeat(64));
  const q = (over: Partial<CouponQuote> = {}): CouponQuote => ({
    coupon_id: "c1", code: "SAVE10", kind: CouponKind.MEMBERSHIP, currency: "NGN", original_amount_minor: 1_500_000,
    discount_minor: 150_000, final_amount_minor: 1_350_000, free: false, floored: false, discount_type: CouponDiscountType.PERCENT,
    percent_off: 10, apply_to_renewals: 2, renewal_amount_minor: 1_350_000, renewal_discount_minor: 150_000, ...over,
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    start = vi.spyOn(marketplaceService, "startPlanCheckout");
    consent = vi.spyOn(memberBillingService, "getPlanAutoRenewConsent");
    vi.spyOn(marketplaceService, "getListingById").mockResolvedValue({ success: true, data: listing });
    vi.spyOn(marketplaceService, "getPublicListingPlans").mockResolvedValue({ success: true, data: [plan] });
    vi.spyOn(marketplaceService, "getMyMembershipSubscriptions").mockResolvedValue({ success: true, data: [] });
    vi.spyOn(marketplaceService, "subscribeToListingPlan").mockResolvedValue({ success: true, data: {} as never });
    consent.mockImplementation((async (_l: string, _p: string, code?: string) => ({ success: true, data: code ? withCode : plain })) as never);
    start.mockResolvedValue({
      success: true,
      data: { reference: "mbr_1", payment_reference: "paystack_mbr_1", access_code: "AC", authorization_url: null, amount_minor: 1_350_000, currency: "NGN", plan_id: "p1" },
    });
    open.mockResolvedValue({ closed: "dismissed" });
  });

  const applyCode = async (quote: CouponQuote) => {
    vi.spyOn(couponsService, "validatePlanCode").mockResolvedValue({ success: true, data: quote });
    await userEvent.click(await screen.findByText("Have a code?"));
    await userEvent.type(screen.getByLabelText("Discount code"), "save10");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
  };

  it("fetches the code's own consent text, shows it unticked, and sends the code WITH the renewal echo", async () => {
    render(<CheckoutPage />);
    await applyCode(q());
    expect(await screen.findByText(/first 2 renewal charges are discounted with code SAVE10/)).toBeInTheDocument();
    expect(consent).toHaveBeenLastCalledWith("l1", "p1", "SAVE10");
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();
    await userEvent.click(box);
    expect(screen.getByText(/Your first 2 renewals are discounted too \(₦13,500 at today's price\), then the full price/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
    await waitFor(() => expect(start).toHaveBeenCalled());
    expect(start).toHaveBeenCalledWith(
      "l1", "p1",
      { save_card: true, text_version: "mbr-renew-v1-code", text_sha256: "b".repeat(64), channel: "web" },
      "SAVE10",
    );
  });

  it("a code that does not carry into renewals offers no auto-renew box and says why", async () => {
    render(<CheckoutPage />);
    await applyCode(q({ apply_to_renewals: 0, renewal_amount_minor: null, renewal_discount_minor: null }));
    expect(await screen.findByTestId("promo-no-renew")).toHaveTextContent(/only discounts the first payment/);
    expect(screen.queryByRole("checkbox")).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
    await waitFor(() => expect(start).toHaveBeenCalled());
    expect(start).toHaveBeenCalledWith("l1", "p1", undefined, "SAVE10");
  });

  it("removing the code goes back to the plain text and unticks the box", async () => {
    render(<CheckoutPage />);
    await applyCode(q());
    await userEvent.click(await screen.findByRole("checkbox"));
    await userEvent.click(screen.getByText("Remove"));
    expect(await screen.findByText(/PLAIN TEXT/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("when the code's renewal terms changed, shows the new text unticked and does not open the payment", async () => {
    start.mockResolvedValueOnce({ success: false, status: 409, code: "CONSENT_TEXT_CHANGED", message: "changed" } as never);
    render(<CheckoutPage />);
    await applyCode(q());
    await userEvent.click(await screen.findByRole("checkbox"));
    await userEvent.click(screen.getByRole("button", { name: /Pay .* with Paystack/ }));
    expect(await screen.findByText(/renewal terms changed since you opened this page/)).toBeInTheDocument();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(open).not.toHaveBeenCalled();
  });
});
