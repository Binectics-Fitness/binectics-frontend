"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { consultationsService } from "@/lib/api/consultations";
import { marketplaceService } from "@/lib/api/marketplace";
import { autoRenewOutcome } from "@/lib/billing/autoRenew";
import { clearPendingCheckout, readPendingCheckout } from "@/lib/payments/pendingCheckout";

/**
 * Where Paystack sends the browser after a hosted (redirect) checkout the
 * API started: callback_url = FRONTEND_URL + "/payments/return", with
 * ?trxref=<ref>&reference=<ref>.
 *
 * Arriving here proves nothing. Settlement is the API's webhook and verify;
 * this page only asks the API to check, then moves on:
 *  - "bkg_" (a booking hold): ask the API to verify that booking's charge,
 *    then go to My bookings, which shows whatever the API says.
 *  - "mbr_" (a membership plan): finish the subscribe step the checkout
 *    page would have run, with the reference the server issued; the API
 *    verifies the charge before activating anything.
 *  - anything else: say they are back and can close the page.
 *
 * The mobile app's WebView closes itself on this URL, so this matters for
 * web redirects and as a browser fallback.
 */

type View =
  | { kind: "working"; text: string }
  | { kind: "done"; title: string; body: string; href?: string; cta?: string };

function referenceKind(reference: string): "booking" | "membership" | "other" {
  if (reference.startsWith("bkg_")) return "booking";
  if (reference.startsWith("mbr_")) return "membership";
  return "other";
}

function PaymentReturnInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const reference = (params.get("reference") || params.get("trxref") || "").trim();
  const kind = referenceKind(reference);
  const [view, setView] = useState<View>(() =>
    kind === "other"
      ? { kind: "done", title: "You're back from Paystack.", body: "You can close this page." }
      : kind === "membership"
        ? { kind: "working", text: "Payment received. Finishing your membership..." }
        : { kind: "working", text: "Checking your payment..." },
  );
  const ran = useRef(false);

  // Signed out: nothing can be checked from here, so say where it will show.
  const signedOut = kind !== "other" && !authLoading && !user;

  useEffect(() => {
    if (kind === "other" || authLoading || !user || ran.current) return;
    ran.current = true;

    void (async () => {
      if (kind === "booking") {
        // The API verifies a booking by id; find the hold this reference
        // belongs to among the member's own bookings.
        try {
          const mine = await consultationsService.getMyBookings();
          const booking = mine.success
            ? mine.data?.find((b) => b.payment?.reference === reference)
            : undefined;
          if (booking) await consultationsService.verifyBookingPayment(booking.id);
        } catch {
          // The bookings page still shows the API's view of the hold.
        }
        router.replace("/dashboard/bookings");
        return;
      }

      const pending = readPendingCheckout(reference);
      if (!pending) {
        setView({
          kind: "done",
          title: "Payment received.",
          body: `We couldn't finish your membership from this page. If it doesn't appear in Billing within a few minutes, contact support with reference ${reference}.`,
          href: "/dashboard/member/billing",
          cta: "Go to billing",
        });
        return;
      }
      try {
        const res = await marketplaceService.subscribeToListingPlan(
          pending.listing_id,
          pending.plan_id,
          pending.payment_reference,
          pending.amount_minor,
        );
        if (res.success) {
          clearPendingCheckout();
          const outcome = autoRenewOutcome(!!pending.save_card, res.data);
          router.replace(
            `/checkout/success?listing=${pending.listing_id}&plan=${pending.plan_id}${outcome ? `&renewal=${outcome}` : ""}`,
          );
          return;
        }
        setView({
          kind: "done",
          title: "Your membership isn't active yet.",
          body: `${res.message ? `${res.message} ` : ""}Your payment reference is ${reference}. Contact support if you were charged.`,
          href: `/marketplace/${pending.listing_id}`,
          cta: "Back to the listing",
        });
      } catch {
        setView({
          kind: "done",
          title: "Your membership isn't active yet.",
          body: `Something went wrong. Your payment reference is ${reference}. Contact support if you were charged.`,
          href: "/dashboard/member/billing",
          cta: "Go to billing",
        });
      }
    })();
  }, [kind, authLoading, user, reference, router]);

  const shown: View = signedOut
    ? {
        kind: "done",
        title: "Sign in to see your payment.",
        body: `Your payment reference is ${reference}. It shows on your account once Paystack confirms it.`,
        href: "/login",
        cta: "Sign in",
      }
    : view;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg-2)" }}>
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-(--r-3) p-6 sm:p-8 text-center"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
          aria-live="polite"
        >
          {shown.kind === "working" ? (
            <p className="text-[15px]" style={{ color: "var(--ink)" }}>{shown.text}</p>
          ) : (
            <>
              <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>{shown.title}</h1>
              <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--fg-2)" }}>{shown.body}</p>
              {shown.href && shown.cta && (
                <Link href={shown.href} className="btn-ghost-v2 sm mt-5 inline-flex">{shown.cta}</Link>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturnInner />
    </Suspense>
  );
}
