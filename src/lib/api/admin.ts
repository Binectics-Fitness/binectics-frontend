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
}

export const adminService = new AdminService();
