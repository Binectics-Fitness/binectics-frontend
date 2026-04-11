"use client";

import Link from "next/link";
import { useNotificationCount } from "@/hooks/useNotificationCount";

interface NotificationBellProps {
  collapsed?: boolean;
}

export default function NotificationBell({
  collapsed = false,
}: NotificationBellProps) {
  const { count } = useNotificationCount();

  return (
    <Link
      href="/dashboard/notifications"
      className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-all duration-200 hover:bg-neutral-200 hover:text-foreground ${collapsed ? "justify-center" : ""}`}
      title={collapsed ? "Notifications" : ""}
    >
      <span className="relative flex-shrink-0 text-foreground-tertiary">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
      {!collapsed && "Notifications"}
    </Link>
  );
}
