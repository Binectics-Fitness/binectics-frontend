"use client";

/**
 * React Query surfaces for messaging: the inbox (page 1, polled), one thread
 * summary, and the unread total behind every shell's nav badge. Cadence per
 * CONTRACT §7: inbox 15 s, badge 30 s, both ±10% jitter, paused while the
 * tab is hidden (React Query skips interval refetches in the background),
 * refetched at once when it becomes visible again, and backed off on errors.
 */

import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from "@tanstack/react-query";
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
  /** Every gym inbox this user has open; prefix for invalidation. */
  gymInboxes: (userId: string) => ["messaging", userId, "gym-inbox"] as const,
  gymInbox: (userId: string, orgId: string) => ["messaging", userId, "gym-inbox", orgId] as const,
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

const GYM_INBOX_PAGE = 30;

/**
 * Poll cadence for a gym inbox. A refetch of an infinite query re-requests
 * every loaded page, so the timer runs only while page 1 alone is loaded.
 * Once someone has paged back through older threads the timer stops; the
 * list still refreshes on focus, after a send or thread action, and the nav
 * badge keeps polling, so new messages still show.
 */
export function gymInboxPollDelay(pagesLoaded: number, failures: number): number | false {
  return pagesLoaded > 1 ? false : pollDelay(INBOX_POLL_MS, failures);
}

/**
 * One gym's inbox, for its staff: `?as_gym=<orgId>`, paged by `next_cursor`
 * so a busy inbox never hides threads past the first page. Polled like the
 * inbox while only page 1 is loaded (see gymInboxPollDelay). A 403
 * MESSAGING_NOT_GYM_INBOX surfaces as the query error.
 */
export function useGymInbox(orgId: string | null) {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  return useInfiniteQuery<
    ThreadsPage,
    MessagingRequestError,
    InfiniteData<ThreadsPage, string | undefined>,
    readonly string[],
    string | undefined
  >({
    queryKey: messagingKeys.gymInbox(userId, orgId ?? ""),
    enabled: Boolean(userId && orgId),
    initialPageParam: undefined,
    queryFn: async ({ pageParam }) => {
      const res = await messagingService.listThreads({
        asGym: orgId as string,
        limit: GYM_INBOX_PAGE,
        cursor: pageParam,
      });
      if (!res.success || !res.data) {
        throw new MessagingRequestError(res.message ?? "Couldn't load conversations", res.status, res.code);
      }
      return res.data;
    },
    getNextPageParam: (last) => last.next_cursor ?? undefined,
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: (query) =>
      gymInboxPollDelay(query.state.data?.pages.length ?? 1, query.state.fetchFailureCount),
  });
}

/**
 * Where a thread's cached summary lives: the member inbox first, then any
 * gym inbox. Returns the hit with that query's freshness, so a seed taken
 * from a gym inbox is dated by the gym inbox, not by the member inbox.
 */
function findCachedSummary(
  queryClient: QueryClient,
  userId: string,
  threadId: string | null,
): { thread: ThreadSummary; updatedAt: number | undefined } | undefined {
  const inboxKey = messagingKeys.inbox(userId);
  const fromInbox = queryClient
    .getQueryData<ThreadsPage>(inboxKey)
    ?.threads.find((t) => t._id === threadId);
  if (fromInbox) {
    return { thread: fromInbox, updatedAt: queryClient.getQueryState(inboxKey)?.dataUpdatedAt };
  }
  for (const [key, data] of queryClient.getQueriesData<InfiniteData<ThreadsPage>>({
    queryKey: messagingKeys.gymInboxes(userId),
  })) {
    for (const page of data?.pages ?? []) {
      const hit = page.threads.find((t) => t._id === threadId);
      if (hit) return { thread: hit, updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt };
    }
  }
  return undefined;
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
    initialData: () => findCachedSummary(queryClient, userId, threadId)?.thread,
    initialDataUpdatedAt: () => findCachedSummary(queryClient, userId, threadId)?.updatedAt,
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
  queryClient.setQueriesData<InfiniteData<ThreadsPage>>({ queryKey: messagingKeys.gymInboxes(userId) }, (prev) =>
    prev
      ? { ...prev, pages: prev.pages.map((page) => ({ ...page, threads: page.threads.map(patch) })) }
      : prev,
  );
  queryClient.setQueryData<ThreadSummary>(messagingKeys.thread(userId, threadId), (prev) =>
    prev ? patch(prev) : prev,
  );
}

/** Refresh inbox page 1, any open gym inbox and the badge (after a send, a push, or a thread action). */
export function refreshMessaging(queryClient: QueryClient, userId: string): void {
  void queryClient.invalidateQueries({ queryKey: messagingKeys.inbox(userId) });
  void queryClient.invalidateQueries({ queryKey: messagingKeys.gymInboxes(userId) });
  void queryClient.invalidateQueries({ queryKey: messagingKeys.unread(userId) });
}
