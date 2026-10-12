"use client";

/**
 * One open thread's lifecycle (CONTRACT §6–§7):
 * - load the latest page (or a window around a search hit);
 * - poll `since_rev` every 5 s ±10% while the tab is visible, at once on
 *   visibility, reconnect and push; back off on errors; stop on 403/404 and
 *   ask `GET /threads/:id` once what state the thread is in;
 * - load older (`before_seq`) and newer (`after_seq`) history;
 * - send optimistically through a persisted outbox with automatic retries
 *   that reuse the same `client_message_id`, so a retry never duplicates.
 *
 * The pane that uses this is keyed by thread id, so a response for thread A
 * can never paint into thread B (web B11); every async step also checks it
 * still belongs to a mounted hook.
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MessagingErrorCode,
  READ_ONLY_CODES,
  messagingService,
  type ChatMessage,
  type MessagesPage,
  type ThreadState,
} from "@/lib/api/messaging";
import type { ApiResponse } from "@/lib/types";
import {
  getOutbox,
  newClientMessageId,
  subscribeOutbox,
  updateOutbox,
  type OutboxEntry,
  type OutboxFailure,
} from "./messagingStorage";
import {
  appendNewer,
  applyServerMessage,
  fromAnchor,
  fromLatest,
  highestSeq,
  mergeChanges,
  prependOlder,
  type Transcript,
} from "./transcriptModel";
import { applyReadResult, messagingKeys, pollDelay, refreshMessaging } from "./queries";
import { registerOpenThread } from "./openThread";

const THREAD_POLL_MS = 5_000;
/** Automatic retry delays for a send (CONTRACT §6.2 rule 2). */
export const SEND_RETRY_DELAYS_MS = [1_000, 4_000, 15_000];

export type ThreadStatus = "loading" | "ready" | "error" | "gone";

export interface ReplyTarget {
  message_id: string;
  author_name: string;
  excerpt: string | null;
}

const transcriptKey = (userId: string, threadId: string) =>
  [...messagingKeys.thread(userId, threadId), "transcript"] as const;

function isVisible(): boolean {
  return typeof document === "undefined" || document.visibilityState === "visible";
}

function isOnline(): boolean {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

/** Network errors, timeouts, 5xx, 408 and 429 are worth retrying (§6.2 rule 2). */
export function isRetryable(res: ApiResponse<unknown>): boolean {
  const status = res.status;
  return status === undefined || status >= 500 || status === 408 || status === 429;
}

function retryAfterMs(res: ApiResponse<unknown>): number | null {
  const seconds = res.details?.retry_after_seconds;
  return typeof seconds === "number" && seconds > 0 ? seconds * 1000 : null;
}

/** What a refused send means for the outbox entry (§6.2 rule 3). */
export function failureFor(res: ApiResponse<unknown>): OutboxFailure {
  if (isRetryable(res)) return { kind: "retryable" };
  const reason = res.code ? READ_ONLY_CODES[res.code] : undefined;
  if (res.status === 403 && reason) return { kind: "read_only", reason };
  if (res.status === 409 && res.code === MessagingErrorCode.CLIENT_ID_REUSED) return { kind: "reused" };
  return { kind: "refused", message: res.message || "The message was refused." };
}

export function useThreadSync({
  threadId,
  userId,
  anchorSeq,
}: {
  threadId: string;
  userId: string;
  /** Open around this message (a search hit) instead of at the latest. */
  anchorSeq?: number | null;
}) {
  const queryClient = useQueryClient();
  const cached = anchorSeq
    ? undefined
    : queryClient.getQueryData<Transcript>(transcriptKey(userId, threadId));

  const [transcript, setTranscript] = useState<Transcript | null>(cached ?? null);
  const [status, setStatus] = useState<ThreadStatus>(cached ? "ready" : "loading");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [loadingNewer, setLoadingNewer] = useState(false);
  const [online, setOnline] = useState(isOnline);

  const transcriptRef = useRef<Transcript | null>(cached ?? null);
  const alive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const failures = useRef(0);
  const stopped = useRef(false);
  const syncing = useRef(false);
  const retryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pausedRetries = useRef(new Map<string, number>());

  const outbox = useSyncExternalStore(
    useCallback((fn) => subscribeOutbox(userId, threadId, fn), [userId, threadId]),
    () => getOutbox(userId, threadId),
    () => getOutbox(userId, threadId),
  );

  /** Store a new transcript: state, ref and the query cache (instant re-open). */
  const commit = useCallback(
    (next: Transcript) => {
      if (!alive.current) return;
      transcriptRef.current = next;
      setTranscript(next);
      queryClient.setQueryData(transcriptKey(userId, threadId), next);
      // A server copy of one of my pending messages replaces the local bubble.
      const delivered = new Set(next.messages.map((m) => m.client_message_id).filter(Boolean));
      if (getOutbox(userId, threadId).some((e) => delivered.has(e.client_message_id))) {
        updateOutbox(userId, threadId, (entries) => entries.filter((e) => !delivered.has(e.client_message_id)));
      }
    },
    [queryClient, threadId, userId],
  );

  const patchThreadState = useCallback(
    (patch: Partial<ThreadState>) => {
      const t = transcriptRef.current;
      if (t) commit({ ...t, thread: { ...t.thread, ...patch } });
    },
    [commit],
  );

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // ── Polling ───────────────────────────────────────────────────────────

  const syncRef = useRef<() => Promise<void>>(async () => {});

  const schedule = useCallback(() => {
    clearTimer();
    if (!alive.current || stopped.current || !isVisible()) return;
    timer.current = setTimeout(() => void syncRef.current(), pollDelay(THREAD_POLL_MS, failures.current));
  }, []);

  /** A 403/404 while polling: stop, ask once what state the thread is in. */
  const handleLostAccess = useCallback(async () => {
    stopped.current = true;
    clearTimer();
    refreshMessaging(queryClient, userId);
    const res = await messagingService.getThread(threadId);
    if (!alive.current) return;
    if (res.success && res.data) {
      queryClient.setQueryData(messagingKeys.thread(userId, threadId), res.data);
      const t = transcriptRef.current;
      if (t) {
        const s = res.data;
        commit({
          ...t,
          thread: {
            seq: s.seq,
            rev: s.rev,
            can_send: s.can_send,
            read_only_reason: s.read_only_reason,
            can_reply: s.can_reply,
            can_react: s.can_react,
            can_block: s.can_block,
            blocked_by_me: s.blocked_by_me,
            muted: s.muted,
            my_last_read_seq: s.my_last_read_seq,
            counterpart_last_read_seq: s.counterpart_last_read_seq,
          },
        });
      }
      // Still readable (its state may be read-only now); polling stays
      // stopped until the thread is opened again (CONTRACT §7 Errors).
    } else {
      setStatus("gone");
    }
  }, [commit, queryClient, threadId, userId]);

  const sync = useCallback(async () => {
    const t = transcriptRef.current;
    if (!alive.current || stopped.current || syncing.current || !t) return;
    if (!isVisible()) return clearTimer();
    syncing.current = true;
    clearTimer();
    let res: ApiResponse<MessagesPage>;
    try {
      res = await messagingService.getMessages(threadId, { since_rev: t.nextRev });
    } finally {
      syncing.current = false;
    }
    if (!alive.current) return;
    if (res.success && res.data) {
      failures.current = 0;
      setOnline(true);
      const current = transcriptRef.current ?? t;
      commit(mergeChanges(current, res.data).transcript);
      if (res.data.has_more) return void syncRef.current();
    } else if (res.status === 403 || res.status === 404) {
      return void handleLostAccess();
    } else {
      failures.current += 1;
      if (res.status === undefined && !isOnline()) setOnline(false);
    }
    schedule();
  }, [commit, handleLostAccess, schedule, threadId]);

  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  // ── Initial load ──────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setStatus((s) => (transcriptRef.current ? s : "loading"));
    const res = await messagingService.getMessages(
      threadId,
      anchorSeq ? { before_seq: anchorSeq + 1 } : {},
    );
    if (!alive.current) return;
    if (res.success && res.data) {
      failures.current = 0;
      commit(anchorSeq ? fromAnchor(res.data, res.data.thread.seq) : fromLatest(res.data));
      setStatus("ready");
      schedule();
    } else if (res.status === 400 || res.status === 403 || res.status === 404) {
      setStatus("gone");
    } else {
      setStatus("error");
    }
  }, [anchorSeq, commit, schedule, threadId]);

  useEffect(() => {
    alive.current = true;
    stopped.current = false;
    const retries = retryTimers.current;
    if (transcriptRef.current && !anchorSeq) {
      // Re-opened from cache: show it at once and catch up.
      void syncRef.current();
    } else {
      void load();
    }
    return () => {
      alive.current = false;
      clearTimer();
      retries.forEach((t) => clearTimeout(t));
      retries.clear();
    };
    // The pane is keyed by thread: this runs once per thread.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Visibility, connectivity, push ────────────────────────────────────

  const syncNow = useCallback(() => {
    failures.current = 0;
    void syncRef.current();
  }, []);

  useEffect(() => registerOpenThread(threadId, syncNow), [threadId, syncNow]);

  // ── History ───────────────────────────────────────────────────────────

  const loadOlder = useCallback(async () => {
    const t = transcriptRef.current;
    if (!t || !t.hasOlder || loadingOlder || t.messages.length === 0) return;
    setLoadingOlder(true);
    const res = await messagingService.getMessages(threadId, { before_seq: t.messages[0].seq });
    if (!alive.current) return;
    setLoadingOlder(false);
    if (res.success && res.data) commit(prependOlder(transcriptRef.current ?? t, res.data));
  }, [commit, loadingOlder, threadId]);

  const loadNewer = useCallback(async () => {
    const t = transcriptRef.current;
    if (!t || t.atTip || loadingNewer) return;
    setLoadingNewer(true);
    const res = await messagingService.getMessages(threadId, { after_seq: highestSeq(t) });
    if (!alive.current) return;
    setLoadingNewer(false);
    if (res.success && res.data) commit(appendNewer(transcriptRef.current ?? t, res.data));
  }, [commit, loadingNewer, threadId]);

  /** Replace the window with the latest page ("New messages" when not at the tip). */
  const jumpToLatest = useCallback(async () => {
    const res = await messagingService.getMessages(threadId);
    if (!alive.current) return;
    if (res.success && res.data) {
      const prev = transcriptRef.current;
      const next = fromLatest(res.data);
      commit(prev ? { ...next, nextRev: Math.max(next.nextRev, prev.nextRev) } : next);
    }
  }, [commit, threadId]);

  /** Apply a message the server returned for an action (edit, delete, react). */
  const applyMessage = useCallback(
    (m: ChatMessage) => {
      const t = transcriptRef.current;
      if (t) commit(applyServerMessage(t, m));
    },
    [commit],
  );

  // ── Sending ───────────────────────────────────────────────────────────

  const attemptRef = useRef<(cid: string, tries: number) => Promise<void>>(async () => {});

  const setFailed = useCallback(
    (cid: string, failure: OutboxFailure) => {
      updateOutbox(userId, threadId, (entries) =>
        entries.map((e) => (e.client_message_id === cid ? { ...e, status: "failed", failure } : e)),
      );
    },
    [threadId, userId],
  );

  const attempt = useCallback(
    async (cid: string, tries: number) => {
      const entry = getOutbox(userId, threadId).find((e) => e.client_message_id === cid);
      if (!entry) return;
      const res = await messagingService.sendMessage(threadId, {
        body: entry.body,
        client_message_id: cid,
        ...(entry.reply_to ? { reply_to_message_id: entry.reply_to.message_id } : {}),
      });

      if (res.success && res.data) {
        const sent = res.data;
        updateOutbox(userId, threadId, (entries) => entries.filter((e) => e.client_message_id !== cid));
        refreshMessaging(queryClient, userId);
        if (!alive.current) return;
        setOnline(true);
        const t = transcriptRef.current;
        if (t && !t.atTip) {
          void jumpToLatest();
        } else if (t) {
          commit(applyServerMessage(t, sent));
        }
        return;
      }

      const failure = failureFor(res);
      if (failure.kind === "retryable" && tries < SEND_RETRY_DELAYS_MS.length && alive.current) {
        if (!isOnline()) {
          setOnline(false);
          pausedRetries.current.set(cid, tries + 1);
          return;
        }
        const delay = retryAfterMs(res) ?? SEND_RETRY_DELAYS_MS[tries];
        retryTimers.current.set(
          cid,
          setTimeout(() => {
            retryTimers.current.delete(cid);
            void attemptRef.current(cid, tries + 1);
          }, delay),
        );
        return;
      }

      setFailed(cid, failure);
      if (failure.kind === "read_only") {
        patchThreadState({
          can_send: false,
          can_reply: false,
          can_react: false,
          read_only_reason: failure.reason,
        });
        refreshMessaging(queryClient, userId);
      } else if (res.status === 404) {
        void handleLostAccess();
      }
    },
    [commit, handleLostAccess, jumpToLatest, patchThreadState, queryClient, setFailed, threadId, userId],
  );

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  const send = useCallback(
    (body: string, replyTo: ReplyTarget | null = null) => {
      const text = body.trim();
      if (!text) return;
      const entry: OutboxEntry = {
        client_message_id: newClientMessageId(),
        body: text,
        reply_to: replyTo,
        created_at: new Date().toISOString(),
        status: "sending",
        failure: null,
      };
      updateOutbox(userId, threadId, (entries) => [...entries, entry]);
      void attemptRef.current(entry.client_message_id, 0);
    },
    [threadId, userId],
  );

  /** Manual retry: same id (a replay returns the original), new id only after a 409 reuse. */
  const retry = useCallback(
    (cid: string) => {
      const entry = getOutbox(userId, threadId).find((e) => e.client_message_id === cid);
      if (!entry || entry.status === "sending") return;
      if (entry.failure && entry.failure.kind !== "retryable" && entry.failure.kind !== "reused") return;
      const nextId = entry.failure?.kind === "reused" ? newClientMessageId() : cid;
      updateOutbox(userId, threadId, (entries) =>
        entries.map((e) =>
          e.client_message_id === cid
            ? { ...e, client_message_id: nextId, status: "sending", failure: null }
            : e,
        ),
      );
      void attemptRef.current(nextId, 0);
    },
    [threadId, userId],
  );

  const discard = useCallback(
    (cid: string) => {
      const pending = retryTimers.current.get(cid);
      if (pending) clearTimeout(pending);
      retryTimers.current.delete(cid);
      pausedRetries.current.delete(cid);
      updateOutbox(userId, threadId, (entries) => entries.filter((e) => e.client_message_id !== cid));
    },
    [threadId, userId],
  );

  // ── Visibility and connectivity ───────────────────────────────────────

  useEffect(() => {
    const onVisibility = () => {
      if (isVisible()) syncNow();
      else clearTimer();
    };
    const onOnline = () => {
      setOnline(true);
      syncNow();
      const paused = [...pausedRetries.current.entries()];
      pausedRetries.current.clear();
      paused.forEach(([cid, tries]) => void attemptRef.current(cid, tries));
    };
    const onOffline = () => setOnline(false);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [syncNow]);

  return {
    status,
    transcript,
    outbox,
    online,
    loadingOlder,
    loadingNewer,
    reload: load,
    loadOlder,
    loadNewer,
    jumpToLatest,
    syncNow,
    applyMessage,
    patchThreadState,
    send,
    retry,
    discard,
  };
}

export type ThreadSync = ReturnType<typeof useThreadSync>;

/**
 * Mark read (CONTRACT §6.4): only while the thread is open, the tab visible
 * and the reader at the bottom; debounced 1 s; only forward; never because
 * history loaded. The response's total feeds the nav badge.
 */
export function useMarkRead({
  threadId,
  userId,
  upToSeq,
  initialReadSeq,
  active,
}: {
  threadId: string;
  userId: string;
  upToSeq: number;
  initialReadSeq: number;
  active: boolean;
}) {
  const queryClient = useQueryClient();
  const posted = useRef(initialReadSeq);

  useEffect(() => {
    if (initialReadSeq > posted.current) posted.current = initialReadSeq;
  }, [initialReadSeq]);

  useEffect(() => {
    if (!active || upToSeq <= posted.current) return;
    const t = setTimeout(async () => {
      if (!isVisible() || upToSeq <= posted.current) return;
      const before = posted.current;
      posted.current = upToSeq;
      const res = await messagingService.markRead(threadId, upToSeq);
      if (res.success && res.data) applyReadResult(queryClient, userId, threadId, res.data);
      else posted.current = before;
    }, 1_000);
    return () => clearTimeout(t);
  }, [active, queryClient, threadId, upToSeq, userId]);
}

/** Tracks `document.visibilityState` as React state. */
export function useDocumentVisible(): boolean {
  return useSyncExternalStore(
    (fn) => {
      document.addEventListener("visibilitychange", fn);
      return () => document.removeEventListener("visibilitychange", fn);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}
