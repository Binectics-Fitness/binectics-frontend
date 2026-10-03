import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BookingReceiptClient } from "@/app/booking/[id]/receipt/BookingReceiptClient";
import {
  consultationsService,
  ConsultationBookingStatus,
  ConsultationCancelledBy,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { bookingAmountLabel, bookingMoneyState, hasPaidReceipt } from "@/lib/bookings/receipt";
import { formatMinor } from "@/lib/currencies/helpers";

vi.mock("next/link", () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));
vi.mock("@/components/BinecticsLogo", () => ({ BinecticsLockup: () => <span>Binectics</span> }));
vi.mock("@/components/MarketplaceAuthCluster", () => ({ MarketplaceAuthCluster: () => null }));
const auth = { user: { id: "c1", role: "USER" } as { id: string; role: string } | null };
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => auth }));

const paid: ConsultationBooking = {
  id: "6650aa00bb11cc22dd33ee44",
  clientUserId: "c1",
  clientFirstName: "Ada",
  clientLastName: "Obi",
  providerId: "p1",
  providerFirstName: "Sam",
  providerLastName: "Coach",
  consultationTypeId: "t1",
  consultationTypeName: "Strength session",
  startsAt: "2026-10-10T09:00:00.000Z",
  endsAt: "2026-10-10T10:00:00.000Z",
  providerTimezone: "Africa/Lagos",
  clientTimezone: "Africa/Lagos",
  status: ConsultationBookingStatus.CONFIRMED,
  price: { amountMinor: 2_500_000, currency: "NGN" },
  receipt: { reference: "bkg_abc123", paidAt: "2026-09-20T10:15:00.000Z" },
  createdAt: "",
  updatedAt: "",
};
const ok = <T,>(data: T) => ({ success: true, data });

describe("booking receipt page", () => {
  const get = vi.spyOn(consultationsService, "getBooking");

  beforeEach(() => {
    get.mockReset();
    auth.user = { id: "c1", role: "USER" };
  });

  it("shows a paid booking as a receipt: provider, session, amount from minor units, reference and paid date", async () => {
    get.mockResolvedValue(ok(paid));
    render(<BookingReceiptClient bookingId={paid.id} />);
    await screen.findByTestId("booking-receipt");
    expect(get).toHaveBeenCalledWith(paid.id);
    expect(screen.getByText("Receipt · paid")).toBeInTheDocument();
    expect(screen.getByText("Sam Coach")).toBeInTheDocument();
    expect(screen.getByText("Ada Obi")).toBeInTheDocument();
    expect(screen.getByText(/Strength session · 60 min/)).toBeInTheDocument();
    expect(screen.getByTestId("receipt-total")).toHaveTextContent(formatMinor("NGN", 2_500_000));
    expect(screen.getByText("bkg_abc123")).toBeInTheDocument();
    expect(screen.getByText("Total paid")).toBeInTheDocument();
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
    expect(screen.queryByTestId("receipt-unpaid-note")).toBeNull();
    expect(screen.getByRole("link", { name: "Back to bookings" })).toHaveAttribute("href", "/dashboard/bookings");
  });

  it("sends a trainer back to the session it belongs to", async () => {
    auth.user = { id: "p1", role: "TRAINER" };
    get.mockResolvedValue(ok(paid));
    render(<BookingReceiptClient bookingId={paid.id} />);
    expect(await screen.findByRole("link", { name: "Back to session" })).toHaveAttribute(
      "href",
      `/dashboard/trainer/sessions/${paid.id}`,
    );
  });

  it("says Free for a free session", async () => {
    get.mockResolvedValue(ok({ ...paid, price: undefined, receipt: undefined }));
    render(<BookingReceiptClient bookingId={paid.id} />);
    await screen.findByTestId("booking-receipt");
    expect(screen.getByText("Receipt · free session")).toBeInTheDocument();
    expect(screen.getByTestId("receipt-total")).toHaveTextContent("Free");
  });

  it("does not pretend a held booking is paid", async () => {
    get.mockResolvedValue(
      ok({
        ...paid,
        status: ConsultationBookingStatus.PENDING,
        receipt: undefined,
        payment: { reference: "bkg_abc123", amountMinor: 2_500_000, currency: "NGN", expiresAt: "2026-10-01T10:00:00.000Z" },
      }),
    );
    render(<BookingReceiptClient bookingId={paid.id} />);
    await screen.findByTestId("booking-receipt");
    expect(screen.getByText("Booking summary · awaiting payment")).toBeInTheDocument();
    expect(screen.getByTestId("receipt-unpaid-note")).toHaveTextContent(/isn't paid yet/);
    expect(screen.queryByText("Payment reference")).toBeNull();
    expect(screen.queryByText("Total paid")).toBeNull();
  });

  it("shows a lapsed hold as not paid, with its status", async () => {
    get.mockResolvedValue(
      ok({
        ...paid,
        status: ConsultationBookingStatus.CANCELLED,
        cancelledBy: ConsultationCancelledBy.SYSTEM,
        cancelReason: "Payment was not completed in time",
        receipt: undefined,
      }),
    );
    render(<BookingReceiptClient bookingId={paid.id} />);
    await screen.findByTestId("booking-receipt");
    expect(screen.getByText("Booking summary · not paid")).toBeInTheDocument();
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText(/Payment was not completed in time/)).toBeInTheDocument();
  });

  it("explains a booking the API will not show (404 or 403) instead of rendering an empty receipt", async () => {
    for (const status of [404, 403]) {
      get.mockResolvedValueOnce({ success: false, status, message: "Booking not found" });
      const { unmount } = render(<BookingReceiptClient bookingId="nope" />);
      expect(await screen.findByText("Receipt not found")).toBeInTheDocument();
      expect(screen.queryByTestId("booking-receipt")).toBeNull();
      unmount();
    }
  });

  it("offers a retry when loading fails for another reason", async () => {
    get.mockResolvedValueOnce({ success: false, status: 500, message: "Server error" });
    get.mockResolvedValueOnce(ok(paid));
    render(<BookingReceiptClient bookingId={paid.id} />);
    const retry = await screen.findByRole("button", { name: "Try again" });
    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByTestId("booking-receipt")).toBeInTheDocument());
  });
});

describe("booking money state", () => {
  it("calls a priced confirmed/completed/no-show booking paid, even from the list without a receipt block", () => {
    for (const status of [
      ConsultationBookingStatus.CONFIRMED,
      ConsultationBookingStatus.COMPLETED,
      ConsultationBookingStatus.NO_SHOW,
    ]) {
      expect(hasPaidReceipt({ ...paid, receipt: undefined, status })).toBe(true);
    }
  });

  it("never calls a free, held or lapsed booking paid", () => {
    expect(hasPaidReceipt({ ...paid, price: undefined, receipt: undefined })).toBe(false);
    expect(
      bookingMoneyState({
        ...paid,
        receipt: undefined,
        status: ConsultationBookingStatus.PENDING,
        payment: { reference: "r", amountMinor: 1, currency: "NGN" },
      }),
    ).toBe("awaiting_payment");
    expect(
      bookingMoneyState({ ...paid, receipt: undefined, status: ConsultationBookingStatus.CANCELLED }),
    ).toBe("unpaid");
  });

  it("trusts the single read's receipt for a paid booking cancelled afterwards", () => {
    expect(bookingMoneyState({ ...paid, status: ConsultationBookingStatus.CANCELLED })).toBe("paid");
  });

  it("formats the amount from minor units in the booking's currency", () => {
    expect(bookingAmountLabel(paid)).toBe(formatMinor("NGN", 2_500_000));
    expect(bookingAmountLabel({ price: { amountMinor: 1999, currency: "USD" } })).toBe(formatMinor("USD", 1999));
    expect(bookingAmountLabel({})).toBe("Free");
  });
});
