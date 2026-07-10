import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authService, type PrivacyPreferences } from "@/lib/api/auth";
import { queryKeys } from "./keys";

export function usePrivacyPreferences() {
  return useQuery<PrivacyPreferences | null>({
    queryKey: queryKeys.privacy.preferences(),
    queryFn: async () => {
      const res = await authService.getPrivacyPreferences();
      return res.success && res.data ? res.data : null;
    },
    retry: false,
  });
}

export function useUpdatePrivacyPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<PrivacyPreferences>) =>
      authService.updatePrivacyPreferences(payload),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.setQueryData(queryKeys.privacy.preferences(), res.data);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.privacy.preferences(),
      });
    },
  });
}
