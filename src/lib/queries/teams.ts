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
