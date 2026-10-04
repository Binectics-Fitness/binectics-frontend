import type { Tone } from "./tones";

/**
 * Status → tone for every status the web app shows, following the rules in
 * ./tones.ts. These mirror the mobile app's helpers (binectics-mobile
 * utils/sessions.ts bookingStatusTone, utils/programTasks.ts taskStatusTone /
 * instanceStatusTone / adherenceCountTones, utils/coachDay.ts attentionTone,
 * utils/coachClientPage.ts sentTaskTone) so a status reads the same colour on
 * both. Every helper is tolerant of a status the API adds later: unknown is
 * neutral, never a guess.
 */

/**
 * A booking's status badge, for sessions (PENDING, CONFIRMED, COMPLETED,
 * NO_SHOW, CANCELLED) and gym classes (confirmed, waitlisted,
 * cancelled_by_member, cancelled_by_gym):
 *  - success: confirmed or completed
 *  - warn: a held slot awaiting payment, or a no-show (missed)
 *  - neutral: cancelled, waitlisted, pending on the provider, anything new.
 *    Cancelled is not a failure, so it is not red.
 */
export function bookingStatusTone(
  status: string | null | undefined,
  opts: { awaitingPayment?: boolean } = {},
): Tone {
  if (opts.awaitingPayment) return "warn";
  const s = (status ?? "").toUpperCase();
  if (s === "CONFIRMED" || s === "COMPLETED") return "success";
  if (s === "NO_SHOW") return "warn";
  return "neutral";
}

/**
 * The tone for lib/bookings/paymentState's BookingPaymentState, the member's
 * view of a booking: awaiting payment and no-show need attention; an expired
 * hold or a cancellation is news, not a failure.
 */
export function bookingPaymentStateTone(state: string | null | undefined): Tone {
  switch (state) {
    case "awaiting_payment":
    case "no_show":
      return "warn";
    case "confirmed":
    case "completed":
      return "success";
    default:
      return "neutral";
  }
}

/**
 * A program task's status: done is success (late or not: it was done),
 * missed needs attention (warn), skipped was a choice and to-do is just the
 * plan, so both are neutral.
 */
export function taskStatusTone(status: string | null | undefined): Tone {
  if (status === "done") return "success";
  if (status === "missed") return "warn";
  return "neutral";
}

/**
 * A program instance's status: active and completed are success, paused
 * needs watching (warn: nothing counts while paused), assigned and cancelled
 * are neutral. Cancelled is an ending, not a failure.
 */
export function instanceStatusTone(status: string | null | undefined): Tone {
  if (status === "active" || status === "completed") return "success";
  if (status === "paused") return "warn";
  return "neutral";
}

/**
 * Tones for a program's adherence counts. A count only carries colour when it
 * is above zero; "0 missed" is not a warning.
 */
export function adherenceCountTones(counts: { done: number; missed: number }): {
  done: Tone;
  missed: Tone;
  skipped: Tone;
  pending: Tone;
} {
  return {
    done: counts.done > 0 ? "success" : "neutral",
    missed: counts.missed > 0 ? "warn" : "neutral",
    skipped: "neutral",
    pending: "neutral",
  };
}

/**
 * A "Needs you" row (GET /programs/provider/attention): a submitted form is
 * ready to review (success); missed tasks need a nudge but nothing failed
 * (warn). An unknown kind from a newer API stays neutral.
 */
export function attentionTone(kind: string | null | undefined): Tone {
  if (kind === "form_submitted") return "success";
  if (kind === "tasks_missed") return "warn";
  return "neutral";
}

/**
 * A task or form a provider sent on its own (one-off): done or submitted is
 * success; missed, or still open past its due day, needs a nudge (warn);
 * skipped and anything not yet due are neutral. `today` is the CLIENT's day
 * (YYYY-MM-DD), as the API returns it.
 */
export function sentTaskTone(task: { status: string; due_date: string }, today: string): Tone {
  switch (task.status) {
    case "done":
      return "success";
    case "missed":
      return "warn";
    case "skipped":
      return "neutral";
    default:
      return today && task.due_date < today ? "warn" : "neutral";
  }
}

/**
 * A gym membership (MembershipSubscriptionStatus): active is success;
 * pending payment needs the member to pay (warn); past due (renewal failed)
 * and suspended (blocked by the gym) are danger; paused is the member's own
 * break, and expired / cancelled are endings, so all three are neutral.
 */
export function membershipStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "active":
      return "success";
    case "pending_payment":
      return "warn";
    case "past_due":
    case "suspended":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * A provider's platform subscription (ProviderSubscriptionStatus): active is
 * success, trialing is neutral information, pending payment is warn, past due
 * is danger, cancelled / expired are neutral.
 */
export function subscriptionStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "active":
      return "success";
    case "pending_payment":
      return "warn";
    case "past_due":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * An invoice (ProviderInvoiceStatus): paid is success, open is waiting on
 * payment (warn), uncollectible failed (danger), draft and void neutral.
 */
export function invoiceStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "paid":
      return "success";
    case "open":
      return "warn";
    case "uncollectible":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * A payment transaction (admin payments): succeeded is success, pending is
 * awaiting payment (warn), failed is danger, reversed is neutral (a refund is
 * an outcome, not a fault).
 */
export function paymentStatusTone(status: string | null | undefined): Tone {
  switch ((status ?? "").toLowerCase()) {
    case "succeeded":
    case "success":
    case "paid":
      return "success";
    case "pending":
      return "warn";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * A marketplace connection request (MarketplaceRequestStatus): accepted is
 * success, pending is waiting on someone (warn), declined is a refusal
 * (danger), expired and cancelled are neutral endings.
 */
export function requestStatusTone(status: string | null | undefined): Tone {
  switch (status) {
    case "accepted":
      return "success";
    case "pending":
      return "warn";
    case "declined":
      return "danger";
    default:
      return "neutral";
  }
}

/**
 * Whether an account, listing or other record is live. Suspended is blocked
 * (danger); invited / awaiting verification is waiting (warn); live is
 * success; drafts, inactive and archived are neutral.
 */
export function recordStateTone(state: "live" | "waiting" | "blocked" | "off"): Tone {
  switch (state) {
    case "live":
      return "success";
    case "waiting":
      return "warn";
    case "blocked":
      return "danger";
    default:
      return "neutral";
  }
}

/** A program template: published is ready (success); draft and archived are neutral. */
export function templateStatusTone(status: string | null | undefined): Tone {
  return status === "published" ? "success" : "neutral";
}
