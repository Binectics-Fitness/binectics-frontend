import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgClosureService } from "@/lib/api/orgClosure";
import { queryKeys } from "./keys";
import type { ClosedOrganization } from "@/lib/orgClosure/closure";

export const closedOrganizationsKey = () => [...queryKeys.teams.all, "closedOrganizations"] as const;

/** The caller's own closed gyms. A failed load is an error, not an empty list. */
export function useClosedOrganizations(enabled = true) {
  return useQuery<ClosedOrganization[]>({
    queryKey: closedOrganizationsKey(),
    queryFn: async () => {
      const res = await orgClosureService.listClosed();
      if (!res.success) throw new Error(res.message || "Could not load your closed gyms");
      return res.data ?? [];
    },
    enabled,
    retry: false,
    // Asked on every gym dashboard page for owners: cache it. Closing and
    // reopening invalidate it.
    staleTime: 60_000,
  });
}

function useInvalidateOrgLists() {
  const qc = useQueryClient();
  return () => {
    void qc.invalidateQueries({ queryKey: queryKeys.teams.all });
  };
}

export function useCloseOrganization() {
  const invalidate = useInvalidateOrgLists();
  return useMutation({
    mutationFn: ({ orgId, confirm, reason }: { orgId: string; confirm: string; reason?: string }) =>
      orgClosureService.close(orgId, { confirm, ...(reason ? { reason } : {}) }),
    onSuccess: (res) => {
      if (res.success) invalidate();
    },
  });
}

export function useReopenOrganization() {
  const invalidate = useInvalidateOrgLists();
  return useMutation({
    mutationFn: (orgId: string) => orgClosureService.reopen(orgId),
    onSuccess: (res) => {
      if (res.success) invalidate();
    },
  });
}
