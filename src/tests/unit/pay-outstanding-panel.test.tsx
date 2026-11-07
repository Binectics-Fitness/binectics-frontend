import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayOutstandingPanel } from "@/components/payments/PayOutstandingPanel";
import { memberPaymentsService, type OwedCharge } from "@/lib/api/memberPayments";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { readPendingOwed } from "@/lib/payments/pendingOwed";

// A fast poll so the loop can run for real: 3 re-reads, 15 ms apart.
vi.mock("@/lib/memberPayments/helpers", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/memberPayments/helpers")>()),
  OWED_POLL_MS: 15,
  OWED_POLL_LIMIT: 3,
}));
vi.mock("@/lib/payments/paystackInline", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/payments/paystackInline")>()),
  openPaystackCheckout: vi.fn(),
}));

const charge = (state: OwedCharge["state"] = "payable"): OwedCharge => ({
  id: "sub1",
  kind: "first_payment",
  state,
  provider: { id: "org1", name: "i-Fitness Gym" },
  description: "Monthly",
  amountMinor: 4500000,
  currency: "NGN",
  owedSince: "2026-10-01T00:00:00.000Z",
  lapsesAt: null,
  payVia: "checkout",
  renewal: null,
  paidAt: null,
});
const ok = <T,>(data: T) => ({ success: true as const, data });
const checkoutOk = ok({
  reference: "mbr_1",
  accessCode: "AC_1",
  authorizationUrl: "https://checkout.paystack.com/AC_1",
  amountMinor: 4500000,
  currency: "NGN",
});

describe("PayOutstandingPanel", () => {
  const checkout = vi.spyOn(memberPaymentsService, "checkout");
  const verify = vi.spyOn(memberPaymentsService, "verify");
  const reread = vi.spyOn(memberPaymentsService, "charge");
  const open = vi.mocked(openPaystackCheckout);
  const onPaid = vi.fn();
  const onChanged = vi.fn();

  beforeEach(() => {
    for (const m of [checkout, verify, reread, open, onPaid, onChanged]) m.mockReset();
    checkout.mockResolvedValue(checkoutOk);
    window.sessionStorage.clear();
  });

  const renderPanel = () => render(<PayOutstandingPanel charge={charge()} onPaid={onPaid} onChanged={onChanged} />);

  it("labels the button with the API's amount and sends no amount", async () => {
    open.mockResolvedValue({ closed: "dismissed" });
    reread.mockResolvedValue(ok(charge()));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: "Pay ₦45,000" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith("AC_1"));
    // Only the id: the amount and currency are the API's.
    expect(checkout).toHaveBeenCalledWith("sub1");
    expect(checkout.mock.calls[0]).toHaveLength(1);
  });

  it("does not trust the popup callback: verifies, and only the API's state marks it paid", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "mbr_1" });
    verify.mockResolvedValue(ok({ charge: charge("payable"), gatewayStatus: "pending" }));
    reread.mockResolvedValueOnce(ok(charge("payable"))).mockResolvedValue(ok(charge("paid")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(verify).toHaveBeenCalledWith("sub1"));
    expect(onPaid).not.toHaveBeenCalled();
    await waitFor(() => expect(onPaid).toHaveBeenCalledTimes(1));
    expect(onPaid.mock.calls[0][0].state).toBe("paid");
  });

  it("marks paid straight from a verify that settled", async () => {
    open.mockResolvedValue({ closed: "callback" });
    verify.mockResolvedValue(ok({ charge: charge("paid"), gatewayStatus: "success" }));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(onPaid).toHaveBeenCalledTimes(1));
    expect(reread).not.toHaveBeenCalled();
  });

  it("says a declined payment did not charge them and offers another try", async () => {
    open.mockResolvedValue({ closed: "callback" });
    verify.mockResolvedValue(ok({ charge: charge("payable"), gatewayStatus: "failed" }));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/did not go through.*not been charged/);
    expect(onPaid).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^Pay/ })).toBeEnabled();
  });

  it("keeps 'confirming' when verification itself is unreachable, then asks to check again", async () => {
    open.mockResolvedValue({ closed: "callback" });
    verify.mockResolvedValue({ success: false, status: 503, message: "down" });
    reread.mockResolvedValue(ok(charge("payable")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    expect(await screen.findByRole("button", { name: "Check again" })).toBeInTheDocument();
    expect(screen.getByText(/still being confirmed/)).toBeInTheDocument();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(reread).toHaveBeenCalledTimes(3);
  });

  it("re-reads when the popup is closed, and picks up a payment that landed just before", async () => {
    open.mockResolvedValue({ closed: "dismissed" });
    reread.mockResolvedValue(ok(charge("paid")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(onPaid).toHaveBeenCalledTimes(1));
    expect(verify).not.toHaveBeenCalled();
  });

  it("leaves the button usable after a plain dismiss", async () => {
    open.mockResolvedValue({ closed: "dismissed" });
    reread.mockResolvedValue(ok(charge("payable")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(screen.getByRole("button", { name: /^Pay/ })).toBeEnabled());
    expect(onPaid).not.toHaveBeenCalled();
  });

  it("on 'already paid' from the API, says so and shows the paid state", async () => {
    checkout.mockResolvedValue({ success: false, status: 409, code: "MEMBER_CHARGE_ALREADY_PAID", message: "x" });
    reread.mockResolvedValue(ok(charge("paid")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(onPaid).toHaveBeenCalledTimes(1));
    expect(open).not.toHaveBeenCalled();
  });

  it("hands a no-longer-payable charge to the page", async () => {
    checkout.mockResolvedValue({ success: false, status: 409, code: "MEMBER_CHARGE_NOT_PAYABLE", message: "x" });
    reread.mockResolvedValue(ok(charge("closed")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(onChanged).toHaveBeenCalledTimes(1));
    expect(onChanged.mock.calls[0][0].state).toBe("closed");
  });

  it("shows a bank transfer already waiting, in the API's terms", async () => {
    checkout.mockResolvedValue({ success: false, status: 409, code: "MEMBER_CHARGE_TRANSFER_IN_PROGRESS", message: "x" });
    reread.mockResolvedValue(ok(charge("payable")));
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/bank transfer is already waiting/);
  });

  it("falls back to the hosted page when the popup cannot load, remembering the charge for the return", async () => {
    open.mockRejectedValue(new PaystackUnavailableError());
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, assign });
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.paystack.com/AC_1"));
    expect(readPendingOwed("mbr_1")).toBe("sub1");
    vi.unstubAllGlobals();
  });

  it("explains a checkout it could not start without opening Paystack", async () => {
    checkout.mockResolvedValue({ success: false, status: 502, message: "We couldn't start the payment. Please try again." });
    renderPanel();
    await userEvent.click(screen.getByRole("button", { name: /^Pay/ }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't start the payment/);
    expect(open).not.toHaveBeenCalled();
  });
});
