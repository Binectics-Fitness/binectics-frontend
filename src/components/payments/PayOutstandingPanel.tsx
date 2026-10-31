"use client";

import { useEffect, useRef, useState } from "react";
import { memberPaymentsService, type OwedCharge } from "@/lib/api/memberPayments";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { formatMinor } from "@/lib/currencies/helpers";
import { savePendingOwed } from "@/lib/payments/pendingOwed";
import { OWED_POLL_LIMIT, OWED_POLL_MS, owedErrorCopy, owedFailureCopy } from "@/lib/memberPayments/helpers";

/**
 * `starting`: asking the API to open the checkout. `checkout`: Paystack's
 * popup is open. Then the API is asked whether it was paid (`verifying`) and
 * the charge is re-read until it settles (`unsettled` when it has not yet).
 * Same rules as the booking and content payments: the popup's word is never
 * proof, only the API's state moves the screen, and the amount is the API's.
 */
type Phase = "idle" | "starting" | "checkout" | "verifying" | "unsettled" | "paid";

const UNAVAILABLE = "Payments aren't available right now. Please try again later.";

export function PayOutstandingPanel({
  charge,
  onPaid,
  onChanged,
}: {
  charge: OwedCharge;
  /** Called once, when the API says it is paid. */
  onPaid: (charge: OwedCharge) => void;
  /** Called when a re-read shows the charge is no longer payable (ended, already paid elsewhere). */
  onChanged: (charge: OwedCharge) => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const alive = useRef(true);
  const inFlight = useRef(false);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const setPhaseSafe = (p: Phase) => {
    if (alive.current) setPhase(p);
  };

  const paid = (c: OwedCharge) => {
    setPhaseSafe("paid");
    if (alive.current) onPaid(c);
  };

  /** The API's charge is the only truth about whether it is paid. */
  const reload = async (): Promise<OwedCharge | null> => {
    const res = await memberPaymentsService.charge(charge.id);
    if (!alive.current || !res.success || !res.data) return null;
    return res.data;
  };

  /** True when the re-read ended the attempt (paid, or no longer payable). */
  const settleFrom = (fresh: OwedCharge | null): boolean => {
    if (!fresh) return false;
    if (fresh.state === "paid") {
      paid(fresh);
      return true;
    }
    if (fresh.state !== "payable") {
      setPhaseSafe("idle");
      onChanged(fresh);
      return true;
    }
    return false;
  };

  const confirmPayment = async () => {
    setPhaseSafe("verifying");
    setNotice(null);
    const res = await memberPaymentsService.verify(charge.id);
    if (!alive.current) return;
    if (res.success && res.data) {
      if (settleFrom(res.data.charge)) return;
      const failure = owedFailureCopy(res.data.gatewayStatus);
      // "Confirming" (ongoing/pending) and an unreadable answer keep polling;
      // only a definite answer stops here.
      if (failure && res.data.gatewayStatus !== "error") {
        setPhaseSafe("idle");
        setNotice(failure);
        return;
      }
    } else if (typeof res.status === "number" && res.status >= 400 && res.status < 500) {
      // A 4xx is a business answer (not yours, not found...): say it. A 5xx or
      // no answer means verification was unreachable, not that the payment
      // failed: keep "Confirming" and let the re-read below decide.
      setPhaseSafe("idle");
      setNotice(owedErrorCopy(res, UNAVAILABLE));
      return;
    }
    for (let i = 0; i < OWED_POLL_LIMIT && alive.current; i++) {
      await new Promise((r) => setTimeout(r, OWED_POLL_MS));
      if (!alive.current) return;
      if (settleFrom(await reload())) return;
    }
    setPhaseSafe("unsettled");
  };

  const pay = async () => {
    setNotice(null);
    setPhaseSafe("starting");
    const started = await memberPaymentsService.checkout(charge.id);
    if (!alive.current) return;
    if (!started.success || !started.data) {
      // Already paid (the webhook got there first) or ended: say what the API says, then re-read.
      setPhaseSafe("idle");
      setNotice(owedErrorCopy(started, "We couldn't start the payment. Please try again."));
      if (started.status === 409) settleFrom(await reload());
      return;
    }
    const payment = started.data;
    setPhaseSafe("checkout");
    try {
      let result;
      try {
        result = await openPaystackCheckout(payment.accessCode);
      } catch (err) {
        if (err instanceof PaystackUnavailableError && payment.authorizationUrl) {
          // The popup can't load here: the hosted page charges the same
          // server-started transaction. Coming back to this page verifies it.
          savePendingOwed(charge.id, payment.reference);
          window.location.assign(payment.authorizationUrl);
          return;
        }
        throw err;
      }
      if (!alive.current) return;
      if (result.closed === "dismissed") {
        // Closing the popup is not a failure. Re-read anyway: a charge can
        // complete just before the close.
        if (settleFrom(await reload())) return;
        setPhaseSafe("idle");
        return;
      }
      await confirmPayment();
    } catch (err) {
      if (!alive.current) return;
      setPhaseSafe("idle");
      setNotice(err instanceof Error ? err.message : "Could not open payment.");
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

  if (phase === "paid") return null;

  const busy = phase === "starting" || phase === "verifying";
  const label =
    phase === "starting"
      ? "Starting payment..."
      : phase === "verifying"
        ? "Confirming payment..."
        : phase === "checkout"
          ? "Complete payment in the Paystack window"
          : phase === "unsettled"
            ? "Check again"
            : `Pay ${formatMinor(charge.currency, charge.amountMinor)}`;

  return (
    <div className="flex flex-col gap-3" data-testid="pay-outstanding-panel">
      <button
        type="button"
        className="btn-primary-v2 w-full justify-center disabled:opacity-60"
        disabled={busy}
        onClick={() => void run(() => (phase === "unsettled" ? confirmPayment() : pay()))}
      >
        {label}
      </button>
      {phase === "unsettled" && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          Your payment is still being confirmed. This updates by itself once it goes through; you can check again or
          come back later.
        </p>
      )}
      {notice && (
        <p role="alert" className="text-[13px]" style={{ color: "var(--fg-2)" }}>
          {notice}
        </p>
      )}
    </div>
  );
}
