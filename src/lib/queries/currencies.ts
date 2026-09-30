import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  currenciesService,
  platformAsOrgPriceCurrency,
  type CurrencyUse,
  type OrgPriceCurrency,
  type PlatformCurrency,
} from "@/lib/api/currencies";
import {
  paymentGatewaysService,
  type PublicPaymentGateway,
} from "@/lib/api/paymentGateways";

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

/**
 * GET /payment-gateways: the gateways we run, and whether a provider may
 * connect their own keys for each. Same cache horizon as the currency list.
 */
export function usePaymentGateways(enabled = true) {
  return useQuery<PublicPaymentGateway[]>({
    queryKey: queryKeys.currencies.gateways(),
    queryFn: async () => {
      const res = await paymentGatewaysService.list();
      if (!res.success) throw new Error(res.message || "Could not load payment providers");
      return res.data ?? [];
    },
    staleTime: CURRENCIES_STALE_MS,
    enabled,
  });
}

/**
 * "Your Paystack account": how a picker marks a currency only the org's own
 * account can take. Named after the gateway providers can connect when there
 * is exactly one (GET /payment-gateways), else generic.
 */
export function providerAccountHint(gateways: readonly PublicPaymentGateway[] | undefined): string {
  const connectable = (gateways ?? []).filter((g) => g.provider_keys_supported);
  return connectable.length === 1 ? `Your ${connectable[0].label} account` : "Your own payment account";
}

/**
 * The currencies an org's MEMBERSHIP prices may use (plans, packages, the
 * org default currency): GET /marketplace/organizations/:id/price-currencies,
 * which adds the currencies verified on the org's own Paystack account to the
 * platform's. 1:1 session prices never use this (bookings are charged on the
 * platform account); they keep useCurrencies("price").
 *
 * Falls back to the platform list, every row on the platform route, when
 * there is no org or the org list can't be read (a staff role without
 * listing access, or an API without the endpoint), so a picker never goes
 * empty because of it.
 *
 * `data` is every row (selectable or not, for labels and saved values);
 * `providerHint` labels provider-route options.
 */
export function useOrgPriceCurrencies(orgId: string | null | undefined) {
  const org = useQuery<OrgPriceCurrency[]>({
    queryKey: queryKeys.currencies.org(orgId ?? ""),
    queryFn: async () => {
      const res = await currenciesService.listForOrg(orgId!);
      if (!res.success) throw new Error(res.message || "Could not load currencies");
      return res.data ?? [];
    },
    enabled: !!orgId,
    staleTime: 60_000,
    retry: false,
  });
  const fallback = !orgId || org.isError;
  const platform = useCurrencyList(fallback);
  const gateways = usePaymentGateways();
  const data = useMemo(() => {
    if (!fallback) return org.data;
    return platform.data?.map(platformAsOrgPriceCurrency);
  }, [fallback, org.data, platform.data]);
  return {
    data,
    isLoading: fallback ? platform.isLoading : org.isLoading,
    isError: fallback && platform.isError,
    providerHint: providerAccountHint(gateways.data),
  };
}
