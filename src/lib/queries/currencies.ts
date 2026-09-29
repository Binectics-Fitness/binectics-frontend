import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  currenciesService,
  type CurrencyUse,
  type PlatformCurrency,
} from "@/lib/api/currencies";

/**
 * The list changes only when an admin flips a currency, and the API caches
 * it for a minute itself; ten minutes here keeps pickers instant without
 * holding a stale answer for long. A save the server refuses still says why.
 */
const CURRENCIES_STALE_MS = 10 * 60_000;

/** Every platform-enabled currency (GET /currencies), unfiltered. */
export function useCurrencyList(enabled = true) {
  return useQuery<PlatformCurrency[]>({
    queryKey: queryKeys.currencies.list(),
    queryFn: async () => {
      const res = await currenciesService.list();
      if (!res.success) throw new Error(res.message || "Could not load currencies");
      return res.data ?? [];
    },
    staleTime: CURRENCIES_STALE_MS,
    enabled,
  });
}

/**
 * The currencies a picker may offer. With `use`, only those selectable for
 * it right now ("price" for any price or org default, "charge_card" /
 * "charge_transfer" for paying); without, every enabled currency.
 *
 * `data` is the filtered list; `all` is the unfiltered one, for formatting
 * and for suggesting.
 */
export function useCurrencies(use?: CurrencyUse, enabled = true) {
  const query = useCurrencyList(enabled);
  const all = query.data;
  const data = useMemo(
    () => (all ? (use ? all.filter((c) => c.selectable[use]) : all) : undefined),
    [all, use],
  );
  return { ...query, data, all };
}
