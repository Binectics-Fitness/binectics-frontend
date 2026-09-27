import {
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";

export function statusLabel(status: ConsultationBookingStatus): string {
  switch (status) {
    case ConsultationBookingStatus.CONFIRMED:
      return "Confirmed";
    case ConsultationBookingStatus.PENDING:
      return "Pending";
    case ConsultationBookingStatus.COMPLETED:
      return "Completed";
    case ConsultationBookingStatus.CANCELLED:
      return "Cancelled";
    case ConsultationBookingStatus.NO_SHOW:
      return "No show";
  }
}

/**
 * A priced session is PENDING only while its slot is held for payment, so
 * the pill says that; "Pending" alone reads as waiting on the provider,
 * who has nothing to do.
 */
export function bookingLabel(
  booking: Pick<ConsultationBooking, "status" | "payment">,
): string {
  if (booking.status === ConsultationBookingStatus.PENDING && booking.payment) {
    return "Awaiting payment";
  }
  return statusLabel(booking.status);
}

export function formatClock(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
