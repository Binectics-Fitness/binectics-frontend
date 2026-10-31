import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OrgContentSalesSection } from "@/components/content/OrgContentSalesSection";
import { paidContentService, normalizeOrgSale } from "@/lib/api/paidContent";
import { gymPageRule, gymViewer, allows, REVENUE_BY_TRAINER_ACCESS } from "@/lib/gymStaffNav";

let flagsOn = true;
let flagOrgSeen: unknown;
vi.mock("@/hooks/useFeatureFlags", () => ({
  useFeatureFlags: () => ({
    isEnabled: (_k: string, orgId?: string | null) => {
      flagOrgSeen = orgId;
      return flagsOn;
    },
    isLoading: false,
  }),
}));

const ok = <T,>(data: T) => ({ success: true as const, data });
const raw = (id: string, over: Record<string, unknown> = {}) => ({
  id, item_kind: "program", item_id: "p1", item_name: "Strength Base", seller_organization_id: "org1",
  amount_minor: 1500000, currency: "NGN", status: "paid", reference: "r", expires_at: null,
  paid_at: "2026-10-20T23:30:00Z", refunded_at: null, paid_late: false,
  buyer: { id: "b1", name: "Maya Ade" }, trainer: { id: "t1", name: "Tunde Coach" },
  payment_rail: "platform", transaction_id: "tx1", ...over,
});
const page = (items: unknown[], total = items.length) =>
  ok({ items: items.map((i) => normalizeOrgSale(i as Record<string, unknown>)), total, limit: 25, skip: 0 });

describe("OrgContentSalesSection", () => {
  beforeEach(() => {
    flagsOn = true;
    vi.restoreAllMocks();
  });

  it("renders nothing, and asks nothing, while paid content is off for the gym", () => {
    flagsOn = false;
    const spy = vi.spyOn(paidContentService, "orgSales");
    const { container } = render(<OrgContentSalesSection orgId="org1" />);
    expect(container).toBeEmptyDOMElement();
    expect(spy).not.toHaveBeenCalled();
    expect(flagOrgSeen).toBe("org1");
  });

  it("lists sales per currency with UTC dates and no refund button", async () => {
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue(
      page([raw("s1"), raw("s2", { currency: "USD", amount_minor: 2500, status: "refunded", trainer: null })]),
    );
    render(<OrgContentSalesSection orgId="org1" />);
    const [first] = await screen.findAllByText(/Maya Ade/);
    expect(first).toHaveTextContent("By Tunde Coach");
    expect(first).toHaveTextContent("20 Oct 2026");
    expect(screen.getAllByText("Refunded")).toHaveLength(2); // the filter and the row pill
    expect(screen.getByText("Showing 2 of 2.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Refund/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
  });

  it("pages with Show more using skip and total", async () => {
    const first = Array.from({ length: 25 }, (_, i) => raw(`a${i}`, { buyer: { id: "b", name: `Buyer ${i}` } }));
    const spy = vi
      .spyOn(paidContentService, "orgSales")
      .mockResolvedValueOnce(page(first, 26))
      .mockResolvedValueOnce(page([raw("z", { buyer: { id: "b", name: "Late Buyer" } })], 26));
    render(<OrgContentSalesSection orgId="org1" />);
    await screen.findByText(/Buyer 0/);
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    await screen.findByText(/Late Buyer/);
    expect(spy).toHaveBeenLastCalledWith("org1", { status: undefined, limit: 25, skip: 25 });
    expect(screen.getByText("Showing 26 of 26.")).toBeInTheDocument();
  });

  it("filters by status from the first page", async () => {
    const spy = vi.spyOn(paidContentService, "orgSales").mockResolvedValue(page([raw("s1")]));
    render(<OrgContentSalesSection orgId="org1" />);
    await screen.findByText(/Maya Ade/);
    await userEvent.click(screen.getByRole("radio", { name: "Refunded" }));
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith("org1", { status: "refunded", limit: 25, skip: 0 }));
  });

  it("says no access on a 404", async () => {
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue({ success: false, status: 404, message: "Organization not found" });
    render(<OrgContentSalesSection orgId="org1" />);
    expect(await screen.findByText("You don't have access to these sales.")).toBeInTheDocument();
  });
});

describe("revenue-by-trainer page access", () => {
  const org = (perms: string[]) => ({ owner_id: "boss", is_owner: false, my_permissions: perms });
  it("is the owner or manage_listing, not owner only", () => {
    expect(gymPageRule("/dashboard/gym-owner/revenue/trainers")).toEqual(REVENUE_BY_TRAINER_ACCESS);
    expect(allows(gymViewer({ owner_id: "u1", is_owner: true }, "u1"), REVENUE_BY_TRAINER_ACCESS)).toBe(true);
    expect(allows(gymViewer(org(["marketplace:manage_listing"]), "u1"), REVENUE_BY_TRAINER_ACCESS)).toBe(true);
    expect(allows(gymViewer(org(["team:view_members"]), "u1"), REVENUE_BY_TRAINER_ACCESS)).toBe(false);
  });
});
