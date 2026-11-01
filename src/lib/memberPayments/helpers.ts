import type { Tone } from "@/lib/ui/tones";
import type {
  MemberPayment,
  OwedCharge,
  OwedGatewayStatus,
  PaymentKind,
  PaymentMethodWord,
} from "@/lib/api/memberPayments";
import { MEMBER_CHARGE_CODES } from "@/lib/api/memberPayments";
import type { ApiResponse } from "@/lib/types";

/** Re-reads after a verify that has not settled: 20 x 3s, as the booking and content panels. */
export const OWED_POLL_MS = 3000;
export const OWED_POLL_LIMIT = 20;

export const PAYMENT_PATH = "/dashboard/member/payments";
export const payMembershipPath = (chargeId: string) => `/pay/membership/${encodeURIComponent(chargeId)}`;

export const KIND_LABEL: Record<PaymentKind, string> = {
  membership: "Membership",
  session: "Session",
  content: "Program or meal plan",
  service: "Service",
  refund: "Refund",
};

export const METHOD_LABEL: Record<PaymentMethodWord, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
  cash: "Paid at the gym",
  other: "Other",
};

/** The status pill for a history row: what the money did, in the member's words. */
export function paymentStatus(p: Pick<MemberPayment, "status" | "refund">): { label: string; tone: Tone } {
  if (p.status === "refund") return { label: "Refund", tone: "warn" };
  if (p.refund.state === "full") return { label: "Refunded", tone: "warn" };
  if (p.refund.state === "partial") return { label: "Part refunded", tone: "warn" };
  return { label: "Paid", tone: "success" };
}

/**
 * The words for a pay-page gateway answer that did not settle. `null` for
 * answers that are not failures (still confirming, or paid).
 */
export function owedFailureCopy(status: OwedGatewayStatus | null | undefined): string | null {
  switch (status) {
    case "failed":
      return "The payment did not go through. You have not been charged; you can try again.";
    case "abandoned":
      return "The checkout closed before the payment completed. You have not been charged; you can try again.";
    case "mismatch":
      return "The amount paid does not match what is owed. Contact the gym or support and we will sort it out.";
    case "error":
      return "We couldn't confirm this payment just now. If you were charged, it will show up here once confirmed; otherwise you can try again.";
    case "not_payable":
      return "This can no longer be paid. Check with the gym.";
    default:
      return null;
  }
}

/** What a refused checkout or verify says. The API's own sentence wins. */
export function owedErrorCopy(res: Pick<ApiResponse, "code" | "message">, fallback: string): string {
  switch (res.code) {
    case MEMBER_CHARGE_CODES.ALREADY_PAID:
      return "This is already paid.";
    case MEMBER_CHARGE_CODES.NOT_PAYABLE:
      return "There is nothing to pay here any more.";
    case MEMBER_CHARGE_CODES.TRANSFER_IN_PROGRESS:
      return "A bank transfer is already waiting for this payment. Finish it, or try again in a little while.";
    default:
      return res.message?.trim() || fallback;
  }
}

/** How a renewal that is owed is paid: the existing renew-in-place checkout. */
export function renewHrefFor(c: OwedCharge): string | null {
  if (c.payVia !== "renewal_checkout" || !c.renewal?.listingId) return null;
  return `/checkout?listing=${encodeURIComponent(c.renewal.listingId)}&plan=${encodeURIComponent(c.renewal.planId)}`;
}
