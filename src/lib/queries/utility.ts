import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  utilityService,
  type CountryItem,
} from "@/lib/api/utility";

export function useCountries(enabled = true) {
  return useQuery<CountryItem[]>({
    queryKey: queryKeys.utility.countries(),
    queryFn: async () => {
      const res = await utilityService.getCountries();
      return res.success && res.data ? res.data : [];
    },
    staleTime: 10 * 60_000, // Countries rarely change — cache for 10 minutes
    enabled,
  });
}
