import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  payoutAccountService,
  type PayoutAccountInput,
  type PayoutAccountStatus,
  type PayoutBankList,
} from "@/lib/api/payoutAccount";

/**
 * The workspace's payout account and whether payouts can run. Owner only on
 * the API, so callers pass `enabled` false for anyone else.
 */
export function usePayoutAccount(organizationId: string | undefined, enabled = true) {
  return useQuery<PayoutAccountStatus>({
    queryKey: queryKeys.payoutAccount.status(organizationId ?? ""),
    queryFn: async () => {
      const res = await payoutAccountService.getStatus(organizationId!);
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load your payout account.");
      return res.data;
    },
    enabled: enabled && !!organizationId,
  });
}

/** Paystack's banks for the workspace's currency. Never a hardcoded list. */
export function usePayoutBanks(organizationId: string | undefined, enabled = true) {
  return useQuery<PayoutBankList>({
    queryKey: queryKeys.payoutAccount.banks(organizationId ?? ""),
    queryFn: async () => {
      const res = await payoutAccountService.listBanks(organizationId!);
      // The message matters here: a workspace with no currency is told to
      // set one in Settings.
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load the list of banks.");
      return res.data;
    },
    enabled: enabled && !!organizationId,
    // The list changes rarely; don't refetch it while the form is open.
    staleTime: 60 * 60 * 1000,
  });
}

/**
 * Looks an account up at Paystack. The server stores nothing. On the client
 * the mutation's variables hold the full account number, so it is never kept
 * in the query cache (gcTime 0) and the form calls reset() when it closes.
 */
export function useResolvePayoutAccount(organizationId: string | undefined) {
  return useMutation({
    mutationFn: (input: PayoutAccountInput) => payoutAccountService.resolve(organizationId!, input),
    gcTime: 0,
  });
}

/** Saves the account. Same rule as resolve: the variables carry the full number (gcTime 0, reset on close). */
export function useSavePayoutAccount(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PayoutAccountInput) => payoutAccountService.save(organizationId!, input),
    gcTime: 0,
    onSuccess: (res) => {
      if (res.success && res.data && organizationId) {
        queryClient.setQueryData(queryKeys.payoutAccount.status(organizationId), res.data);
      }
    },
  });
}

export function useRemovePayoutAccount(organizationId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => payoutAccountService.remove(organizationId!),
    onSuccess: (res) => {
      if (res.success && organizationId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.payoutAccount.status(organizationId) });
      }
    },
  });
}
