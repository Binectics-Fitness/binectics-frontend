"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsService } from "@/lib/api/notifications";
import { API_BASE_URL } from "@/lib/api/client";
import { tokenStorage } from "@/lib/utils/storage";

/** Fallback polling interval when SSE is unavailable */
const POLL_INTERVAL_MS = 60_000;

export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** One-shot REST fetch for the current unread count */
  const refresh = useCallback(async () => {
    try {
      const res = await notificationsService.getUnreadCount();
      if (res.success && res.data) {
        setCount(res.data.count);
      }
    } catch {
      // Silently fail — the bell just won't update
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Always fetch initial count via REST
    refresh();

    const token = tokenStorage.get();
    if (!token) return;

    // Attempt SSE connection
    const url = `${API_BASE_URL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      if (!mounted) return;
      // Each SSE event means a new notification arrived — increment count
      try {
        // The server pushes { type, title, message }
        JSON.parse(event.data);
        setCount((prev) => prev + 1);
      } catch {
        // Malformed event, ignore
      }
    };

    es.onerror = () => {
      // SSE failed — fall back to polling
      es.close();
      eventSourceRef.current = null;
      if (!mounted) return;

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
  }, [refresh]);

  return { count, isLoading, refresh };
}
