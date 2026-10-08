import { apiClient } from "./client";
import type { ApiResponse, MembershipSubscription } from "@/lib/types";

/**
 * Recurring member billing: card auto-renew on the provider's own Paystack
 * account (api #204). The API owns every amount, date and word of the
 * consent; the client shows what it is given and echoes the version and hash
 * back. Nothing here computes a price or a renewal date.
 */

/** Why the API won't offer auto-renew for a plan or membership. */
export type AutoRenewUnavailableReason =
  | "disabled"
  | "no_provider_account"
  | "free_plan"
  | "one_time_plan"
  | "gym_managed"
  | "currency_not_card_chargeable"
  | "plan_unavailable";

/** The variables the server rendered into the consent text. Display only. */
export interface AutoRenewConsentRendered {
  merchant_name: string;
  plan_name?: string;
  collected_by: "provider";
  amount_minor: number;
  currency: string;
  interval_days: number;
  first_charge_at: string;
  reminder_hours: number;
  price_notice_days: number;
}

export type AutoRenewConsentOffer =
  | {
      offered: true;
      text_version: string;
      /** Shown to the member word for word. */
      text: string;
      text_sha256: string;
      rendered: AutoRenewConsentRendered;
    }
  | { offered: false; reason: AutoRenewUnavailableReason | string };

export type OfferedConsent = Extract<AutoRenewConsentOffer, { offered: true }>;

/** What the client echoes back when the member ticks the box. */
export interface ConsentEcho {
  text_version: string;
  text_sha256: string;
  channel: "web";
}

export interface RenewalCheckoutRequest extends ConsentEcho {
  save_card: true;
}

export type PaymentMethodStatus = "active" | "expired" | "invalid";

export type PaymentMethodInvalidReason =
  | "account_changed"
  | "gateway_rejected"
  | "needs_customer";

export interface PaymentMethodSubscription {
  id: string;
  plan_id: string;
  plan_name: string | null;
  status: string;
  next_charge_at: string | null;
  renewal_price_minor: number | null;
  currency: string | null;
}

/** GET /marketplace/my-payment-methods row. */
export interface PaymentMethodView {
  id: string;
  organization_id: string;
  provider_name: string | null;
  brand: string | null;
  card_type: string | null;
  last4: string;
  exp_month: number;
  exp_year: number;
  bank: string | null;
  status: PaymentMethodStatus;
  invalid_reason: PaymentMethodInvalidReason | null;
  created_at: string | null;
  subscriptions: PaymentMethodSubscription[];
}

export type RecordRenewalMethod = "cash" | "bank_transfer" | "card" | "other";

/** Staff record a paid term. No amount: the API charges the plan's own price. */
export interface RecordRenewalRequest {
  payment_method: RecordRenewalMethod;
  payment_reference?: string;
}

export const memberBillingService = {
  /** The consent for paying this plan at checkout. */
  getPlanAutoRenewConsent(
    listingId: string,
    planId: string,
  ): Promise<ApiResponse<AutoRenewConsentOffer>> {
    return apiClient.get<AutoRenewConsentOffer>(
      `/marketplace/listings/${listingId}/plans/${planId}/auto-renew-consent`,
    );
  },

  /** The consent for turning auto-renew back on for a membership. */
  getSubscriptionAutoRenewConsent(
    subscriptionId: string,
  ): Promise<ApiResponse<AutoRenewConsentOffer>> {
    return apiClient.get<AutoRenewConsentOffer>(
      `/marketplace/my-subscriptions/${subscriptionId}/auto-renew-consent`,
    );
  },

  /**
   * Flip auto-renew. Not optimistic: the caller renders the subscription
   * this returns. `consent` is sent only after the member accepted the text
   * the API asked for (CONSENT_REQUIRED).
   */
  setAutoRenew(
    subscriptionId: string,
    consent?: ConsentEcho,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return apiClient.patch<MembershipSubscription>(
      `/marketplace/my-subscriptions/${subscriptionId}/auto-renew`,
      consent ? { consent } : {},
    );
  },

  listPaymentMethods(): Promise<ApiResponse<PaymentMethodView[]>> {
    return apiClient.get<PaymentMethodView[]>("/marketplace/my-payment-methods");
  },

  removePaymentMethod(
    id: string,
  ): Promise<ApiResponse<{ id: string; status: "revoked" }>> {
    return apiClient.delete<{ id: string; status: "revoked" }>(
      `/marketplace/my-payment-methods/${id}`,
    );
  },

  /** Gym staff: one more term at the plan's own price (api #196). */
  recordRenewal(
    organizationId: string,
    subscriptionId: string,
    body: RecordRenewalRequest,
  ): Promise<ApiResponse<MembershipSubscription>> {
    return apiClient.post<MembershipSubscription>(
      `/marketplace/organizations/${organizationId}/subscriptions/${subscriptionId}/record-renewal`,
      body,
    );
  },
};
