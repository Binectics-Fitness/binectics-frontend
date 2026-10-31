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

  it("renders nothing while paid content is off for the gym and there are no sales", async () => {
    flagsOn = false;
    const spy = vi.spyOn(paidContentService, "orgSales").mockResolvedValue(page([]));
    const { container } = render(<OrgContentSalesSection orgId="org1" />);
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(1));
    expect(container).toBeEmptyDOMElement();
    expect(flagOrgSeen).toBe("org1");
  });

  it("stays reachable with the flag off once the gym has sales", async () => {
    flagsOn = false;
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue(page([raw("s1")]));
    render(<OrgContentSalesSection orgId="org1" />);
    expect(await screen.findByText(/Maya Ade/)).toBeInTheDocument();
  });

  it("gives the owner a confirmed Refund on a paid row; Admin and Manager get none", async () => {
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue(page([raw("s1"), raw("s2", { buyer: { id: "b2", name: "Zed" } })]));
    const refund = vi.spyOn(paidContentService, "refund").mockResolvedValue(ok("refunded" as const));
    render(<OrgContentSalesSection orgId="org1" canRefund />);
    await screen.findByText(/Maya Ade/);
    await userEvent.click(screen.getByRole("button", { name: /Refund Maya Ade/ }));
    expect(refund).not.toHaveBeenCalled();
    await userEvent.click(await screen.findByRole("button", { name: "Refund" }));
    await waitFor(() => expect(refund).toHaveBeenCalledWith("s1"));
    // Only that row changed; the other keeps its button.
    await waitFor(() => expect(screen.getAllByText("Refunded").length).toBeGreaterThan(1));
    expect(screen.getByRole("button", { name: /Refund Zed/ })).toBeInTheDocument();
  });

  it("marks a requested (platform-held) refund on the row", async () => {
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue(page([raw("s1")]));
    vi.spyOn(paidContentService, "refund").mockResolvedValue(ok("requested" as const));
    render(<OrgContentSalesSection orgId="org1" canRefund />);
    await screen.findByText(/Maya Ade/);
    await userEvent.click(screen.getByRole("button", { name: /Refund Maya Ade/ }));
    await userEvent.click(await screen.findByRole("button", { name: "Refund" }));
    expect(await screen.findByText("Refund requested")).toBeInTheDocument();
  });

  it("drops a Show more answer that arrives after the status filter changed", async () => {
    const first = Array.from({ length: 25 }, (_, i) => raw(`a${i}`, { buyer: { id: "b", name: `Buyer ${i}` } }));
    let release: (v: ReturnType<typeof page>) => void = () => {};
    const slow = new Promise<ReturnType<typeof page>>((r) => (release = r));
    vi.spyOn(paidContentService, "orgSales")
      .mockResolvedValueOnce(page(first, 26))
      .mockReturnValueOnce(slow as never)
      .mockResolvedValueOnce(page([raw("r1", { status: "refunded", buyer: { id: "b", name: "Refunded Rae" } })], 1));
    render(<OrgContentSalesSection orgId="org1" />);
    await screen.findByText(/Buyer 0/);
    await userEvent.click(screen.getByRole("button", { name: "Show more" }));
    await userEvent.click(screen.getByRole("button", { name: "Refunded" }));
    await screen.findByText(/Refunded Rae/);
    release(page([raw("late", { buyer: { id: "b", name: "Stale Sam" } })], 26));
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(/Stale Sam/)).not.toBeInTheDocument();
  });

  it("lists sales per currency with UTC dates and no refund button for staff", async () => {
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue(
      page([raw("s1"), raw("s2", { currency: "USD", amount_minor: 2500, status: "refunded", trainer: null })]),
    );
    render(<OrgContentSalesSection orgId="org1" />);
    const [first] = await screen.findAllByText(/Maya Ade/);
    expect(first).toHaveTextContent("By Tunde Coach");
    expect(first).toHaveTextContent("20 Oct 2026");
    expect(screen.getAllByText("Refunded")).toHaveLength(2); // the filter and the row pill
    expect(screen.getByText("Showing 2 of 2.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Refund / })).not.toBeInTheDocument();
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
    await userEvent.click(screen.getByRole("button", { name: "Refunded" }));
    await waitFor(() => expect(spy).toHaveBeenLastCalledWith("org1", { status: "refunded", limit: 25, skip: 0 }));
  });

  it("says no access on a 404", async () => {
    vi.spyOn(paidContentService, "orgSales").mockResolvedValue({ success: false, status: 404, message: "Organization not found" });
    render(<OrgContentSalesSection orgId="org1" />);
    expect(await screen.findByText("You don't have access to these sales.")).toBeInTheDocument();
  });
});

describe("revenue-by-trainer page access", () => {
  it("is matched by its own entry, not shadowed by the /revenue prefix rule", () => {
    // Same-shaped rules deep-equal each other, so check identity.
    expect(gymPageRule("/dashboard/gym-owner/revenue/trainers")).toBe(REVENUE_BY_TRAINER_ACCESS);
    expect(gymPageRule("/dashboard/gym-owner/revenue/trainers/")).toBe(REVENUE_BY_TRAINER_ACCESS);
    expect(gymPageRule("/dashboard/gym-owner/revenue/trainers/anything")).toBe(REVENUE_BY_TRAINER_ACCESS);
    expect(gymPageRule("/dashboard/gym-owner/revenue")).not.toBe(REVENUE_BY_TRAINER_ACCESS);
    expect(gymPageRule("/dashboard/gym-owner/revenue/other")).not.toBe(REVENUE_BY_TRAINER_ACCESS);
  });

  const org = (perms: string[]) => ({ owner_id: "boss", is_owner: false, my_permissions: perms });
  it("is the owner or manage_listing, not owner only", () => {
    expect(gymPageRule("/dashboard/gym-owner/revenue/trainers")).toEqual(REVENUE_BY_TRAINER_ACCESS);
    expect(allows(gymViewer({ owner_id: "u1", is_owner: true }, "u1"), REVENUE_BY_TRAINER_ACCESS)).toBe(true);
    expect(allows(gymViewer(org(["marketplace:manage_listing"]), "u1"), REVENUE_BY_TRAINER_ACCESS)).toBe(true);
    expect(allows(gymViewer(org(["team:view_members"]), "u1"), REVENUE_BY_TRAINER_ACCESS)).toBe(false);
  });
});
