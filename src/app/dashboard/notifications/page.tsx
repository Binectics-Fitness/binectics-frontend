"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DietitianSidebar from "@/components/DietitianSidebar";
import TrainerSidebar from "@/components/TrainerSidebar";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import {
  notificationsService,
  type NotificationItem,
  type NotificationPagination,
  NotificationType,
} from "@/lib/api/notifications";
import { resolveNotificationLink } from "@/utils/resolveNotificationLink";

type FilterTab = "all" | "unread";

const TYPE_LABELS: Record<string, string> = {
  BOOKING: "Booking",
  CLIENT: "Client",
  MARKETPLACE: "Marketplace",
  REVIEW: "Review",
  PLAN: "Plan",
  TEAM: "Team",
  SUBSCRIPTION: "Payment",
  PAYMENT: "Payment",
  VERIFICATION: "Verification",
  SYSTEM: "System",
  ACCOUNT: "System",
  DIET: "Plan",
  WORKOUT: "Plan",
  JOURNAL: "Plan",
};

function getTypeCategory(type: NotificationType): string {
  const prefix = type.split("_")[0];
  return TYPE_LABELS[prefix] ?? "Other";
}

function getTypeColor(type: NotificationType): string {
  const prefix = type.split("_")[0];
  switch (prefix) {
    case "BOOKING":
      return "bg-accent-blue-100 text-accent-blue-700";
    case "PAYMENT":
    case "SUBSCRIPTION":
      return "bg-accent-yellow-100 text-accent-yellow-700";
    case "VERIFICATION":
      return "bg-primary-100 text-primary-700";
    case "TEAM":
      return "bg-accent-purple-100 text-accent-purple-700";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return `${diffD}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAuthorized = !authLoading && !!user;

  const Sidebar =
    user?.role === UserRole.DIETITIAN
      ? DietitianSidebar
      : user?.role === UserRole.TRAINER
        ? TrainerSidebar
        : user?.role === UserRole.GYM_OWNER
          ? GymOwnerSidebar
          : DashboardSidebar;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<NotificationPagination | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchNotifications = useCallback(async (p: number, tab: FilterTab) => {
    setIsLoading(true);
    try {
      const res = await notificationsService.getNotifications({
        page: p,
        limit: 20,
        ...(tab === "unread" ? { is_read: false } : {}),
      });
      if (res.success && res.data) {
        setNotifications(res.data.notifications);
        setPagination(res.data.pagination);
      }
    } catch {
      // fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthorized) return;
    fetchNotifications(page, filter);
  }, [authLoading, isAuthorized, page, filter, fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      const res = await notificationsService.markAllAsRead();
      if (res.success) {
        setNotifications((prev) =>
          prev.map((n) => ({
            ...n,
            isRead: true,
            readAt: new Date().toISOString(),
          })),
        );
      }
    } catch {
      // fail silently
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.isRead) {
      try {
        await notificationsService.markAsRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id
              ? { ...n, isRead: true, readAt: new Date().toISOString() }
              : n,
          ),
        );
      } catch {
        // fail silently
      }
    }
    const link = resolveNotificationLink(notification.actionUrl);
    router.push(link);
  };

  const handleFilterChange = (tab: FilterTab) => {
    setFilter(tab);
    setPage(1);
  };

  if (authLoading || !isAuthorized || !user) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 md:ml-64">
          <DashboardLoading />
        </main>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar />
      <main className="flex-1 pt-20 md:ml-64 md:pt-0">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                Notifications
              </h1>
              <p className="mt-1 text-sm text-foreground/60">
                Stay up to date with your activity
              </p>
            </div>
            {unreadCount > 0 && filter === "all" && (
              <button
                onClick={handleMarkAllRead}
                className="self-start rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100 sm:self-auto"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2">
            {(["all", "unread"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => handleFilterChange(tab)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  filter === tab
                    ? "bg-foreground text-white"
                    : "bg-white text-foreground/70 hover:bg-neutral-100"
                }`}
              >
                {tab === "all" ? "All" : "Unread"}
              </button>
            ))}
          </div>

          {/* Notification List */}
          <div className="space-y-2">
            {isLoading ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-[var(--shadow-card)]">
                <p className="text-sm text-foreground/60">
                  Loading notifications…
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-xl bg-white p-12 text-center shadow-[var(--shadow-card)]">
                <svg
                  className="mx-auto h-12 w-12 text-foreground/20"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                <p className="mt-4 text-sm font-semibold text-foreground/60">
                  {filter === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
                </p>
                <p className="mt-1 text-sm text-foreground/40">
                  {filter === "unread"
                    ? "You're all caught up!"
                    : "We'll notify you when something important happens."}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors sm:p-5 ${
                    notification.isRead
                      ? "border-neutral-200 bg-white hover:bg-neutral-50"
                      : "border-primary-200 bg-primary-50/30 hover:bg-primary-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Unread dot */}
                    <div className="mt-1.5 flex-shrink-0">
                      {!notification.isRead ? (
                        <span className="block h-2.5 w-2.5 rounded-full bg-primary-500" />
                      ) : (
                        <span className="block h-2.5 w-2.5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p
                          className={`text-sm font-semibold ${notification.isRead ? "text-foreground/70" : "text-foreground"}`}
                        >
                          {notification.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getTypeColor(notification.type)}`}
                          >
                            {getTypeCategory(notification.type)}
                          </span>
                          <span className="whitespace-nowrap text-xs text-foreground/40">
                            {timeAgo(notification.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                        {notification.message}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-foreground/60">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.totalPages, p + 1))
                }
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
