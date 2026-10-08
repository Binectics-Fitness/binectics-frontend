import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { loyaltyService } from "@/lib/api/loyalty";
import type {
  AdjustPointsRequest,
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

function unwrap<T>(res: { success: boolean; data?: T; message?: string }, what: string): T {
  if (!res.success || res.data === undefined) {
    throw new Error(res.message || `Couldn't load ${what}.`);
  }
  return res.data;
}

/**
 * The provider programs this member can see. Loyalty UI (nav, Home card,
 * rewards) renders only when this is non-empty: an empty list means none of
 * their providers runs a program, so loyalty does not exist for them.
 */
export function useLoyaltyPrograms(enabled = true) {
  return useQuery<LoyaltyProgram[]>({
    queryKey: queryKeys.loyalty.programs(),
    queryFn: async () => unwrap(await loyaltyService.getPrograms(), "your loyalty programs"),
    enabled,
  });
}

export function useLoyaltyBalance(organizationId?: string, enabled = true) {
  return useQuery<LoyaltyBalance>({
    queryKey: queryKeys.loyalty.balance(organizationId),
    queryFn: async () => unwrap(await loyaltyService.getBalance(organizationId), "your points"),
    enabled,
  });
}

export function useLoyaltyHistory(limit = 25, skip = 0, organizationId?: string, enabled = true) {
  return useQuery<LoyaltyPointsTransaction[]>({
    queryKey: queryKeys.loyalty.history(limit, skip, organizationId),
    queryFn: async () =>
      unwrap(await loyaltyService.getHistory(limit, skip, organizationId), "your points history"),
    enabled,
  });
}

export function useLoyaltyRewards(organizationId?: string, enabled = true) {
  return useQuery<LoyaltyReward[]>({
    queryKey: queryKeys.loyalty.rewards(organizationId),
    queryFn: async () => unwrap(await loyaltyService.listRewards(organizationId), "rewards"),
    enabled,
  });
}

export function useMyLoyaltyRedemptions(enabled = true) {
  return useQuery<LoyaltyRedemption[]>({
    queryKey: queryKeys.loyalty.myRedemptions(),
    queryFn: async () => unwrap(await loyaltyService.listMyRedemptions(), "your redemptions"),
    enabled,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      const res = await loyaltyService.redeemReward(rewardId);
      if (!res.success) throw new Error(res.message || "Couldn't redeem that reward.");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

// -------- Provider: the org's own program --------

export function useOrgLoyaltySettings(organizationId: string | undefined) {
  return useQuery<LoyaltySettings>({
    queryKey: queryKeys.loyalty.orgSettings(organizationId ?? ""),
    queryFn: async () =>
      unwrap(await loyaltyService.getOrgSettings(organizationId!), "loyalty settings"),
    enabled: !!organizationId,
  });
}

export function useUpdateOrgLoyaltySettings(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await loyaltyService.updateOrgSettings(organizationId!, enabled);
      return unwrap(res, "loyalty settings");
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.loyalty.orgSettings(organizationId ?? ""), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

export function useOrgLoyaltyRewards(organizationId: string | undefined, enabled = true) {
  return useQuery<LoyaltyReward[]>({
    queryKey: queryKeys.loyalty.orgRewards(organizationId ?? ""),
    queryFn: async () =>
      unwrap(await loyaltyService.listOrgRewards(organizationId!), "your rewards"),
    enabled: !!organizationId && enabled,
  });
}

export function useSaveOrgReward(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ rewardId, data }: { rewardId?: string; data: LoyaltyRewardInput }) => {
      const res = rewardId
        ? await loyaltyService.updateOrgReward(organizationId!, rewardId, data)
        : await loyaltyService.createOrgReward(organizationId!, data);
      return unwrap(res, "the reward");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.orgRewards(organizationId ?? "") });
    },
  });
}

export function useRemoveOrgReward(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) =>
      unwrap(await loyaltyService.removeOrgReward(organizationId!, rewardId), "the reward"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.orgRewards(organizationId ?? "") });
    },
  });
}

// -------- Admin (support) --------

export function useAdminCreateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLoyaltyRewardRequest) => loyaltyService.adminCreateReward(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.loyalty.all });
    },
  });
}

export function useAdminUpdateReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rewardId, data }: { rewardId: string; data: UpdateLoyaltyRewardRequest }) =>
      loyaltyService.adminUpdateReward(rewardId, data),
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
    mutationFn: ({ userId, data }: { userId: string; data: AdjustPointsRequest }) =>
      loyaltyService.adminAdjustUserPoints(userId, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.loyalty.adminUserBalance(variables.userId),
      });
    },
  });
}
