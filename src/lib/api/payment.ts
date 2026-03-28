/**
 * Payment Service
 *
 * Handles client-side payment processing via Stripe (global),
 * Flutterwave (Africa), and Paystack (Africa).
 *
 * Flow:
 * 1. User selects a plan → redirected to /checkout
 * 2. Checkout page determines gateway based on currency/region
 * 3. Payment processes via gateway SDK
 * 4. On success, subscription is created via marketplace API with payment_reference
 */

import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { PaymentGateway } from "@/lib/types";

// ==================== GATEWAY SELECTION ====================

/** African currencies that use Flutterwave/Paystack instead of Stripe */
const AFRICAN_CURRENCIES = new Set([
  "NGN",
  "GHS",
  "KES",
  "ZAR",
  "UGX",
  "TZS",
  "RWF",
  "XOF",
  "XAF",
  "EGP",
]);

/**
 * Determines the best payment gateway based on currency.
 * Stripe for global, Flutterwave as primary African gateway,
 * Paystack as fallback for NGN/GHS/KES/ZAR.
 */
export function getPaymentGateway(currency: string): PaymentGateway {
  const upper = currency.toUpperCase();

  if (!AFRICAN_CURRENCIES.has(upper)) {
    return PaymentGateway.STRIPE;
  }

  // Paystack supports NGN, GHS, KES, ZAR
  const paystackKey = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  const flutterwaveKey = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

  if (
    paystackKey &&
    ["NGN", "GHS", "KES", "ZAR"].includes(upper)
  ) {
    return PaymentGateway.PAYSTACK;
  }

  if (flutterwaveKey) {
    return PaymentGateway.FLUTTERWAVE;
  }

  // Fallback to Stripe if no African gateway keys configured
  return PaymentGateway.STRIPE;
}

// ==================== STRIPE ====================

let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
}

export interface StripePaymentResult {
  success: boolean;
  paymentReference?: string;
  error?: string;
}

// ==================== FLUTTERWAVE ====================

export interface FlutterwaveConfig {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
  };
  customizations: {
    title: string;
    description: string;
  };
}

export function buildFlutterwaveConfig(params: {
  amount: number;
  currency: string;
  email: string;
  name: string;
  planName: string;
  txRef: string;
}): FlutterwaveConfig | null {
  const key = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
  if (!key) return null;

  return {
    public_key: key,
    tx_ref: params.txRef,
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    customer: {
      email: params.email,
      name: params.name,
    },
    customizations: {
      title: "Binectics",
      description: `Subscription: ${params.planName}`,
    },
  };
}

// ==================== PAYSTACK ====================

export interface PaystackConfig {
  publicKey: string;
  email: string;
  amount: number; // in kobo/pesewas (smallest currency unit)
  currency: string;
  reference: string;
}

export function buildPaystackConfig(params: {
  amount: number;
  currency: string;
  email: string;
  reference: string;
}): PaystackConfig | null {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!key) return null;

  return {
    publicKey: key,
    email: params.email,
    amount: Math.round(params.amount * 100), // Convert to smallest unit
    currency: params.currency.toUpperCase(),
    reference: params.reference,
  };
}

// ==================== HELPERS ====================

/** Generate a unique transaction reference */
export function generateTxRef(prefix = "BN"): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${timestamp}-${random}`;
}

/** Format price for display */
export function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

/** Get human-readable gateway name */
export function getGatewayDisplayName(gateway: PaymentGateway): string {
  switch (gateway) {
    case PaymentGateway.STRIPE:
      return "Card Payment";
    case PaymentGateway.FLUTTERWAVE:
      return "Flutterwave";
    case PaymentGateway.PAYSTACK:
      return "Paystack";
  }
}
