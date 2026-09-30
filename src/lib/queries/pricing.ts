import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  providerBillingApi,
  type PlanAudience,
  type PublicProviderPlanOption,
} from "@/lib/api/providerBilling";
import { sortPlans } from "@/lib/pricing/publicPlans";

/**
 * The public plan catalogue for a visitor's country and provider type. The
 * API caches it for a minute, so this does too.
 */
export function usePublicPlans(
  country: string | null | undefined,
  audience: PlanAudience,
  enabled = true,
) {
  const code = (country ?? "").toUpperCase();
  return useQuery<PublicProviderPlanOption[]>({
    queryKey: queryKeys.pricing.publicPlans(code, audience),
    queryFn: async () => {
      const res = await providerBillingApi.listPublicPlans({ country: code, audience });
      if (!res.success) throw new Error(res.message || "Could not load plans");
      return sortPlans(Array.isArray(res.data) ? res.data : []);
    },
    staleTime: 60_000,
    retry: 1,
    enabled,
  });
}
