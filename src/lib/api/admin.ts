/**
 * Admin API Service
 * Handles all Admin Management API calls
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import type { PlatformCurrency } from "./utility";

// ==================== TYPES ====================

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
  subscriptions: {
    activeCount: number;
    totalRevenueUsd: number;
    averageValueUsd: number;
    byCurrency: Array<{
      currency: string;
      count: number;
      total: number;
      average: number;
    }>;
  };
  conversion: {
    totalUsers: number;
    payingUsers: number;
    conversionRate: number;
  };
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
}

/** Fields the PATCH endpoint accepts (everything except the immutable code). */
export type UpdateAdminPlan = Partial<Omit<AdminPlan, "_id" | "code">>;

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

  async getSupportedCurrencies(): Promise<ApiResponse<PlatformCurrency[]>> {
    return apiClient.get<PlatformCurrency[]>("/admin/currencies");
  }

  async updateSupportedCurrencies(
    currencies: PlatformCurrency[],
  ): Promise<ApiResponse<PlatformCurrency[]>> {
    return apiClient.put<PlatformCurrency[]>("/admin/currencies", {
      currencies,
    });
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
}

export const adminService = new AdminService();
