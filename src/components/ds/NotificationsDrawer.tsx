"use client";

import { useState } from "react";
import { Drawer } from "./Drawer";
import { DEMO_NOTIFICATIONS, type NotificationItem } from "@/lib/constants/notifications";

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

const TABS = ["all", "bookings", "payments", "mentions"] as const;
type Tab = (typeof TABS)[number];

const CATEGORY_MAP: Record<Tab, NotificationItem["category"][]> = {
  all: ["booking", "payment", "mention", "system"],
  bookings: ["booking"],
  payments: ["payment"],
  mentions: ["mention"],
};

export function NotificationsDrawer({ open, onClose }: NotificationsDrawerProps) {
  const [tab, setTab] = useState<Tab>("all");
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);

  const filtered = notifications.filter((n) =>
    CATEGORY_MAP[tab].includes(n.category),
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            </button>
          ))}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-[12px] font-medium text-fg-3 underline underline-offset-2 hover:text-ink"
          >
            Mark all read
          </button>
        )}
      </div>
      <div>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <p className="text-[13.5px] text-fg-3">No notifications</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              className={`flex gap-3 border-b border-border px-6 py-4 ${
                n.read ? "" : "bg-signal-soft/30"
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-(--r-2) bg-bg-2 font-mono text-[11px] font-medium uppercase text-fg-3">
                {n.title.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-[13.5px] leading-snug ${n.read ? "text-fg" : "font-medium text-ink"}`}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" />
                  )}
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-fg-3">
                  {n.body}
                </p>
                <p
                  className="mt-1 font-mono text-[10.5px] uppercase tracking-wide text-fg-4"
                >
                  {n.timestamp}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </Drawer>
  );
}
