import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { marketplaceService } from "@/lib/api/marketplace";
import type {
  AmenityKey,
  FacilityCategory,
  FacilityCondition,
  FacilityItem,
  FacilityStatus,
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

// ─── My listings (multi-location) ────────────────────────────────────

export function useMyListings(enabled = true) {
  return useQuery<MarketplaceListing[]>({
    queryKey: queryKeys.marketplace.myListings(),
    queryFn: async () => {
      const res = await marketplaceService.getMyListings();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useFacilityItems(listingId: string | undefined) {
  return useQuery<FacilityItem[]>({
    queryKey: queryKeys.marketplace.facilityItems(listingId ?? ""),
    queryFn: async () => {
      const res = await marketplaceService.getMyListingFacilityItems(
        listingId!,
      );
      return res.success && res.data ? res.data : [];
    },
    enabled: !!listingId,
  });
}

export function useAddFacilityItem(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Parameters<typeof marketplaceService.addMyListingFacilityItem>[1],
    ) => marketplaceService.addMyListingFacilityItem(listingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.facilityItems(listingId),
      });
    },
  });
}

export function useUpdateFacilityItem(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (args: {
      itemId: string;
      payload: Parameters<
        typeof marketplaceService.updateMyListingFacilityItem
      >[2];
    }) =>
      marketplaceService.updateMyListingFacilityItem(
        listingId,
        args.itemId,
        args.payload,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.facilityItems(listingId),
      });
    },
  });
}

export function useDeleteFacilityItem(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      marketplaceService.deleteMyListingFacilityItem(listingId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.facilityItems(listingId),
      });
    },
  });
}

export function useUpdateAmenities(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amenities: AmenityKey[]) =>
      marketplaceService.updateMyListingAmenities(listingId, amenities),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.myListings(),
      });
    },
  });
}

// ==================== ORG PAYMENT GATEWAY CONFIG ====================

export interface OrgPaymentConfig {
  gateway: string;
  public_key: string;
  is_active: boolean;
}

export function useOrgPaymentConfigs(orgId: string | undefined) {
  return useQuery<OrgPaymentConfig[]>({
    queryKey: queryKeys.marketplace.orgPaymentConfigs(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const res = await marketplaceService.getPaymentConfigs(orgId);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!orgId,
  });
}

export function useUpsertPaymentConfig(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      gateway: string;
      public_key: string;
      secret_key: string;
      is_active?: boolean;
    }) => {
      if (!orgId) throw new Error("No organization selected");
      return marketplaceService.upsertPaymentConfig(orgId, data);
    },
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.marketplace.orgPaymentConfigs(orgId),
        });
    },
  });
}

export function useDeletePaymentConfig(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gateway: string) => {
      if (!orgId) throw new Error("No organization selected");
      return marketplaceService.deletePaymentConfig(orgId, gateway);
    },
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.marketplace.orgPaymentConfigs(orgId),
        });
    },
  });
}

// ==================== MY LISTING MUTATIONS ====================

export function useUpdateMyListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof marketplaceService.updateMyListing>[0]) =>
      marketplaceService.updateMyListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.myListing(),
      });
    },
  });
}

export function usePublishMyListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) =>
      publish
        ? marketplaceService.publishMyListing()
        : marketplaceService.unpublishMyListing(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.myListing(),
      });
    },
  });
}

export function useCreateMyListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof marketplaceService.createMyListing>[0]) =>
      marketplaceService.createMyListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.myListing(),
      });
    },
  });
}

// ==================== ORG LISTING MUTATIONS ====================
// The org listing is keyed by organization_id (authoritative for gyms),
// distinct from the professional_id-scoped "my listing" above.

export function useCreateOrgListing(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof marketplaceService.createOrgListing>[1]) =>
      marketplaceService.createOrgListing(orgId!, data),
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.marketplace.orgListing(orgId),
        });
    },
  });
}

export function useUpdateOrgListing(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof marketplaceService.updateOrgListing>[1]) =>
      marketplaceService.updateOrgListing(orgId!, data),
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.marketplace.orgListing(orgId),
        });
    },
  });
}

export function usePublishOrgListing(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (publish: boolean) =>
      publish
        ? marketplaceService.publishOrgListing(orgId!)
        : marketplaceService.unpublishOrgListing(orgId!),
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.marketplace.orgListing(orgId),
        });
    },
  });
}

// ==================== ORG MEMBERSHIP PLAN MUTATIONS ====================

function useInvalidateOrgPlans(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return () => {
    if (orgId)
      void queryClient.invalidateQueries({
        queryKey: queryKeys.marketplace.orgMembershipPlans(orgId),
      });
  };
}

export function useCreateOrgMembershipPlan(orgId: string | undefined) {
  const invalidate = useInvalidateOrgPlans(orgId);
  return useMutation({
    mutationFn: (
      data: Parameters<typeof marketplaceService.createOrgMembershipPlan>[1],
    ) => {
      if (!orgId) throw new Error("No organization selected");
      return marketplaceService.createOrgMembershipPlan(orgId, data);
    },
    onSuccess: invalidate,
  });
}

export function useUpdateOrgMembershipPlan(orgId: string | undefined) {
  const invalidate = useInvalidateOrgPlans(orgId);
  return useMutation({
    mutationFn: ({
      planId,
      data,
    }: {
      planId: string;
      data: Parameters<typeof marketplaceService.updateOrgMembershipPlan>[2];
    }) => {
      if (!orgId) throw new Error("No organization selected");
      return marketplaceService.updateOrgMembershipPlan(orgId, planId, data);
    },
    onSuccess: invalidate,
  });
}

export function useSetOrgMembershipPlanActive(orgId: string | undefined) {
  const invalidate = useInvalidateOrgPlans(orgId);
  return useMutation({
    mutationFn: ({ planId, active }: { planId: string; active: boolean }) => {
      if (!orgId) throw new Error("No organization selected");
      return active
        ? marketplaceService.activateOrgMembershipPlan(orgId, planId)
        : marketplaceService.deactivateOrgMembershipPlan(orgId, planId);
    },
    onSuccess: invalidate,
  });
}

export function useDeleteOrgMembershipPlan(orgId: string | undefined) {
  const invalidate = useInvalidateOrgPlans(orgId);
  return useMutation({
    mutationFn: (planId: string) => {
      if (!orgId) throw new Error("No organization selected");
      return marketplaceService.deleteOrgMembershipPlan(orgId, planId);
    },
    onSuccess: invalidate,
  });
}
