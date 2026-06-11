"use client";

import { useEffect, useMemo, useState } from "react";
import {
  NotificationType,
  notificationsService,
  type NotificationItem,
} from "@/lib/api/notifications";

type InboxRole = "member" | "trainer" | "dietitian";

type Props = {
  role: InboxRole;
};

const MESSAGE_LIKE_TYPES = new Set<NotificationType>([
  NotificationType.CLIENT_INVITATION,
  NotificationType.CLIENT_REQUEST,
  NotificationType.CLIENT_ACCEPTED,
  NotificationType.CLIENT_DEPARTED,
  NotificationType.TEAM_INVITATION,
  NotificationType.TEAM_MEMBER_JOINED,
  NotificationType.TEAM_MEMBER_REMOVED,
  NotificationType.SYSTEM_ANNOUNCEMENT,
  NotificationType.REVIEW_RESPONSE,
]);

function formatWhen(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function InboxActivityPanel({ role }: Props) {
  const [rows, setRows] = useState<NotificationItem[]>([]);
  const [query, setQuery] = useState("");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const quickLink =
    role === "member"
      ? "/dashboard/bookings"
      : role === "trainer"
        ? "/dashboard/trainer/clients"
        : "/dashboard/dietitian/clients";

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const res = await notificationsService.getNotifications({ page: 1, limit: 50 });

      if (!mounted) return;

      if (res.success && res.data) {
        const filtered = res.data.notifications.filter(
          (n) => MESSAGE_LIKE_TYPES.has(n.type) || n.category === "mention",
        );
        setRows(filtered);
      } else {
        setRows([]);
      }

      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((r) => {
      if (showUnreadOnly && r.isRead) return false;
      if (!q) return true;

      return (
        r.title.toLowerCase().includes(q) ||
        r.message.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q)
      );
    });
  }, [query, rows, showUnreadOnly]);

  const unreadCount = useMemo(() => rows.filter((r) => !r.isRead).length, [rows]);

  const onMarkRead = async (id: string) => {
    const res = await notificationsService.markAsRead(id);
    if (!res.success) return;

    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, isRead: true, readAt: res.data?.readAt ?? row.readAt } : row)),
    );
  };

  const onMarkAllRead = async () => {
    const res = await notificationsService.markAllAsRead();
    if (!res.success) return;

    setRows((prev) => prev.map((row) => ({ ...row, isRead: true })));
  };

  return (
    <section className="rounded-(--r-3) border p-4 sm:p-6" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Inbox activity
          </p>
          <h1 className="mt-1 text-[26px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
            Messages and updates
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: "var(--fg-3)" }}>
            {loading ? "Loading inbox..." : `${visibleRows.length} items · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost-v2 sm" onClick={onMarkAllRead}>
            Mark all read
          </button>
          <a href={quickLink} className="btn-primary-v2 sm">
            Open related work
          </a>
        </div>
      </div>

      <div className="mt-4 rounded-(--r-2) border px-3 py-2" style={{ borderColor: "var(--border)", background: "var(--bg-2)" }}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8 flex-1 rounded-(--r-2) px-3 text-[13px]"
            style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
            placeholder="Search title, message, or type..."
          />
          <label className="inline-flex items-center gap-2 text-[12px]" style={{ color: "var(--fg-2)" }}>
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
            />
            Unread only
          </label>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {visibleRows.map((row) => (
          <article
            key={row.id}
            className="rounded-(--r-2) border p-3"
            style={{
              borderColor: row.isRead ? "var(--border)" : "var(--signal)",
              background: row.isRead ? "var(--bg)" : "var(--signal-soft)",
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                  {row.title}
                </h2>
                <p className="mt-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
                  {row.message}
                </p>
                <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                  {row.type.replaceAll("_", " ")} · {formatWhen(row.createdAt)}
                </p>
              </div>
              {!row.isRead && (
                <button className="btn-ghost-v2 sm" onClick={() => void onMarkRead(row.id)}>
                  Mark read
                </button>
              )}
            </div>
          </article>
        ))}

        {!loading && visibleRows.length === 0 && (
          <div className="rounded-(--r-2) border p-4 text-[13px]" style={{ borderColor: "var(--border)", color: "var(--fg-3)" }}>
            No inbox activity found.
          </div>
        )}
      </div>
    </section>
  );
}
