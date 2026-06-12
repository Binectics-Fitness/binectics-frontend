"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Drawer } from "./Drawer";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/lib/queries/notifications";
import { NotificationCategory } from "@/lib/api/notifications";
import { resolveNotificationLink } from "@/utils/resolveNotificationLink";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ["all", "bookings", "payments", "mentions"] as const;
type Tab = (typeof TABS)[number];

const CATEGORY_MAP: Record<Tab, NotificationCategory[]> = {
  all: [
    NotificationCategory.BOOKING,
    NotificationCategory.PAYMENT,
    NotificationCategory.MENTION,
    NotificationCategory.SYSTEM,
  ],
  bookings: [NotificationCategory.BOOKING],
  payments: [NotificationCategory.PAYMENT],
  mentions: [NotificationCategory.MENTION],
};

const TAB_TO_QUERY_CATEGORY: Partial<Record<Tab, NotificationCategory>> = {
  bookings: NotificationCategory.BOOKING,
  payments: NotificationCategory.PAYMENT,
  mentions: NotificationCategory.MENTION,
};

function formatTimestamp(dateValue: string) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "now";
  return formatDistanceToNow(date, { addSuffix: true });
}

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("all");

  const listQuery = useNotifications(
    {
      page: 1,
      limit: 50,
      category: TAB_TO_QUERY_CATEGORY[tab],
    },
    open,
  );
  const unreadQuery = useUnreadNotificationCount(open);
  const markAllReadMutation = useMarkAllAsRead();
  const markAsReadMutation = useMarkAsRead();

  const notifications = listQuery.data?.notifications ?? [];

  const filtered = notifications.filter((n) =>
    CATEGORY_MAP[tab].includes(n.category),
  );

  const unreadCount = unreadQuery.data?.count ?? 0;
  const unreadByCategory = unreadQuery.data?.by_category;

  const tabUnreadCount = (tabKey: Tab) => {
    if (!unreadByCategory) return 0;
    if (tabKey === "all") return unreadCount;

    return CATEGORY_MAP[tabKey].reduce(
      (sum, category) => sum + (unreadByCategory[category] ?? 0),
      0,
    );
  };

  const isLoading = listQuery.isLoading;

  const markAllRead = async () => {
    await markAllReadMutation.mutateAsync();
    await Promise.all([listQuery.refetch(), unreadQuery.refetch()]);
  };

  const handleNotificationClick = async (
    notificationId: string,
    isRead: boolean,
    actionUrl?: string,
  ) => {
    if (!isRead && !markAsReadMutation.isPending) {
      await markAsReadMutation.mutateAsync(notificationId);
      await Promise.all([listQuery.refetch(), unreadQuery.refetch()]);
    }

    if (typeof actionUrl === "string") {
      const nextPath = resolveNotificationLink(actionUrl, user?.role);
      onClose();
      router.push(nextPath);
    }
  };

  return (
    <Drawer open={open} onClose={onClose} title="Notifications" width={400}>
      <div
        className="flex items-center justify-between border-b border-border px-6 py-3"
      >
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-(--r-full) px-2.5 py-1 text-[12px] font-medium capitalize transition-colors ${
                tab === t
                  ? "bg-ink text-bg"
                  : "text-fg-3 hover:bg-bg-2 hover:text-fg"
              }`}
              style={{ transitionDuration: "var(--motion-fast)" }}
            >
              {t}
              {tabUnreadCount(t) > 0 ? ` (${tabUnreadCount(t)})` : ""}
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            disabled={markAllReadMutation.isPending}
            className="text-[12px] font-medium text-fg-3 underline underline-offset-2 hover:text-ink"
          >
            {markAllReadMutation.isPending ? "Marking..." : "Mark all read"}
          </button>
        )}
      </div>
      <div>
        {isLoading ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <p className="text-[13.5px] text-fg-3">Loading notifications...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <p className="text-[13.5px] text-fg-3">No notifications</p>
          </div>
        ) : (
          filtered.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleNotificationClick(n.id, n.isRead, n.actionUrl)}
              className={`flex gap-3 border-b border-border px-6 py-4 ${
                n.isRead ? "" : "bg-signal-soft/30"
              }`}
              style={{ width: "100%", textAlign: "left" }}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--r-2) bg-bg-2 font-mono text-[11px] font-medium uppercase text-fg-3">
                {n.title.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-[13.5px] leading-snug ${n.isRead ? "text-fg" : "font-medium text-ink"}`}>
                    {n.title}
                  </p>
                  {!n.isRead && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-3">
                  {n.message}
                </p>
                <p
                  className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-fg-4"
                >
                  {formatTimestamp(n.createdAt)}
                </p>
              </div>
            </button>
          ))
        )}
      </div>
    </Drawer>
  );
}
