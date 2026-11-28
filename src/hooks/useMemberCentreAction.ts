"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { centreActionFor, LOG_ACTION, type CentreAction } from "@/lib/member/shellV2";

/**
 * The centre action of the new member bar: Check in or Log. Read only while
 * `enabled` (the flag is on); a failed or pending read is Log, the safe one.
 */
export function useMemberCentreAction(enabled: boolean): CentreAction {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const query = useQuery<CentreAction>({
    queryKey: ["member-shell-v2", "centre", userId],
    enabled: enabled && !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await marketplaceService.getMyMembershipSubscriptions();
      if (!res.success) throw new Error(res.message || "Could not read memberships");
      return centreActionFor(res.data, Date.now());
    },
  });
  return query.data ?? LOG_ACTION;
}
