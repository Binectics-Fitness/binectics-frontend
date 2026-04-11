"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsService } from "@/lib/api/notifications";

const POLL_INTERVAL_MS = 60_000;

export function useNotificationCount() {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

    const poll = async () => {
      if (!mounted) return;
      await refresh();
    };

    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  return { count, isLoading, refresh };
}
