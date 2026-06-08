import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";

// ─── Enums ──────────────────────────────────────────────────────

export enum NotificationType {
  BOOKING_CREATED = "BOOKING_CREATED",
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  BOOKING_RESCHEDULED = "BOOKING_RESCHEDULED",
  BOOKING_COMPLETED = "BOOKING_COMPLETED",
  BOOKING_REMINDER = "BOOKING_REMINDER",
  CLIENT_INVITATION = "CLIENT_INVITATION",
  CLIENT_REQUEST = "CLIENT_REQUEST",
  CLIENT_ACCEPTED = "CLIENT_ACCEPTED",
  CLIENT_DEPARTED = "CLIENT_DEPARTED",
  MARKETPLACE_REQUEST_RECEIVED = "MARKETPLACE_REQUEST_RECEIVED",
  MARKETPLACE_REQUEST_ACCEPTED = "MARKETPLACE_REQUEST_ACCEPTED",
  MARKETPLACE_REQUEST_REJECTED = "MARKETPLACE_REQUEST_REJECTED",
  MARKETPLACE_TRANSFER_REQUEST = "MARKETPLACE_TRANSFER_REQUEST",
  REVIEW_RECEIVED = "REVIEW_RECEIVED",
  REVIEW_RESPONSE = "REVIEW_RESPONSE",
  DIET_PLAN_ASSIGNED = "DIET_PLAN_ASSIGNED",
  WORKOUT_PLAN_ASSIGNED = "WORKOUT_PLAN_ASSIGNED",
  JOURNAL_ENTRY_ADDED = "JOURNAL_ENTRY_ADDED",
  MEAL_LOGGED = "MEAL_LOGGED",
  TEAM_INVITATION = "TEAM_INVITATION",
  TEAM_MEMBER_JOINED = "TEAM_MEMBER_JOINED",
  TEAM_MEMBER_REMOVED = "TEAM_MEMBER_REMOVED",
  SUBSCRIPTION_CREATED = "SUBSCRIPTION_CREATED",
  SUBSCRIPTION_EXPIRING = "SUBSCRIPTION_EXPIRING",
  SUBSCRIPTION_EXPIRED = "SUBSCRIPTION_EXPIRED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  VERIFICATION_APPROVED = "VERIFICATION_APPROVED",
  VERIFICATION_REJECTED = "VERIFICATION_REJECTED",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  ACCOUNT_SUSPENDED = "ACCOUNT_SUSPENDED",
}

export enum NotificationCategory {
  BOOKING = "booking",
  PAYMENT = "payment",
  MENTION = "mention",
  SYSTEM = "system",
}

// ─── Interfaces ─────────────────────────────────────────────────

export interface NotificationItem {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedNotifications {
  notifications: NotificationItem[];
  pagination: NotificationPagination;
}

export interface NotificationUnreadByCategory {
  [NotificationCategory.BOOKING]: number;
  [NotificationCategory.PAYMENT]: number;
  [NotificationCategory.MENTION]: number;
  [NotificationCategory.SYSTEM]: number;
}

export interface NotificationUnreadCount {
  count: number;
  by_category: NotificationUnreadByCategory;
}

export interface NotificationPreferences {
  emailSubscriptionUpdates: boolean;
  emailPaymentReceipts: boolean;
  emailBookingConfirmations: boolean;
  emailCancellations: boolean;
  emailReminders: boolean;
  emailNewsletter: boolean;
  emailPromotions: boolean;
  inAppBookings: boolean;
  inAppPayments: boolean;
  inAppMessages: boolean;
  inAppReminders: boolean;
  inAppPromotions: boolean;
}

// ─── Service ────────────────────────────────────────────────────

export const notificationsService = {
  getNotifications(params?: {
    page?: number;
    limit?: number;
    is_read?: boolean;
    type?: NotificationType;
    category?: NotificationCategory;
  }): Promise<ApiResponse<PaginatedNotifications>> {
    const search = new URLSearchParams();
    if (params?.page) search.set("page", String(params.page));
    if (params?.limit) search.set("limit", String(params.limit));
    if (params?.is_read !== undefined)
      search.set("is_read", String(params.is_read));
    if (params?.type) search.set("type", params.type);
    if (params?.category) search.set("category", params.category);
    const query = search.toString();
    return apiClient.get<PaginatedNotifications>(
      `/notifications${query ? `?${query}` : ""}`,
    );
  },

  getUnreadCount(): Promise<ApiResponse<NotificationUnreadCount>> {
    return apiClient.get<NotificationUnreadCount>(
      "/notifications/unread-count",
    );
  },

  markAsRead(
    id: string,
  ): Promise<ApiResponse<{ id: string; isRead: boolean; readAt: string }>> {
    return apiClient.patch<{ id: string; isRead: boolean; readAt: string }>(
      `/notifications/${id}/read`,
      {},
    );
  },

  markAllAsRead(): Promise<ApiResponse<{ modifiedCount: number }>> {
    return apiClient.patch<{ modifiedCount: number }>(
      "/notifications/read-all",
      {},
    );
  },

  getPreferences(): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.get<NotificationPreferences>("/notifications/preferences");
  },

  updatePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<ApiResponse<NotificationPreferences>> {
    return apiClient.patch<NotificationPreferences>(
      "/notifications/preferences",
      prefs,
    );
  },
};
