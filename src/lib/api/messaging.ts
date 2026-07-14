/**
 * Messaging API — relationship-scoped 1:1 conversations + gym broadcasts.
 * Threads are gated server-side by an existing relationship; the client
 * just lists, opens, and posts.
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

export interface MessageThreadSummary {
  _id: string;
  kind: "direct" | "broadcast";
  organization_id: string | null;
  counterparty: {
    user_id?: string;
    name: string;
    profile_picture?: string | null;
  } | null;
  last_message_preview: string;
  last_message_at: string | null;
  unread_count: number;
}

export interface ChatMessage {
  _id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export const messagingService = {
  listThreads: (): Promise<ApiResponse<MessageThreadSummary[]>> =>
    apiClient.get<MessageThreadSummary[]>("/messaging/threads"),

  /** Start or resume a direct thread (member↔provider or member↔gym). */
  startThread: (
    payload: { recipient_user_id?: string; organization_id?: string },
  ): Promise<ApiResponse<{ thread_id: string }>> =>
    apiClient.post<{ thread_id: string }>("/messaging/threads", payload),

  getMessages: (
    threadId: string,
    before?: string,
  ): Promise<ApiResponse<{ messages: ChatMessage[] }>> =>
    apiClient.get<{ messages: ChatMessage[] }>(
      `/messaging/threads/${threadId}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`,
    ),

  sendMessage: (
    threadId: string,
    body: string,
  ): Promise<ApiResponse<ChatMessage>> =>
    apiClient.post<ChatMessage>(`/messaging/threads/${threadId}/messages`, {
      body,
    }),

  markRead: (threadId: string): Promise<ApiResponse<unknown>> =>
    apiClient.post(`/messaging/threads/${threadId}/read`, {}),

  unreadCount: (): Promise<ApiResponse<{ unread: number }>> =>
    apiClient.get<{ unread: number }>("/messaging/unread-count"),

  /** Gym owner → all active members. */
  broadcast: (
    organizationId: string,
    body: string,
  ): Promise<ApiResponse<ChatMessage>> =>
    apiClient.post<ChatMessage>("/messaging/broadcast", {
      organization_id: organizationId,
      body,
    }),
};
