"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { featureFlagKeys, featureFlagsService, type EffectiveFeatureFlags } from "@/lib/api/featureFlags";
import { effectiveFlag } from "@/lib/featureFlags/helpers";

/** The server re-reads flags every 15s; a minute is plenty for hiding UI. */
const STALE_MS = 60_000;

/**
 * The signed-in user's effective feature flags, for showing or hiding UI.
 * The API still enforces every flag itself; this never grants anything.
 * While loading, signed out, or on error, every flag reads as off.
 *
 * @example
 *   const { isEnabled } = useFeatureFlags();
 *   if (isEnabled("member_recurring_billing", currentOrg?._id)) { ... }
 */
export function useFeatureFlags() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const query = useQuery<EffectiveFeatureFlags>({
    queryKey: featureFlagKeys.me(userId),
    enabled: !!user,
    staleTime: STALE_MS,
    queryFn: async () => {
      const res = await featureFlagsService.me();
      if (!res.success || !res.data) throw new Error(res.message || "Couldn't load feature flags");
      return res.data;
    },
  });
  const data = user ? query.data : undefined;
  const isEnabled = useCallback(
    (key: string, organizationId?: string | null) => effectiveFlag(data, key, organizationId),
    [data],
  );
  return { isEnabled, data, isLoading: !!user && query.isLoading };
}

/** One flag; see {@link useFeatureFlags}. */
export function useFeatureFlag(key: string, organizationId?: string | null): boolean {
  return useFeatureFlags().isEnabled(key, organizationId);
}
