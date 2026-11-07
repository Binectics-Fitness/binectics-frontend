import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PayMembershipClient from "@/app/pay/membership/[chargeId]/PayMembershipClient";
import { memberPaymentsService, type OwedCharge } from "@/lib/api/memberPayments";

vi.mock("@/components/payments/PayOutstandingPanel", () => ({
  PayOutstandingPanel: ({ onPaid, charge }: { onPaid: (c: OwedCharge) => void; charge: OwedCharge }) => (
    <button type="button" data-testid="pay-panel" onClick={() => onPaid({ ...charge, state: "paid" })}>
      pay
    </button>
  ),
}));

const base: OwedCharge = {
  id: "sub1",
  kind: "first_payment",
  state: "payable",
  provider: { id: "org1", name: "i-Fitness Gym" },
  description: "Monthly",
  amountMinor: 4500000,
  currency: "NGN",
  owedSince: "2026-10-01T00:00:00.000Z",
  lapsesAt: null,
  payVia: "checkout",
  renewal: null,
  paidAt: null,
};
const ok = <T,>(data: T) => ({ success: true as const, data });

describe("/pay/membership/:chargeId", () => {
  const get = vi.spyOn(memberPaymentsService, "charge");
  beforeEach(() => get.mockReset());

  it("shows what is owed, to whom, and the pay panel", async () => {
    get.mockResolvedValue(ok(base));
    render(<PayMembershipClient chargeId="sub1" />);
    expect(await screen.findByRole("heading", { name: "Monthly" })).toBeInTheDocument();
    expect(screen.getByText("i-Fitness Gym")).toBeInTheDocument();
    expect(screen.getByText("₦45,000")).toBeInTheDocument();
    expect(screen.getByTestId("pay-panel")).toBeInTheDocument();
    expect(get).toHaveBeenCalledWith("sub1");
  });

  it.each([404, 400])("treats a %s as 'can't find that payment', not an error to retry", async (status) => {
    get.mockResolvedValue({ success: false, status, message: "Payment not found" });
    render(<PayMembershipClient chargeId="x" />);
    expect(await screen.findByText("We can't find that payment.")).toBeInTheDocument();
    expect(screen.queryByTestId("pay-panel")).toBeNull();
    expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
  });

  it("offers a retry on a server error", async () => {
    get.mockResolvedValueOnce({ success: false, status: 500, message: "boom" }).mockResolvedValue(ok(base));
    render(<PayMembershipClient chargeId="sub1" />);
    await userEvent.click(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByTestId("pay-panel")).toBeInTheDocument();
  });

  it("says an already-paid charge is paid, with no pay panel", async () => {
    get.mockResolvedValue(ok({ ...base, state: "paid", paidAt: "2026-10-05T10:00:00.000Z" }));
    render(<PayMembershipClient chargeId="sub1" />);
    expect(await screen.findByText("This is already paid.")).toBeInTheDocument();
    expect(screen.queryByTestId("pay-panel")).toBeNull();
    expect(screen.getByRole("link", { name: "See my payments" })).toHaveAttribute("href", "/dashboard/member/payments");
  });

  it("says an ended membership cannot be paid", async () => {
    get.mockResolvedValue(ok({ ...base, state: "closed" }));
    render(<PayMembershipClient chargeId="sub1" />);
    expect(await screen.findByText("This can't be paid any more.")).toBeInTheDocument();
    expect(screen.queryByTestId("pay-panel")).toBeNull();
  });

  it("sends a renewal to the renew checkout instead of the pay panel", async () => {
    get.mockResolvedValue(
      ok({
        ...base,
        kind: "renewal" as const,
        payVia: "renewal_checkout" as const,
        renewal: { listingId: "L1", planId: "P1" },
        lapsesAt: "2026-11-08T00:00:00.000Z",
      }),
    );
    render(<PayMembershipClient chargeId="sub1" />);
    expect(await screen.findByRole("link", { name: "Renew now" })).toHaveAttribute(
      "href",
      "/checkout?listing=L1&plan=P1",
    );
    expect(screen.queryByTestId("pay-panel")).toBeNull();
  });

  it("thanks the member once the panel reports the API says paid", async () => {
    get.mockResolvedValue(ok(base));
    render(<PayMembershipClient chargeId="sub1" />);
    await userEvent.click(await screen.findByTestId("pay-panel"));
    expect(await screen.findByText("Payment received.")).toBeInTheDocument();
    expect(screen.getByText(/Your membership is active/)).toBeInTheDocument();
  });
});
