import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PayBookingButton } from "@/components/bookings/PayBookingButton";
import { consultationsService, ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { openPaystack, paystackPublicKey } from "@/lib/payments/paystackInline";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { email: "ngozi@example.com" } }),
}));
vi.mock("@/lib/payments/paystackInline", () => ({
  openPaystack: vi.fn(),
  paystackPublicKey: vi.fn(() => "pk_test_abc123"),
}));

const base: ConsultationBooking = {
  id: "b1",
  clientUserId: "c1",
  providerId: "p1",
  consultationTypeId: "t1",
  consultationTypeName: "1:1 session",
  startsAt: "2026-09-28T09:00:00.000Z",
  endsAt: "2026-09-28T10:00:00.000Z",
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.PENDING,
  payment: { reference: "bkg_ref-1", amountMinor: 2500000, currency: "NGN", expiresAt: "2026-09-27T20:00:00.000Z" },
  createdAt: "",
  updatedAt: "",
};
const confirmed: ConsultationBooking = { ...base, status: ConsultationBookingStatus.CONFIRMED, payment: undefined };
const ok = <T,>(data: T) => ({ success: true, data });

describe("PayBookingButton", () => {
  const verify = vi.spyOn(consultationsService, "verifyBookingPayment");
  const get = vi.spyOn(consultationsService, "getBooking");
  const open = vi.mocked(openPaystack);

  beforeEach(() => {
    verify.mockReset();
    get.mockReset();
    open.mockReset();
    vi.mocked(paystackPublicKey).mockReturnValue("pk_test_abc123");
  });
  afterEach(() => vi.useRealTimers());

  it("renders nothing for a free (confirmed) booking", () => {
    const { container } = render(<PayBookingButton booking={confirmed} onBooking={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing for a hold that has already lapsed", () => {
    const expired = { ...base, status: ConsultationBookingStatus.CANCELLED, payment: undefined, cancelReason: "Payment was not completed in time" };
    const { container } = render(<PayBookingButton booking={expired} onBooking={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens Paystack with the API's reference, minor amount and currency, and the signed-in email", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockResolvedValue(ok(confirmed));
    render(<PayBookingButton booking={base} onBooking={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: /^Pay / }));
    expect(open).toHaveBeenCalledWith({ email: "ngozi@example.com", amountMinor: 2500000, currency: "NGN", reference: "bkg_ref-1" });
  });

  it("treats the callback as 'checkout closed' and reports the booking the API returns, not the callback", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockResolvedValue(ok({ ...confirmed, verification: { gatewayStatus: "success" } }));
    const onBooking = vi.fn();
    render(<PayBookingButton booking={base} onBooking={onBooking} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onBooking).toHaveBeenCalledWith(expect.objectContaining({ status: "CONFIRMED" })));
    expect(verify).toHaveBeenCalledWith("b1");
  });

  it("keeps the hold and says so when the checkout is dismissed", async () => {
    open.mockResolvedValue({ closed: "dismissed", reference: "bkg_ref-1" });
    get.mockResolvedValue(ok(base));
    const onBooking = vi.fn();
    render(<PayBookingButton booking={base} onBooking={onBooking} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(get).toHaveBeenCalledWith("b1"));
    expect(verify).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^Pay / })).toBeEnabled();
  });

  it("surfaces a failed payment and offers a retry, without creating anything new", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockResolvedValue(ok({ ...base, verification: { gatewayStatus: "failed" } }));
    const onError = vi.fn();
    render(<PayBookingButton booking={base} onBooking={() => {}} onError={onError} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/did not go through/)));
    expect(screen.getByRole("button", { name: /Try again/ })).toBeEnabled();
  });

  it("keeps asking the API while the webhook has not settled, then reports the confirmation", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockResolvedValue(ok({ ...base, verification: { gatewayStatus: "ongoing" } }));
    get.mockResolvedValueOnce(ok(base)).mockResolvedValueOnce(ok(confirmed));
    const onBooking = vi.fn();
    render(<PayBookingButton booking={base} onBooking={onBooking} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(verify).toHaveBeenCalled());
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    await waitFor(() => expect(onBooking).toHaveBeenLastCalledWith(expect.objectContaining({ status: "CONFIRMED" })));
  });

  it("gives up polling after the limit and offers to check again, still without assuming anything", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockResolvedValue(ok({ ...base, verification: { gatewayStatus: "ongoing" } }));
    get.mockResolvedValue(ok(base));
    const onBooking = vi.fn();
    render(<PayBookingButton booking={base} onBooking={onBooking} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(verify).toHaveBeenCalled());
    for (let i = 0; i < 20; i++) {
      await act(async () => { await vi.advanceTimersByTimeAsync(3000); });
    }
    await waitFor(() => expect(screen.getByRole("button", { name: /Check again/ })).toBeEnabled());
    expect(get).toHaveBeenCalledTimes(20);
    expect(onBooking).not.toHaveBeenCalledWith(expect.objectContaining({ status: "CONFIRMED" }));
    expect(screen.getByText(/still being confirmed/)).toBeInTheDocument();
  });

  it("polls the booking when the verify call itself fails", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockRejectedValue(new Error("network"));
    get.mockResolvedValue(ok(confirmed));
    const onBooking = vi.fn();
    render(<PayBookingButton booking={base} onBooking={onBooking} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(verify).toHaveBeenCalled());
    await act(async () => { await vi.advanceTimersByTimeAsync(3100); });
    await waitFor(() => expect(onBooking).toHaveBeenCalledWith(expect.objectContaining({ status: "CONFIRMED" })));
  });

  it("reports a charge that completed just before the popup was dismissed", async () => {
    open.mockResolvedValue({ closed: "dismissed", reference: "bkg_ref-1" });
    get.mockResolvedValue(ok(confirmed));
    const onBooking = vi.fn();
    render(<PayBookingButton booking={base} onBooking={onBooking} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onBooking).toHaveBeenCalledWith(expect.objectContaining({ status: "CONFIRMED" })));
    expect(verify).not.toHaveBeenCalled();
  });

  it("says so and offers a retry when the popup cannot open", async () => {
    open.mockRejectedValue(new Error("Could not load Paystack"));
    const onError = vi.fn();
    render(<PayBookingButton booking={base} onBooking={() => {}} onError={onError} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onError).toHaveBeenCalledWith("Could not load Paystack"));
    expect(screen.getByRole("button", { name: /Try again/ })).toBeEnabled();
    expect(verify).not.toHaveBeenCalled();
  });

  it("refuses a second click while the popup is open, without disabling the button", async () => {
    let finish: (v: { closed: "callback" | "dismissed"; reference: string }) => void = () => {};
    open.mockReturnValue(new Promise((r) => { finish = r; }));
    get.mockResolvedValue(ok(base));
    render(<PayBookingButton booking={base} onBooking={() => {}} />);
    await userEvent.click(screen.getByRole("button"));
    const button = screen.getByRole("button", { name: /Complete payment/ });
    expect(button).toBeEnabled();
    await userEvent.click(button);
    expect(open).toHaveBeenCalledTimes(1);
    await act(async () => { finish({ closed: "dismissed", reference: "bkg_ref-1" }); });
    await waitFor(() => expect(screen.getByRole("button", { name: /^Pay / })).toBeEnabled());
  });

  it("explains a mismatched or reversed charge instead of polling for it", async () => {
    open.mockResolvedValue({ closed: "callback", reference: "bkg_ref-1" });
    verify.mockResolvedValue(ok({ ...base, verification: { gatewayStatus: "mismatch" } }));
    const onError = vi.fn();
    render(<PayBookingButton booking={base} onBooking={() => {}} onError={onError} />);
    await userEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.stringMatching(/does not match/)));
    expect(get).not.toHaveBeenCalled();
  });

  it("does not offer payment when Paystack is not configured", () => {
    vi.mocked(paystackPublicKey).mockReturnValue(null);
    render(<PayBookingButton booking={base} onBooking={() => {}} />);
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByTestId("pay-unavailable")).toBeInTheDocument();
  });
});
