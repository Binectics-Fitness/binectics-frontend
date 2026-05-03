import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { marketplaceService } from "@/lib/api/marketplace";
import type {
  MembershipSubscription,
  MarketplaceListing,
  MarketplaceRequest,
  MarketplaceMembershipPlan,
  MarketplaceSearchParams,
  MarketplaceSearchResult,
} from "@/lib/types";

export function useSearchListings(
  params: MarketplaceSearchParams,
  enabled = true,
) {
  return useQuery<MarketplaceSearchResult>({
    queryKey: queryKeys.marketplace.search(params as Record<string, unknown>),
    queryFn: async () => {
      try {
        const res = await marketplaceService.searchListings(params);
        return res.success && res.data
          ? res.data
          : { listings: [], pagination: { total: 0, page: 1, limit: 20, total_pages: 0 } };
      } catch {
        return { listings: [], pagination: { total: 0, page: 1, limit: 20, total_pages: 0 } };
      }
    },
    enabled,
    retry: false,
    // Same query key is reused on filter toggles; matches public HTTP cache.
    staleTime: 30_000,
  });
}

export function useMySubscriptions(enabled = true) {
  return useQuery<MembershipSubscription[]>({
    queryKey: queryKeys.marketplace.subscriptions(),
    queryFn: async () => {
      const res = await marketplaceService.getMyMembershipSubscriptions();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      marketplaceService.cancelMembershipSubscription(subscriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.subscriptions(),
      });
    },
  });
}

export function useToggleAutoRenew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (subscriptionId: string) =>
      marketplaceService.toggleAutoRenew(subscriptionId),
    onSuccess: (res, subscriptionId) => {
      if (res.success && res.data) {
        queryClient.setQueryData<MembershipSubscription[]>(
          queryKeys.marketplace.subscriptions(),
          (old) =>
            old?.map((s) =>
              s._id === subscriptionId
                ? { ...s, auto_renew: res.data!.auto_renew }
                : s,
            ),
        );
      }
    },
  });
}

export function useMyListing(enabled = true) {
  return useQuery<MarketplaceListing | null>({
    queryKey: queryKeys.marketplace.myListing(),
    queryFn: async () => {
      const res = await marketplaceService.getMyListing();
      return res.success && res.data ? res.data : null;
    },
    enabled,
  });
}

export function useOrgListing(orgId?: string, enabled = true) {
  return useQuery<MarketplaceListing | null>({
    queryKey: queryKeys.marketplace.orgListing(orgId ?? ""),
    queryFn: async () => {
      const res = await marketplaceService.getOrgListing(orgId!);
      return res.success && res.data ? res.data : null;
    },
    enabled: enabled && !!orgId,
  });
}

export function useMyListingRequests(enabled = true) {
  return useQuery<MarketplaceRequest[]>({
    queryKey: queryKeys.marketplace.myListingRequests(),
    queryFn: async () => {
      const res = await marketplaceService.getMyListingRequests();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useOrgMembershipSubscriptions(orgId?: string, enabled = true) {
  return useQuery<MembershipSubscription[]>({
    queryKey: queryKeys.marketplace.orgMembershipSubscriptions(orgId ?? ""),
    queryFn: async () => {
      const res = await marketplaceService.getOrgMembershipSubscriptions(
        orgId!,
      );
      return res.success && res.data ? res.data : [];
    },
    enabled: enabled && !!orgId,
  });
}

export function useOrgMembershipPlans(orgId?: string, enabled = true) {
  return useQuery<MarketplaceMembershipPlan[]>({
    queryKey: queryKeys.marketplace.orgMembershipPlans(orgId ?? ""),
    queryFn: async () => {
      const res = await marketplaceService.getOrgMembershipPlans(orgId!);
      return res.success && res.data ? res.data : [];
    },
    enabled: enabled && !!orgId,
  });
}
