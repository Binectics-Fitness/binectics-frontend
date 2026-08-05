import {
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";

/**
 * Pure rules behind the provider booking actions (Complete / Mark no-show /
 * Cancel), shared by the dietitian consultations page and the trainer
 * sessions log. The no-show and terminal-status rules mirror what the API
 * enforces, so the UI never offers a button the backend rejects; the cancel
 * window is a UI policy (the API lets a provider cancel at any time, only
 * clients face a cutoff).
 *
 * Deliberately NOT here: a "Confirm" action. `createBooking` writes
 * CONFIRMED directly, so PENDING is unreachable today and a confirm button
 * would be dead UI.
 *
 * Unit-tested in src/tests/unit/booking-actions.test.ts.
 */

export type BookingActionKind = "complete" | "no-show" | "cancel";

/** Only open bookings can be acted on; terminal states are read-only. */
export function isActionable(status: ConsultationBookingStatus): boolean {
  return (
    status === ConsultationBookingStatus.PENDING ||
    status === ConsultationBookingStatus.CONFIRMED
  );
}

/**
 * Has the session's start time passed? `now` is a wall-clock snapshot taken
 * on load / on row click — never Date.now() during render, so the markup
 * stays deterministic. A zero snapshot means "not measured yet".
 */
export function hasStarted(booking: ConsultationBooking, now: number): boolean {
  return now > 0 && new Date(booking.startsAt).getTime() < now;
}

/**
 * The API rejects a no-show before the session was due to start
 * ("A booking cannot be marked as no-show before it starts").
 */
export function canMarkNoShow(booking: ConsultationBooking, now: number): boolean {
  return isActionable(booking.status) && hasStarted(booking, now);
}

/**
 * Cancelling is only offered before the session starts — a UI policy: after
 * the start time the honest outcomes are "completed" or "no-show".
 */
export function canCancel(booking: ConsultationBooking, now: number): boolean {
  return isActionable(booking.status) && !hasStarted(booking, now);
}

/**
 * Completing a session that hasn't started yet is allowed but suspicious —
 * the page double-checks with the provider first.
 */
export function needsEarlyCompleteConfirm(
  booking: ConsultationBooking,
  now: number,
): boolean {
  return !hasStarted(booking, now);
}

export const ACTION_SUCCESS_MESSAGE: Record<BookingActionKind, string> = {
  complete: "Session marked as completed.",
  "no-show": "Session marked as a no-show.",
  cancel: "Session cancelled.",
};

export const NO_SHOW_DISABLED_REASON =
  "No-show becomes available once the session start time has passed.";

export const CANCEL_DISABLED_REASON =
  "Cancelling is only available before the session starts.";

export const BOOKING_STATUS_LABEL: Record<ConsultationBookingStatus, string> = {
  [ConsultationBookingStatus.PENDING]: "Pending",
  [ConsultationBookingStatus.CONFIRMED]: "Confirmed",
  [ConsultationBookingStatus.COMPLETED]: "Completed",
  [ConsultationBookingStatus.CANCELLED]: "Cancelled",
  [ConsultationBookingStatus.NO_SHOW]: "No-show",
};

export function bookingStatusLabel(status: ConsultationBookingStatus): string {
  return BOOKING_STATUS_LABEL[status] ?? String(status);
}

/** Minutes between start and end, floored at 0 for malformed ranges. */
export function durationMins(booking: ConsultationBooking): number {
  return Math.max(
    0,
    Math.round(
      (new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60000,
    ),
  );
}

/**
 * Display name for the booked client. The provider bookings payload only
 * carries first/last name when the client profile exposes them — fall back
 * to a stable short id rather than inventing a name.
 */
export function clientDisplayName(booking: ConsultationBooking): string {
  const name = [booking.clientFirstName, booking.clientLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (name) return name;
  return `Client ${booking.clientUserId.slice(-6).toUpperCase()}`;
}

export function clientInitials(booking: ConsultationBooking): string {
  const name = [booking.clientFirstName, booking.clientLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (!name) {
    // No name on the payload — echo the tail of the id shown in the label
    // instead of faking initials.
    return booking.clientUserId.slice(-2).toUpperCase() || "?";
  }
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}
