"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";

/**
 * Account popover for the dashboard shells — the shells had NO logout at
 * all (the only one lived in the marketing navbar's avatar menu), and
 * platform admins had no way into /admin from their own dashboard.
 * Wraps any trigger (sidebar footer row, topbar avatar chip).
 */
export function ShellAccountMenu({
  trigger,
  direction = "up",
}: {
  trigger: ReactNode;
  /** Popover opens above (sidebar footers) or below (topbar chips). */
  direction?: "up" | "down";
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const items: { href: string; label: string }[] = [
    { href: "/dashboard/settings/profile", label: "Profile" },
    { href: "/dashboard/settings", label: "Settings" },
    ...(user?.is_admin && user.role !== UserRole.ADMIN
      ? [{ href: "/admin/dashboard", label: "Admin panel" }]
      : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="w-full text-left"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute z-50 min-w-[180px] rounded-(--r-2) py-1.5"
          style={{
            [direction === "up" ? "bottom" : "top"]: "calc(100% + 8px)",
            right: 0,
            background: "var(--bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          }}
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3.5 py-2 text-[13.5px] hover:bg-bg-2"
              style={{ color: "var(--fg-2)", textDecoration: "none" }}
            >
              {item.label}
            </Link>
          ))}
          <div style={{ borderTop: "1px solid var(--border)", margin: "6px 0" }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
            className="block w-full px-3.5 py-2 text-left text-[13.5px] hover:bg-bg-2"
            style={{ color: "var(--danger)", background: "none", border: "none", cursor: "pointer" }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
