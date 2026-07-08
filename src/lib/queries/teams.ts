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

// ==================== ORG NOTIFICATION SETTINGS ====================

export function useOrgNotificationSettings(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.orgNotificationSettings(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return null;
      const res = await teamsService.getOrgNotificationSettings(orgId);
      return res.success && res.data ? res.data : null;
    },
    enabled: !!orgId,
  });
}

export function useUpdateOrgNotificationSettings(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Record<string, boolean>>) => {
      if (!orgId) throw new Error("No organization selected");
      return teamsService.updateOrgNotificationSettings(orgId, data);
    },
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.orgNotificationSettings(orgId),
        });
    },
  });
}

// ==================== ROLES ====================

export function useOrgRoles(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.roles(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const res = await teamsService.getRoles(orgId);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!orgId,
  });
}

// ==================== API KEYS ====================

export function useOrgApiKeys(orgId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.teams.apiKeys(orgId ?? ""),
    queryFn: async () => {
      if (!orgId) return [];
      const res = await teamsService.getApiKeys(orgId);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!orgId,
  });
}

export function useCreateApiKey(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof teamsService.createApiKey>[1]) => {
      if (!orgId) throw new Error("No organization selected");
      return teamsService.createApiKey(orgId, data);
    },
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.apiKeys(orgId),
        });
    },
  });
}

export function useRevokeApiKey(orgId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) => {
      if (!orgId) throw new Error("No organization selected");
      return teamsService.revokeApiKey(orgId, keyId);
    },
    onSuccess: () => {
      if (orgId)
        queryClient.invalidateQueries({
          queryKey: queryKeys.teams.apiKeys(orgId),
        });
    },
  });
}
