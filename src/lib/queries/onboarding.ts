import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { onboardingService, type OnboardingStatus } from "@/lib/api/onboarding";

/**
 * The signed-in user's onboarding status, including the server-side (and thus
 * cross-device) walkthrough dismissal flag `is_dismissed`. Returns null when
 * the request fails, so callers treat "unknown" as "not dismissed" and err
 * toward showing setup help rather than hiding it.
 */
export function useOnboardingStatus(enabled = true) {
  return useQuery<OnboardingStatus | null>({
    queryKey: queryKeys.onboarding.status(),
    queryFn: async () => {
      const res = await onboardingService.getStatus();
      return res.success && res.data ? res.data : null;
    },
    enabled,
  });
}
