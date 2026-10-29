import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import PurchasesClient from "@/app/dashboard/member/purchases/PurchasesClient";
import ContentOfferClient from "@/app/dashboard/member/content/[kind]/[id]/ContentOfferClient";
import { paidContentService, type ContentOfferRead } from "@/lib/api/paidContent";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/components/content/ContentBuyPanel", () => ({
  ContentBuyPanel: () => <div data-testid="buy-panel" />,
}));
vi.mock("@/components/content/StartProgramControl", () => ({
  StartProgramControl: () => <div data-testid="start-control" />,
}));

const ok = <T,>(data: T) => ({ success: true as const, data });
const ent = (over: Record<string, unknown>) => ({
  id: "e1",
  itemKind: "program" as const,
  itemId: "p1",
  title: "Strength Base",
  source: "purchase" as const,
  planName: null,
  state: "open" as const,
  since: null,
  until: null,
  ...over,
});

describe("My purchases", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("labels each item by how the member has it", async () => {
    vi.spyOn(paidContentService, "myPurchases").mockResolvedValue(ok([]));
    vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue(
      ok({
        nextCursor: null,
        items: [
          ent({ id: "a", title: "Bought one" }),
          ent({ id: "b", title: "Gift", source: "grant" }),
          ent({ id: "c", title: "Plan one", source: "plan", planName: "Monthly Coaching" }),
          ent({ id: "d", title: "Kept one", source: "carry_over", state: "frozen" }),
        ],
      }),
    );
    render(<PurchasesClient />);
    expect(await screen.findByText(/Program · Bought$/)).toBeInTheDocument();
    expect(screen.getByText(/Given to you/)).toBeInTheDocument();
    expect(screen.getByText(/Included in Monthly Coaching/)).toBeInTheDocument();
    expect(screen.getByText(/Kept until your plan ends/)).toBeInTheDocument();
    // Only open programs can be started; a frozen one points to the renew page.
    expect(screen.getAllByTestId("start-control")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "See how to renew Kept one" })).toHaveAttribute(
      "href",
      "/dashboard/member/content/programs/p1",
    );
  });

  it("lists a pending purchase as a record to finish, and does not repeat paid ones", async () => {
    vi.spyOn(paidContentService, "myPurchases").mockResolvedValue(
      ok([
        { id: "x", itemKind: "meal_plan", itemId: "m1", itemName: "Cut", amountMinor: 500000, currency: "NGN", status: "pending", reference: "itm_x", expiresAt: null, paidAt: null, refundedAt: null },
        { id: "y", itemKind: "program", itemId: "p1", itemName: "Done", amountMinor: 500000, currency: "NGN", status: "paid", reference: "itm_y", expiresAt: null, paidAt: null, refundedAt: null },
      ]),
    );
    vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue(ok({ items: [], nextCursor: null }));
    render(<PurchasesClient />);
    expect(await screen.findByText("Waiting for payment")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Finish paying for Cut" })).toHaveAttribute(
      "href",
      "/dashboard/member/content/meal-plans/m1",
    );
    expect(screen.queryByText("Done")).not.toBeInTheDocument();
  });

  it("shows an empty state", async () => {
    vi.spyOn(paidContentService, "myPurchases").mockResolvedValue(ok([]));
    vi.spyOn(paidContentService, "myEntitlements").mockResolvedValue(ok({ items: [], nextCursor: null }));
    render(<PurchasesClient />);
    expect(await screen.findByText("Nothing here yet.")).toBeInTheDocument();
  });
});

describe("Offer page", () => {
  const offer = (over: Partial<ContentOfferRead>): ContentOfferRead => ({
    itemKind: "program",
    itemId: "p1",
    title: "Strength Base",
    prices: [{ currency: "NGN", amountMinor: 1500000 }],
    plans: [],
    isPaid: true,
    forSale: true,
    access: { state: "needs_payment", via: null },
    ...over,
  });
  const render1 = (o: ContentOfferRead | null, status?: number) => {
    vi.spyOn(paidContentService, "getOffer").mockResolvedValue(
      o || !status ? ok(o) : { success: false, status },
    );
    render(<ContentOfferClient kindSegment="programs" itemId="p1" />);
  };

  it("offers the buy panel for an item that needs payment", async () => {
    render1(offer({}));
    expect(await screen.findByTestId("buy-panel")).toBeInTheDocument();
    expect(screen.getByText("₦15,000")).toBeInTheDocument();
  });

  it("shows start for an item the member already has", async () => {
    render1(offer({ access: { state: "open", via: "purchase" } }));
    expect(await screen.findByText("You already have this.")).toBeInTheDocument();
    expect(screen.getByTestId("start-control")).toBeInTheDocument();
    expect(screen.queryByTestId("buy-panel")).not.toBeInTheDocument();
  });

  it("explains a frozen item and how to bring it back", async () => {
    render1(
      offer({
        access: { state: "frozen", via: null },
        plans: [{ id: "pl", name: "Monthly", priceMinor: 2000000, currency: "NGN", durationDays: 30, planType: "x", listingId: "L1" }],
      }),
    );
    expect(await screen.findByText("Renew to keep your plan going")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See plan" })).toHaveAttribute("href", "/marketplace/L1");
  });

  it("does not offer a purchase for an item that is not for sale", async () => {
    render1(offer({ forSale: false }));
    expect(await screen.findByText(/isn't for sale right now/)).toBeInTheDocument();
    expect(screen.queryByTestId("buy-panel")).not.toBeInTheDocument();
  });

  it("says it is gone on a 404", async () => {
    render1(null, 404);
    expect(await screen.findByText("No longer available.")).toBeInTheDocument();
  });
});
