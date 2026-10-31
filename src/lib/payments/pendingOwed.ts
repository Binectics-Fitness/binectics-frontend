/**
 * A payment of something a gym says the member owes (/pay/membership/:id)
 * that fell back to Paystack's hosted page. The hosted page sends the member
 * to /payments/return with only the reference; this keeps which charge it was
 * for that tab, so the return page can ask the API to verify it and go back
 * to the pay page. It is not proof of anything: the API verifies with
 * Paystack. Storage can be unavailable, so every access is guarded.
 */
const KEY = "binectics.pendingOwedCharge";

export function savePendingOwed(chargeId: string, reference: string): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify({ chargeId, reference }));
  } catch {
    // No storage: the pay page re-reads and verifies when it is opened.
  }
}

/** The charge id saved for `reference`, or null. */
export function readPendingOwed(reference: string): string | null {
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { chargeId?: unknown; reference?: unknown };
    return parsed.reference === reference && typeof parsed.chargeId === "string" ? parsed.chargeId : null;
  } catch {
    return null;
  }
}

export function clearPendingOwed(): void {
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    // Nothing to clear.
  }
}
