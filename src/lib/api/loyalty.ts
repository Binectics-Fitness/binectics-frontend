/**
 * Loyalty API. Loyalty is each provider's own opt-in program: members only
 * see programs of providers that turned it on, and points spend only with
 * the provider that awarded them.
 */

import { apiClient } from "./client";
import type {
  AdjustPointsRequest,
  AdminLoyaltyBalances,
  ApiResponse,
  CreateLoyaltyRewardRequest,
  LoyaltyBalance,
  LoyaltyPointsTransaction,
  LoyaltyProgram,
  LoyaltyRedemption,
  LoyaltyReward,
  LoyaltyRewardInput,
  LoyaltySettings,
  UpdateLoyaltyRewardRequest,
} from "@/lib/types";

function orgQuery(organizationId?: string, prefix: "?" | "&" = "?"): string {
  return organizationId
    ? `${prefix}organizationId=${encodeURIComponent(organizationId)}`
    : "";
}

export const loyaltyService = {
  // -------- Member --------
  /** The programs I can see; empty means show no loyalty anywhere. */
  getPrograms: (): Promise<ApiResponse<LoyaltyProgram[]>> =>
    apiClient.get<LoyaltyProgram[]>("/loyalty/programs"),

  getBalance: (organizationId?: string): Promise<ApiResponse<LoyaltyBalance>> =>
    apiClient.get<LoyaltyBalance>(`/loyalty/balance${orgQuery(organizationId)}`),

  getHistory: (
    limit = 25,
    skip = 0,
    organizationId?: string,
  ): Promise<ApiResponse<LoyaltyPointsTransaction[]>> =>
    apiClient.get<LoyaltyPointsTransaction[]>(
      `/loyalty/history?limit=${limit}&skip=${skip}${orgQuery(organizationId, "&")}`,
    ),

  listRewards: (organizationId?: string): Promise<ApiResponse<LoyaltyReward[]>> =>
    apiClient.get<LoyaltyReward[]>(`/loyalty/rewards${orgQuery(organizationId)}`),

  redeemReward: (rewardId: string): Promise<ApiResponse<LoyaltyRedemption>> =>
    apiClient.post<LoyaltyRedemption>(`/loyalty/rewards/${rewardId}/redeem`),

  listMyRedemptions: (): Promise<ApiResponse<LoyaltyRedemption[]>> =>
    apiClient.get<LoyaltyRedemption[]>("/loyalty/redemptions"),

  // -------- Provider (owner / manage-organization) --------
  getOrgSettings: (organizationId: string): Promise<ApiResponse<LoyaltySettings>> =>
    apiClient.get<LoyaltySettings>(`/loyalty/organizations/${organizationId}/settings`),

  updateOrgSettings: (
    organizationId: string,
    enabled: boolean,
  ): Promise<ApiResponse<LoyaltySettings>> =>
    apiClient.patch<LoyaltySettings>(
      `/loyalty/organizations/${organizationId}/settings`,
      { enabled },
    ),

  listOrgRewards: (organizationId: string): Promise<ApiResponse<LoyaltyReward[]>> =>
    apiClient.get<LoyaltyReward[]>(`/loyalty/organizations/${organizationId}/rewards`),

  createOrgReward: (
    organizationId: string,
    data: LoyaltyRewardInput,
  ): Promise<ApiResponse<LoyaltyReward>> =>
    apiClient.post<LoyaltyReward>(`/loyalty/organizations/${organizationId}/rewards`, data),

  updateOrgReward: (
    organizationId: string,
    rewardId: string,
    data: UpdateLoyaltyRewardRequest,
  ): Promise<ApiResponse<LoyaltyReward>> =>
    apiClient.patch<LoyaltyReward>(
      `/loyalty/organizations/${organizationId}/rewards/${rewardId}`,
      data,
    ),

  removeOrgReward: (
    organizationId: string,
    rewardId: string,
  ): Promise<ApiResponse<{ deleted: boolean; archived: boolean }>> =>
    apiClient.delete<{ deleted: boolean; archived: boolean }>(
      `/loyalty/organizations/${organizationId}/rewards/${rewardId}`,
    ),

  // -------- Admin (support) --------
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
  ): Promise<ApiResponse<AdminLoyaltyBalances>> =>
    apiClient.get<AdminLoyaltyBalances>(`/admin/loyalty/users/${userId}/balance`),

  adminAdjustUserPoints: (
    userId: string,
    data: AdjustPointsRequest,
  ): Promise<ApiResponse<LoyaltyPointsTransaction>> =>
    apiClient.post<LoyaltyPointsTransaction>(
      `/admin/loyalty/users/${userId}/adjust`,
      data,
    ),
};
