import {
  ConsultationBookingStatus,
  ConsultationCancelledBy,
  type ConsultationBooking,
} from "@/lib/api/consultations";

/**
 * What a booking needs from the client right now. Derived from the API's
 * booking only: the status and the payment block are the truth, never a
 * client-side clock. `expired` is what the API reports once its sweep has
 * cancelled an unpaid hold; until then a hold is `awaiting_payment` even if
 * the deadline reads as past on this device.
 */
export type BookingPaymentState =
  | "awaiting_payment"
  | "confirmed"
  | "expired"
  | "cancelled"
  | "completed"
  | "no_show"
  | "pending";

export function bookingPaymentState(
  booking: Pick<ConsultationBooking, "status" | "payment" | "cancelReason" | "cancelledBy">,
): BookingPaymentState {
  switch (booking.status) {
    case ConsultationBookingStatus.PENDING:
      return booking.payment ? "awaiting_payment" : "pending";
    case ConsultationBookingStatus.CONFIRMED:
      return "confirmed";
    case ConsultationBookingStatus.COMPLETED:
      return "completed";
    case ConsultationBookingStatus.NO_SHOW:
      return "no_show";
    case ConsultationBookingStatus.CANCELLED:
      // Only the sweep cancels as SYSTEM. Holds it released before the API
      // recorded that carry its reason alone, so the copy is the fallback.
      return booking.cancelledBy === ConsultationCancelledBy.SYSTEM ||
        /not completed in time/i.test(booking.cancelReason ?? "")
        ? "expired"
        : "cancelled";
  }
}

/** True while the booking can still be paid for. */
export function isPayable(
  booking: Pick<ConsultationBooking, "status" | "payment">,
): boolean {
  return (
    booking.status === ConsultationBookingStatus.PENDING && !!booking.payment
  );
}

/**
 * What a held booking will charge, as the API snapshotted it: the reference,
 * the amount in minor units and the currency. For display only; the charge
 * itself is started by the API from the same snapshot (see
 * consultationsService.startBookingPayment), never from these values.
 */
export function paystackChargeFor(
  booking: Pick<ConsultationBooking, "payment">,
): { reference: string; amountMinor: number; currency: string } | null {
  const p = booking.payment;
  if (!p?.reference || !p.amountMinor || !p.currency) return null;
  return {
    reference: p.reference,
    amountMinor: p.amountMinor,
    currency: p.currency.toUpperCase(),
  };
}
