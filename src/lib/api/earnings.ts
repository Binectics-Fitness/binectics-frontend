import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

/**
 * Provider earnings, honestly split across two backends:
 *
 * - Org ledger (`/transactions/organizations/:id/...`): SETTLED money —
 *   membership subscriptions, refunds, payouts — read off the
 *   append-only transactions ledger. Owner-only.
 * - Session activity (`/consultations/provider/earnings`): booking
 *   counts are real; monetary figures are ESTIMATES derived from the
 *   consultation type's optional price (bookings are not yet paid
 *   through the platform). Render them labelled as estimates.
 */

export interface RevenueByCurrency {
  [currency: string]: number; // minor units
}

export interface OrgEarningsSummary {
  windows: {
    today: RevenueByCurrency;
    week: RevenueByCurrency;
    month: RevenueByCurrency;
  };
  all_time: {
    /** Minor units per currency. Never summed across currencies (no FX). */
    by_currency: RevenueByCurrency;
  };
}

export interface RevenueTimeseriesPoint {
  date: string; // YYYY-MM-DD
  revenue_minor: number;
  currency: string;
}

export interface LedgerTransaction {
  _id: string;
  user_id?: { first_name?: string; last_name?: string; email?: string } | string;
  type: string;
  direction: "credit" | "debit";
  status: string;
  method: string;
  amount_minor: number;
  currency: string;
  occurred_at: string;
  reference_type: string;
}

export interface LedgerPage {
  items: LedgerTransaction[];
  total: number;
  page: number;
  limit: number;
}

export interface SessionEarnings {
  counts: Record<string, number>; // keyed by booking status
  monthly: Array<{ month: string; completed: number }>;
  estimated: {
    by_currency: RevenueByCurrency;
    priced_sessions: number;
    unpriced_sessions: number;
  };
}

/** One month of a provider's income summary (minor units, one currency). */
export interface IncomeSummaryMonth {
  /** YYYY-MM, in UTC. */
  month: string;
  gross_minor: number;
  refunds_minor: number;
  adjustments_minor: number;
  net_minor: number;
  transaction_count: number;
}

export interface IncomeSummaryCurrency {
  currency: string;
  gross_minor: number;
  refunds_minor: number;
  adjustments_minor: number;
  net_minor: number;
  transaction_count: number;
  months: IncomeSummaryMonth[];
}

/**
 * Informational income by year, month and currency, from settled ledger
 * rows. Payouts are excluded; no tax is computed. Currencies are never
 * added together.
 */
export interface IncomeSummary {
  year: number;
  time_zone: "UTC";
  /** Years with any settled row, newest first. */
  years: number[];
  currencies: IncomeSummaryCurrency[];
}

export const earningsService = {
  getOrgSummary(orgId: string): Promise<ApiResponse<OrgEarningsSummary>> {
    return apiClient.get<OrgEarningsSummary>(
      `/transactions/organizations/${orgId}/summary`,
    );
  },

  getOrgTimeseries(
    orgId: string,
    days = 90,
  ): Promise<ApiResponse<RevenueTimeseriesPoint[]>> {
    return apiClient.get<RevenueTimeseriesPoint[]>(
      `/transactions/organizations/${orgId}/timeseries?days=${days}`,
    );
  },

  getOrgTransactions(
    orgId: string,
    params?: { page?: number; limit?: number; type?: string; status?: string },
  ): Promise<ApiResponse<LedgerPage>> {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.type) search.set("type", params.type);
    if (params?.status) search.set("status", params.status);
    const query = search.toString();
    return apiClient.get<LedgerPage>(
      `/transactions/organizations/${orgId}/transactions${query ? `?${query}` : ""}`,
    );
  },

  getIncomeSummary(orgId: string, year?: number): Promise<ApiResponse<IncomeSummary>> {
    const query = year ? `?year=${year}` : "";
    return apiClient.get<IncomeSummary>(
      `/transactions/organizations/${orgId}/income-summary${query}`,
    );
  },

  getSessionEarnings(): Promise<ApiResponse<SessionEarnings>> {
    return apiClient.get<SessionEarnings>("/consultations/provider/earnings");
  },
};
