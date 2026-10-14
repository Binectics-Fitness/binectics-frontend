import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { refundsService } from "@/lib/api/refunds";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { ownsWorkspace } from "@/lib/workspaces";

/**
 * How many refund items are waiting on the provider: "Refund suggested"
 * prompts still open, plus open disputes. Drives the Refunds nav badge.
 *
 * The refunds API is owner-only, so the count is only asked for when the
 * signed-in person owns the current workspace (a gym's staff trainer works in
 * the gym's and would only be refused). Any failure counts as zero: a badge
 * is a hint, never an error.
 */
export function useRefundsAttentionCount(enabled = true): number {
  const { user } = useAuth();
  const orgs = useOptionalOrganization();
  const org = orgs?.currentOrg ?? null;
  const owns = ownsWorkspace(org, user?.id);
  const orgId = org?._id ?? "";
  const { data } = useQuery({
    queryKey: queryKeys.refunds.attentionCount(orgId),
    queryFn: async () => {
      const [prompts, disputes] = await Promise.all([
        refundsService.orgRefunds(orgId, { provider_prompt: "open" }),
        refundsService.orgDisputes(orgId, { state: "open" }),
      ]);
      const total = (res: { success: boolean; data?: { total?: number } }) =>
        res.success && typeof res.data?.total === "number" ? res.data.total : 0;
      return total(prompts) + total(disputes);
    },
    enabled: enabled && owns && Boolean(orgId),
    staleTime: 60_000,
  });
  return enabled && owns ? (data ?? 0) : 0;
}
