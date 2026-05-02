import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  notificationsService,
  type PaginatedNotifications,
} from "@/lib/api/notifications";

export function useNotifications(
  params: { page: number; limit: number; is_read?: boolean },
  enabled = true,
) {
  return useQuery<PaginatedNotifications | null>({
    queryKey: queryKeys.notifications.list(params),
    queryFn: async () => {
      try {
        const res = await notificationsService.getNotifications(params);
        return res.success && res.data ? res.data : null;
      } catch {
        return null;
      }
    },
    enabled,
    retry: false,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
