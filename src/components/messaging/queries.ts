"use client";

/**
 * React Query surfaces for messaging: the inbox (page 1, polled), one thread
 * summary, and the unread total behind every shell's nav badge. Cadence per
 * CONTRACT §7: inbox 15 s, badge 30 s, both ±10% jitter, paused while the
 * tab is hidden (React Query skips interval refetches in the background),
 * refetched at once when it becomes visible again, and backed off on errors.
 */

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  messagingService,
  type ThreadSummary,
  type ThreadsPage,
  type UnreadCount,
} from "@/lib/api/messaging";

export const messagingKeys = {
  all: ["messaging"] as const,
  inbox: (userId: string) => ["messaging", userId, "inbox"] as const,
  thread: (userId: string, threadId: string) => ["messaging", userId, "thread", threadId] as const,
  unread: (userId: string) => ["messaging", userId, "unread"] as const,
};

const INBOX_POLL_MS = 15_000;
const UNREAD_POLL_MS = 30_000;
const BACKOFF_MS = [5_000, 10_000, 20_000, 40_000, 60_000];

export function jitter(ms: number): number {
  return Math.round(ms * (0.9 + Math.random() * 0.2));
}

/** Next poll delay: the base cadence, or the error back-off while failing. */
export function pollDelay(base: number, failures: number): number {
  if (failures <= 0) return jitter(base);
  return BACKOFF_MS[Math.min(failures, BACKOFF_MS.length) - 1];
}

class MessagingRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
  ) {
    super(message);
  }
}

export { MessagingRequestError };

export function useInbox(enabled = true) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useQuery<ThreadsPage>({
    queryKey: messagingKeys.inbox(userId),
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const res = await messagingService.listThreads({ limit: 30 });
      if (!res.success || !res.data) {
        throw new MessagingRequestError(res.message ?? "Couldn't load conversations", res.status, res.code);
      }
      return res.data;
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => pollDelay(INBOX_POLL_MS, query.state.fetchFailureCount),
  });
}

/**
 * One thread's summary. Seeded from the inbox when it's there; fetched on
 * its own for deep links, push taps and threads beyond page 1 (§4.2).
 */
export function useThreadSummary(threadId: string | null) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const queryClient = useQueryClient();
  return useQuery<ThreadSummary>({
    queryKey: messagingKeys.thread(userId, threadId ?? ""),
    enabled: Boolean(userId && threadId),
    queryFn: async () => {
      const res = await messagingService.getThread(threadId as string);
      if (!res.success || !res.data) {
        throw new MessagingRequestError(res.message ?? "Conversation unavailable", res.status, res.code);
      }
      return res.data;
    },
    initialData: () =>
      queryClient
        .getQueryData<ThreadsPage>(messagingKeys.inbox(userId))
        ?.threads.find((t) => t._id === threadId),
    initialDataUpdatedAt: () => queryClient.getQueryState(messagingKeys.inbox(userId))?.dataUpdatedAt,
    staleTime: 30_000,
    retry: false,
  });
}

/** Total unread messages across unmuted threads, for the nav badges. */
export function useMessagingUnread(enabled = true): number {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const { data } = useQuery<UnreadCount>({
    queryKey: messagingKeys.unread(userId),
    enabled: enabled && Boolean(userId),
    queryFn: async () => {
      const res = await messagingService.unreadCount();
      if (!res.success || !res.data) {
        throw new MessagingRequestError(res.message ?? "Couldn't load unread count", res.status, res.code);
      }
      return res.data;
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => pollDelay(UNREAD_POLL_MS, query.state.fetchFailureCount),
  });
  return data?.unread ?? 0;
}

/** After a mark-read: the badge takes the server's total, the row drops to its count. */
export function applyReadResult(
  queryClient: QueryClient,
  userId: string,
  threadId: string,
  result: { unread_count: number; total_unread: number; last_read_seq: number },
): void {
  queryClient.setQueryData<UnreadCount>(messagingKeys.unread(userId), (prev) => ({
    unread: result.total_unread,
    threads: prev?.threads ?? 0,
  }));
  const patch = (t: ThreadSummary): ThreadSummary =>
    t._id === threadId
      ? { ...t, unread_count: result.unread_count, my_last_read_seq: Math.max(t.my_last_read_seq, result.last_read_seq) }
      : t;
  queryClient.setQueryData<ThreadsPage>(messagingKeys.inbox(userId), (prev) =>
    prev ? { ...prev, threads: prev.threads.map(patch) } : prev,
  );
  queryClient.setQueryData<ThreadSummary>(messagingKeys.thread(userId, threadId), (prev) =>
    prev ? patch(prev) : prev,
  );
}

/** Refresh inbox page 1 and the badge (after a send, a push, or a thread action). */
export function refreshMessaging(queryClient: QueryClient, userId: string): void {
  void queryClient.invalidateQueries({ queryKey: messagingKeys.inbox(userId) });
  void queryClient.invalidateQueries({ queryKey: messagingKeys.unread(userId) });
}
