import {
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { formatMinor } from "@/lib/currencies/helpers";
import { bookingPaymentState } from "@/lib/bookings/paymentState";

/**
 * Where a booking stands on money, from the API's booking only:
 *  - `free`: no price was ever attached;
 *  - `paid`: the charge settled (the single read's `receipt`, or a priced
 *    booking the list shows as confirmed/completed/no-show, which only
 *    settlement can produce);
 *  - `awaiting_payment`: a held slot that can still be paid;
 *  - `unpaid`: priced, never paid, and no longer payable (a lapsed hold or
 *    a hold cancelled before payment).
 */
export type BookingMoneyState = "free" | "paid" | "awaiting_payment" | "unpaid";

const SETTLED_STATUSES: ReadonlySet<ConsultationBookingStatus> = new Set([
  ConsultationBookingStatus.CONFIRMED,
  ConsultationBookingStatus.COMPLETED,
  ConsultationBookingStatus.NO_SHOW,
]);

export function bookingMoneyState(
  booking: Pick<ConsultationBooking, "status" | "price" | "receipt" | "payment" | "cancelReason" | "cancelledBy">,
): BookingMoneyState {
  if (booking.receipt) return "paid";
  if (bookingPaymentState(booking) === "awaiting_payment") return "awaiting_payment";
  if (!booking.price) return "free";
  return SETTLED_STATUSES.has(booking.status) ? "paid" : "unpaid";
}

/** True when the booking has a receipt worth linking to: a settled charge. */
export function hasPaidReceipt(
  booking: Pick<ConsultationBooking, "status" | "price" | "receipt" | "payment" | "cancelReason" | "cancelledBy">,
): boolean {
  return bookingMoneyState(booking) === "paid";
}

export function receiptHref(bookingId: string): string {
  return `/booking/${encodeURIComponent(bookingId)}/receipt`;
}

/**
 * The booking's price, formatted from minor units in its own currency, or
 * "Free". Falls back to the held payment block for API builds that only
 * sent the amount while a booking was unpaid.
 */
export function bookingAmountLabel(
  booking: Pick<ConsultationBooking, "price" | "payment">,
): string {
  const amountMinor = booking.price?.amountMinor ?? booking.payment?.amountMinor ?? null;
  const currency = booking.price?.currency ?? booking.payment?.currency ?? null;
  if (amountMinor == null || amountMinor <= 0 || !currency) return "Free";
  return formatMinor(currency, amountMinor);
}

export function providerDisplayName(
  booking: Pick<ConsultationBooking, "providerFirstName" | "providerLastName">,
): string | null {
  const name = [booking.providerFirstName, booking.providerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || null;
}

/**
 * A date and time in the viewer's own time zone, with the zone named so a
 * printed receipt is unambiguous: "Sat, 10 Oct 2026, 10:00 WAT".
 */
export function formatViewerDateTime(
  iso: string,
  opts: { locale?: string; timeZone?: string } = {},
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat(opts.locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    ...(opts.timeZone ? { timeZone: opts.timeZone } : {}),
  }).format(d);
}
