"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationsService } from "@/lib/api/notifications";
import { NotificationCategory } from "@/lib/api/notifications";
import { API_BASE_URL } from "@/lib/api/client";
import { useUnreadNotificationCount } from "@/lib/queries/notifications";
import { queryKeys } from "@/lib/queries/keys";
import { useAuth } from "@/contexts/AuthContext";

/** Fallback polling interval when SSE is unavailable */
const POLL_INTERVAL_MS = 60_000;

function emptyUnreadCount() {
  return {
    count: 0,
    by_category: {
      [NotificationCategory.BOOKING]: 0,
      [NotificationCategory.PAYMENT]: 0,
      [NotificationCategory.MENTION]: 0,
      [NotificationCategory.SYSTEM]: 0,
    },
  };
}

function coerceCategory(value: unknown): NotificationCategory {
  if (value === NotificationCategory.BOOKING) return NotificationCategory.BOOKING;
  if (value === NotificationCategory.PAYMENT) return NotificationCategory.PAYMENT;
  if (value === NotificationCategory.MENTION) return NotificationCategory.MENTION;
  return NotificationCategory.SYSTEM;
}

export function useNotificationCount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Only query/stream when signed in — otherwise every mount on a public page
  // fires an unauthenticated request that 401s.
  const isAuthenticated = user !== null;
  const unreadQuery = useUnreadNotificationCount(isAuthenticated);
  const eventSourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** One-shot REST fetch for the current unread count */
  const refresh = useCallback(async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      if (res.success && res.data) {
        queryClient.setQueryData(queryKeys.notifications.unreadCount(), res.data);
      }
    } catch {
      // Silently fail — the bell just won't update
    }
  }, [queryClient]);

  useEffect(() => {
    let mounted = true;

    if (!isAuthenticated) return;

    // Fetch initial count via REST (only when authenticated)
    refresh();

    // Attempt SSE connection
    const es = new EventSource(`${API_BASE_URL}/notifications/stream`, { withCredentials: true });
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (!mounted) return;
      try {
        const payload = JSON.parse(event.data) as { category?: unknown };
        const category = coerceCategory(payload.category);

        queryClient.setQueryData(queryKeys.notifications.unreadCount(), (prev: ReturnType<typeof emptyUnreadCount> | null | undefined) => {
          const current = prev ?? emptyUnreadCount();
          return {
            count: current.count + 1,
            by_category: {
              ...current.by_category,
              [category]: (current.by_category[category] ?? 0) + 1,
            },
          };
        });
      } catch {
        // Malformed event, ignore
      }
    };

    es.onerror = () => {
      // SSE failed — fall back to polling. `onerror` can fire more than once;
      // guard so we don't leak a second (or third) parallel interval.
      es.close();
      eventSourceRef.current = null;
      if (!mounted || intervalRef.current) return;

      intervalRef.current = setInterval(() => {
        if (mounted) refresh();
      }, POLL_INTERVAL_MS);
    };

    return () => {
      mounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [queryClient, refresh, isAuthenticated]);

  return {
    count: unreadQuery.data?.count ?? 0,
    isLoading: unreadQuery.isLoading,
    refresh,
  };
}
