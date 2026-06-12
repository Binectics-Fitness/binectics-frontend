import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import {
  notificationsService,
  type NotificationCategory,
  type NotificationPreferences,
  NotificationCategory as NotificationCategoryEnum,
  type NotificationItem,
  type NotificationUnreadCount,
  type PaginatedNotifications,
} from "@/lib/api/notifications";

export function useNotifications(
  params: {
    page: number;
    limit: number;
    is_read?: boolean;
    category?: NotificationCategory;
  },
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
    // User-perceived freshness; mark-as-read mutations invalidate this key.
    staleTime: 30_000,
  });
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery<NotificationUnreadCount | null>({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: async () => {
      try {
        const res = await notificationsService.getUnreadCount();
        return res.success && res.data ? res.data : null;
      } catch {
        return null;
      }
    },
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useNotificationPreferences(enabled = true) {
  return useQuery<NotificationPreferences | null>({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: async () => {
      try {
        const res = await notificationsService.getPreferences();
        return res.success && res.data ? res.data : null;
      } catch {
        return null;
      }
    },
    enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<NotificationPreferences>) =>
      notificationsService.updatePreferences(payload),
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.setQueryData(queryKeys.notifications.preferences(), res.data);
      }
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.preferences(),
      });
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onMutate: async (notificationId: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const unreadKey = queryKeys.notifications.unreadCount();
      const previousUnread = queryClient.getQueryData<NotificationUnreadCount | null>(unreadKey);
      const previousLists = queryClient.getQueriesData<PaginatedNotifications | null>({
        queryKey: queryKeys.notifications.all,
      });

      let target: NotificationItem | null = null;

      for (const [key, data] of previousLists) {
        if (!data?.notifications?.length) continue;
        const hit = data.notifications.find((n) => n.id === notificationId);
        if (hit) {
          target = hit;
          break;
        }
      }

      for (const [key, data] of previousLists) {
        if (!data?.notifications?.length) continue;
        queryClient.setQueryData<PaginatedNotifications | null>(key, {
          ...data,
          notifications: data.notifications.map((item) =>
            item.id === notificationId && !item.isRead
              ? { ...item, isRead: true }
              : item,
          ),
        });
      }

      if (previousUnread && target && !target.isRead) {
        const categoryKey = target.category;
        queryClient.setQueryData<NotificationUnreadCount | null>(unreadKey, {
          ...previousUnread,
          count: Math.max(0, previousUnread.count - 1),
          by_category: {
            ...previousUnread.by_category,
            [categoryKey]: Math.max(0, previousUnread.by_category[categoryKey] - 1),
          },
        });
      }

      return { previousUnread, previousLists };
    },
    onError: (_error, _notificationId, context) => {
      if (!context) return;

      if (context.previousUnread !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousUnread);
      }

      for (const [key, data] of context.previousLists ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications.all });

      const unreadKey = queryKeys.notifications.unreadCount();
      const previousUnread = queryClient.getQueryData<NotificationUnreadCount | null>(unreadKey);
      const previousLists = queryClient.getQueriesData<PaginatedNotifications | null>({
        queryKey: queryKeys.notifications.all,
      });

      for (const [key, data] of previousLists) {
        if (!data?.notifications?.length) continue;
        queryClient.setQueryData<PaginatedNotifications | null>(key, {
          ...data,
          notifications: data.notifications.map((item) => ({ ...item, isRead: true })),
        });
      }

      if (previousUnread) {
        queryClient.setQueryData<NotificationUnreadCount | null>(unreadKey, {
          count: 0,
          by_category: {
            [NotificationCategoryEnum.BOOKING]: 0,
            [NotificationCategoryEnum.PAYMENT]: 0,
            [NotificationCategoryEnum.MENTION]: 0,
            [NotificationCategoryEnum.SYSTEM]: 0,
          },
        });
      }

      return { previousUnread, previousLists };
    },
    onError: (_error, _variables, context) => {
      if (!context) return;

      if (context.previousUnread !== undefined) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), context.previousUnread);
      }

      for (const [key, data] of context.previousLists ?? []) {
        queryClient.setQueryData(key, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.notifications.all,
      });
    },
  });
}
