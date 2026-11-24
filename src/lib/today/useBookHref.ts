"use client";

import { useQuery } from "@tanstack/react-query";
import { consultationsService } from "@/lib/api/consultations";
import { queryKeys } from "@/lib/queries/keys";

/** Where web books a session with a provider: their listing's booking page. */
export const bookHref = (listingId: string) => `/booking?listingId=${encodeURIComponent(listingId)}`;

/**
 * "Book a session" for a coach, or null when it should hide (06 build spec,
 * finding 12): web books through the coach's listing, so no listing means no
 * Book; a coach with no session types has nothing to book. A read that is
 * still running or failed keeps Book: the booking page says what it can.
 */
export function useBookHref(coach: { userId?: string; listingId?: string | null } | null): string | null {
  const userId = coach?.userId ?? null;
  const listingId = coach?.listingId ?? null;
  const types = useQuery({
    queryKey: [...queryKeys.consultations.types(), "provider", userId ?? ""],
    enabled: !!userId && !!listingId,
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const res = await consultationsService.getTypes({ providerId: userId as string });
      if (!res.success) throw new Error(res.message || "Couldn't read session types");
      return res.data ?? [];
    },
  });
  if (!listingId) return null;
  if (types.isSuccess && types.data.length === 0) return null;
  return bookHref(listingId);
}
