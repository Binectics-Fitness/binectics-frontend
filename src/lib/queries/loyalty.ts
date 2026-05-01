import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { loyaltyService } from "@/lib/api/loyalty";
import type {
  AdjustPointsRequest,
  CreateLoyaltyRewardRequest,
  LoyaltyBalance,
  LoyaltyPointsTransaction,
  LoyaltyRedemption,
  LoyaltyReward,
  UpdateLoyaltyRewardRequest,
} from "@/lib/types";

export function useLoyaltyBalance(enabled = true) {
  return useQuery<LoyaltyBalance>({
    queryKey: queryKeys.loyalty.balance(),
    queryFn: async () => {
      const res = await loyaltyService.getBalance();
      return res.success && res.data ? res.data : { balance: 0 };
    },
    enabled,
  });
}

export function useLoyaltyHistory(limit = 25, skip = 0, enabled = true) {
  return useQuery<LoyaltyPointsTransaction[]>({
    queryKey: queryKeys.loyalty.history(limit, skip),
    queryFn: async () => {
      const res = await loyaltyService.getHistory(limit, skip);
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useLoyaltyRewards(organizationId?: string, enabled = true) {
  return useQuery<LoyaltyReward[]>({
    queryKey: queryKeys.loyalty.rewards(organizationId),
    queryFn: async () => {
      const res = await loyaltyService.listRewards(organizationId);
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useMyLoyaltyRedemptions(enabled = true) {
  return useQuery<LoyaltyRedemption[]>({
    queryKey: queryKeys.loyalty.myRedemptions(),
    queryFn: async () => {
      const res = await loyaltyService.listMyRedemptions();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => loyaltyService.redeemReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

// -------- Admin --------

export function useAdminCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoyaltyRewardRequest) =>
      loyaltyService.adminCreateReward(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

export function useAdminUpdateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rewardId,
      data,
    }: {
      rewardId: string;
      data: UpdateLoyaltyRewardRequest;
    }) => loyaltyService.adminUpdateReward(rewardId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

export function useAdminDeleteReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rewardId: string) => loyaltyService.adminDeleteReward(rewardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

export function useAdminAdjustUserPoints() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      data,
    }: {
      userId: string;
      data: AdjustPointsRequest;
    }) => loyaltyService.adminAdjustUserPoints(userId, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loyalty.adminUserBalance(variables.userId),
      });
    },
  });
}
