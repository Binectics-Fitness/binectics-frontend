import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TrainerRevenueClient from "@/app/dashboard/gym-owner/revenue/trainers/TrainerRevenueClient";
import { MyAttributedEarnings } from "@/components/attributed/MyAttributedEarnings";
import {
  attributedRevenueService,
  parseMyEarnings,
  parseRevenueByTrainer,
} from "@/lib/api/attributedRevenue";
import { contentMinorOf, groupByTrainer, utcShortDate, windowFor, windowLabel, attributedTypeLabel } from "@/lib/attributedRevenue/helpers";

vi.mock("@/components/ds/GymDashboardShell", () => ({
  GymDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));
vi.mock("@/contexts/OrganizationContext", () => ({
  useOrganization: () => ({ currentOrg: { _id: "org1" }, isLoading: false }),
}));
let inGym = true;
vi.mock("@/hooks/useTrainerAccess", () => ({ useCoachingGym: () => (inGym ? { _id: "org1" } : null) }));

const ok = <T,>(data: T) => ({ success: true as const, data });
const row = (user: string, first: string, currency: string, over: Record<string, unknown> = {}) => ({
  trainer: { user_id: user, first_name: first, last_name: "T" },
  currency,
  gross_minor: 1000000,
  refunds_minor: 100000,
  net_minor: 900000,
  consultations_minor: 600000,
  subscriptions_minor: 300000,
  payments: 4,
  ...over,
});

describe("helpers", () => {
  it("windows are UTC calendar days ending at the end of today", () => {
    const w = windowFor("7d", new Date("2026-10-28T23:30:00Z"));
    expect(w.to).toBe("2026-10-29T00:00:00.000Z");
    expect(w.from).toBe("2026-10-22T00:00:00.000Z");
    expect(windowFor("month", new Date("2026-10-28T10:00:00Z")).from).toBe("2026-10-01T00:00:00.000Z");
    expect(windowLabel(w.from, w.to)).toBe("22 Oct to 28 Oct (UTC)");
  });
  it("derives the program and meal plan share without going negative", () => {
    expect(contentMinorOf({ grossMinor: 1000, consultationsMinor: 600, subscriptionsMinor: 300 })).toBe(100);
    expect(contentMinorOf({ grossMinor: 100, consultationsMinor: 600, subscriptionsMinor: 300 })).toBe(0);
  });
  it("formats item dates in UTC, whatever the browser's timezone", () => {
    expect(utcShortDate("2026-10-20T23:30:00Z")).toBe("20 Oct 2026");
    expect(utcShortDate("2026-10-21T00:00:00Z")).toBe("21 Oct 2026");
    expect(utcShortDate(null)).toBe("");
    expect(utcShortDate("nope")).toBe("");
  });
  it("names the ledger kinds and groups rows by trainer", () => {
    expect(attributedTypeLabel("content_purchase")).toBe("Program or meal plan");
    expect(attributedTypeLabel("weird_kind")).toBe("Weird kind");
    const rows = parseRevenueByTrainer({ items: [row("a", "Ann", "NGN"), row("a", "Ann", "USD"), row("b", "Bo", "NGN")] }).items;
    expect(groupByTrainer(rows).map((g) => [g.name, g.rows.length])).toEqual([["Ann T", 2], ["Bo T", 1]]);
  });
  it("parses the API's snake_case into minor units", () => {
    const p = parseMyEarnings({
      currencies: [{ currency: "NGN", gross_minor: 5, refunds_minor: 1, net_minor: 4, consultations_minor: 5, subscriptions_minor: 0, payments: 1 }],
      by_organization: [{ organization: { id: "o", name: "Gym" }, currency: "NGN", gross_minor: 5 }],
      items: [{ id: "i", occurred_at: "2026-10-01T00:00:00Z", type: "refund", direction: "debit", amount_minor: 1, currency: "NGN", organization_id: "o" }],
      total: 1,
    });
    expect(p.currencies[0].netMinor).toBe(4);
    expect(p.byOrganization[0].organizationName).toBe("Gym");
    expect(p.items[0].direction).toBe("debit");
  });
});

describe("Revenue by trainer page", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("shows one block per trainer and currency and the org vs attributed totals", async () => {
    const spy = vi.spyOn(attributedRevenueService, "revenueByTrainer").mockResolvedValue(
      ok(
        parseRevenueByTrainer({
          from: "2026-10-01T00:00:00.000Z",
          to: "2026-10-29T00:00:00.000Z",
          items: [row("a", "Ann", "NGN"), row("a", "Ann", "USD", { net_minor: 1234 })],
          total: 2,
          page: 1,
          limit: 25,
          totals: [{ currency: "NGN", organization_net_minor: 5000000, attributed_net_minor: 900000 }],
        }),
      ),
    );
    render(<TrainerRevenueClient />);
    expect(await screen.findByText("Ann T")).toBeInTheDocument();
    expect(screen.getByText(/Dates are UTC/)).toBeInTheDocument();
    expect(screen.getByText("Member payments net")).toBeInTheDocument();
    expect(screen.queryByText("Gym net")).not.toBeInTheDocument();
    expect(screen.getAllByText(/Net · /)).toHaveLength(2); // NGN and USD, never one summed block
    expect(screen.getAllByText("From programs and meal plans")).toHaveLength(2);
    expect(spy).toHaveBeenCalledWith("org1", expect.objectContaining({ page: 1, limit: 25 }));
  });

  it("asks for a new window when the range changes", async () => {
    const spy = vi.spyOn(attributedRevenueService, "revenueByTrainer").mockResolvedValue(
      ok(parseRevenueByTrainer({ items: [], total: 0, totals: [] })),
    );
    render(<TrainerRevenueClient />);
    expect(await screen.findByText("Nothing attributed in this range yet.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: "90 days" }));
    await screen.findByText("Nothing attributed in this range yet.");
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("says it is the owner's report on a 404", async () => {
    vi.spyOn(attributedRevenueService, "revenueByTrainer").mockResolvedValue({ success: false, status: 404, message: "Organization not found" });
    render(<TrainerRevenueClient />);
    expect(await screen.findByText("Only the gym's owner can see revenue by trainer.")).toBeInTheDocument();
  });
});

describe("My attributed earnings", () => {
  beforeEach(() => {
    inGym = true;
    vi.restoreAllMocks();
  });

  it("is hidden for a trainer who does not coach at a gym, and asks for nothing", () => {
    inGym = false;
    const spy = vi.spyOn(attributedRevenueService, "myEarnings");
    const { container } = render(<MyAttributedEarnings />);
    expect(container).toBeEmptyDOMElement();
    expect(spy).not.toHaveBeenCalled();
  });

  it("lists payments and refunds as a report, per gym and currency", async () => {
    vi.spyOn(attributedRevenueService, "myEarnings").mockResolvedValue(
      ok(
        parseMyEarnings({
          from: "2026-10-01T00:00:00.000Z",
          to: "2026-10-29T00:00:00.000Z",
          currencies: [{ currency: "NGN", gross_minor: 1000000, refunds_minor: 100000, net_minor: 900000, consultations_minor: 1000000, subscriptions_minor: 0, payments: 2 }],
          by_organization: [{ organization: { id: "o", name: "Iron Gym" }, currency: "NGN", gross_minor: 1000000, refunds_minor: 100000, net_minor: 900000, consultations_minor: 1000000, subscriptions_minor: 0, payments: 2 }],
          items: [
            { id: "1", occurred_at: "2026-10-20T10:00:00Z", type: "consultation", direction: "credit", amount_minor: 1000000, currency: "NGN", organization_id: "o" },
            { id: "2", occurred_at: "2026-10-21T10:00:00Z", type: "refund", direction: "debit", amount_minor: 100000, currency: "NGN", organization_id: "o" },
          ],
          total: 2,
          page: 1,
          limit: 25,
        }),
      ),
    );
    render(<MyAttributedEarnings />);
    expect(await screen.findByText("Iron Gym · NGN")).toBeInTheDocument();
    const refund = screen.getByText("Refund").closest("li")!;
    expect(within(refund).getByText("-₦1,000")).toBeInTheDocument();
    expect(screen.getByText(/The gym receives this money/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
  });

  it("drops a 'Show more' that comes back after the range changed", async () => {
    const item = (id: string) => ({ id, occurred_at: "2026-10-20T23:30:00Z", type: "consultation", direction: "credit", amount_minor: 1000, currency: "NGN", organization_id: "o" });
    const body = (items: unknown[], total: number) =>
      parseMyEarnings({
        from: "2026-10-01T00:00:00.000Z",
        to: "2026-10-29T00:00:00.000Z",
        currencies: [{ currency: "NGN", gross_minor: 1, refunds_minor: 0, net_minor: 1, consultations_minor: 1, subscriptions_minor: 0, payments: 1 }],
        by_organization: [],
        items,
        total,
        page: 1,
        limit: 25,
      });
    let release: () => void = () => {};
    const spy = vi
      .spyOn(attributedRevenueService, "myEarnings")
      .mockResolvedValueOnce(ok(body(Array.from({ length: 25 }, (_, i) => item(`a${i}`)), 26)))
      .mockImplementationOnce(() => new Promise((resolve) => { release = () => resolve(ok(body([item("late")], 26))); }))
      .mockResolvedValue(ok(body([item("fresh")], 1)));
    render(<MyAttributedEarnings />);
    await userEvent.click(await screen.findByRole("button", { name: "Show more" }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(2));
    await userEvent.click(screen.getByRole("radio", { name: "90 days" }));
    await waitFor(() => expect(spy).toHaveBeenCalledTimes(3));
    release();
    await new Promise((r) => setTimeout(r, 50));
    // Only the new range's single row is listed; the old range's page 2 was dropped.
    await waitFor(() => expect(screen.getAllByText("Session")).toHaveLength(1));
    expect(screen.queryByRole("button", { name: "Show more" })).not.toBeInTheDocument();
  });

  it("dates its items in UTC", async () => {
    vi.spyOn(attributedRevenueService, "myEarnings").mockResolvedValue(
      ok(
        parseMyEarnings({
          from: "2026-10-01T00:00:00.000Z",
          to: "2026-10-29T00:00:00.000Z",
          currencies: [{ currency: "NGN", gross_minor: 1, refunds_minor: 0, net_minor: 1, consultations_minor: 1, subscriptions_minor: 0, payments: 1 }],
          by_organization: [],
          items: [{ id: "1", occurred_at: "2026-10-20T23:30:00Z", type: "consultation", direction: "credit", amount_minor: 1000, currency: "NGN", organization_id: "o" }],
          total: 1,
        }),
      ),
    );
    render(<MyAttributedEarnings />);
    expect(await screen.findByText("20 Oct 2026")).toBeInTheDocument();
  });
});
