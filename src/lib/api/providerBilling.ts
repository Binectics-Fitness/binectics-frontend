/**
 * Provider Billing API Service
 *
 * Wraps the backend `/provider-billing/*` endpoints used by the org-billing
 * settings page (status, plan catalogue, hosted-checkout, invoices).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import { formatCurrency } from "@/utils/format";
import { minorToMajor } from "@/lib/money/minorMoney";

// ─── Enums (mirror backend) ────────────────────────────────────────────────

export enum ProviderPlanTier {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export enum ProviderSubscriptionStatus {
  ACTIVE = "active",
  TRIALING = "trialing",
  PAST_DUE = "past_due",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  PENDING_PAYMENT = "pending_payment",
}

export enum ProviderInvoiceStatus {
  DRAFT = "draft",
  OPEN = "open",
  PAID = "paid",
  UNCOLLECTIBLE = "uncollectible",
  VOID = "void",
}

export type BillingInterval = "month" | "year";

// ─── Response shapes ───────────────────────────────────────────────────────

export interface ProviderBillingLimits {
  max_active_members: number | null;
  max_membership_plans: number | null;
  max_staff_members: number | null;
  max_listings: number | null;
}

export interface ProviderBillingFeatures {
  analytics_enabled: boolean;
  consultations_enabled: boolean;
  journals_enabled: boolean;
  qr_checkin_enabled: boolean;
  white_label_enabled: boolean;
  custom_domain_enabled: boolean;
  branded_email_enabled: boolean;
}

export interface ProviderBillingUsage {
  active_members: number;
  membership_plans: number;
  staff_members: number;
  listings: number;
}

/**
 * Seat headroom, so the UI can render "428 of 500 seats" and prompt BEFORE the
 * cap rather than after.
 *
 * The seat model only works if the operator can see it: archiving a member is
 * what frees a seat, and a gym that cannot see its count has no way to know it
 * should archive — the first signal would be a refused enrolment.
 */
export interface ProviderBillingSeats {
  used: number;
  /** Null when the grant is uncapped. */
  limit: number | null;
  /**
   * Null when uncapped. **Can be negative** once over the cap — that is a real
   * state under a soft limit, so never clamp it: clamping hides the overage
   * the gym is about to be billed for.
   */
  remaining: number | null;
  /** True within 10% of the cap — the point at which prompting is useful. */
  near_limit: boolean;
  /**
   * `used > limit`. Note enforcement refuses at `used >= limit`, so a gym
   * exactly AT its cap reads `over_limit: false` and is still refused. Copy
   * must not promise "you can still add one".
   */
  over_limit: boolean;
}

export interface ProviderBillingStatus {
  organization_id: string;
  plan_tier: ProviderPlanTier;
  subscription_status: ProviderSubscriptionStatus;
  subscription_current_period_end: string | null;
  market_code: string;
  limits: ProviderBillingLimits;
  features: ProviderBillingFeatures;
  usage: ProviderBillingUsage;
  seats: ProviderBillingSeats;
}

export interface ProviderPlanPrice {
  amount_minor: number;
  currency: string;
}

export interface ProviderPlanOption {
  code: ProviderPlanTier;
  name: string;
  description: string;
  sort_order: number;
  limits: ProviderBillingLimits;
  features: ProviderBillingFeatures;
  prices: {
    month: ProviderPlanPrice | null;
    year: ProviderPlanPrice | null;
  };
  /**
   * False when the tier has no concrete cap and must be negotiated. Render it
   * as "Contact us" with NO amount and NO buy action — never a price the
   * customer cannot actually transact.
   */
  is_self_serve: boolean;
}

export interface CheckoutSessionResult {
  gateway: string;
  checkout_url: string;
  /** Present for Paystack — resume this server-initialized transaction in
   * an inline popup (secure: amount is server-set, not client-set). */
  access_code?: string;
  external_reference: string;
}

export interface ProviderInvoice {
  _id: string;
  organization_id: string;
  gateway: string;
  external_invoice_id: string;
  external_payment_id: string | null;
  /**
   * Minor units (kobo/cents). Renamed from `amount_due` — which was ALREADY
   * minor units, so the value is unchanged. Do not rescale it.
   */
  amount_due_minor: number;
  /** Minor units. Renamed from `amount_paid`; already minor, value unchanged. */
  amount_paid_minor: number;
  currency: string;
  status: ProviderInvoiceStatus;
  period_start: string;
  period_end: string;
  hosted_invoice_url: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceListResult {
  invoices: ProviderInvoice[];
  total: number;
}

export interface CreateCheckoutPayload {
  plan_tier: ProviderPlanTier;
  interval: BillingInterval;
  success_url: string;
  cancel_url: string;
}

// ─── Service ───────────────────────────────────────────────────────────────

export const providerBillingApi = {
  getStatus(organizationId: string): Promise<ApiResponse<ProviderBillingStatus>> {
    return apiClient.get<ProviderBillingStatus>(
      `/provider-billing/organizations/${organizationId}/status`,
    );
  },

  listPlans(market?: string): Promise<ApiResponse<ProviderPlanOption[]>> {
    const qs = market ? `?market=${encodeURIComponent(market)}` : "";
    return apiClient.get<ProviderPlanOption[]>(`/provider-billing/plans${qs}`);
  },

  createCheckout(
    organizationId: string,
    payload: CreateCheckoutPayload,
  ): Promise<ApiResponse<CheckoutSessionResult>> {
    return apiClient.post<CheckoutSessionResult>(
      `/provider-billing/organizations/${organizationId}/checkout`,
      payload,
    );
  },

  listInvoices(
    organizationId: string,
    opts: { limit?: number; skip?: number } = {},
  ): Promise<ApiResponse<InvoiceListResult>> {
    const params = new URLSearchParams();
    if (opts.limit !== undefined) params.set("limit", String(opts.limit));
    if (opts.skip !== undefined) params.set("skip", String(opts.skip));
    const qs = params.toString() ? `?${params.toString()}` : "";
    return apiClient.get<InvoiceListResult>(
      `/provider-billing/organizations/${organizationId}/invoices${qs}`,
    );
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * The one line that tells an operator where they stand on seats.
 *
 * Two traps, both deliberate:
 *
 *   1. `remaining` is NOT clamped. Being over a soft cap is a real state, and
 *      hiding it hides the overage the gym is about to be billed for.
 *   2. Zero gets its own wording rather than "0 seats left", because
 *      enforcement refuses at `used >= limit` while `over_limit` is
 *      `used > limit`. A gym exactly AT its cap reads `over_limit: false` and
 *      is still refused — copy implying one more seat is available would
 *      contradict the refusal they are about to hit.
 *
 * `fmtNumber` is injected so the org's own number formatting applies.
 */
export function seatHeadroomLabel(
  seats: Pick<ProviderBillingSeats, "remaining">,
  fmtNumber: (n: number) => string,
): string {
  if (seats.remaining === null) return "Unlimited seats";
  if (seats.remaining < 0)
    return `${fmtNumber(Math.abs(seats.remaining))} over your limit`;
  if (seats.remaining === 0)
    return "At your limit — free a seat before adding a member";
  return `${fmtNumber(seats.remaining)} seat${seats.remaining === 1 ? "" : "s"} left`;
}

export function formatMinorAmount(amountMinor: number, currency: string): string {
  // minorToMajor rather than an inline /100, so the factor lives in one place
  // for both the read and the write side (see lib/money/minorMoney).
  return formatCurrency(minorToMajor(amountMinor), currency);
}
