import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { searchService, type UnifiedSearchResult } from "@/lib/api/search";

export function useUnifiedSearch(
  params: { q?: string; limit?: number },
  enabled = true,
) {
  return useQuery<UnifiedSearchResult | null>({
    queryKey: queryKeys.search.unified(params),
    queryFn: async () => {
      try {
        const res = await searchService.unifiedSearch(params);
        return res.success && res.data ? res.data : null;
      } catch {
        return null;
      }
    },
    enabled,
    retry: false,
    staleTime: 15_000,
  });
}
