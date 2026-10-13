"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { openPaystackCheckout, PaystackUnavailableError } from "@/lib/payments/paystackInline";
import { clearPendingCheckout, savePendingCheckout } from "@/lib/payments/pendingCheckout";
import { formatMinor, writeErrorMessage } from "@/lib/currencies/helpers";
import type {
  MarketplaceListing,
  MarketplaceMembershipPlan,
} from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";
import DashboardLoading from "@/components/DashboardLoading";
import { Button } from "@/components/Button";
import { AutoRenewConsentBox } from "@/components/billing/AutoRenewConsentBox";
import {
  memberBillingService,
  type AutoRenewConsentOffer,
  type RenewalCheckoutRequest,
} from "@/lib/api/memberBilling";
import {
  autoRenewSuccessQuery,
  autoRenewUnavailableCopy,
  consentFromError,
  isOfferedConsent,
  reasonFromError,
} from "@/lib/billing/autoRenew";

/**
 * Plan checkout.
 *
 * The API starts the payment (POST .../plans/:planId/checkout) at the plan's
 * own price and currency, with the gym's own Paystack key when it has one,
 * and returns an access code. The browser only resumes that transaction in
 * Paystack's popup; it never names an amount, a currency or a key. Once the
 * popup reports success, the member subscribes with the returned
 * payment_reference and the API verifies the charge before activating.
 *
 * Paystack is the only gateway the API takes member payments through, so
 * there is no Stripe or Flutterwave path here.
 *
 * Auto-renew (api #204): when the API offers it, its consent text shows
 * word for word beside an unticked box. Ticking it sends the text's version
 * and hash with the checkout, which makes it card-only and saves the card
 * once Paystack says it can be charged again. Not offered, no box.
 */

// ==================== CHECKOUT CONTENT ====================

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();

  const listingId = searchParams.get("listing");
  const planId = searchParams.get("plan");

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [plan, setPlan] = useState<MarketplaceMembershipPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  // Null while loading or when the read failed: no box either way.
  const [consent, setConsent] = useState<AutoRenewConsentOffer | null>(null);
  const [renewTicked, setRenewTicked] = useState(false);
  const [consentNotice, setConsentNotice] = useState<string | null>(null);
  // One checkout at a time: a second click while the popup is up is ignored.
  const inFlight = useRef(false);

  const loadCheckoutData = useCallback(async () => {
    if (!listingId || !planId) return;

    setLoading(true);
    setError("");
    try {
      const [listingRes, plansRes, consentRes] = await Promise.all([
        marketplaceService.getListingById(listingId),
        marketplaceService.getPublicListingPlans(listingId),
        // A failed read just leaves the box out: paying once still works.
        memberBillingService
          .getPlanAutoRenewConsent(listingId, planId)
          .catch(() => null),
      ]);
      setConsent(consentRes?.success && consentRes.data ? consentRes.data : null);

      if (listingRes.success && listingRes.data) {
        setListing(listingRes.data);
      } else {
        setError("Listing not found");
        return;
      }

      // A failed plans read used to fall through to a blank page.
      if (!plansRes.success || !plansRes.data) {
        setError("We couldn't load this plan. Check your connection and try again.");
        return;
      }
      const selectedPlan = plansRes.data.find((p) => p._id === planId);
      if (selectedPlan) {
        setPlan(selectedPlan);
      } else {
        setError("This plan isn't available anymore. Go back to the listing to choose another.");
      }
    } catch {
      setError("Failed to load checkout details");
    } finally {
      setLoading(false);
    }
  }, [listingId, planId]);

  useEffect(() => {
    if (!authLoading && !user) {
      const returnUrl = `/checkout?listing=${listingId}&plan=${planId}`;
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`);
      return;
    }
    if (user && listingId && planId) {
      // Loading the checkout from the API is the external sync this effect
      // exists for; its loading flag is set before the first await.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadCheckoutData();
    }
  }, [user, authLoading, listingId, planId, loadCheckoutData, router]);

  /**
   * Start the server's checkout, open it, then subscribe with the reference
   * it returned. The popup's success is not proof of payment: subscribe
   * verifies the charge with the gateway before activating anything.
   */
  const handlePay = async () => {
    if (!listing || !plan || inFlight.current) return;
    inFlight.current = true;
    setIsProcessing(true);
    setPaymentError("");
    try {
      const renewal: RenewalCheckoutRequest | undefined =
        renewTicked && isOfferedConsent(consent)
          ? {
              save_card: true,
              text_version: consent.text_version,
              text_sha256: consent.text_sha256,
              channel: "web",
            }
          : undefined;
      const started = renewal
        ? await marketplaceService.startPlanCheckout(listing._id, plan._id, renewal)
        : await marketplaceService.startPlanCheckout(listing._id, plan._id);
      if (!started.success && started.code === "CONSENT_TEXT_CHANGED") {
        // The price, plan or provider changed since the page loaded. Show
        // the new terms, untick, and let the member decide again.
        const fresh =
          consentFromError(started) ??
          (await memberBillingService.getPlanAutoRenewConsent(listing._id, plan._id)).data ??
          null;
        setConsent(fresh);
        setRenewTicked(false);
        setConsentNotice(
          isOfferedConsent(fresh)
            ? "The renewal terms changed since you opened this page. Read them again and tick the box if you agree."
            : null,
        );
        if (!isOfferedConsent(fresh)) {
          setPaymentError(
            `${autoRenewUnavailableCopy(fresh && !fresh.offered ? fresh.reason : null)} You can still pay for this term on its own.`,
          );
        }
        return;
      }
      if (!started.success && started.code === "AUTO_RENEW_NOT_AVAILABLE") {
        const reason = reasonFromError(started);
        setConsent({ offered: false, reason: reason ?? "disabled" });
        setRenewTicked(false);
        setConsentNotice(null);
        setPaymentError(
          `${autoRenewUnavailableCopy(reason)} You can still pay for this term on its own.`,
        );
        return;
      }
      if (!started.success && started.code === "RENEWAL_CHARGE_IN_PROGRESS") {
        // A saved-card renewal for this membership is with the bank now;
        // paying again could charge the member twice.
        setPaymentError(
          "A renewal payment from your saved card is being processed right now. Check back in a few minutes before paying again.",
        );
        return;
      }
      if (!started.success || !started.data?.access_code) {
        setPaymentError(writeErrorMessage(started, "We couldn't start the payment. Please try again."));
        return;
      }
      const checkout = started.data;
      // Kept for this tab in case the checkout has to finish on
      // /payments/return after Paystack's hosted page.
      savePendingCheckout({
        reference: checkout.reference,
        payment_reference: checkout.payment_reference,
        listing_id: listing._id,
        plan_id: plan._id,
        amount_minor: checkout.amount_minor,
        save_card: !!renewal,
      });
      let result;
      try {
        result = await openPaystackCheckout(checkout.access_code);
      } catch (err) {
        if (err instanceof PaystackUnavailableError && checkout.authorization_url) {
          // The popup can't load here; the hosted page charges the same
          // server-started transaction and comes back to /payments/return.
          window.location.assign(checkout.authorization_url);
          return;
        }
        setPaymentError(err instanceof Error ? err.message : "Could not open the payment.");
        return;
      }
      if (result.closed === "dismissed") return;

      const res = await marketplaceService.subscribeToListingPlan(
        listing._id,
        plan._id,
        checkout.payment_reference,
        // What the server charged, in minor units; the API checks it
        // against the plan and the gateway's own record.
        checkout.amount_minor,
      );
      if (res.success) {
        clearPendingCheckout();
        router.push(
          `/checkout/success?listing=${listing._id}&plan=${plan._id}${autoRenewSuccessQuery(!!renewal, res.data)}`,
        );
      } else {
        setPaymentError(
          res.message
            ? `${res.message} Your payment reference is ${checkout.reference}.`
            : `Your payment went through but the subscription didn't activate. Contact support with reference ${checkout.reference}.`,
        );
      }
    } catch {
      setPaymentError("Something went wrong. Please try again.");
    } finally {
      inFlight.current = false;
      setIsProcessing(false);
    }
  };

  // Handle free plans
  const handleFreePlan = async () => {
    if (!listing || !plan) return;
    setIsProcessing(true);
    setPaymentError("");

    try {
      const res = await marketplaceService.subscribeToListingPlan(
        listing._id,
        plan._id,
        "free_plan",
        0,
      );

      if (res.success) {
        router.push(
          `/checkout/success?listing=${listing._id}&plan=${plan._id}`,
        );
      } else {
        setPaymentError(res.message || "Failed to activate subscription");
      }
    } catch {
      setPaymentError("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading || loading) {
    return <DashboardLoading />;
  }

  if (!listingId || !planId) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-bg rounded-(--r-3) p-6 sm:p-8 max-w-md w-full text-center border border-border">
          <h2 className="text-2xl font-bold text-ink mb-2">
            No plan selected
          </h2>
          <p className="text-fg-2 mb-6">
            Please select a plan from a provider&apos;s profile to proceed.
          </p>
          <Button onClick={() => router.push("/marketplace")}>
            Browse Marketplace
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-4">
        <div className="bg-bg rounded-(--r-3) p-6 sm:p-8 max-w-md w-full text-center border border-border">
          <h2 className="text-2xl font-bold text-ink mb-2">
            Checkout error
          </h2>
          <p className="text-fg-2 mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Loading has settled here; anything still missing is a failed read, not
  // a reason to render nothing.
  if (!listing || !plan || !user) {
    return <DashboardLoading />;
  }

  const displayName =
    typeof listing.professional_id === "object"
      ? `${listing.professional_id.first_name} ${listing.professional_id.last_name}`
      : listing.headline;

  const isFree = plan.price_minor === 0;
  const priceLabel = formatMinor(plan.currency, plan.price_minor);

  return (
    <div className="min-h-screen bg-bg py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-fg-2 hover:text-fg mb-4 inline-flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-black text-ink">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-bg rounded-(--r-3) border border-border p-6 sticky top-8">
              <h2 className="text-lg font-bold text-ink mb-4">
                Order Summary
              </h2>

              <div className="border-b border-border pb-4 mb-4">
                <p className="font-semibold text-fg">{displayName}</p>
                <p className="text-sm text-fg-2">
                  {listing.headline}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-fg-2">Plan</span>
                  <span className="font-medium text-fg">
                    {plan.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-fg-2">Type</span>
                  <span className="font-medium text-fg">
                    {plan.plan_type === MembershipPlanType.SUBSCRIPTION
                      ? "Subscription"
                      : "One-time"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-fg-2">Duration</span>
                  <span className="font-medium text-fg">
                    {plan.duration_days} days
                  </span>
                </div>
                {!isFree && (
                  <div className="flex justify-between text-sm">
                    <span className="text-fg-2">Payment via</span>
                    <span className="font-medium text-fg">Paystack</span>
                  </div>
                )}
              </div>

              {(plan.features?.length ?? 0) > 0 && (
                <div className="border-t border-border pt-4 mb-4">
                  <p className="text-sm font-semibold text-fg mb-2">
                    Includes:
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="text-sm text-fg-2 flex items-start gap-2"
                      >
                        <span className="text-signal mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-border pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-fg">Total</span>
                  <span className="text-2xl font-black text-ink">
                    {isFree ? "Free" : priceLabel}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <div className="bg-bg rounded-(--r-3) border border-border p-6">
              <h2 className="text-lg font-bold text-ink mb-6">
                {isFree ? "Confirm Subscription" : "Payment Details"}
              </h2>

              {paymentError && (
                <div role="alert" className="bg-danger-soft border border-danger text-danger px-4 py-3 rounded-(--r-2) mb-6 text-sm">
                  {paymentError}
                </div>
              )}

              {isFree ? (
                <div className="text-center">
                  <p className="text-fg-2 mb-6">
                    This plan is free. Click below to activate your
                    subscription.
                  </p>
                  <Button
                    onClick={handleFreePlan}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing
                      ? "Activating..."
                      : "Activate Free Subscription"}
                  </Button>
                </div>
              ) : (
                <>
                  {isOfferedConsent(consent) && (
                    <div className="mb-5">
                      <AutoRenewConsentBox
                        consent={consent}
                        checked={renewTicked}
                        onChange={(next) => {
                          setRenewTicked(next);
                          setConsentNotice(null);
                        }}
                        notice={consentNotice}
                        disabled={isProcessing}
                      />
                      <p className="mt-2 text-[12.5px] text-fg-2">
                        {renewTicked
                          ? "You pay today's amount now, by card. Your card is saved for renewals only if your bank allows it."
                          : "Leave this unticked to pay for this term only."}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={() => void handlePay()}
                    disabled={isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? "Processing..." : `Pay ${priceLabel} with Paystack`}
                  </Button>

                  <p className="text-xs text-fg-3 mt-4 text-center">
                    Your payment is processed securely. We never store your card
                    details.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <CheckoutContent />
    </Suspense>
  );
}
