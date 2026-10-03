import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { marketplaceService, type SavedListingCard } from "@/lib/api/marketplace";

/**
 * Saved providers. The ids query is shared by every save toggle on a page
 * (one request however many cards there are); the list query backs
 * /dashboard/saved-providers.
 */

export function useSavedListingIds(enabled = true) {
  return useQuery<string[]>({
    queryKey: queryKeys.marketplace.savedIds(),
    queryFn: async () => {
      const res = await marketplaceService.getSavedListingIds();
      if (!res.success) throw new Error(res.message || "Couldn't load saved providers");
      return res.data ?? [];
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSavedListings(enabled = true) {
  return useQuery<SavedListingCard[]>({
    queryKey: queryKeys.marketplace.saved(),
    queryFn: async () => {
      const res = await marketplaceService.getSavedListings();
      if (!res.success) throw new Error(res.message || "Couldn't load saved providers");
      return res.data ?? [];
    },
    enabled,
    retry: false,
  });
}

/**
 * Save or unsave a listing. The saved state flips at once (optimistic) and
 * flips back if the API refuses; the saved list is refetched either way.
 */
export function useToggleSavedListing() {
  const queryClient = useQueryClient();
  const idsKey = queryKeys.marketplace.savedIds();
  const listKey = queryKeys.marketplace.saved();

  return useMutation({
    mutationFn: async ({ listingId, save }: { listingId: string; save: boolean }) => {
      const res = save
        ? await marketplaceService.saveListing(listingId)
        : await marketplaceService.unsaveListing(listingId);
      if (!res.success) throw new Error(res.message || (save ? "Couldn't save" : "Couldn't remove"));
      return res.data;
    },
    onMutate: async ({ listingId, save }) => {
      await queryClient.cancelQueries({ queryKey: idsKey });
      await queryClient.cancelQueries({ queryKey: listKey });
      const prevIds = queryClient.getQueryData<string[]>(idsKey);
      const prevList = queryClient.getQueryData<SavedListingCard[]>(listKey);
      queryClient.setQueryData<string[]>(idsKey, (ids = []) =>
        save ? (ids.includes(listingId) ? ids : [listingId, ...ids]) : ids.filter((id) => id !== listingId),
      );
      if (!save && prevList) {
        queryClient.setQueryData<SavedListingCard[]>(
          listKey,
          prevList.filter((l) => l._id !== listingId),
        );
      }
      return { prevIds, prevList };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevIds !== undefined) queryClient.setQueryData(idsKey, ctx.prevIds);
      if (ctx?.prevList !== undefined) queryClient.setQueryData(listKey, ctx.prevList);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: idsKey });
      void queryClient.invalidateQueries({ queryKey: listKey });
    },
  });
}
