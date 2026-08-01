"use client";

import { useCallback, useEffect } from "react";
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

// ── Shared notification stream ───────────────────────────────────────────────
// The bell renders more than once at a time: every shell keeps a desktop and a
// mobile header in the DOM simultaneously (CSS hides one), and the sidebar has
// its own bell. One EventSource per hook instance would open a stream per bell
// and eat the browser's per-host connection budget, so the stream is a
// refcounted module-level singleton — the first subscriber opens it, the last
// one closes it.

type StreamEvent =
  | { type: "increment"; category: NotificationCategory }
  | { type: "refresh" };
type StreamListener = (event: StreamEvent) => void;

const listeners = new Set<StreamListener>();
let eventSource: EventSource | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

function emit(event: StreamEvent) {
  // Exactly one listener applies the update. The unread count lives in a single
  // shared query cache entry, so running the handler once per mounted bell
  // would multiply every increment by the number of bells on screen. The Set is
  // insertion-ordered, so if the primary unmounts the next one takes over.
  const primary = listeners.values().next().value;
  primary?.(event);
}

function startPolling() {
  if (pollTimer) return;
  pollTimer = setInterval(() => emit({ type: "refresh" }), POLL_INTERVAL_MS);
}

function openStream() {
  if (eventSource) return;
  const es = new EventSource(`${API_BASE_URL}/notifications/stream`, {
    withCredentials: true,
  });
  eventSource = es;

  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { category?: unknown };
      emit({ type: "increment", category: coerceCategory(payload.category) });
    } catch {
      // Malformed event, ignore
    }
  };

  es.onerror = () => {
    // SSE failed — fall back to polling. `onerror` can fire more than once;
    // clearing the ref and guarding startPolling keeps this idempotent.
    es.close();
    if (eventSource === es) eventSource = null;
    if (listeners.size > 0) startPolling();
  };
}

function closeStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function subscribeToStream(listener: StreamListener): () => void {
  listeners.add(listener);
  if (listeners.size === 1) openStream();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) closeStream();
  };
}

export function useNotificationCount() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  // Only query/stream when signed in — otherwise every mount on a public page
  // fires an unauthenticated request that 401s.
  const isAuthenticated = user !== null;
  const unreadQuery = useUnreadNotificationCount(isAuthenticated);

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
    if (!isAuthenticated) return;

    // Fetch initial count via REST (only when authenticated)
    void refresh();

    return subscribeToStream((event) => {
      if (event.type === "refresh") {
        void refresh();
        return;
      }

      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(),
        (prev: ReturnType<typeof emptyUnreadCount> | null | undefined) => {
          const current = prev ?? emptyUnreadCount();
          return {
            count: current.count + 1,
            by_category: {
              ...current.by_category,
              [event.category]: (current.by_category[event.category] ?? 0) + 1,
            },
          };
        },
      );
    });
  }, [queryClient, refresh, isAuthenticated]);

  return {
    count: unreadQuery.data?.count ?? 0,
    isLoading: unreadQuery.isLoading,
    refresh,
  };
}
