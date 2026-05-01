/**
 * Loyalty & Rewards API Service
 */

import { apiClient } from "./client";
import type {
  AdjustPointsRequest,
  ApiResponse,
  CreateLoyaltyRewardRequest,
  LoyaltyBalance,
  LoyaltyPointsTransaction,
  LoyaltyRedemption,
  LoyaltyReward,
  UpdateLoyaltyRewardRequest,
} from "@/lib/types";

export const loyaltyService = {
  // -------- User-facing --------
  getBalance: (): Promise<ApiResponse<LoyaltyBalance>> =>
    apiClient.get<LoyaltyBalance>("/loyalty/balance"),

  getHistory: (
    limit = 25,
    skip = 0,
  ): Promise<ApiResponse<LoyaltyPointsTransaction[]>> =>
    apiClient.get<LoyaltyPointsTransaction[]>(
      `/loyalty/history?limit=${limit}&skip=${skip}`,
    ),

  listRewards: (organizationId?: string): Promise<ApiResponse<LoyaltyReward[]>> => {
    const query = organizationId ? `?organizationId=${organizationId}` : "";
    return apiClient.get<LoyaltyReward[]>(`/loyalty/rewards${query}`);
  },

  redeemReward: (rewardId: string): Promise<ApiResponse<LoyaltyRedemption>> =>
    apiClient.post<LoyaltyRedemption>(`/loyalty/rewards/${rewardId}/redeem`),

  listMyRedemptions: (): Promise<ApiResponse<LoyaltyRedemption[]>> =>
    apiClient.get<LoyaltyRedemption[]>("/loyalty/redemptions"),

  // -------- Admin --------
  adminCreateReward: (
    data: CreateLoyaltyRewardRequest,
  ): Promise<ApiResponse<LoyaltyReward>> =>
    apiClient.post<LoyaltyReward>("/admin/loyalty/rewards", data),

  adminUpdateReward: (
    rewardId: string,
    data: UpdateLoyaltyRewardRequest,
  ): Promise<ApiResponse<LoyaltyReward>> =>
    apiClient.patch<LoyaltyReward>(`/admin/loyalty/rewards/${rewardId}`, data),

  adminDeleteReward: (rewardId: string): Promise<ApiResponse<void>> =>
    apiClient.delete<void>(`/admin/loyalty/rewards/${rewardId}`),

  adminGetUserBalance: (
    userId: string,
  ): Promise<ApiResponse<LoyaltyBalance>> =>
    apiClient.get<LoyaltyBalance>(`/admin/loyalty/users/${userId}/balance`),

  adminAdjustUserPoints: (
    userId: string,
    data: AdjustPointsRequest,
  ): Promise<ApiResponse<LoyaltyPointsTransaction>> =>
    apiClient.post<LoyaltyPointsTransaction>(
      `/admin/loyalty/users/${userId}/adjust`,
      data,
    ),
};
