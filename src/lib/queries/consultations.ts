import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  consultationsService,
  type ConsultationBooking,
} from "@/lib/api/consultations";

export function useProviderBookings(
  params?: { from?: string; to?: string },
  enabled = true,
) {
  const qParams: Record<string, string> = {};
  if (params?.from) qParams.from = params.from;
  if (params?.to) qParams.to = params.to;

  return useQuery<ConsultationBooking[]>({
    queryKey: queryKeys.consultations.providerBookings(qParams),
    queryFn: async () => {
      const res = await consultationsService.getProviderBookings(qParams);
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useMyBookings(filter?: "upcoming" | "past", enabled = true) {
  return useQuery<ConsultationBooking[]>({
    queryKey: queryKeys.consultations.myBookings(
      filter ? { filter } : undefined,
    ),
    queryFn: async () => {
      const res = await consultationsService.getMyBookings(filter);
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}
