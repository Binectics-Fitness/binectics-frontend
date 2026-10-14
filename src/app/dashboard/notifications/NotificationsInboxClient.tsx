"use client";

import { useState } from "react";
import { AsyncSpinner, EmptySlate, NotificationIconTile, DSCard, Eyebrow } from "@/components/ds";
import { RoleShell } from "@/components/ds/RoleShell";
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
import Link from "next/link";
import { resolveNotificationTarget } from "@/utils/resolveNotificationLink";
import { renewHrefForNotification } from "@/lib/billing/autoRenew";
import { NOTIFICATION_SETTINGS_HREF } from "@/lib/constants/routes";

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

    const nextPath = resolveNotificationTarget(item, user?.role);
    router.push(nextPath);
  };

  const onMarkAll = async () => {
    await markAllAsReadMutation.mutateAsync();
    await Promise.all([listQuery.refetch(), unreadQuery.refetch()]);
  };

  // Wrapped in the signed-in user's own dashboard chrome. The inbox used to
  // render as a bare full-page card, so now that the shells link here the
  // visitor would otherwise land somewhere with no navigation back.
  return (
    <RoleShell
      activeItem="Notifications"
      memberActiveLabel="Notifications"
      crumb="Notifications"
    >
      <div className="mx-auto w-full max-w-5xl">
        <DSCard>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <div>
              <Eyebrow as="p">Notifications</Eyebrow>
              <h1 className="text-xl font-semibold text-ink sm:text-2xl">Inbox</h1>
            </div>
            <div className="flex items-center gap-2">
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
              {/* What reaches you, and how, is set in account settings. */}
              <Link
                href={NOTIFICATION_SETTINGS_HREF}
                aria-label="Notification settings"
                title="Notification settings"
                className="inline-flex h-9 w-9 items-center justify-center rounded-(--r-2) border border-border text-fg-2 hover:bg-bg-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
                </svg>
              </Link>
            </div>
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
              notifications.map((item) => {
                const renewHref = renewHrefForNotification(item);
                return (
                <div key={item.id} className={`border-b border-border ${item.isRead ? "" : "bg-bg-2"}`}>
                <button
                  type="button"
                  onClick={() => onOpen(item)}
                  className="flex w-full gap-3 px-5 py-4 text-left sm:px-6"
                >
                  <NotificationIconTile type={item.type} category={item.category} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${item.isRead ? "text-fg" : "font-medium text-ink"}`}>
                        {item.title}
                      </p>
                      {!item.isRead && <span className="mt-1.5 h-2 w-2 rounded-full bg-signal" />}
                    </div>
                    <p className="mt-1 text-sm text-fg-3">{item.message}</p>
                    <Eyebrow as="p" className="mt-1">
                      {relativeTime(item.createdAt)}
                    </Eyebrow>
                  </div>
                </button>
                {renewHref && (
                  <div className="-mt-1 pb-4 pl-[64px] pr-5 sm:pl-[68px] sm:pr-6">
                    <Link href={renewHref} className="btn-primary-v2 md inline-flex" aria-label={`Renew: ${item.title}`}>
                      Renew
                    </Link>
                  </div>
                )}
                </div>
                );
              })
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
        </DSCard>
      </div>
    </RoleShell>
  );
}
