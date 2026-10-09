/**
 * A small in-memory stand-in for the messaging API, for tests only. It does
 * exactly what the web client relies on from the chat contract and no more:
 * per-thread `seq` and `rev`, `since_rev` that re-sends the last few changes
 * (the settle window), idempotent replay on `client_message_id`, and the
 * read-only refusal codes. It is not a second server.
 */

import { vi } from "vitest";
import {
  MessageSide,
  MessagingErrorCode,
  ReadOnlyReason,
  ThreadKind,
  ThreadRole,
  messagingService,
  type ChatMessage,
  type MessagesCursor,
  type ThreadState,
  type ThreadSummary,
} from "@/lib/api/messaging";
import type { ApiResponse } from "@/lib/types";

export const ME = "aaaaaaaaaaaaaaaaaaaaaaaa";
export const OTHER = "bbbbbbbbbbbbbbbbbbbbbbbb";

let counter = 0;
const oid = () => (++counter).toString(16).padStart(24, "c");

interface FakeThread {
  summary: ThreadSummary;
  messages: ChatMessage[];
  seq: number;
  rev: number;
  myRead: number;
  theirRead: number;
  readOnly: ReadOnlyReason | null;
}

const READ_ONLY_CODE: Record<ReadOnlyReason, MessagingErrorCode> = {
  [ReadOnlyReason.RELATIONSHIP_ENDED]: MessagingErrorCode.RELATIONSHIP_ENDED,
  [ReadOnlyReason.BLOCKED]: MessagingErrorCode.BLOCKED,
  [ReadOnlyReason.ANNOUNCEMENTS_ONLY]: MessagingErrorCode.ANNOUNCEMENTS_ONLY,
  [ReadOnlyReason.UNAVAILABLE]: MessagingErrorCode.UNAVAILABLE,
};

const fail = <T>(status: number | undefined, code?: string, message = "refused"): ApiResponse<T> => ({
  success: false,
  status,
  code,
  message,
});

export function createMessagingFake({ settle = 2 }: { settle?: number } = {}) {
  const threads = new Map<string, FakeThread>();
  /** Queued one-off answers for the next calls of a method (network errors, 5xx…). */
  const failures: Partial<Record<string, ApiResponse<unknown>[]>> = {};
  const calls: { method: string; args: unknown[] }[] = [];
  let clock = Date.parse("2026-10-09T09:00:00.000Z");

  const state = (t: FakeThread): ThreadState => ({
    seq: t.seq,
    rev: t.rev,
    can_send: t.readOnly === null,
    read_only_reason: t.readOnly,
    can_reply: t.readOnly === null,
    can_react: t.readOnly === null && t.summary.kind !== ThreadKind.BROADCAST,
    can_block: false,
    blocked_by_me: false,
    muted: false,
    my_last_read_seq: t.myRead,
    counterpart_last_read_seq: t.summary.kind === ThreadKind.BROADCAST ? null : t.theirRead,
  });

  const summary = (t: FakeThread): ThreadSummary => {
    const last = [...t.messages].reverse().find(Boolean) ?? null;
    return {
      ...t.summary,
      ...state(t),
      last_message: last
        ? {
            _id: last._id,
            seq: last.seq,
            side: last.side,
            author_name: last.author.name,
            preview: last.deleted_at ? null : last.body.slice(0, 140),
            deleted: Boolean(last.deleted_at),
            created_at: last.created_at,
          }
        : null,
      unread_count: t.messages.filter((m) => m.side === MessageSide.THEIRS && m.seq > t.myRead && !m.deleted_at).length,
    };
  };

  function addThread(init: Partial<ThreadSummary> & { title: string }, readOnly: ReadOnlyReason | null = null): string {
    const id = init._id ?? oid();
    threads.set(id, {
      summary: {
        _id: id,
        kind: ThreadKind.DIRECT,
        organization_id: null,
        avatar_url: null,
        my_role: ThreadRole.PARTICIPANT,
        as_gym: null,
        last_message: null,
        unread_count: 0,
        ...state({ seq: 0, rev: 0, myRead: 0, theirRead: 0, readOnly, summary: { kind: init.kind ?? ThreadKind.DIRECT } } as FakeThread),
        ...init,
      } as ThreadSummary,
      messages: [],
      seq: 0,
      rev: 0,
      myRead: 0,
      theirRead: 0,
      readOnly,
    });
    return id;
  }

  function push(threadId: string, side: MessageSide, body: string, clientId: string | null = null): ChatMessage {
    const t = threads.get(threadId)!;
    t.seq += 1;
    t.rev += 1;
    clock += 60_000;
    const m: ChatMessage = {
      _id: oid(),
      thread_id: threadId,
      seq: t.seq,
      rev: t.rev,
      client_message_id: side === MessageSide.MINE ? clientId : null,
      side,
      sender_id: side === MessageSide.MINE ? ME : OTHER,
      author: { kind: "user", user_id: side === MessageSide.MINE ? ME : OTHER, name: side === MessageSide.MINE ? "Me Myself" : t.summary.title, avatar_url: null },
      staff_sender: null,
      body,
      created_at: new Date(clock).toISOString(),
      edited_at: null,
      deleted_at: null,
      reply_to: null,
      reactions: [],
      editable_until: null,
      can_delete: side === MessageSide.MINE,
    };
    t.messages.push(m);
    if (side === MessageSide.MINE) t.myRead = Math.max(t.myRead, t.seq);
    return m;
  }

  /** The other participant writes. */
  const receive = (threadId: string, body: string) => push(threadId, MessageSide.THEIRS, body);

  /** The server changes a message (edit/delete/reaction elsewhere): new rev. */
  function change(threadId: string, messageId: string, patch: Partial<ChatMessage>) {
    const t = threads.get(threadId)!;
    t.rev += 1;
    const i = t.messages.findIndex((m) => m._id === messageId);
    t.messages[i] = { ...t.messages[i], ...patch, rev: t.rev };
  }

  function take<T>(method: string): ApiResponse<T> | null {
    const queue = failures[method];
    return queue && queue.length ? (queue.shift() as ApiResponse<T>) : null;
  }

  const api = {
    listThreads: async () => {
      calls.push({ method: "listThreads", args: [] });
      const failed = take<{ threads: ThreadSummary[]; next_cursor: null }>("listThreads");
      if (failed) return failed;
      const list = [...threads.values()]
        .filter((t) => t.messages.length > 0)
        .map(summary)
        .reverse();
      return { success: true, data: { threads: list, next_cursor: null } };
    },
    getThread: async (threadId: string) => {
      calls.push({ method: "getThread", args: [threadId] });
      const t = threads.get(threadId);
      return t ? { success: true, data: summary(t) } : fail<ThreadSummary>(404, MessagingErrorCode.THREAD_NOT_FOUND);
    },
    getMessages: async (threadId: string, cursor: MessagesCursor = {}, limit = 50) => {
      calls.push({ method: "getMessages", args: [threadId, cursor] });
      const failed = take<never>("getMessages");
      if (failed) return failed;
      const t = threads.get(threadId);
      if (!t) return fail<never>(404, MessagingErrorCode.THREAD_NOT_FOUND);
      const c = cursor as Partial<Record<"before_seq" | "after_seq" | "since_rev", number>>;
      let messages: ChatMessage[];
      let hasMore = false;
      let nextRev = t.rev;
      if (c.since_rev !== undefined) {
        const changed = t.messages.filter((m) => m.rev > c.since_rev!).sort((a, b) => a.rev - b.rev);
        messages = changed.slice(0, limit);
        hasMore = changed.length > limit;
        // Settle window: hand back a cursor a little behind, so the last few
        // changes come again on the next poll and the client must de-duplicate.
        nextRev = hasMore ? messages[messages.length - 1].rev : Math.max(c.since_rev, t.rev - settle);
      } else if (c.before_seq !== undefined) {
        const older = t.messages.filter((m) => m.seq < c.before_seq!);
        messages = older.slice(-limit);
        hasMore = older.length > limit;
      } else if (c.after_seq !== undefined) {
        const newer = t.messages.filter((m) => m.seq > c.after_seq!);
        messages = newer.slice(0, limit);
        hasMore = newer.length > limit;
      } else {
        messages = t.messages.slice(-limit);
        hasMore = t.messages.length > limit;
      }
      return { success: true, data: { messages, has_more: hasMore, next_rev: nextRev, thread: state(t) } };
    },
    sendMessage: async (threadId: string, payload: { body: string; client_message_id: string }) => {
      calls.push({ method: "sendMessage", args: [threadId, payload] });
      const t = threads.get(threadId);
      if (!t) return fail<ChatMessage>(404, MessagingErrorCode.THREAD_NOT_FOUND);
      const replay = t.messages.find((m) => m.side === MessageSide.MINE && m.client_message_id === payload.client_message_id);
      const failed = take<ChatMessage>("sendMessage");
      if (failed) {
        // A "lost response": the server stored it but the client never heard.
        if (failed.status === 599 && !replay) push(threadId, MessageSide.MINE, payload.body, payload.client_message_id);
        return failed.status === 599 ? fail<ChatMessage>(undefined, undefined, "Network error") : failed;
      }
      if (replay) {
        return replay.body === payload.body
          ? { success: true, data: replay }
          : fail<ChatMessage>(409, MessagingErrorCode.CLIENT_ID_REUSED);
      }
      if (t.readOnly) return fail<ChatMessage>(403, READ_ONLY_CODE[t.readOnly]);
      return { success: true, data: push(threadId, MessageSide.MINE, payload.body, payload.client_message_id) };
    },
    markRead: async (threadId: string, upToSeq: number) => {
      calls.push({ method: "markRead", args: [threadId, upToSeq] });
      const t = threads.get(threadId);
      if (!t) return fail<never>(404, MessagingErrorCode.THREAD_NOT_FOUND);
      t.myRead = Math.max(t.myRead, Math.min(upToSeq, t.seq));
      const total = [...threads.values()].reduce((n, x) => n + summary(x).unread_count, 0);
      return { success: true, data: { last_read_seq: t.myRead, unread_count: summary(t).unread_count, total_unread: total } };
    },
    unreadCount: async () => {
      calls.push({ method: "unreadCount", args: [] });
      const all = [...threads.values()].map(summary);
      return {
        success: true,
        data: { unread: all.reduce((n, x) => n + x.unread_count, 0), threads: all.filter((x) => x.unread_count > 0).length },
      };
    },
  };

  return {
    api,
    calls,
    threads,
    addThread,
    receive,
    sendAsMe: (threadId: string, body: string) => push(threadId, MessageSide.MINE, body, oid()),
    change,
    setReadOnly: (threadId: string, reason: ReadOnlyReason | null) => {
      threads.get(threadId)!.readOnly = reason;
    },
    setTheirRead: (threadId: string, seq: number) => {
      threads.get(threadId)!.theirRead = seq;
    },
    remove: (threadId: string) => threads.delete(threadId),
    /** Make the next call(s) of a method answer this. Status 599 = response lost after the server stored it. */
    failNext: (method: keyof typeof api, ...responses: ApiResponse<unknown>[]) => {
      failures[method] = [...(failures[method] ?? []), ...responses];
    },
    count: (method: string) => calls.filter((c) => c.method === method).length,
    /** Route messagingService through the fake. */
    install() {
      for (const [name, impl] of Object.entries(api)) {
        vi.spyOn(messagingService, name as keyof typeof api).mockImplementation(impl as never);
      }
    },
  };
}

export type MessagingFake = ReturnType<typeof createMessagingFake>;

export const networkError = (): ApiResponse<unknown> => ({ success: false, message: "Network error" });
export const lostResponse = (): ApiResponse<unknown> => ({ success: false, status: 599 });
export const serverError = (): ApiResponse<unknown> => ({ success: false, status: 503, code: "MESSAGING_BUSY" });
