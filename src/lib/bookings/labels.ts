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

const DAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_LONG = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];

/**
 * "Saturdays only", "Sun, Sat only": the days a session type runs on
 * (0 = Sunday, in the provider's timezone). Null when it runs on every day
 * the provider works (no days listed, or all seven). The slots endpoint
 * already offers only those days; this tells the member why.
 */
export function sessionDaysLabel(days: readonly number[] | null | undefined): string | null {
  const set = [...new Set(days ?? [])].filter((d) => d >= 0 && d <= 6).sort((a, b) => a - b);
  if (set.length === 0 || set.length === 7) return null;
  if (set.length === 1) return `${DAY_LONG[set[0]]} only`;
  return `${set.map((d) => DAY_SHORT[d]).join(", ")} only`;
}
