/**
 * The short lines under the booking summary on /booking.
 *
 * Cancellation (owner ruling, Oct 18 2026): each provider sets its own
 * cancellation refund policy, so this page never promises a blanket window
 * or refund. A member cannot read the provider's policy before booking (the
 * API serves it to the owner only); once booked, the Bookings page shows
 * what cancelling would refund before they confirm (cancellation quote).
 *
 * A free session has no refund to speak of; the one rule there is the
 * API's own cut-off: a member cannot cancel inside 24 hours of the start
 * (binectics-api consultations.service CANCELLATION_WINDOW_HOURS). Keep the
 * number in step with that constant.
 */
export const FREE_SESSION_CANCEL_CUTOFF_HOURS = 24;

function possessive(name: string): string {
  const n = name.trim();
  if (!n) return "the provider’s";
  return /s$/i.test(n) ? `${n}’` : `${n}’s`;
}

export function bookingAssurances(isPaid: boolean, providerName: string): string[] {
  return isPaid
    ? [
        "Pay with Paystack right after booking",
        "Slot held for 30 minutes while you pay",
        `If you cancel, ${possessive(providerName)} policy sets the refund. You see the amount before you confirm.`,
      ]
    : [
        "Confirmed as soon as you book",
        `You can cancel up to ${FREE_SESSION_CANCEL_CUTOFF_HOURS} hours before`,
        "You'll be notified of any changes",
      ];
}
