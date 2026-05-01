/**
 * Admin API Service
 * Handles all Admin Management API calls
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

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
}

export const adminService = new AdminService();
