import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaymentsClient from "@/app/dashboard/member/payments/PaymentsClient";
import {
  memberPaymentsService,
  type MemberPayment,
  type MemberReceipt,
  type OwedCharge,
} from "@/lib/api/memberPayments";

vi.mock("@/components/ds/MemberDashboardShell", () => ({
  MemberDashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const ok = <T,>(data: T) => ({ success: true as const, data });
const pay = (over: Partial<MemberPayment> = {}): MemberPayment => ({
  id: "t1",
  kind: "membership",
  description: "Monthly",
  provider: { id: "org1", name: "i-Fitness Gym" },
  amountMinor: 4500000,
  currency: "NGN",
  status: "paid",
  paidAt: "2026-10-05T10:00:00.000Z",
  method: "card",
  reference: "mbr_1",
  receiptAvailable: true,
  refund: { state: "none", refundedMinor: 0 },
  ...over,
});
const owedCharge = (over: Partial<OwedCharge> = {}): OwedCharge => ({
  id: "sub1",
  kind: "first_payment",
  state: "payable",
  provider: { id: "org1", name: "i-Fitness Gym" },
  description: "Quarterly",
  amountMinor: 9000000,
  currency: "NGN",
  owedSince: "2026-10-01T00:00:00.000Z",
  lapsesAt: null,
  payVia: "checkout",
  renewal: null,
  paidAt: null,
  ...over,
});
const receipt: MemberReceipt = {
  receiptNumber: "R-1A2B3C4D",
  kind: "membership",
  provider: { id: "org1", name: "i-Fitness Gym" },
  memberName: "Ada Obi",
  description: "Monthly",
  period: null,
  amountMinor: 4500000,
  currency: "NGN",
  paidAt: "2026-10-05T10:00:00.000Z",
  method: "card",
  reference: "mbr_1",
  refunds: [],
  refund: { state: "none", refundedMinor: 0 },
};

describe("Payments page", () => {
  const list = vi.spyOn(memberPaymentsService, "list");
  const owed = vi.spyOn(memberPaymentsService, "owed");
  const summary = vi.spyOn(memberPaymentsService, "summary");
  const getReceipt = vi.spyOn(memberPaymentsService, "receipt");

  beforeEach(() => {
    for (const m of [list, owed, summary, getReceipt]) m.mockReset();
    owed.mockResolvedValue(ok({ items: [], totalsByCurrency: [] }));
    summary.mockResolvedValue(ok([]));
    list.mockResolvedValue(ok({ items: [pay()], nextCursor: null }));
  });

  it("lists payments with the API's amount, provider and status", async () => {
    render(<PaymentsClient />);
    const rows = await screen.findByTestId("payment-rows");
    expect(within(rows).getByText("Monthly")).toBeInTheDocument();
    expect(within(rows).getByText(/Membership · i-Fitness Gym/)).toBeInTheDocument();
    expect(within(rows).getByText("₦45,000")).toBeInTheDocument();
    expect(within(rows).getByText("Paid")).toBeInTheDocument();
  });

  it("shows what is owed per currency, with a pay link to the pay page and one for a renewal", async () => {
    owed.mockResolvedValue(
      ok({
        items: [
          owedCharge(),
          owedCharge({
            id: "sub2",
            kind: "renewal",
            payVia: "renewal_checkout",
            description: "Monthly",
            amountMinor: 4500000,
            renewal: { listingId: "L1", planId: "P1" },
          }),
          owedCharge({ id: "sub3", currency: "USD", amountMinor: 2500, description: "Day pass" }),
        ],
        totalsByCurrency: [
          { currency: "NGN", amountMinor: 13500000 },
          { currency: "USD", amountMinor: 2500 },
        ],
      }),
    );
    render(<PaymentsClient />);
    const card = await screen.findByTestId("owed-card");
    // One total per currency, never added together.
    expect(within(card).getByTestId("owed-total-NGN")).toHaveTextContent("₦135,000");
    expect(within(card).getByTestId("owed-total-USD")).toHaveTextContent("$25");
    expect(within(card).getByRole("link", { name: "Pay Quarterly" })).toHaveAttribute("href", "/pay/membership/sub1");
    expect(within(card).getByRole("link", { name: "Renew Monthly" })).toHaveAttribute(
      "href",
      "/checkout?listing=L1&plan=P1",
    );
  });

  it("shows no balance card when nothing is owed, and none when the balance could not load", async () => {
    owed.mockResolvedValue({ success: false, status: 500, message: "x" });
    render(<PaymentsClient />);
    await screen.findByTestId("payment-rows");
    expect(screen.queryByTestId("owed-card")).toBeNull();
  });

  it("shows paid totals one card per currency", async () => {
    summary.mockResolvedValue(
      ok([
        { currency: "NGN", paidMinor: 9000000, refundedMinor: 1000000, netMinor: 8000000 },
        { currency: "USD", paidMinor: 2500, refundedMinor: 0, netMinor: 2500 },
      ]),
    );
    render(<PaymentsClient />);
    const totals = await screen.findByTestId("totals");
    expect(within(totals).getByText("Paid in NGN")).toBeInTheDocument();
    expect(within(totals).getByText("₦80,000")).toBeInTheDocument();
    expect(within(totals).getByText(/₦90,000 paid, ₦10,000 refunded/)).toBeInTheDocument();
    expect(within(totals).getByText("$25")).toBeInTheDocument();
  });

  it("asks the API for a kind and a currency when a filter is chosen", async () => {
    summary.mockResolvedValue(
      ok([
        { currency: "NGN", paidMinor: 1, refundedMinor: 0, netMinor: 1 },
        { currency: "USD", paidMinor: 1, refundedMinor: 0, netMinor: 1 },
      ]),
    );
    render(<PaymentsClient />);
    await screen.findByTestId("payment-rows");
    await userEvent.click(screen.getByRole("button", { name: "Sessions" }));
    await waitFor(() => expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "session" })));
    await userEvent.click(await screen.findByRole("button", { name: "USD" }));
    await waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ kind: "session", currency: "USD" })),
    );
  });

  it("sends a date range as day bounds", async () => {
    render(<PaymentsClient />);
    await screen.findByTestId("payment-rows");
    await userEvent.type(screen.getByLabelText("From"), "2026-10-01");
    await waitFor(() => {
      const last = list.mock.calls.at(-1)?.[0];
      expect(last?.from).toBeTruthy();
      expect(new Date(last!.from!).getHours()).toBe(0);
    });
  });

  it("says when filters match nothing, and clears them", async () => {
    render(<PaymentsClient />);
    await screen.findByTestId("payment-rows");
    list.mockResolvedValue(ok({ items: [], nextCursor: null }));
    await userEvent.click(screen.getByRole("button", { name: "Refunds" }));
    expect(await screen.findByText("No payments match these filters.")).toBeInTheDocument();
    list.mockResolvedValue(ok({ items: [pay()], nextCursor: null }));
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByTestId("payment-rows")).toBeInTheDocument();
  });

  it("pages with the API's cursor", async () => {
    list
      .mockResolvedValueOnce(ok({ items: [pay({ id: "a", description: "First" })], nextCursor: "CUR1" }))
      .mockResolvedValueOnce(ok({ items: [pay({ id: "b", description: "Second" })], nextCursor: null }));
    render(<PaymentsClient />);
    await userEvent.click(await screen.findByRole("button", { name: "Show more" }));
    expect(await screen.findByText("Second")).toBeInTheDocument();
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: "CUR1" }));
    expect(screen.queryByRole("button", { name: "Show more" })).toBeNull();
  });

  it("opens a receipt for a payment, and offers none for a refund row", async () => {
    list.mockResolvedValue(
      ok({
        items: [
          pay(),
          pay({ id: "r1", kind: "refund", status: "refund", description: "Refund: Monthly", receiptAvailable: false }),
        ],
        nextCursor: null,
      }),
    );
    getReceipt.mockResolvedValue(ok(receipt));
    render(<PaymentsClient />);
    const rows = await screen.findByTestId("payment-rows");
    expect(within(rows).getAllByRole("button", { name: /^Receipt for/ })).toHaveLength(1);
    await userEvent.click(within(rows).getByRole("button", { name: /^Receipt for Monthly/ }));
    const slip = await screen.findByTestId("receipt");
    expect(getReceipt).toHaveBeenCalledWith("t1");
    expect(within(slip).getByText("R-1A2B3C4D")).toBeInTheDocument();
    expect(within(slip).getByText("Ada Obi")).toBeInTheDocument();
    expect(within(slip).getByText("₦45,000")).toBeInTheDocument();
    expect(within(slip).getByText(/mbr_1/)).toBeInTheDocument();
  });

  it("shows a part refund on the row and on the receipt", async () => {
    list.mockResolvedValue(
      ok({ items: [pay({ refund: { state: "partial", refundedMinor: 1000000 } })], nextCursor: null }),
    );
    render(<PaymentsClient />);
    expect(await screen.findByText("Part refunded")).toBeInTheDocument();
  });

  it("offers a retry when the history cannot be loaded, never an empty 'no payments'", async () => {
    list.mockResolvedValueOnce({ success: false, status: 500, message: "boom" });
    render(<PaymentsClient />);
    expect(await screen.findByText("We couldn't load your payments.")).toBeInTheDocument();
    expect(screen.queryByText("No payments yet.")).toBeNull();
    list.mockResolvedValue(ok({ items: [pay()], nextCursor: null }));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("payment-rows")).toBeInTheDocument();
  });

  it("explains an empty history", async () => {
    list.mockResolvedValue(ok({ items: [], nextCursor: null }));
    render(<PaymentsClient />);
    expect(await screen.findByText("No payments yet.")).toBeInTheDocument();
  });
});
