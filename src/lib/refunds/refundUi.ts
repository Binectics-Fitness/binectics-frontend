import type { Tone } from "@/lib/ui/tones";
import type { Dispute, RefundOrigin, RefundStatus } from "@/lib/api/refunds";

/** What each refund status says to a person, and how it is coloured. */
export const REFUND_STATUS: Record<RefundStatus, { label: string; tone: Tone; help: string }> = {
  requested: { label: "Requested", tone: "warn", help: "Waiting for Binectics to approve it." },
  rejected: { label: "Declined", tone: "neutral", help: "Binectics declined the request." },
  queued: { label: "Queued", tone: "warn", help: "About to be sent to Paystack." },
  sending: { label: "Sending", tone: "warn", help: "Being sent to Paystack now." },
  pending: { label: "With Paystack", tone: "warn", help: "Paystack accepted it and is sending the money back." },
  needs_attention: {
    label: "Needs attention",
    tone: "danger",
    help: "Paystack needs the customer's bank details. Finish it in the Paystack dashboard.",
  },
  unknown: {
    label: "Unconfirmed",
    tone: "danger",
    help: "Paystack didn't answer when it was sent. We are checking; it is never sent twice.",
  },
  processed: { label: "Refunded", tone: "success", help: "The money is back with the customer." },
  failed: { label: "Failed", tone: "danger", help: "It did not go through. The amount can be refunded again." },
};

export const REFUND_ORIGIN_LABEL: Record<RefundOrigin, string> = {
  policy_cancellation: "Member cancelled (policy)",
  provider_cancellation: "Provider cancelled",
  admin_cancellation: "Cancelled by Binectics",
  provider: "Refunded by provider",
  admin: "Refunded by Binectics",
  provider_request: "Requested by provider",
};

/** Which dispute state to show. */
export function disputeTone(d: Pick<Dispute, "open" | "resolution">): { label: string; tone: Tone } {
  if (d.open) return { label: "Open", tone: "warn" };
  if (d.resolution === "merchant-accepted" || d.resolution === "auto-accepted") {
    return { label: "Lost", tone: "danger" };
  }
  if (d.resolution === "declined") return { label: "Won", tone: "success" };
  return { label: "Closed", tone: "neutral" };
}

/**
 * Validates an amount the person typed (already in minor units) against
 * what is still refundable. Returns an error message, or null when fine.
 */
export function refundAmountError(minor: number | null, refundableMinor: number): string | null {
  if (minor === null) return "Enter an amount.";
  if (!Number.isInteger(minor) || minor <= 0) return "Enter an amount above zero.";
  if (minor > refundableMinor) return "That is more than can still be refunded.";
  return null;
}

/**
 * A fresh key for one refund the person means to make. Made when the
 * dialog opens and reused for every retry of that submit, so a
 * double-click or a retried request returns the same refund.
 */
export function newIdempotencyKey(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/** Plain words for the errors the refund API returns by code. */
export function refundErrorMessage(code: string | undefined, fallback?: string): string {
  switch (code) {
    case "REFUND_REQUEST_REQUIRED":
      return "Binectics collected this payment, so ask Binectics to refund it.";
    case "REFUND_NOT_COLLECTOR":
      return "This payment went to the provider's own Paystack account, so only they can refund it.";
    case "REFUND_DIRECT_ONLY":
      return "This payment went to your own Paystack account, so refund it yourself.";
    case "REFUND_EXCEEDS_REMAINING":
      return fallback || "That is more than can still be refunded.";
    case "REFUND_COLLECTOR_UNKNOWN":
      return "We can't tell which Paystack account holds this payment. Refund it from that Paystack dashboard.";
    case "REFUND_COLLECTOR_CHECK_FAILED":
      return "Paystack couldn't be reached to check this payment. Try again in a few minutes.";
    case "REFUND_INVALID_STATE":
      return fallback || "This refund has already moved on. Refresh to see where it is.";
    case "REFUND_DISPUTE_OPEN":
      return "The member has disputed this payment with their bank. It can't be refunded until the dispute is resolved; if the bank sides with them, the money goes back without a refund.";
    case "REFUND_IDEMPOTENCY_CONFLICT":
      return "This form was already used for a different refund. Close it and start again.";
    default:
      return fallback || "Something went wrong. Try again.";
  }
}
