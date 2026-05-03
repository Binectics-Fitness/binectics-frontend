/**
 * Provider Billing API Service
 *
 * Wraps the backend `/provider-billing/*` endpoints used by the org-billing
 * settings page (status, plan catalogue, hosted-checkout, invoices).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

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

export interface ProviderBillingStatus {
  organization_id: string;
  plan_tier: ProviderPlanTier;
  subscription_status: ProviderSubscriptionStatus;
  subscription_current_period_end: string | null;
  subscription_trial_end: string | null;
  subscription_cancelled_at: string | null;
  market_code: string;
  limits: ProviderBillingLimits;
  features: ProviderBillingFeatures;
  usage: ProviderBillingUsage;
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
}

export interface CheckoutSessionResult {
  gateway: string;
  checkout_url: string;
  external_reference: string;
}

export interface ProviderInvoice {
  _id: string;
  organization_id: string;
  gateway: string;
  external_invoice_id: string;
  external_payment_id: string | null;
  amount_due: number;
  amount_paid: number;
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

export function formatMinorAmount(amountMinor: number, currency: string): string {
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: major % 1 === 0 ? 0 : 2,
    }).format(major);
  } catch {
    return `${currency} ${major.toFixed(2)}`;
  }
}
