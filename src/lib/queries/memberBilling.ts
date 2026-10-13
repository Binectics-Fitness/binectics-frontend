import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  memberBillingService,
  type PaymentMethodView,
} from "@/lib/api/memberBilling";

/** The member's saved cards, grouped later by provider. */
export function useMyPaymentMethods(enabled = true) {
  return useQuery<PaymentMethodView[]>({
    queryKey: queryKeys.marketplace.paymentMethods(),
    queryFn: async () => {
      const res = await memberBillingService.listPaymentMethods();
      if (!res.success) throw new Error(res.message ?? "Couldn't load your cards.");
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled,
    retry: false,
  });
}

/**
 * Remove a card. Auto-renew stops on every membership it paid, so both the
 * cards and the memberships are read again from the server afterwards.
 */
export function useRemovePaymentMethod() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => memberBillingService.removePaymentMethod(id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.paymentMethods() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.marketplace.subscriptions() });
    },
  });
}
