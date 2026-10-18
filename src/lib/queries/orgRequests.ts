import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  marketplaceService,
  type OrgRequestListStatus,
  type OrgRequestsPage,
} from "@/lib/api/marketplace";

/** Requests per page on the gym's Requests page. */
export const ORG_REQUESTS_PAGE_SIZE = 20;

/**
 * A gym's incoming connection requests, pending or answered, a page at a
 * time. A failure throws rather than resolving to an empty list: "no
 * requests" and "couldn't load them" must never look the same.
 */
export function useOrgListingRequests(
  orgId: string | undefined,
  status: OrgRequestListStatus,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.marketplace.orgRequests(orgId ?? "", status),
    queryFn: async ({ pageParam }): Promise<OrgRequestsPage> => {
      const res = await marketplaceService.getOrgListingRequests(orgId!, {
        status,
        limit: ORG_REQUESTS_PAGE_SIZE,
        cursor: pageParam || undefined,
      });
      if (!res.success || !res.data) {
        throw new Error(res.message ?? "Couldn't load the gym's requests");
      }
      return res.data;
    },
    initialPageParam: "",
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    enabled: enabled && !!orgId,
  });
}

/**
 * How many requests wait on the gym, for the nav badge. Only asked for
 * when the viewer may see requests (the API refuses everyone else).
 */
export function useOrgPendingRequestCount(orgId: string | undefined, enabled = true): number {
  const { data } = useQuery({
    queryKey: queryKeys.marketplace.orgPendingRequestCount(orgId ?? ""),
    queryFn: async () => {
      const res = await marketplaceService.getOrgPendingRequestCount(orgId!);
      return res.success && res.data ? res.data.count : 0;
    },
    enabled: enabled && !!orgId,
    // Read on every gym page; no need to refetch on each navigation.
    staleTime: 60_000,
  });
  return data ?? 0;
}

/** Accepts or declines a request on the gym's behalf. */
export function useRespondToOrgRequest(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, accept, note }: { requestId: string; accept: boolean; note?: string }) => {
      const res = accept
        ? await marketplaceService.acceptOrgRequest(orgId!, requestId, note)
        : await marketplaceService.rejectOrgRequest(orgId!, requestId, note);
      if (!res.success) throw new Error(res.message ?? "Couldn't update this request");
      return res;
    },
    // Settled, not success: "already responded to" means the list on screen
    // is stale either way. Returned, so the card stays busy until the fresh
    // lists are in and a second tap can't send a second answer.
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.orgRequestsAll(orgId ?? "") }),
  });
}
