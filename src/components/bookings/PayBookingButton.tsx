"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { formatCurrency } from "@/utils/format";
import { minorToMajor } from "@/lib/money/minorMoney";
import { openPaystack, paystackPublicKey } from "@/lib/payments/paystackInline";
import { isPayable, paystackChargeFor } from "@/lib/bookings/paymentState";

/**
 * How long to keep asking the API after the checkout closed and the
 * gateway has not settled yet (the webhook can lag the callback by a few
 * seconds). After this the booking stays visible as awaiting payment and
 * any later refresh picks the confirmation up; nothing is assumed.
 */
const VERIFY_POLL_MS = 3000;
const VERIFY_POLL_LIMIT = 20;

export type PayPhase = "idle" | "opening" | "checkout" | "verifying" | "unsettled" | "failed";

/**
 * Pays for a held booking with Paystack's popup and reports the booking
 * the API returns afterwards. The popup's callback is treated as "the
 * checkout closed", never as "paid": the API verifies the charge with the
 * gateway and only its booking status counts.
 */
export function PayBookingButton({
  booking,
  onBooking,
  onError,
  label,
  className = "btn-primary-v2 w-full justify-center",
}: {
  booking: ConsultationBooking;
  /** Every authoritative booking the API returns while paying. */
  onBooking: (booking: ConsultationBooking) => void;
  onError?: (message: string) => void;
  /** Defaults to "Pay ₦25,000"; the bookings list uses "Pay now". */
  label?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<PayPhase>("idle");
  // Set inside the effect, not at creation: StrictMode mounts, unmounts and
  // remounts in development, and a ref initialised once would stay false.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);

  const charge = paystackChargeFor(booking);
  const configured = !!paystackPublicKey();
  if (!isPayable(booking) || !charge) return null;

  const amountLabel = formatCurrency(minorToMajor(charge.amountMinor), charge.currency);

  const settle = async () => {
    // First ask the API to verify with the gateway directly; if the webhook
    // beat us the booking is already confirmed and this is a no-op.
    setPhase("verifying");
    try {
      const verified = await consultationsService.verifyBookingPayment(booking.id);
      if (!alive.current) return;
      if (verified.success && verified.data) {
        onBooking(verified.data);
        if (verified.data.status !== "PENDING") { setPhase("idle"); return; }
        if (verified.data.verification?.gatewayStatus === "abandoned" || verified.data.verification?.gatewayStatus === "failed") {
          setPhase("failed");
          onError?.(verified.data.verification.gatewayStatus === "failed" ? "The payment did not go through. You can try again." : "The checkout was closed before payment completed.");
          return;
        }
      }
    } catch {
      // Verification unreachable; fall through to polling the booking.
    }
    // The gateway may still be settling. Re-read the booking for a while.
    for (let i = 0; i < VERIFY_POLL_LIMIT && alive.current; i++) {
      await new Promise((r) => setTimeout(r, VERIFY_POLL_MS));
      try {
        const res = await consultationsService.getBooking(booking.id);
        if (!alive.current) return;
        if (res.success && res.data) {
          onBooking(res.data);
          if (res.data.status !== "PENDING") { setPhase("idle"); return; }
        }
      } catch {
        // keep polling
      }
    }
    if (alive.current) setPhase("unsettled");
  };

  const pay = async () => {
    if (!user?.email) { onError?.("Sign in again to pay."); return; }
    setPhase("opening");
    try {
      setPhase("checkout");
      const result = await openPaystack({
        email: user.email,
        amountMinor: charge.amountMinor,
        currency: charge.currency,
        reference: charge.reference,
      });
      if (!alive.current) return;
      if (result.closed === "dismissed") {
        // Closing the popup is not a failure; the hold is still theirs.
        // Re-read anyway: a charge can complete just before the close.
        setPhase("idle");
        try {
          const res = await consultationsService.getBooking(booking.id);
          if (alive.current && res.success && res.data) onBooking(res.data);
        } catch {
          // the list refresh will catch it
        }
        return;
      }
      await settle();
    } catch (err) {
      if (!alive.current) return;
      setPhase("failed");
      onError?.(err instanceof Error ? err.message : "Could not open payment.");
    }
  };

  if (!configured) {
    return (
      <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }} data-testid="pay-unavailable">
        Payments are not available right now. Your slot stays held until the deadline.
      </p>
    );
  }

  // "checkout" does not disable: the popup's iframe covers the page while it
  // is open, and if Paystack refuses the key it opens nothing and calls
  // nothing back, so a button gated on its callbacks would be a dead end.
  const busy = phase === "opening" || phase === "verifying";
  const text =
    phase === "verifying" ? "Confirming payment..."
    : phase === "checkout" ? "Complete payment in the Paystack window"
    : phase === "opening" ? "Opening payment..."
    : phase === "unsettled" ? "Check again"
    : phase === "failed" ? `Try again: ${label ?? `Pay ${amountLabel}`}`
    : label ?? `Pay ${amountLabel}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={phase === "unsettled" ? settle : pay}
        disabled={busy}
        className={`${className} disabled:opacity-60`}
        data-testid="pay-booking"
      >
        {text}
      </button>
      {phase === "unsettled" && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          Your payment is still being confirmed. This booking updates by itself once it goes through; you can check again or come back later.
        </p>
      )}
    </div>
  );
}
