import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PromoCodeField } from "@/components/coupons/PromoCodeField";
import { DiscountCodesClient } from "@/app/dashboard/discount-codes/DiscountCodesClient";
import { couponsService, CouponDiscountType, CouponKind, type Coupon, type CouponQuote } from "@/lib/api/coupons";
import { couponErrorMessage, couponState, discountLabel, isValidCodeText } from "@/lib/coupons/couponUi";

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

const quote = (over: Partial<CouponQuote> = {}): CouponQuote => ({
  coupon_id: "c1",
  code: "SAVE10",
  kind: CouponKind.MEMBERSHIP,
  currency: "NGN",
  original_amount_minor: 5_000_000,
  discount_minor: 500_000,
  final_amount_minor: 4_500_000,
  free: false,
  floored: false,
  discount_type: CouponDiscountType.PERCENT,
  percent_off: 10,
  ...over,
});

const coupon = (over: Partial<Coupon> = {}): Coupon => ({
  id: "c1",
  organization_id: "org1",
  code: "SAVE10",
  label: null,
  discount_type: CouponDiscountType.PERCENT,
  percent_off: 10,
  amounts_minor: [],
  min_order_minor: [],
  applies_to: [CouponKind.MEMBERSHIP, CouponKind.BOOKING],
  expires_at: null,
  max_redemptions: 5,
  max_per_user: 1,
  used_count: 2,
  redeemed_count: 2,
  is_active: true,
  is_expired: false,
  created_at: null,
  ...over,
});

describe("coupon helpers", () => {
  it("maps API error codes to plain messages", () => {
    expect(couponErrorMessage({ code: "COUPON_EXPIRED" })).toBe("This code has expired.");
    expect(couponErrorMessage({ code: "COUPON_ALREADY_USED" })).toBe("You've already used this code.");
    expect(couponErrorMessage({ status: 429 })).toMatch(/Too many tries/);
    expect(couponErrorMessage({ code: "COUPON_BELOW_MINIMUM", details: { minimum_minor: 600000, currency: "NGN" } })).toMatch(/at least/);
    expect(couponErrorMessage({ message: "boom" })).toBe("boom");
  });
  it("labels discounts and states", () => {
    expect(discountLabel(coupon())).toBe("10% off");
    expect(couponState(coupon({ redeemed_count: 5 }))).toBe("used_up");
    expect(couponState(coupon({ is_active: false }))).toBe("inactive");
    expect(couponState(coupon({ is_expired: true }))).toBe("expired");
  });
  it("checks code text like the API", () => {
    expect(isValidCodeText("")).toBe(true);
    expect(isValidCodeText("AB")).toBe(false);
    expect(isValidCodeText("WELCOME10")).toBe(true);
    expect(isValidCodeText("bad code")).toBe(false);
  });
});

describe("PromoCodeField", () => {
  it("applies a valid code and shows the saving", async () => {
    const onChange = vi.fn();
    const validate = vi.fn().mockResolvedValue({ success: true, data: quote() });
    render(<PromoCodeField quote={null} onChange={onChange} validate={validate} />);
    await userEvent.click(screen.getByText("Have a code?"));
    await userEvent.type(screen.getByLabelText("Discount code"), "save10");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    await waitFor(() => expect(onChange).toHaveBeenCalledWith(quote()));
    expect(validate).toHaveBeenCalledWith("save10");
  });

  it("shows the API's reason when a code is refused and applies nothing", async () => {
    const onChange = vi.fn();
    const validate = vi.fn().mockResolvedValue({ success: false, code: "COUPON_EXHAUSTED" });
    render(<PromoCodeField quote={null} onChange={onChange} validate={validate} />);
    await userEvent.click(screen.getByText("Have a code?"));
    await userEvent.type(screen.getByLabelText("Discount code"), "FULL1");
    await userEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This code has been fully used.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows an applied code and lets it be removed; a free code says so", async () => {
    const onChange = vi.fn();
    render(<PromoCodeField quote={quote({ free: true, final_amount_minor: 0, discount_minor: 5_000_000 })} onChange={onChange} validate={vi.fn()} />);
    expect(screen.getByTestId("promo-applied")).toHaveTextContent("covers the whole price");
    await userEvent.click(screen.getByText("Remove"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});

describe("DiscountCodesClient", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("lists the provider's codes with usage", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [coupon(), coupon({ id: "c2", code: "OLD20", is_active: false })] });
    render(<DiscountCodesClient />);
    expect(await screen.findByText("SAVE10")).toBeInTheDocument();
    expect(screen.getByText("OLD20")).toBeInTheDocument();
    expect(screen.getAllByText("2 of 5 used")).toHaveLength(2);
  });

  it("switches a code off", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [coupon()] });
    const off = vi.spyOn(couponsService, "deactivate").mockResolvedValue({ success: true, data: coupon({ is_active: false }) });
    render(<DiscountCodesClient />);
    await userEvent.click(await screen.findByRole("button", { name: "Switch off" }));
    await waitFor(() => expect(off).toHaveBeenCalledWith("org1", "c1"));
    expect(await screen.findByRole("button", { name: "Switch on" })).toBeInTheDocument();
  });

  it("shows who used a code", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [coupon()] });
    vi.spyOn(couponsService, "redemptions").mockResolvedValue({
      success: true,
      data: [{ id: "r1", kind: CouponKind.MEMBERSHIP, member_name: "Ada Obi", currency: "NGN", original_amount_minor: 5_000_000, discount_minor: 500_000, final_amount_minor: 4_500_000, consumed_at: null }],
    });
    render(<DiscountCodesClient />);
    await userEvent.click(await screen.findByText("Who used it"));
    expect(await screen.findByText(/Ada Obi/)).toBeInTheDocument();
  });

  it("creates a percentage code from the modal", async () => {
    vi.spyOn(couponsService, "list").mockResolvedValue({ success: true, data: [] });
    const create = vi.spyOn(couponsService, "create").mockResolvedValue({ success: true, data: coupon({ code: "WELCOME10" }) });
    render(<DiscountCodesClient />);
    await userEvent.click(await screen.findByRole("button", { name: "New code" }));
    await userEvent.type(await screen.findByPlaceholderText("WELCOME10"), "welcome10");
    await userEvent.click(screen.getByRole("button", { name: "Create code" }));
    await waitFor(() => expect(create).toHaveBeenCalled());
    expect(create.mock.calls[0][1]).toMatchObject({ code: "WELCOME10", discount_type: "percent", percent_off: 10, max_per_user: 1 });
    expect(await screen.findByText("WELCOME10")).toBeInTheDocument();
  });
});
