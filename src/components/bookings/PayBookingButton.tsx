"use client";

import { useEffect, useRef, useState } from "react";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { formatMinor } from "@/lib/currencies/helpers";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { isPayable, paystackChargeFor } from "@/lib/bookings/paymentState";

/**
 * How long to keep asking the API after the checkout closed and the
 * gateway has not settled yet (the webhook can lag the callback by a few
 * seconds). After this the booking stays visible as awaiting payment and
 * any later refresh picks the confirmation up; nothing is assumed.
 */
const VERIFY_POLL_MS = 3000;
const VERIFY_POLL_LIMIT = 20;

export type PayPhase = "idle" | "checkout" | "verifying" | "unsettled" | "failed";

type GatewayStatus = NonNullable<ConsultationBooking["verification"]>["gatewayStatus"];

/**
 * What to tell the person when the API has verified the charge and the
 * booking is still not confirmed. Anything not listed is "still settling"
 * and is polled for instead.
 */
function failureMessage(status: GatewayStatus | undefined): string | null {
  switch (status) {
    case "failed":
      return "The payment did not go through. You can try again.";
    case "abandoned":
      return "The checkout was closed before payment completed.";
    case "mismatch":
      return "The amount paid does not match this booking. Contact support and we will sort it out.";
    case "reversed":
      return "The payment was reversed. You can try again.";
    case "paid_after_expiry":
      return "The payment arrived after the hold had already been released. Contact support for a refund.";
    default:
      return null;
  }
}

/**
 * Pays for a held booking with Paystack's popup and reports the booking
 * the API returns afterwards.
 *
 * The API starts the charge (POST /consultations/bookings/:id/payment) from
 * the booking's own snapshot and returns an access code; the popup only
 * resumes that transaction, so no amount, currency or reference leaves the
 * browser. The popup's callback is treated as "the checkout closed", never
 * as "paid": the API verifies the charge with the gateway and only its
 * booking status counts.
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
  const [phase, setPhase] = useState<PayPhase>("idle");
  // Set inside the effect, not at creation: StrictMode mounts, unmounts and
  // remounts in development, and a ref initialised once would stay false.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  // One attempt at a time. The "checkout" phase keeps the button enabled
  // (see below), so a second click must be refused here, not by `disabled`.
  const inFlight = useRef(false);

  // For the label only; the server charges its own snapshot.
  const charge = paystackChargeFor(booking);
  if (!isPayable(booking) || !charge) return null;

  const amountLabel = formatMinor(charge.currency, charge.amountMinor);

  const settle = async () => {
    // First ask the API to verify with the gateway directly; if the webhook
    // beat us the booking is already confirmed and this is a no-op.
    setPhase("verifying");
    try {
      const verified = await consultationsService.verifyBookingPayment(booking.id);
      if (!alive.current) return;
      if (verified.success && verified.data) {
        onBooking(verified.data);
        const message = failureMessage(verified.data.verification?.gatewayStatus);
        if (verified.data.status !== ConsultationBookingStatus.PENDING) {
          setPhase("idle");
          if (message) onError?.(message);
          return;
        }
        if (message) {
          setPhase("failed");
          onError?.(message);
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
          if (res.data.status !== ConsultationBookingStatus.PENDING) { setPhase("idle"); return; }
        }
      } catch {
        // keep polling
      }
    }
    if (alive.current) setPhase("unsettled");
  };

  const pay = async () => {
    setPhase("checkout");
    try {
      const started = await consultationsService.startBookingPayment(booking.id);
      if (!alive.current) return;
      if (!started.success || !started.data?.access_code) {
        setPhase("failed");
        onError?.(started.message || "We couldn't start the payment. Please try again.");
        return;
      }
      const checkout = started.data;
      let result;
      try {
        result = await openPaystackCheckout(checkout.access_code);
      } catch (err) {
        if (err instanceof PaystackUnavailableError && checkout.authorization_url) {
          // The popup can't load here: the hosted page charges the same
          // server-started transaction and returns to /payments/return,
          // which asks the API to verify it.
          window.location.assign(checkout.authorization_url);
          return;
        }
        throw err;
      }
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

  const run = async (action: () => Promise<void>) => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      await action();
    } finally {
      inFlight.current = false;
    }
  };

  // "checkout" does not disable: the popup's iframe covers the page while it
  // is open, and if Paystack refuses the key it opens nothing and calls
  // nothing back, so a button gated on its callbacks would be a dead end.
  const busy = phase === "verifying";
  const text =
    phase === "verifying" ? "Confirming payment..."
    : phase === "checkout" ? "Complete payment in the Paystack window"
    : phase === "unsettled" ? "Check again"
    : phase === "failed" ? `Try again: ${label ?? `Pay ${amountLabel}`}`
    : label ?? `Pay ${amountLabel}`;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => void run(phase === "unsettled" ? settle : pay)}
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
