import { describe, it, expect } from "vitest";
import { bookingLabel, statusLabel, formatClock } from "@/lib/bookings/labels";
import { ConsultationBookingStatus } from "@/lib/api/consultations";

describe("booking labels", () => {
  it("calls a held session 'Awaiting payment' and everything else by its status", () => {
    const payment = { reference: "bkg_x", amountMinor: 1, currency: "NGN", expiresAt: "2026-09-27T20:00:00.000Z" };
    expect(bookingLabel({ status: ConsultationBookingStatus.PENDING, payment })).toBe("Awaiting payment");
    expect(bookingLabel({ status: ConsultationBookingStatus.PENDING })).toBe("Pending");
    expect(bookingLabel({ status: ConsultationBookingStatus.CONFIRMED, payment })).toBe("Confirmed");
    expect(statusLabel(ConsultationBookingStatus.NO_SHOW)).toBe("No show");
  });

  it("prints a clock time for the hold deadline", () => {
    expect(formatClock("2026-09-27T20:05:00.000Z")).toMatch(/\d{1,2}:05/);
  });
});
