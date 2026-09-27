import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MyBookingsPage from "@/app/dashboard/bookings/page";
import { consultationsService, ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";

vi.mock("next/link", () => ({ default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a> }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { email: "ngozi@example.com" } }) }));
vi.mock("@/components/classes/MyClassBookingsCard", () => ({ MyClassBookingsCard: () => null }));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));
vi.mock("@/lib/payments/paystackInline", () => ({
  openPaystack: vi.fn(),
  paystackPublicKey: vi.fn(() => "pk_test_abc123"),
}));

const hold: ConsultationBooking = {
  id: "held-1",
  clientUserId: "c1",
  providerId: "p1",
  consultationTypeId: "t1",
  consultationTypeName: "1:1 session",
  startsAt: "2026-10-02T09:00:00.000Z",
  endsAt: "2026-10-02T10:00:00.000Z",
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.PENDING,
  payment: { reference: "bkg_ref-1", amountMinor: 2500000, currency: "NGN", expiresAt: "2026-09-27T20:00:00.000Z" },
  createdAt: "",
  updatedAt: "",
};
const free: ConsultationBooking = { ...hold, id: "free-1", status: ConsultationBookingStatus.CONFIRMED, payment: undefined, consultationTypeName: "Check-in" };
const ok = <T,>(data: T) => ({ success: true, data });

describe("bookings page", () => {
  const list = vi.spyOn(consultationsService, "getMyBookings");
  const get = vi.spyOn(consultationsService, "getBooking");

  beforeEach(() => {
    list.mockReset();
    get.mockReset();
    window.history.replaceState(null, "", "/dashboard/bookings");
  });

  it("lands on the booking the URL names, then drops the parameter so a tab change does not pull it back", async () => {
    window.history.replaceState(null, "", "/dashboard/bookings?booking=held-1");
    list.mockResolvedValue(ok([free, hold]));
    render(<MyBookingsPage />);
    await waitFor(() => expect(screen.getAllByTestId("payment-panel").length).toBeGreaterThan(0));
    expect(window.location.search).toBe("");
    expect(get).not.toHaveBeenCalled();

    // The past tab does not hold it; it is not fetched back in.
    list.mockResolvedValue(ok([]));
    await userEvent.click(screen.getByRole("button", { name: /Past/ }));
    await waitFor(() => expect(screen.getByText(/No past sessions yet/)).toBeInTheDocument());
    expect(get).not.toHaveBeenCalled();
  });

  it("fetches a named booking the list no longer holds, such as one the sweep has cancelled", async () => {
    window.history.replaceState(null, "", "/dashboard/bookings?booking=held-1");
    const lapsed = { ...hold, status: ConsultationBookingStatus.CANCELLED, payment: undefined, cancelledBy: "SYSTEM" as never, cancelReason: "Payment was not completed in time" };
    list.mockResolvedValue(ok([free]));
    get.mockResolvedValue(ok(lapsed));
    render(<MyBookingsPage />);
    await waitFor(() => expect(get).toHaveBeenCalledWith("held-1"));
    await waitFor(() => expect(screen.getByText(/ran out before payment/)).toBeInTheDocument());
    expect(screen.queryByTestId("payment-panel")).toBeNull();
  });

  it("offers Pay now as its own button and shows the payment panel for the held booking", async () => {
    list.mockResolvedValue(ok([free, hold]));
    render(<MyBookingsPage />);
    const payNow = await screen.findByTestId("pay-now");
    expect(payNow.tagName).toBe("BUTTON");
    expect(payNow.closest("button")).toBe(payNow);
    await userEvent.click(payNow);
    await waitFor(() => expect(screen.getAllByTestId("payment-panel").length).toBeGreaterThan(0));
    // Both the detail column and the under-row copy carry a real Pay button.
    for (const button of screen.getAllByTestId("pay-booking")) {
      expect(button).toHaveTextContent(/^Pay ₦/);
    }
  });
});
