/**
 * DashboardTopbar — shared topbar for all dashboard pages
 * Height: 56px (h-14), border-bottom, bg: --bg
 * Contains: search bar + notification bell + user avatar
 */
"use client";

import { Search, Bell } from "lucide-react";

interface DashboardTopbarProps {
  searchPlaceholder?: string;
  notificationCount?: number;
  userName?: string;
  userInitials?: string;
}

export function DashboardTopbar({
  searchPlaceholder = "Search…",
  notificationCount = 0,
  userName = "User",
  userInitials = "U",
}: DashboardTopbarProps) {
  return (
    <header
      className="flex items-center justify-between h-14 px-5 sm:px-7 sticky top-0 z-10"
      style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
    >
      {/* Search */}
      <div
        className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-[var(--r-2)] w-70 text-[13px]"
        style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-3)" }}
      >
        <Search size={14} strokeWidth={1.5} />
        <span className="flex-1">{searchPlaceholder}</span>
        <span
          className="font-mono text-[10.5px] px-1.25 py-px rounded-[3px]"
          style={{ border: "1px solid var(--border)", color: "var(--fg-3)" }}
        >
          ⌘ K
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Notification bell */}
        <button
          className="w-8 h-8 rounded-[var(--r-2)] flex items-center justify-center relative"
          style={{
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--fg-2)",
            transition: "border-color var(--motion-fast) var(--ease)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-2)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <Bell size={15} strokeWidth={1.5} />
          {notificationCount > 0 && (
            <span
              className="absolute -top-1 -right-1 w-[15px] h-[15px] rounded-full flex items-center justify-center text-[9px] font-medium"
              style={{ background: "var(--danger)", color: "var(--bg)" }}
            >
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          )}
        </button>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-medium"
          style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
          title={userName}
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
}
