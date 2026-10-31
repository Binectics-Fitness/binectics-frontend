"use client";

import { useEffect, useRef, useState } from "react";
import { paidContentService, type ContentItemKind, type ContentPrice, type ContentPurchase } from "@/lib/api/paidContent";
import { paidContentErrorOf } from "@/lib/api/paidContent";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { formatMinor } from "@/lib/currencies/helpers";
import {
  PURCHASE_POLL_LIMIT,
  PURCHASE_POLL_MS,
  gatewayFailureCopy,
  memberContentMessage,
  purchaseIsDead,
  purchaseView,
} from "@/lib/paidContent/helpers";

/**
 * `starting`: asking the API to open the checkout. `checkout`: Paystack's
 * popup is open. Then the API is asked whether it was paid (`verifying`) and
 * the purchase is re-read until it settles (`unsettled` when it has not yet).
 * Same rules as the booking payment: the popup's word is never proof, only
 * the API's purchase status moves the screen.
 */
type Phase = "idle" | "starting" | "checkout" | "verifying" | "unsettled" | "unlocked";

const UNAVAILABLE = "Payments aren't available right now. Please try again later.";

export function ContentBuyPanel({
  kind,
  itemId,
  prices,
  onUnlocked,
}: {
  kind: ContentItemKind;
  itemId: string;
  prices: ContentPrice[];
  /** Called once the API says the purchase is paid. */
  onUnlocked: (purchase: ContentPurchase) => void;
}) {
  const [currency, setCurrency] = useState(prices[0]?.currency ?? "");
  const [phase, setPhase] = useState<Phase>("idle");
  const [notice, setNotice] = useState<string | null>(null);
  const alive = useRef(true);
  const inFlight = useRef(false);
  const purchaseRef = useRef<ContentPurchase | null>(null);
  // Set inside the effect, not at creation: StrictMode mounts, unmounts and
  // remounts in development.
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  // The prices can change under a mounted panel (a reload after a failed
  // check): a currency no longer sold falls back to the first one (derived,
  // and used for the checkout and the highlight), so it never asks for a currency the item is not priced in.
  const price = prices.find((p) => p.currency === currency) ?? prices[0];
  const setPhaseSafe = (p: Phase) => {
    if (alive.current) setPhase(p);
  };

  const unlocked = (p: ContentPurchase) => {
    purchaseRef.current = p;
    setPhaseSafe("unlocked");
    if (alive.current) onUnlocked(p);
  };

  /** The API's purchase is the only truth about whether it is paid. */
  const reload = async (): Promise<ContentPurchase | null> => {
    const id = purchaseRef.current?.id;
    if (!id) return null;
    const res = await paidContentService.getPurchase(id);
    if (!alive.current || !res.success || !res.data) return null;
    purchaseRef.current = res.data;
    return res.data;
  };

  const confirmPayment = async (id: string) => {
    setPhaseSafe("verifying");
    setNotice(null);
    const res = await paidContentService.verify(id);
    if (!alive.current) return;
    if (res.success && res.data) {
      purchaseRef.current = res.data.purchase;
      if (purchaseView(res.data.purchase) === "unlocked") return unlocked(res.data.purchase);
      const failure = gatewayFailureCopy(res.data.gatewayStatus);
      if (failure || purchaseIsDead(res.data.purchase)) {
        setPhaseSafe("idle");
        setNotice(failure ?? "This payment was not completed. You have not been charged; you can try again.");
        return;
      }
    } else if (typeof res.status === "number" && res.status >= 400 && res.status < 500) {
      // A 4xx is a business answer (not yours, not found...): say it. A 5xx or
      // no answer means verification was unreachable, not that the payment
      // failed: keep "Confirming" and let the re-read below decide.
      setPhaseSafe("idle");
      const e = paidContentErrorOf(res);
      setNotice(memberContentMessage(res, e, UNAVAILABLE));
      return;
    }
    for (let i = 0; i < PURCHASE_POLL_LIMIT && alive.current; i++) {
      await new Promise((r) => setTimeout(r, PURCHASE_POLL_MS));
      const fresh = await reload();
      if (!alive.current) return;
      if (fresh && purchaseView(fresh) === "unlocked") return unlocked(fresh);
      if (fresh && purchaseIsDead(fresh)) {
        setPhaseSafe("idle");
        setNotice("This payment was not completed. You have not been charged; you can try again.");
        return;
      }
    }
    setPhaseSafe("unsettled");
  };

  const pay = async () => {
    setNotice(null);
    setPhaseSafe("starting");
    const started = await paidContentService.checkout(kind, itemId, price?.currency || undefined);
    if (!alive.current) return;
    if (!started.success || !started.data) {
      const e = paidContentErrorOf(started);
      if (e?.code === "CONTENT_ALREADY_OWNED") {
        setNotice(memberContentMessage(started, e, UNAVAILABLE));
        const mine = await paidContentService.myPurchases();
        const owned = mine.data?.find((p) => p.itemId === itemId && purchaseView(p) === "unlocked");
        if (owned) return unlocked(owned);
        return setPhaseSafe("idle");
      }
      setPhaseSafe("idle");
      setNotice(memberContentMessage(started, e, "We couldn't start the payment. Please try again."));
      return;
    }
    const { purchase, payment } = started.data;
    purchaseRef.current = purchase;
    if (!payment) {
      setPhaseSafe("idle");
      setNotice(UNAVAILABLE);
      return;
    }
    setPhaseSafe("checkout");
    try {
      let result;
      try {
        result = await openPaystackCheckout(payment.accessCode);
      } catch (err) {
        if (err instanceof PaystackUnavailableError && payment.authorizationUrl) {
          // The popup can't load here: the hosted page charges the same
          // server-started transaction and returns to /payments/return,
          // which asks the API to verify it.
          window.location.assign(payment.authorizationUrl);
          return;
        }
        throw err;
      }
      if (!alive.current) return;
      if (result.closed === "dismissed") {
        // Closing the popup is not a failure. Re-read anyway: a charge can
        // complete just before the close.
        const fresh = await reload();
        if (fresh && purchaseView(fresh) === "unlocked") return unlocked(fresh);
        setPhaseSafe("idle");
        return;
      }
      await confirmPayment(purchase.id);
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

  if (phase === "unlocked") return null;
  if (!price) return null;

  const canPickCurrency = prices.length > 1 && (phase === "idle" || phase === "unsettled");
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
            : `Buy for ${formatMinor(price.currency, price.amountMinor)}`;

  return (
    <div className="flex flex-col gap-3" data-testid="content-buy-panel">
      {prices.length > 1 && (
        <div role="group" aria-label="Pay in" className="flex flex-wrap gap-2">
          {prices.map((p) => (
            <button
              key={p.currency}
              type="button"
              aria-pressed={p.currency === price.currency}
              aria-label={`${p.currency} ${formatMinor(p.currency, p.amountMinor)}`}
              disabled={!canPickCurrency}
              onClick={() => setCurrency(p.currency)}
              className="px-3 py-1.5 rounded-full text-[13px] disabled:opacity-60"
              style={{
                border: "1px solid var(--border-2)",
                background: p.currency === price.currency ? "var(--ink)" : "transparent",
                color: p.currency === price.currency ? "var(--bg)" : "var(--fg-2)",
              }}
            >
              {formatMinor(p.currency, p.amountMinor)}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        className="btn-primary-v2 w-full justify-center disabled:opacity-60"
        disabled={busy}
        onClick={() =>
          void run(async () => {
            if (phase === "unsettled" && purchaseRef.current) return confirmPayment(purchaseRef.current.id);
            return pay();
          })
        }
      >
        {label}
      </button>
      {phase === "unsettled" && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--fg-3)" }}>
          Your payment is still being confirmed. This updates by itself once it goes through; you can check again or come back later.
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
