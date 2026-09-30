/**
 * Admin API Service
 * Handles all Admin Management API calls
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

// ==================== TYPES ====================

/** What a currency can be used for, as the admin sees it. */
export type AdminCurrencyUse = "price" | "charge_card" | "charge_transfer" | "provider_billing";

export const ADMIN_CURRENCY_USES: readonly AdminCurrencyUse[] = [
  "price",
  "charge_card",
  "charge_transfer",
  "provider_billing",
];

export type PaymentMethodCode = "card" | "bank_transfer";

export interface CurrencyEffect {
  selectable: boolean;
  /** Every reason it is not selectable, in plain words; empty when it is. */
  reasons: { code: string; message: string }[];
}

export interface AdminCurrencyGateway {
  gateway: string;
  label: string;
  /** The integration can charge this currency at all (code). */
  capable: boolean;
  /** Methods the integration supports in this currency (code). */
  capable_methods: PaymentMethodCode[];
  /** Switched on for our account (admin). */
  account_enabled: boolean;
  /** Methods confirmed on our account (admin). */
  methods: PaymentMethodCode[];
}

export interface CurrencyInFlight {
  pending_bookings: number;
  pending_subscriptions: number;
  pending_provider_checkouts: number;
}

export interface AdminCurrency {
  code: string;
  name: string;
  symbol: string;
  minor_unit: number;
  platform_enabled: boolean;
  notes: string | null;
  effective: Record<AdminCurrencyUse, CurrencyEffect>;
  gateways: AdminCurrencyGateway[];
  usage: {
    live: { organizations: number; session_types: number; plans: number; listings: number };
    in_flight: CurrencyInFlight;
    historical: { transactions: number };
    in_flight_total: number;
  };
  updated_by: string | null;
  updated_at: string | null;
}

/** PATCH /admin/currencies/:code. `code` and `minor_unit` are not editable. */
export interface UpdateAdminCurrency {
  platform_enabled?: boolean;
  gateways?: { gateway: string; account_enabled?: boolean; methods?: PaymentMethodCode[] }[];
  name?: string;
  symbol?: string;
  notes?: string | null;
  /** Confirms turning a currency off while payments in it are in progress. */
  stop_new_payments?: boolean;
}

export interface AdminUserSuspensionResult {
  user: {
    _id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_suspended: boolean;
    suspension_reason?: string;
  };
  cascaded: {
    listingsSuspended: number;
    subscriptionsCancelled: number;
    bookingsCancelled: number;
  };
}

export interface PlatformMetricsOverview {
  verifiedProviders: {
    total: number;
    distinctCountries: number;
    byCountry: Array<{ country_code: string; count: number }>;
  };
  /**
   * Revenue figures whose names now say their unit. These were ALREADY minor
   * units (the transactions ledger has only ever stored minor) — the `*Minor`
   * suffix is a rename, NOT a rescale. Dividing them again by 100 would
   * report a hundredth of the platform's real revenue.
   */
  subscriptions: {
    activeCount: number;
    primaryCurrency: string | null;
    primaryRevenueMinor: number;
    primaryAverageMinor: number;
    byCurrency: Array<{
      currency: string;
      count: number;
      totalMinor: number;
      averageMinor: number;
    }>;
  };
  conversion: {
    totalUsers: number;
    payingUsers: number;
    conversionRate: number;
  };
  /**
   * Revenue from active paid memberships, one row per currency in that
   * currency's MINOR unit, largest first. Never converted or summed across
   * currencies: there are no FX rates. (The old USD rollups summed USD rows
   * only and read 0 on an NGN platform; they are not read.)
   */
  revenue_by_currency?: Array<{
    currency: string;
    amount_minor: number;
    count: number;
  }>;
}

export interface FeedbackSummary {
  responseCount: number;
  positiveCount: number;
  positivePercentage: number;
  averageScore: number;
  scoreDistribution: Record<string, number>;
  recentComments: Array<{
    score: number;
    comment: string;
    created_at: string;
  }>;
}

/** A provider SaaS plan definition (super-admin editable). */
export interface AdminPlan {
  _id: string;
  code: string; // free | pro | enterprise — immutable
  name: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  // Quotas: null means unlimited.
  max_active_members: number | null;
  max_membership_plans: number | null;
  max_staff_members: number | null;
  max_listings: number | null;
  // Feature flags.
  analytics_enabled: boolean;
  consultations_enabled: boolean;
  journals_enabled: boolean;
  qr_checkin_enabled: boolean;
  white_label_enabled: boolean;
  custom_domain_enabled: boolean;
  branded_email_enabled: boolean;
  forms_enabled: boolean;
  classes_enabled: boolean;
  loyalty_enabled: boolean;
  api_access_enabled: boolean;
}

/** Fields the PATCH endpoint accepts (everything except the immutable code). */
export type UpdateAdminPlan = Partial<Omit<AdminPlan, "_id" | "code">>;

/** A per-market price row for a plan tier (checkout requires one). */
export interface AdminPlanPrice {
  _id: string;
  plan_code: string;
  market_code: string;
  currency: string;
  /** Minor units (kobo/cents). */
  amount_minor: number;
  /**
   * Per-seat price charged for enrolment beyond the seat cap, in `currency`'s
   * minor units. Required for a paid tier (a seat cap with no overage rate is a
   * hard cap); null/absent only on the free tier, which hard-blocks instead.
   */
  overage_per_seat_minor?: number | null;
  interval: "month" | "year";
  trial_days?: number;
  discount_percent?: number;
  is_active: boolean;
  /** Gateway-side price/plan refs — a Paystack plan code here makes the
   * charge RECURRING; without one checkout is a one-shot payment. */
  gateway_prices?: {
    gateway: string;
    external_price_id: string;
    is_primary_for_market?: boolean;
  }[];
}

export type UpsertAdminPlanPrice = Omit<AdminPlanPrice, "_id">;

/**
 * Creation payload. `code` must be one of the canonical tiers — the tier
 * enum threads through checkout, org billing status and quota
 * enforcement, so arbitrary new tiers are a backend change, not a form.
 */
export type CreateAdminPlan = Omit<AdminPlan, "_id">;

/** One row of the platform-wide money ledger (GET /admin/transactions). */
export interface AdminTransaction {
  _id: string;
  user_id: {
    _id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
  } | null;
  organization_id: { _id: string; name?: string } | null;
  type: string;
  direction: "credit" | "debit";
  status: "pending" | "succeeded" | "failed" | "reversed";
  method: string;
  /** Minor units (kobo, cents). */
  amount_minor: number;
  currency: string;
  occurred_at: string;
  gateway?: string;
  gateway_reference?: string;
}

export interface AdminTransactionFilters {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  direction?: string;
  organization_id?: string;
  from?: string;
  to?: string;
}

/** One persisted audit event (GET /admin/audit-log). PII arrives pre-hashed. */
export interface AdminAuditEvent {
  _id: string;
  event: string;
  level: "log" | "warn" | "error";
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface AdminAuditFilters {
  page?: number;
  limit?: number;
  event?: string;
  level?: string;
  from?: string;
  to?: string;
}

export interface AdminPaginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

function toQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// ==================== SERVICE ====================

class AdminService {
  async suspendUser(
    userId: string,
    reason?: string,
  ): Promise<ApiResponse<AdminUserSuspensionResult>> {
    return apiClient.patch(`/admin/users/${userId}/suspend`, {
      reason,
    });
  }

  async unsuspendUser(
    userId: string,
  ): Promise<ApiResponse<{ _id: string; is_suspended: boolean }>> {
    return apiClient.patch(`/admin/users/${userId}/unsuspend`);
  }

  async getPlatformMetrics(): Promise<ApiResponse<PlatformMetricsOverview>> {
    return apiClient.get<PlatformMetricsOverview>("/admin/metrics/overview");
  }

  async getFeedbackSummary(): Promise<ApiResponse<FeedbackSummary>> {
    return apiClient.get<FeedbackSummary>("/admin/feedback/summary");
  }

  // ─── Currencies ─────────────────────────────────────────────────────────

  /** Every ISO currency with its effective status, gateways and usage. */
  async listCurrencies(): Promise<ApiResponse<AdminCurrency[]>> {
    return apiClient.get<AdminCurrency[]>("/admin/currencies");
  }

  /**
   * Change one currency. A change that turns it off while payments in it are
   * in progress is refused with 409 CURRENCY_IN_USE (details.in_flight,
   * details.uses_lost); resend with `stop_new_payments: true` once the admin
   * confirms.
   */
  async updateCurrency(
    code: string,
    patch: UpdateAdminCurrency,
  ): Promise<ApiResponse<AdminCurrency>> {
    return apiClient.patch<AdminCurrency>(
      `/admin/currencies/${encodeURIComponent(code)}`,
      patch,
    );
  }

  // ─── Provider SaaS plans ───────────────────────────────────────────────

  async listPlans(): Promise<ApiResponse<AdminPlan[]>> {
    return apiClient.get<AdminPlan[]>("/admin/provider-billing/plans");
  }

  async updatePlan(
    planId: string,
    patch: UpdateAdminPlan,
  ): Promise<ApiResponse<AdminPlan>> {
    return apiClient.patch<AdminPlan>(
      `/admin/provider-billing/plans/${planId}`,
      patch,
    );
  }

  async createPlan(plan: CreateAdminPlan): Promise<ApiResponse<AdminPlan>> {
    return apiClient.post<AdminPlan>("/admin/provider-billing/plans", plan);
  }

  // ─── Plan market prices (what checkout charges) ─────────────────────────

  async listPlanPrices(): Promise<ApiResponse<AdminPlanPrice[]>> {
    return apiClient.get<AdminPlanPrice[]>("/admin/provider-billing/prices");
  }

  /** Upsert keyed on plan_code + market_code + interval. */
  async upsertPlanPrice(
    price: UpsertAdminPlanPrice,
  ): Promise<ApiResponse<AdminPlanPrice>> {
    return apiClient.put<AdminPlanPrice>(
      "/admin/provider-billing/prices",
      price,
    );
  }

  async deletePlanPrice(id: string): Promise<ApiResponse<unknown>> {
    return apiClient.delete(`/admin/provider-billing/prices/${id}`);
  }

  // ─── Platform ledger & audit log ─────────────────────────────────────────

  async listTransactions(
    filters: AdminTransactionFilters = {},
  ): Promise<ApiResponse<AdminPaginated<AdminTransaction>>> {
    return apiClient.get<AdminPaginated<AdminTransaction>>(
      `/admin/transactions${toQueryString(filters as Record<string, unknown>)}`,
    );
  }

  async listAuditEvents(
    filters: AdminAuditFilters = {},
  ): Promise<ApiResponse<AdminPaginated<AdminAuditEvent>>> {
    return apiClient.get<AdminPaginated<AdminAuditEvent>>(
      `/admin/audit-log${toQueryString(filters as Record<string, unknown>)}`,
    );
  }

  async listAuditEventNames(): Promise<ApiResponse<string[]>> {
    return apiClient.get<string[]>("/admin/audit-log/events");
  }
}

export const adminService = new AdminService();
