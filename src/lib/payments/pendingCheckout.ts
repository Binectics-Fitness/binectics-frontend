/**
 * A membership checkout the browser started and may have to finish after a
 * redirect. The popup normally stays on the page, but when it can't load
 * the checkout falls back to Paystack's hosted page, which sends the member
 * back to /payments/return with only the reference. What subscribe needs
 * besides it (listing, plan, the amount the server quoted) is kept here for
 * that tab.
 *
 * None of this is proof of payment: subscribe sends the server's own
 * payment_reference and the API verifies the charge with Paystack before
 * activating anything. Storage can be unavailable (private mode, blocked
 * site data), so every access is guarded and a miss is a normal outcome.
 */

export interface PendingMembershipCheckout {
  /** Paystack reference ("mbr_..."). */
  reference: string;
  /** What subscribe expects ("paystack_mbr_..."). */
  payment_reference: string;
  listing_id: string;
  plan_id: string;
  amount_minor: number;
  /** The member ticked "Renew automatically" (only words the success page). */
  save_card?: boolean;
}

const KEY = "binectics.pendingMembershipCheckout";

export function savePendingCheckout(checkout: PendingMembershipCheckout): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(checkout));
  } catch {
    // No storage: the popup path does not need it.
  }
}

/** The saved checkout for `reference`, or null. */
export function readPendingCheckout(reference: string): PendingMembershipCheckout | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingMembershipCheckout>;
    if (
      parsed.reference !== reference ||
      typeof parsed.payment_reference !== "string" ||
      typeof parsed.listing_id !== "string" ||
      typeof parsed.plan_id !== "string" ||
      typeof parsed.amount_minor !== "number"
    ) {
      return null;
    }
    return parsed as PendingMembershipCheckout;
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}
