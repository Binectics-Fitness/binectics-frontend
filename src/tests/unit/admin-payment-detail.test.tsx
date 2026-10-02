import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { PaymentDetailClient } from "@/app/admin/payments/[paymentId]/PaymentDetailClient";
import AdminPaymentsPage from "@/app/admin/payments/page";
import type { AdminTransactionDetail } from "@/lib/api/admin";

/**
 * The admin payment detail reads GET /admin/transactions/:id and shows real
 * fields only: amounts from minor units + currency, the payer, the
 * organization, what the row paid for, and refund linkage. No refund button:
 * there is no refund pipeline.
 */

const api = vi.hoisted(() => ({ getTransaction: vi.fn(), listTransactions: vi.fn() }));

vi.mock("@/components/ds/AdminDashboardShell", () => ({
  AdminDashboardShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("@/lib/api/admin", () => ({
  adminService: {
    getTransaction: api.getTransaction,
    listTransactions: api.listTransactions,
  },
}));

function detail(over: Partial<AdminTransactionDetail> = {}): AdminTransactionDetail {
  return {
    transaction: {
      _id: "tx1",
      user_id: { _id: "u1", first_name: "Ada", last_name: "Payer", email: "ada@example.com" },
      organization_id: { _id: "o1", name: "Iron Gym" },
      recorded_by: null,
      type: "subscription",
      direction: "credit",
      status: "succeeded",
      method: "card",
      amount_minor: 1_500_000,
      currency: "NGN",
      occurred_at: "2026-09-01T10:00:00Z",
      created_at: "2026-09-01T10:00:02Z",
      gateway: "paystack",
      gateway_reference: "PSK_abc123",
      reference_type: "membership_subscription",
      reference_id: "sub1",
    },
    booking: null,
    subscription: {
      _id: "sub1",
      plan_id: { _id: "p1", name: "Monthly Unlimited" },
      status: "active",
      start_date: "2026-09-01T00:00:00Z",
      end_date: "2026-10-01T00:00:00Z",
      amount_paid_minor: 1_500_000,
      currency: "NGN",
      auto_renew: true,
    },
    billed_organization: null,
    reverses: null,
    reversed_by: [],
    ...over,
  };
}

describe("admin payment detail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getTransaction.mockResolvedValue({ success: true, data: detail() });
  });

  it("renders the ledger row from minor units, the payer and the subscription", async () => {
    render(<PaymentDetailClient paymentId="tx1" />);

    expect(await screen.findByRole("heading", { name: /Transaction · PSK_abc123/ })).toBeTruthy();
    expect(api.getTransaction).toHaveBeenCalledWith("tx1");
    // 1,500,000 kobo is ₦15,000 (KPI + subscription paid).
    expect(screen.getAllByText("₦15,000").length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText("Ada Payer")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByText("Iron Gym")).toBeTruthy();
    expect(screen.getByText("Monthly Unlimited")).toBeTruthy();
    expect(screen.getByText("None (automated)")).toBeTruthy();
    expect(screen.queryByText(/PI_3OqL08|chargeback/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /refund/i })).toBeNull();
    expect(screen.getByText(/Refunds can.t be issued from here yet/)).toBeTruthy();
  });

  it("shows a booking reference and links refunds of the row", async () => {
    api.getTransaction.mockResolvedValue({
      success: true,
      data: detail({
        subscription: null,
        booking: {
          _id: "b1",
          provider_id: { _id: "u2", first_name: "Tunde", last_name: "Coach" },
          consultation_type_id: { _id: "c1", name: "Intro session" },
          starts_at: "2026-09-03T09:00:00Z",
          status: "confirmed",
          amount_minor: 2_000_000,
          currency: "NGN",
        },
        reversed_by: [
          {
            _id: "tx2",
            type: "refund",
            direction: "debit",
            status: "succeeded",
            amount_minor: 500_000,
            currency: "NGN",
            occurred_at: "2026-09-04T00:00:00Z",
          },
        ],
      }),
    });
    render(<PaymentDetailClient paymentId="tx1" />);

    expect(await screen.findByText("Intro session")).toBeTruthy();
    expect(screen.getByText("Tunde Coach")).toBeTruthy();
    expect(screen.getByText("₦20,000")).toBeTruthy();
    const refund = screen.getByRole("link", { name: /Refund · −₦5,000/ });
    expect(refund.getAttribute("href")).toBe("/admin/payments/tx2");
  });

  it("names the billed organization on a platform-subscription row", async () => {
    const base = detail();
    api.getTransaction.mockResolvedValue({
      success: true,
      data: detail({
        transaction: {
          ...base.transaction,
          type: "platform_subscription",
          organization_id: null,
          reference_type: "provider_invoice",
          reference_id: "o9",
        },
        subscription: null,
        billed_organization: { _id: "o9", name: "Glow Studio" },
      }),
    });
    render(<PaymentDetailClient paymentId="tx1" />);

    expect(await screen.findByText("Glow Studio")).toBeTruthy();
    expect(screen.getByText("Billed organization")).toBeTruthy();
  });

  it("shows the API's error instead of a fake transaction", async () => {
    api.getTransaction.mockResolvedValue({ success: false, message: "Transaction not found" });
    render(<PaymentDetailClient paymentId="nope" />);
    expect(await screen.findByText("Transaction not found")).toBeTruthy();
  });

  it("the payments list links each row to its detail page", async () => {
    api.listTransactions.mockResolvedValue({
      success: true,
      data: {
        items: [{ ...detail().transaction }],
        total: 1,
        page: 1,
        limit: 25,
      },
    });
    render(<AdminPaymentsPage />);
    const links = await screen.findAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toContain("/admin/payments/tx1");
  });
});
