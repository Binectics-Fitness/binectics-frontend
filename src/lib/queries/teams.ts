import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { teamsService, type Organization } from "@/lib/api/teams";

export function useMyOrganizations(enabled = true) {
  return useQuery<Organization[]>({
    queryKey: queryKeys.teams.myOrganizations(),
    queryFn: async () => {
      const res = await teamsService.getMyOrganizations();
      return res.success && res.data ? res.data : [];
    },
    enabled,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof teamsService.createOrganization>[0]) =>
      teamsService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.myOrganizations(),
      });
    },
  });
}

/** Full detail for a single organization — the source of truth for the
 * settings form (the list endpoint may omit newer scalar fields). */
export function useOrganizationDetails(orgId: string | undefined) {
  return useQuery<Organization | null>({
    queryKey: queryKeys.teams.organization(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return null;
      const res = await teamsService.getOrganization(orgId);
      return res.success && res.data ? res.data : null;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orgId,
      data,
    }: {
      orgId: string;
      data: Parameters<typeof teamsService.updateOrganization>[1];
    }) => teamsService.updateOrganization(orgId, data),
    onSuccess: (_res, { orgId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.organization(orgId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.teams.myOrganizations(),
      });
    },
  });
}
