"use client";

import Link from "next/link";
import { useNotificationCount } from "@/hooks/useNotificationCount";

/**
 * ShellNotificationBell — the compact bell that lives in dashboard chrome.
 *
 * The notifications inbox (/dashboard/notifications) is fully built but was
 * unreachable from any shell's navigation. This is the single entry point,
 * shared by the member top nav and every provider shell header so the inbox
 * is one click away whatever role you signed in as.
 *
 * The count comes from useNotificationCount, which streams over SSE and falls
 * back to polling — so the badge stays live without the page reloading.
 *
 * `NotificationBell` (components/NotificationBell.tsx) is the full-width
 * sidebar-row variant used by AppSidebar; this one is the 32px icon button
 * that matches the other controls in the dashboard headers.
 */
export function ShellNotificationBell() {
  const { count } = useNotificationCount();
  const label = count > 0 ? `Notifications (${count} unread)` : "Notifications";

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex items-center justify-center shrink-0"
      style={{
        width: 32,
        height: 32,
        border: "1px solid var(--border)",
        borderRadius: "var(--r-2)",
        background: "var(--bg)",
        color: "var(--fg-2)",
      }}
      aria-label={label}
      title={label}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M14 21a2 2 0 0 1-4 0" />
      </svg>
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute font-mono flex items-center justify-center"
          style={{
            top: -5,
            right: -5,
            minWidth: 16,
            height: 16,
            padding: "0 4px",
            borderRadius: "var(--r-full)",
            background: "var(--danger)",
            color: "var(--bg)",
            fontSize: 10,
            fontWeight: 600,
            lineHeight: 1,
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
