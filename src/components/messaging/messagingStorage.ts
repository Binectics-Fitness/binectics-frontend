/**
 * Per-tab messaging state that must survive a reload but never outlive the
 * session: one draft per thread and the outbox of unsent messages
 * (CONTRACT §6.2 rule 6, §6.5). Keyed by user id + thread id in
 * sessionStorage; cleared on logout. Every access is guarded: storage can
 * be unavailable (private mode, blocked site data), and then drafts simply
 * don't persist.
 */

import type { ReadOnlyReason } from "@/lib/api/messaging";

const PREFIX = "bx_msg:";

function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function read<T>(key: string): T | null {
  try {
    const raw = store()?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown | null): void {
  try {
    const s = store();
    if (!s) return;
    if (value === null) s.removeItem(key);
    else s.setItem(key, JSON.stringify(value));
  } catch {
    /* quota or blocked storage: the draft just isn't kept */
  }
}

const draftKey = (userId: string, threadId: string) => `${PREFIX}draft:${userId}:${threadId}`;
const outboxKey = (userId: string, threadId: string) => `${PREFIX}outbox:${userId}:${threadId}`;

export function loadDraft(userId: string, threadId: string): string {
  return read<string>(draftKey(userId, threadId)) ?? "";
}

export function saveDraft(userId: string, threadId: string, text: string): void {
  write(draftKey(userId, threadId), text ? text : null);
}

/** Why an unsent message failed, which decides whether Retry is offered. */
export type OutboxFailure =
  /** Network, 5xx, 408 or 429 after the automatic retries: Retry with the same id. */
  | { kind: "retryable" }
  /** The server answered with a read-only code: no Retry, the thread is read-only now. */
  | { kind: "read_only"; reason: ReadOnlyReason }
  /** The id was already used for different content: Retry with a new id. */
  | { kind: "reused" }
  /** Any other refusal: no Retry. */
  | { kind: "refused"; message: string };

export interface OutboxEntry {
  client_message_id: string;
  body: string;
  reply_to: { message_id: string; author_name: string; excerpt: string | null } | null;
  created_at: string;
  status: "sending" | "failed";
  failure: OutboxFailure | null;
}

function loadOutbox(userId: string, threadId: string): OutboxEntry[] {
  const entries = read<OutboxEntry[]>(outboxKey(userId, threadId)) ?? [];
  // After a reload nothing is in flight any more: show it as failed, never
  // auto-send later. Retry is safe, the id is unchanged.
  return entries.map((e) =>
    e.status === "sending" ? { ...e, status: "failed", failure: { kind: "retryable" } } : e,
  );
}

/*
 * The outbox lives in memory for the page's lifetime (so a send that
 * finishes after the person switched threads still lands) and is mirrored to
 * sessionStorage (so a reload shows what never went out).
 */
const outboxes = new Map<string, OutboxEntry[]>();
const listeners = new Map<string, Set<() => void>>();
const EMPTY: OutboxEntry[] = [];

export function getOutbox(userId: string, threadId: string): OutboxEntry[] {
  if (!userId || !threadId) return EMPTY;
  const key = outboxKey(userId, threadId);
  let entries = outboxes.get(key);
  if (!entries) {
    entries = loadOutbox(userId, threadId);
    outboxes.set(key, entries);
  }
  return entries;
}

export function updateOutbox(
  userId: string,
  threadId: string,
  update: (entries: OutboxEntry[]) => OutboxEntry[],
): OutboxEntry[] {
  const key = outboxKey(userId, threadId);
  const next = update(getOutbox(userId, threadId));
  outboxes.set(key, next);
  write(key, next.length ? next : null);
  listeners.get(key)?.forEach((fn) => fn());
  return next;
}

export function subscribeOutbox(userId: string, threadId: string, fn: () => void): () => void {
  const key = outboxKey(userId, threadId);
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(fn);
  return () => {
    set.delete(fn);
  };
}

/** Remove every draft and unsent message (on logout). */
export function clearMessagingStorage(): void {
  outboxes.clear();
  const s = store();
  if (!s) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < s.length; i++) {
      const key = s.key(i);
      if (key?.startsWith(PREFIX)) keys.push(key);
    }
    keys.forEach((k) => s.removeItem(k));
  } catch {
    /* nothing to clear */
  }
}

/** A client message id matching the server pattern `^[A-Za-z0-9_-]{8,64}$`. */
export function newClientMessageId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Older browsers: 24 random base-36 characters.
  let out = "";
  while (out.length < 24) out += Math.random().toString(36).slice(2);
  return out.slice(0, 24);
}
