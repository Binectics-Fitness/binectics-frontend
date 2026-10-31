import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContentPricingModal } from "@/components/content/ContentPricingModal";
import { ContentSalesSection } from "@/components/content/ContentSalesSection";
import { paidContentService } from "@/lib/api/paidContent";
import { marketplaceService } from "@/lib/api/marketplace";
import { progressService } from "@/lib/api/progress";
import { usePaidContentSeller } from "@/hooks/usePaidContentSeller";

let flagsOn = true;
// The workspace the provider is in; `owner_id` decides whether they own it.
let org: Record<string, unknown> | null = { _id: "org1", owner_id: "u1", is_owner: true };
let flagOrgSeen: unknown;
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    data: { flags: { paid_content: flagsOn }, organizations: [] },
    isEnabled: (_k: string, orgId?: string | null) => {
      flagOrgSeen = orgId;
      return flagsOn;
    },
    isLoading: false,
  }),
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOptionalOrganization: () => ({ currentOrg: org }),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "u1", role: "TRAINER" } }) }));
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

describe("ContentPricingModal: unsaved edits, warnings, grants", () => {
  const paidRaw = { mode: "paid", prices: [{ currency: "NGN", amount_minor: 1500000 }], included_in_plan_ids: [], show_on_listing: true };
  const onClose = vi.fn();
  beforeEach(() => {
    onClose.mockReset();
    vi.restoreAllMocks();
    vi.spyOn(marketplaceService, "getOrgMembershipPlans").mockResolvedValue(
      ok([{ _id: "plan1", name: "Monthly Coaching", is_active: true }]) as never,
    );
    vi.spyOn(paidContentService, "listGrants").mockResolvedValue(ok([]));
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue(ok([]) as never);
  });
  const mount = (rawAccess: unknown = paidRaw, onSaved = vi.fn()) =>
    render(<ContentPricingModal open onClose={onClose} kind="program" itemId="p1" title="Base" rawAccess={rawAccess} onSaved={onSaved} />);

  it("closes at once when nothing changed", async () => {
    mount();
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before the footer Close throws away a Free/Paid switch", async () => {
    mount();
    await userEvent.click(screen.getByRole("radio", { name: "Free" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
    expect(onClose).not.toHaveBeenCalled();
    expect(await screen.findByText("Discard changes?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks before closing after a plan tick or the listing checkbox", async () => {
    mount();
    await userEvent.click(await screen.findByRole("checkbox", { name: "Monthly Coaching" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
    expect(await screen.findByText("Discard changes?")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(onClose).not.toHaveBeenCalled();
    // Undoing the tick makes it clean again.
    await userEvent.click(screen.getByRole("checkbox", { name: "Monthly Coaching" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[1]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("asks once (not twice) for the X as well", async () => {
    mount();
    await userEvent.click(screen.getByRole("checkbox", { name: "Show it on my listing" }));
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);
    expect(await screen.findAllByText("Discard changes?")).toHaveLength(1);
  });

  it("keeps the API's warnings after our own save is handed back as rawAccess", async () => {
    const saved = { mode: "paid", prices: [{ currency: "NGN", amountMinor: 2000000 }], includedPlanIds: [], showOnListing: true, sellerOrganizationId: null };
    vi.spyOn(paidContentService, "setAccess").mockResolvedValue(ok({ access: saved, warnings: ["A free program can't include this meal plan."] }));
    function Parent() {
      const [raw, setRaw] = useState<unknown>(paidRaw);
      return (
        <ContentPricingModal
          open
          onClose={onClose}
          kind="program"
          itemId="p1"
          title="Base"
          rawAccess={raw}
          onSaved={() => setRaw({ mode: "paid", prices: [{ currency: "NGN", amount_minor: 2000000 }], included_in_plan_ids: [], show_on_listing: true })}
        />
      );
    }
    render(<Parent />);
    await userEvent.click(await screen.findByRole("checkbox", { name: "Show it on my listing" }));
    await userEvent.click(screen.getByRole("button", { name: "Save pricing" }));
    expect(await screen.findByText("A free program can't include this meal plan.")).toBeInTheDocument();
    // The parent re-rendered with the saved block; the warning is still there and the form is clean.
    await waitFor(() => expect(screen.getByRole("button", { name: "Save pricing" })).toBeDisabled());
    expect(screen.getByText("A free program can't include this meal plan.")).toBeInTheDocument();
  });

  it("shows an error with a retry, not 'nobody', when the grants fail to load", async () => {
    const list = vi
      .spyOn(paidContentService, "listGrants")
      .mockResolvedValueOnce({ success: false, message: "offline" })
      .mockResolvedValue(ok([{ id: "g1", clientId: "cu1", createdAt: null }]));
    mount();
    expect(await screen.findByText(/We couldn't load who has it/)).toBeInTheDocument();
    expect(screen.queryByText("Nobody has it for free yet.")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Client ending cu1")).toBeInTheDocument();
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("names a grant's client when known, and tells unknown ones apart", async () => {
    vi.spyOn(paidContentService, "listGrants").mockResolvedValue(
      ok([
        { id: "g1", clientId: "cu1", createdAt: null },
        { id: "g2", clientId: "user-9999", createdAt: null },
      ]),
    );
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue(
      ok([{ _id: "cp1", client_id: { _id: "cu1", first_name: "Maya", last_name: "Ade", email: "m@x.test" }, organization_id: null }]) as never,
    );
    mount();
    expect(await screen.findByText("Maya Ade")).toBeInTheDocument();
    expect(screen.getByText("Client ending 9999")).toBeInTheDocument();
  });

  it("gives access by the client's PROFILE id and reports a refusal in the API's words", async () => {
    vi.spyOn(progressService, "getMyClientProfiles").mockResolvedValue(
      ok([{ _id: "cp1", client_id: { _id: "cu1", first_name: "Maya", last_name: "Ade", email: "m@x.test" }, organization_id: null }]) as never,
    );
    const grant = vi
      .spyOn(paidContentService, "grant")
      .mockResolvedValue({ success: false, code: "CONTENT_NOT_FOR_SALE", message: "" });
    const { toast } = await import("@/components/Toast");
    mount();
    await userEvent.selectOptions(await screen.findByLabelText("Give it to a client"), "cp1");
    await userEvent.click(screen.getByRole("button", { name: "Give for free" }));
    expect(grant).toHaveBeenCalledWith("program", "p1", "cp1");
    expect(toast.error).toHaveBeenCalledWith("This isn't for sale on its own right now.");
  });
});

describe("paid content: who may price and refund (current workspace)", () => {
  beforeEach(() => {
    flagsOn = true;
    org = { _id: "org1", owner_id: "u1", is_owner: true };
  });

  it("lets the workspace's owner price and refund, asking the flag about that workspace", () => {
    const { result } = renderHook(() => usePaidContentSeller());
    expect(result.current).toMatchObject({ on: true, ownsWorkspace: true, canPrice: true });
    expect(flagOrgSeen).toBe("org1");
  });

  it("keeps a gym's staff trainer from pricing or refunding", () => {
    org = { _id: "gym1", owner_id: "boss", is_owner: false, my_role_code: "consultant" };
    const { result } = renderHook(() => usePaidContentSeller());
    expect(result.current).toMatchObject({ on: true, ownsWorkspace: false, canPrice: false });
  });

  it("uses the global flag and leaves it to the API with no workspace", () => {
    org = null;
    const { result } = renderHook(() => usePaidContentSeller());
    expect(flagOrgSeen).toBeNull();
    expect(result.current).toMatchObject({ on: true, ownsWorkspace: false, canPrice: true });
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
    org = { _id: "org1", owner_id: "u1", is_owner: true };
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

  it("hides Refund from someone who does not own the workspace, but still lists the sale", async () => {
    org = { _id: "gym1", owner_id: "boss", is_owner: false };
    vi.spyOn(paidContentService, "sales").mockResolvedValue(ok([sale]));
    render(<ContentSalesSection />);
    expect(await screen.findByText(/Maya Ade/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Refund/ })).not.toBeInTheDocument();
  });

  it("keeps the loaded pages after a refund and marks a requested one so it can't be clicked twice", async () => {
    const mk = (id: string, name: string) => ({ ...sale, id, buyerName: name });
    const page1 = Array.from({ length: 25 }, (_, i) => mk(`a${i}`, `Buyer ${i}`));
    const sales = vi
      .spyOn(paidContentService, "sales")
      .mockResolvedValueOnce(ok(page1))
      .mockResolvedValueOnce(ok([mk("b0", "Late Buyer")]));
    const refund = vi.spyOn(paidContentService, "refund").mockResolvedValue(ok("requested" as const));
    render(<ContentSalesSection />);
    await screen.findByText(/Buyer 0/);
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    await screen.findByText(/Late Buyer/);
    await userEvent.click(screen.getByRole("button", { name: /Refund Late Buyer/ }));
    await userEvent.click(screen.getByRole("button", { name: "Refund" }));
    await waitFor(() => expect(refund).toHaveBeenCalledWith("b0"));
    expect(await screen.findByText("Refund requested")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Refund Late Buyer/ })).not.toBeInTheDocument();
    // Paging progress survived: both pages still listed, nothing re-fetched.
    expect(screen.getByText(/Buyer 0/)).toBeInTheDocument();
    expect(sales).toHaveBeenCalledTimes(2);
  });
});
