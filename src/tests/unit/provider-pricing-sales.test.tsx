import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentPricingModal } from "@/components/content/ContentPricingModal";
import { ContentSalesSection } from "@/components/content/ContentSalesSection";
import { paidContentService } from "@/lib/api/paidContent";
import { marketplaceService } from "@/lib/api/marketplace";
import { progressService } from "@/lib/api/progress";

let flagsOn = true;
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    data: { flags: { paid_content: flagsOn }, organizations: [] },
    isEnabled: () => flagsOn,
    isLoading: false,
  }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({ currentOrg: { _id: "org1" } }),
}));
vi.mock("@/lib/queries/currencies", () => ({
  useOrgPriceCurrencies: () => ({
    data: [
      { code: "NGN", name: "Naira", symbol: "₦", minor_unit: 2, selectable: true, route: "platform", reasons: [], payable: {} },
      { code: "USD", name: "Dollar", symbol: "$", minor_unit: 2, selectable: true, route: "platform", reasons: [], payable: {} },
    ],
    providerHint: "Your own payment account",
  }),
}));
vi.mock("@/components/Toast", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ok = <T,>(data: T) => ({ success: true as const, data });

describe("ContentPricingModal", () => {
  const setAccess = vi.spyOn(paidContentService, "setAccess");
  beforeEach(() => {
    setAccess.mockReset();
    vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue(
      ok([{ _id: "plan1", name: "Monthly Coaching", is_active: true }]) as never,
    );
    vi.spyOn(paidContentService, "listGrants").mockResolvedValue(ok([]));
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue(ok([]) as never);
  });

  const open = (rawAccess: unknown = undefined, onSaved = vi.fn()) =>
    render(
      <ContentPricingModal open onClose={() => {}} kind="program" itemId="p1" title="Strength Base" rawAccess={rawAccess} onSaved={onSaved} />,
    );

  it("saves a price as integer minor units", async () => {
    setAccess.mockResolvedValue(
      ok({ access: { mode: "paid", prices: [{ currency: "NGN", amountMinor: 1500000 }], includedPlanIds: [], showOnListing: true, sellerOrganizationId: null }, warnings: [] }),
    );
    const onSaved = vi.fn();
    open(undefined, onSaved);
    await userEvent.click(screen.getByRole("radio", { name: "Paid" }));
    await userEvent.click(await screen.findByRole("button", { name: "Add NGN" }));
    await userEvent.type(screen.getByLabelText("Price in NGN"), "15000");
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    await waitFor(() => expect(setAccess).toHaveBeenCalled());
    expect(setAccess).toHaveBeenCalledWith("program", "p1", {
      mode: "paid",
      prices: [{ currency: "NGN", amountMinor: 1500000 }],
      includedPlanIds: [],
      showOnListing: true,
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("will not save a paid item nobody can get", async () => {
    open();
    await userEvent.click(screen.getByRole("radio", { name: "Paid" }));
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/Add a price/);
    expect(setAccess).not.toHaveBeenCalled();
  });

  it("shows the API's refusal, e.g. a price below the minimum", async () => {
    setAccess.mockResolvedValue({
      success: false,
      code: "CONTENT_PRICE_BELOW_MINIMUM",
      message: "",
      details: { currency: "NGN", minimum_minor: 5000 },
    });
    open({ mode: "paid", prices: [{ currency: "NGN", amount_minor: 1000 }] });
    await userEvent.click(screen.getByRole("radio", { name: "Free" }));
    await userEvent.click(screen.getByRole("radio", { name: "Paid" }));
    await userEvent.type(screen.getByLabelText("Price in NGN"), "1");
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("lowest price Paystack can charge in NGN");
  });

  it("falls quiet when selling is not enabled for this workspace", async () => {
    setAccess.mockResolvedValue({ success: false, code: "FEATURE_DISABLED", message: "off" });
    open();
    await userEvent.click(screen.getByRole("radio", { name: "Paid" }));
    await userEvent.click(await screen.findByRole("button", { name: "Add NGN" }));
    await userEvent.type(screen.getByLabelText("Price in NGN"), "100");
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    expect(await screen.findByText("Selling programs and meal plans is not available yet.")).toBeInTheDocument();
  });
});

describe("ContentSalesSection", () => {
  const sale = {
    id: "s1", itemKind: "program" as const, itemId: "p1", itemName: "Strength Base", amountMinor: 1500000, currency: "NGN",
    status: "paid", reference: "itm_1", expiresAt: null, paidAt: "2026-10-20T10:00:00Z", refundedAt: null,
    buyerName: "Maya Ade", paymentRail: "platform",
  };
  beforeEach(() => {
    flagsOn = true;
    vi.restoreAllMocks();
  });

  it("renders nothing while paid content is off", () => {
    flagsOn = false;
    const spy = vi.spyOn(paidContentService, "sales");
    const { container } = render(<ContentSalesSection />);
    expect(container).toBeEmptyDOMElement();
    expect(spy).not.toHaveBeenCalled();
  });

  it("lists sales, notes platform-held money, and refunds only after confirming", async () => {
    vi.spyOn(paidContentService, "sales").mockResolvedValue(ok([sale]));
    const refund = vi.spyOn(paidContentService, "refund").mockResolvedValue(ok("requested" as const));
    render(<ContentSalesSection />);
    expect(await screen.findByText(/Maya Ade/)).toHaveTextContent("Held by Binectics");
    await userEvent.click(screen.getByRole("button", { name: /Refund Maya Ade/ }));
    expect(refund).not.toHaveBeenCalled();
    expect(await screen.findByText(/sent to us to process/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await waitFor(() => expect(refund).toHaveBeenCalledWith("s1"));
  });

  it("shows a refunded sale as a record with no refund button", async () => {
    vi.spyOn(paidContentService, "sales").mockResolvedValue(ok([{ ...sale, status: "refunded" }]));
    render(<ContentSalesSection />);
    expect(await screen.findByText("Refunded")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Refund / })).not.toBeInTheDocument();
  });
});
