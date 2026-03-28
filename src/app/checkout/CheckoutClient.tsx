"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  getPaymentGateway,
  getStripe,
  formatPrice,
  getGatewayDisplayName,
  generateTxRef,
  buildPaystackConfig,
  buildFlutterwaveConfig,
} from "@/lib/api/payment";
import type {
  MarketplaceListing,
  MarketplaceMembershipPlan,
} from "@/lib/types";
import { PaymentGateway, MembershipPlanType } from "@/lib/types";
import DashboardLoading from "@/components/DashboardLoading";
import { Button } from "@/components/Button";

declare global {
  interface Window {
    PaystackPop?: any;
  }
}
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";


// ==================== STRIPE CARD FORM ====================

function StripeCardForm({
  amount,
  currency,
  planName,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: {
  amount: number;
  currency: string;
  planName: string;
  onSuccess: (ref: string) => void;
  onError: (msg: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        onError("Card element not found");
        return;
      }

      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (error) {
        onError(error.message ?? "Payment failed");
      } else if (paymentMethod) {
        onSuccess(`stripe_pm_${paymentMethod.id}`);
      }
    } catch {
      onError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border border-neutral-200 rounded-lg p-4 bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#03314b",
                "::placeholder": { color: "#9ca3af" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing
          ? "Processing..."
          : `Pay ${formatPrice(amount, currency)}`}
      </Button>
    </form>
  );
}

// ==================== PAYSTACK BUTTON ====================

function PaystackButton({
  amount,
  currency,
  email,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: {
  amount: number;
  currency: string;
  email: string;
  onSuccess: (ref: string) => void;
  onError: (msg: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}) {
  const reference = generateTxRef("PS");
  const config = buildPaystackConfig({ amount, currency, email, reference });

  const handleClick = () => {
    if (!config) {
      onError("Paystack is not configured");
      return;
    }
    setIsProcessing(true);
    // Dynamically load Paystack script if not present
    if (!window.PaystackPop) {
      const script = document.createElement("script");
      script.src = "https://js.paystack.co/v1/inline.js";
      script.async = true;
      script.onload = () => launchPaystack();
      script.onerror = () => {
        setIsProcessing(false);
        onError("Failed to load Paystack script");
      };
      document.body.appendChild(script);
    } else {
      launchPaystack();
    }
  };

  function launchPaystack() {
    if (!config) {
      setIsProcessing(false);
      onError("Paystack is not configured");
      return;
    }
    if (!window.PaystackPop) {
      setIsProcessing(false);
      onError("Paystack script not loaded");
      return;
    }
    const handler = window.PaystackPop.setup({
      key: config.publicKey,
      email: config.email,
      amount: config.amount,
      currency: config.currency,
      ref: config.reference,
      callback: function (response: any) {
        setIsProcessing(false);
        onSuccess(`paystack_${response.reference}`);
      },
      onClose: function () {
        setIsProcessing(false);
      },
    });
    handler.openIframe();
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isProcessing || !config}
      className="w-full"
    >
      {isProcessing
        ? "Processing..."
        : `Pay ${formatPrice(amount, currency)} with Paystack`}
    </Button>
  );
}

// ==================== FLUTTERWAVE BUTTON ====================

function FlutterwaveButton({
  amount,
  currency,
  email,
  name,
  planName,
  onSuccess,
  onError,
  isProcessing,
  setIsProcessing,
}: {
  amount: number;
  currency: string;
  email: string;
  name: string;
  planName: string;
  onSuccess: (ref: string) => void;
  onError: (msg: string) => void;
  isProcessing: boolean;
  setIsProcessing: (v: boolean) => void;
}) {
  const handleClick = async () => {
    const txRef = generateTxRef("FW");
    const config = buildFlutterwaveConfig({
      amount,
      currency,
      email,
      name,
      planName,
      txRef,
    });

    if (!config) {
      onError("Flutterwave is not configured");
      return;
    }

    setIsProcessing(true);

    try {
      // Dynamic import to avoid SSR issues
      const { closePaymentModal } = await import("flutterwave-react-v3");

      // Use the Flutterwave inline script approach
      const FlutterwaveCheckout = (
        window as unknown as Record<string, unknown>
      ).FlutterwaveCheckout as
        | ((config: Record<string, unknown>) => void)
        | undefined;

      if (typeof FlutterwaveCheckout === "function") {
        FlutterwaveCheckout({
          ...config,
          callback: (response: Record<string, unknown>) => {
            closePaymentModal();
            if (response.status === "successful" || response.status === "completed") {
              onSuccess(
                `flutterwave_${String(response.transaction_id || response.tx_ref || txRef)}`,
              );
            } else {
              onError("Payment was not successful");
            }
            setIsProcessing(false);
          },
          onclose: () => {
            setIsProcessing(false);
          },
        });
      } else {
        // Fallback: redirect-based approach
        onSuccess(`flutterwave_${txRef}`);
        setIsProcessing(false);
      }
    } catch {
      onError("Failed to initialize Flutterwave");
      setIsProcessing(false);
    }
  };

  return (
    <Button onClick={handleClick} disabled={isProcessing} className="w-full">
      {isProcessing
        ? "Processing..."
        : `Pay ${formatPrice(amount, currency)} with Flutterwave`}
    </Button>
  );
}

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

  const gateway = plan ? getPaymentGateway(plan.currency) : PaymentGateway.STRIPE;

  const loadCheckoutData = useCallback(async () => {
    if (!listingId || !planId) return;

    setLoading(true);
    setError("");
    try {
      const [listingRes, plansRes] = await Promise.all([
        marketplaceService.getListingById(listingId),
        marketplaceService.getPublicListingPlans(listingId),
      ]);

      if (listingRes.success && listingRes.data) {
        setListing(listingRes.data);
      } else {
        setError("Listing not found");
        return;
      }

      if (plansRes.success && plansRes.data) {
        const selectedPlan = plansRes.data.find((p) => p._id === planId);
        if (selectedPlan) {
          setPlan(selectedPlan);
        } else {
          setError("Plan not found or no longer available");
        }
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
      void loadCheckoutData();
    }
  }, [user, authLoading, listingId, planId, loadCheckoutData, router]);

  const handlePaymentSuccess = async (paymentReference: string) => {
    if (!listing || !plan) return;

    setIsProcessing(true);
    setPaymentError("");

    try {
      const res = await marketplaceService.subscribeToListingPlan(
        listing._id,
        plan._id,
        paymentReference,
        plan.price,
      );

      if (res.success) {
        router.push(
          `/checkout/success?listing=${listing._id}&plan=${plan._id}`,
        );
      } else {
        setPaymentError(
          res.message || "Failed to activate subscription. Please contact support.",
        );
      }
    } catch {
      setPaymentError(
        "Payment was processed but subscription activation failed. Please contact support with your payment reference.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentError = (msg: string) => {
    setPaymentError(msg);
    setIsProcessing(false);
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-card p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🛒</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            No Plan Selected
          </h2>
          <p className="text-foreground-secondary mb-6">
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-card p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Checkout Error
          </h2>
          <p className="text-foreground-secondary mb-6">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!listing || !plan || !user) return null;

  const displayName =
    typeof listing.professional_id === "object"
      ? `${listing.professional_id.first_name} ${listing.professional_id.last_name}`
      : listing.headline;

  const isFree = plan.price === 0;

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-sm text-foreground-secondary hover:text-foreground mb-4 inline-flex items-center gap-1"
          >
            ← Back
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-card p-6 sticky top-8">
              <h2 className="font-display text-lg font-bold text-foreground mb-4">
                Order Summary
              </h2>

              <div className="border-b border-neutral-200 pb-4 mb-4">
                <p className="font-semibold text-foreground">{displayName}</p>
                <p className="text-sm text-foreground-secondary">
                  {listing.headline}
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Plan</span>
                  <span className="font-medium text-foreground">
                    {plan.name}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Type</span>
                  <span className="font-medium text-foreground">
                    {plan.plan_type === MembershipPlanType.SUBSCRIPTION
                      ? "Subscription"
                      : "One-time"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground-secondary">Duration</span>
                  <span className="font-medium text-foreground">
                    {plan.duration_days} days
                  </span>
                </div>
                {gateway !== PaymentGateway.STRIPE && !isFree && (
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground-secondary">
                      Payment via
                    </span>
                    <span className="font-medium text-foreground">
                      {getGatewayDisplayName(gateway)}
                    </span>
                  </div>
                )}
              </div>

              {plan.features.length > 0 && (
                <div className="border-t border-neutral-200 pt-4 mb-4">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Includes:
                  </p>
                  <ul className="space-y-1">
                    {plan.features.map((feature, i) => (
                      <li
                        key={i}
                        className="text-sm text-foreground-secondary flex items-start gap-2"
                      >
                        <span className="text-primary-500 mt-0.5">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t border-neutral-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="text-2xl font-black text-foreground">
                    {isFree ? "Free" : formatPrice(plan.price, plan.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="font-display text-lg font-bold text-foreground mb-6">
                {isFree ? "Confirm Subscription" : "Payment Details"}
              </h2>

              {paymentError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
                  {paymentError}
                </div>
              )}

              {isFree ? (
                <div className="text-center">
                  <p className="text-foreground-secondary mb-6">
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
                  {gateway === PaymentGateway.STRIPE && (
                    <Elements stripe={getStripe()}>
                      <StripeCardForm
                        amount={plan.price}
                        currency={plan.currency}
                        planName={plan.name}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                      />
                    </Elements>
                  )}

                  {gateway === PaymentGateway.PAYSTACK && (
                    <PaystackButton
                      amount={plan.price}
                      currency={plan.currency}
                      email={user.email}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  )}

                  {gateway === PaymentGateway.FLUTTERWAVE && (
                    <FlutterwaveButton
                      amount={plan.price}
                      currency={plan.currency}
                      email={user.email}
                      name={`${user.first_name} ${user.last_name}`}
                      planName={plan.name}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      isProcessing={isProcessing}
                      setIsProcessing={setIsProcessing}
                    />
                  )}

                  <p className="text-xs text-foreground-tertiary mt-4 text-center">
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
