"use client";

import { useState } from "react";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  NotificationCategory,
  type NotificationItem,
  type NotificationUnreadByCategory,
} from "@/lib/api/notifications";
import {
  useMarkAllAsRead,
  useMarkAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from "@/lib/queries/notifications";
import { resolveNotificationLink } from "@/utils/resolveNotificationLink";

const TABS = ["all", "bookings", "payments", "mentions", "system"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  all: "All",
  bookings: "Bookings",
  payments: "Payments",
  mentions: "Mentions",
  system: "System",
};

const TAB_CATEGORY: Partial<Record<Tab, NotificationCategory>> = {
  bookings: NotificationCategory.BOOKING,
  payments: NotificationCategory.PAYMENT,
  mentions: NotificationCategory.MENTION,
  system: NotificationCategory.SYSTEM,
};

function relativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "now";
  return formatDistanceToNow(date, { addSuffix: true });
}

function toTabCount(tab: Tab, total: number, byCategory?: NotificationUnreadByCategory) {
  if (!byCategory) return tab === "all" ? total : 0;
  if (tab === "all") return total;

  const category = TAB_CATEGORY[tab];
  if (!category) return 0;
  return byCategory[category] ?? 0;
}

export default function NotificationsInboxClient() {
  const router = useRouter();
  const { user } = useAuth();

  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);

  const listQuery = useNotifications(
    {
      page,
      limit: 20,
      category: TAB_CATEGORY[tab],
    },
    true,
  );
  const unreadQuery = useUnreadNotificationCount(true);

  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const unreadTotal = unreadQuery.data?.count ?? 0;
  const unreadByCategory = unreadQuery.data?.by_category;

  const notifications = listQuery.data?.notifications ?? [];
  const pagination = listQuery.data?.pagination;

  const onTabChange = (next: Tab) => {
    setTab(next);
    setPage(1);
  };

  const onOpen = async (item: NotificationItem) => {
    if (!item.isRead && !markAsReadMutation.isPending) {
      await markAsReadMutation.mutateAsync(item.id);
    }

    const nextPath = resolveNotificationLink(item.actionUrl, user?.role);
    router.push(nextPath);
  };

  const onMarkAll = async () => {
    await markAllAsReadMutation.mutateAsync();
    await Promise.all([listQuery.refetch(), unreadQuery.refetch()]);
  };

  return (
    <div className="min-h-screen bg-bg-2 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-(--r-3) border border-border bg-bg">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-fg-3">
                Notifications
              </p>
              <h1 className="text-xl font-semibold text-ink sm:text-2xl">Inbox</h1>
            </div>
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={onMarkAll}
                disabled={markAllAsReadMutation.isPending}
                className="rounded-(--r-2) border border-border px-3 py-2 text-sm font-medium text-fg-2 hover:bg-bg-2"
              >
                {markAllAsReadMutation.isPending ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 border-b border-border px-5 py-3 sm:px-6">
            {TABS.map((item) => {
              const count = toTabCount(item, unreadTotal, unreadByCategory);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => onTabChange(item)}
                  className={`rounded-(--r-full) px-3 py-1.5 text-sm font-medium transition-colors ${
                    tab === item
                      ? "bg-ink text-bg"
                      : "text-fg-3 hover:bg-bg-2 hover:text-fg"
                  }`}
                >
                  {TAB_LABELS[item]}{count > 0 ? ` (${count})` : ""}
                </button>
              );
            })}
          </div>

          <div>
            {listQuery.isLoading ? (
              <div className="px-6 py-4"><AsyncSpinner label="Loading notifications" /></div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-4"><EmptySlate message="No notifications in this category." /></div>
            ) : (
              notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpen(item)}
                  className={`flex w-full gap-3 border-b border-border px-5 py-4 text-left sm:px-6 ${
                    item.isRead ? "" : "bg-signal-soft/30"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-(--r-2) bg-bg-2 font-mono text-[11px] uppercase text-fg-3">
                    {item.title.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${item.isRead ? "text-fg" : "font-medium text-ink"}`}>
                        {item.title}
                      </p>
                      {!item.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-signal" />}
                    </div>
                    <p className="mt-1 text-sm text-fg-3">{item.message}</p>
                    <p className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
                      {relativeTime(item.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 sm:px-6">
              <p className="text-sm text-fg-3">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={pagination.page <= 1 || listQuery.isFetching}
                  className="rounded-(--r-2) border border-border px-3 py-1.5 text-sm text-fg-2 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.page >= pagination.totalPages || listQuery.isFetching}
                  className="rounded-(--r-2) border border-border px-3 py-1.5 text-sm text-fg-2 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
