import { describe, it, expect } from "vitest";
import {
  bookingPaymentState,
  isPayable,
  paystackChargeFor,
} from "@/lib/bookings/paymentState";
import { ConsultationBookingStatus } from "@/lib/api/consultations";

const hold = {
  status: ConsultationBookingStatus.PENDING,
  payment: { reference: "bkg_abc", amountMinor: 2500000, currency: "ngn", expiresAt: "2026-09-27T20:00:00.000Z" },
};

describe("bookingPaymentState", () => {
  it("is awaiting payment only while the API still returns the hold", () => {
    expect(bookingPaymentState(hold)).toBe("awaiting_payment");
    expect(isPayable(hold)).toBe(true);
  });

  it("does not decide expiry from the clock: a pending hold with a past deadline is still the API's to cancel", () => {
    const past = { ...hold, payment: { ...hold.payment, expiresAt: "2000-01-01T00:00:00.000Z" } };
    expect(bookingPaymentState(past)).toBe("awaiting_payment");
    expect(isPayable(past)).toBe(true);
  });

  it("reads a lapsed hold off the sweep's cancel reason", () => {
    expect(
      bookingPaymentState({ status: ConsultationBookingStatus.CANCELLED, cancelReason: "Payment was not completed in time" }),
    ).toBe("expired");
    expect(
      bookingPaymentState({ status: ConsultationBookingStatus.CANCELLED, cancelReason: "Changed my mind" }),
    ).toBe("cancelled");
    expect(isPayable({ status: ConsultationBookingStatus.CANCELLED })).toBe(false);
  });

  it("a confirmed booking is never payable, whatever the payment block says", () => {
    expect(bookingPaymentState({ status: ConsultationBookingStatus.CONFIRMED })).toBe("confirmed");
    expect(isPayable({ status: ConsultationBookingStatus.CONFIRMED, payment: hold.payment })).toBe(false);
  });

  it("a free booking is confirmed at once and carries no payment", () => {
    expect(bookingPaymentState({ status: ConsultationBookingStatus.CONFIRMED })).toBe("confirmed");
    expect(paystackChargeFor({ status: ConsultationBookingStatus.CONFIRMED } as never)).toBeNull();
  });
});

describe("paystackChargeFor", () => {
  it("hands Paystack the API's reference and minor amount, unscaled, with an upper-case currency", () => {
    expect(paystackChargeFor(hold)).toEqual({ reference: "bkg_abc", amountMinor: 2500000, currency: "NGN" });
  });

  it("refuses to build a charge without a reference or amount", () => {
    expect(paystackChargeFor({ payment: { reference: "", amountMinor: 100, currency: "NGN" } })).toBeNull();
    expect(paystackChargeFor({ payment: { reference: "bkg_x", amountMinor: 0, currency: "NGN" } })).toBeNull();
  });
});
