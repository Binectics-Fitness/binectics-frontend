/**
 * Messaging API: relationship-scoped conversations, gym inbox threads and gym
 * announcements. Every rule (who may read, send, edit, react or block) is
 * decided by the server and returned as capability fields; the client only
 * renders them. Wire types follow the chat contract (CONTRACT §3–§4).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export enum ThreadKind {
  DIRECT = "direct",
  GYM = "gym",
  BROADCAST = "broadcast",
}

export enum ThreadRole {
  PARTICIPANT = "participant",
  MEMBER = "member",
  GYM_OWNER = "gym_owner",
  GYM_STAFF = "gym_staff",
  AUDIENCE = "audience",
}

export enum ReadOnlyReason {
  RELATIONSHIP_ENDED = "relationship_ended",
  BLOCKED = "blocked",
  ANNOUNCEMENTS_ONLY = "announcements_only",
  UNAVAILABLE = "unavailable",
  /** A past member↔gym-owner conversation, frozen when the gym inbox opened (owner ruling, Oct 10). */
  MOVED_TO_GYM_INBOX = "moved_to_gym_inbox",
}

export enum MessageSide {
  MINE = "mine",
  THEIRS = "theirs",
}

/** Machine error codes the messaging routes emit (CONTRACT §0). */
export enum MessagingErrorCode {
  VALIDATION_FAILED = "VALIDATION_FAILED",
  INVALID_REPLY = "MESSAGING_INVALID_REPLY",
  ORG_REQUIRED = "MESSAGING_ORG_REQUIRED",
  NOT_RELATED = "MESSAGING_NOT_RELATED",
  RELATIONSHIP_ENDED = "MESSAGING_RELATIONSHIP_ENDED",
  BLOCKED = "MESSAGING_BLOCKED",
  ANNOUNCEMENTS_ONLY = "MESSAGING_ANNOUNCEMENTS_ONLY",
  UNAVAILABLE = "MESSAGING_UNAVAILABLE",
  MOVED_TO_GYM_INBOX = "MESSAGING_MOVED_TO_GYM_INBOX",
  NOT_SENDER = "MESSAGING_NOT_SENDER",
  EDIT_WINDOW_CLOSED = "MESSAGING_EDIT_WINDOW_CLOSED",
  REACTIONS_DISABLED = "MESSAGING_REACTIONS_DISABLED",
  BLOCK_NOT_ALLOWED = "MESSAGING_BLOCK_NOT_ALLOWED",
  THREAD_NOT_FOUND = "MESSAGING_THREAD_NOT_FOUND",
  MESSAGE_NOT_FOUND = "MESSAGING_MESSAGE_NOT_FOUND",
  CLIENT_ID_REUSED = "MESSAGING_CLIENT_ID_REUSED",
  MESSAGE_DELETED = "MESSAGING_MESSAGE_DELETED",
  RATE_LIMITED = "RATE_LIMITED",
  SEARCH_TIMEOUT = "MESSAGING_SEARCH_TIMEOUT",
  BUSY = "MESSAGING_BUSY",
}

/** The refusals that mean "this side can't write here" (CONTRACT §0). */
export const READ_ONLY_CODES: Readonly<Record<string, ReadOnlyReason>> = {
  [MessagingErrorCode.RELATIONSHIP_ENDED]: ReadOnlyReason.RELATIONSHIP_ENDED,
  [MessagingErrorCode.BLOCKED]: ReadOnlyReason.BLOCKED,
  [MessagingErrorCode.ANNOUNCEMENTS_ONLY]: ReadOnlyReason.ANNOUNCEMENTS_ONLY,
  [MessagingErrorCode.UNAVAILABLE]: ReadOnlyReason.UNAVAILABLE,
  [MessagingErrorCode.MOVED_TO_GYM_INBOX]: ReadOnlyReason.MOVED_TO_GYM_INBOX,
};

export enum ReactionKey {
  THUMBS_UP = "thumbs_up",
  HEART = "heart",
  JOY = "joy",
  TADA = "tada",
  PRAY = "pray",
  OPEN_MOUTH = "open_mouth",
}

/** The fixed reaction set, in display order (CONTRACT §4.9). */
export const REACTIONS: ReadonlyArray<{ key: ReactionKey; emoji: string; label: string }> = [
  { key: ReactionKey.THUMBS_UP, emoji: "👍", label: "Thumbs up" },
  { key: ReactionKey.HEART, emoji: "❤️", label: "Heart" },
  { key: ReactionKey.JOY, emoji: "😂", label: "Laughing" },
  { key: ReactionKey.TADA, emoji: "🎉", label: "Celebrate" },
  { key: ReactionKey.PRAY, emoji: "🙏", label: "Thanks" },
  { key: ReactionKey.OPEN_MOUTH, emoji: "😮", label: "Surprised" },
];

export const MESSAGE_MAX_LENGTH = 4000;

export interface LastMessagePreview {
  _id: string;
  seq: number;
  side: MessageSide;
  author_name: string;
  preview: string | null;
  deleted: boolean;
  created_at: string;
}

/** Capabilities and cursors that come with every messages response (§3.3). */
export interface ThreadState {
  seq: number;
  rev: number;
  can_send: boolean;
  read_only_reason: ReadOnlyReason | null;
  can_reply: boolean;
  can_react: boolean;
  can_block: boolean;
  blocked_by_me: boolean;
  muted: boolean;
  my_last_read_seq: number;
  counterpart_last_read_seq: number | null;
}

export interface ThreadSummary extends ThreadState {
  _id: string;
  kind: ThreadKind;
  organization_id: string | null;
  title: string;
  avatar_url: string | null;
  my_role: ThreadRole;
  as_gym: { organization_id: string; name: string } | null;
  last_message: LastMessagePreview | null;
  unread_count: number;
  /**
   * With read_only_reason 'moved_to_gym_inbox': the gym to message instead,
   * or null when the member was at several of the owner's gyms.
   */
  moved_to_organization_id?: string | null;
}

export interface MessageAuthor {
  kind: "user" | "gym";
  user_id: string | null;
  name: string;
  avatar_url: string | null;
}

export interface ReplyContext {
  message_id: string;
  seq: number;
  author_name: string;
  excerpt: string | null;
  deleted: boolean;
}

export interface ReactionSummary {
  key: ReactionKey;
  emoji: string;
  count: number;
  mine: boolean;
}

export interface ChatMessage {
  _id: string;
  thread_id: string;
  seq: number;
  rev: number;
  client_message_id: string | null;
  side: MessageSide;
  sender_id: string | null;
  author: MessageAuthor;
  staff_sender: { user_id: string; name: string } | null;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  reply_to: ReplyContext | null;
  reactions: ReactionSummary[];
  editable_until: string | null;
  can_delete: boolean;
}

export interface MessagesPage {
  messages: ChatMessage[];
  has_more: boolean;
  next_rev: number;
  thread: ThreadState;
}

export interface ThreadsPage {
  threads: ThreadSummary[];
  next_cursor: string | null;
}

export interface MarkReadResult {
  last_read_seq: number;
  unread_count: number;
  total_unread: number;
}

export interface UnreadCount {
  unread: number;
  threads: number;
}

export interface SearchHit {
  thread_id: string;
  thread_title: string;
  kind: ThreadKind;
  message_id: string;
  seq: number;
  side: MessageSide;
  author_name: string;
  excerpt: string;
  created_at: string;
}

export interface SearchResult {
  conversations: ThreadSummary[];
  messages: SearchHit[];
  next_cursor: string | null;
  scope_limited: boolean;
}

/** Exactly one cursor per history request (CONTRACT §4.4). */
export type MessagesCursor =
  | { before_seq: number }
  | { after_seq: number }
  | { since_rev: number }
  | Record<string, never>;

export type StartThreadPayload =
  | { recipient_user_id: string }
  | { organization_id: string }
  | { organization_id: string; member_user_id: string };

const id = (value: string) => encodeURIComponent(value);

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

export const messagingService = {
  /** Inbox page, newest activity first (§4.1). Always paged: passing `limit` opts out of the legacy array. */
  listThreads: (params: { limit?: number; cursor?: string } = {}): Promise<ApiResponse<ThreadsPage>> =>
    apiClient.get<ThreadsPage>(`/messaging/threads${query({ limit: params.limit ?? 30, cursor: params.cursor })}`),

  /** One summary, for deep links, push taps and after a refusal (§4.2). */
  getThread: (threadId: string): Promise<ApiResponse<ThreadSummary>> =>
    apiClient.get<ThreadSummary>(`/messaging/threads/${id(threadId)}`),

  /** Start or resume a thread (§4.3). */
  startThread: (
    payload: StartThreadPayload,
  ): Promise<ApiResponse<{ thread_id: string; thread?: ThreadSummary }>> =>
    apiClient.post<{ thread_id: string; thread?: ThreadSummary }>("/messaging/threads", payload),

  /** History and sync. Never marks read (§4.4). */
  getMessages: (
    threadId: string,
    cursor: MessagesCursor = {},
    limit?: number,
  ): Promise<ApiResponse<MessagesPage>> =>
    apiClient.get<MessagesPage>(
      `/messaging/threads/${id(threadId)}/messages${query({ limit, ...(cursor as Record<string, number>) })}`,
    ),

  /** Idempotent send: a retry with the same client id returns the original (§4.5). */
  sendMessage: (
    threadId: string,
    payload: { body: string; client_message_id: string; reply_to_message_id?: string },
  ): Promise<ApiResponse<ChatMessage>> =>
    apiClient.post<ChatMessage>(`/messaging/threads/${id(threadId)}/messages`, payload),

  /** Gym owner shortcut: post to the org's announcement thread (§4.6). */
  broadcast: (payload: {
    organization_id: string;
    body: string;
    client_message_id: string;
  }): Promise<ApiResponse<ChatMessage>> => apiClient.post<ChatMessage>("/messaging/broadcast", payload),

  editMessage: (threadId: string, messageId: string, body: string): Promise<ApiResponse<ChatMessage>> =>
    apiClient.patch<ChatMessage>(`/messaging/threads/${id(threadId)}/messages/${id(messageId)}`, { body }),

  deleteMessage: (threadId: string, messageId: string): Promise<ApiResponse<ChatMessage>> =>
    apiClient.delete<ChatMessage>(`/messaging/threads/${id(threadId)}/messages/${id(messageId)}`),

  addReaction: (threadId: string, messageId: string, key: ReactionKey): Promise<ApiResponse<ChatMessage>> =>
    apiClient.put<ChatMessage>(
      `/messaging/threads/${id(threadId)}/messages/${id(messageId)}/reactions/${id(key)}`,
    ),

  removeReaction: (threadId: string, messageId: string, key: ReactionKey): Promise<ApiResponse<ChatMessage>> =>
    apiClient.delete<ChatMessage>(
      `/messaging/threads/${id(threadId)}/messages/${id(messageId)}/reactions/${id(key)}`,
    ),

  /** Explicit, forward-only read mark (§4.10). */
  markRead: (threadId: string, upToSeq: number): Promise<ApiResponse<MarkReadResult>> =>
    apiClient.post<MarkReadResult>(`/messaging/threads/${id(threadId)}/read`, { up_to_seq: upToSeq }),

  /** Total unread across unmuted threads, for the nav badge (§4.11). */
  unreadCount: (): Promise<ApiResponse<UnreadCount>> => apiClient.get<UnreadCount>("/messaging/unread-count"),

  setMuted: (threadId: string, muted: boolean): Promise<ApiResponse<{ muted: boolean }>> =>
    apiClient.put<{ muted: boolean }>(`/messaging/threads/${id(threadId)}/mute`, { muted }),

  block: (threadId: string): Promise<ApiResponse<ThreadSummary>> =>
    apiClient.post<ThreadSummary>(`/messaging/threads/${id(threadId)}/block`, {}),

  unblock: (threadId: string): Promise<ApiResponse<ThreadSummary>> =>
    apiClient.delete<ThreadSummary>(`/messaging/threads/${id(threadId)}/block`),

  search: (params: { q: string; limit?: number; cursor?: string }): Promise<ApiResponse<SearchResult>> =>
    apiClient.get<SearchResult>(`/messaging/search${query({ q: params.q, limit: params.limit, cursor: params.cursor })}`),
};
