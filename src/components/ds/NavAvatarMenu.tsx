"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import {
  LayoutDashboard,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronDown,
} from "lucide-react";

function getInitials(first?: string, last?: string) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return "?";
  return ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || f.slice(0, 2).toUpperCase();
}

export function NavAvatarMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  if (!user) return null;

  const dashboardHref = getDashboardRoute(user.role);
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email;

  const menuItems = [
    { href: dashboardHref, label: "Dashboard", icon: LayoutDashboard },
    { href: `${dashboardHref}/profile`, label: "Profile", icon: UserIcon },
    { href: `${dashboardHref}/settings`, label: "Settings", icon: Settings },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex h-8 items-center gap-1.5 rounded-(--r-2) px-1.5 transition-colors"
        style={{
          border: "1px solid var(--border)",
          background: isOpen ? "var(--bg-2)" : "var(--bg)",
          color: "var(--fg-2)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "var(--bg-2)";
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.background = "var(--bg)";
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Account menu"
      >
        <span
          className="relative flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold overflow-hidden"
          style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}
        >
          {user.profile_picture ? (
            <Image src={user.profile_picture} alt="" fill sizes="24px" className="object-cover" />
          ) : (
            getInitials(user.first_name, user.last_name)
          )}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          style={{ color: "var(--fg-3)" }}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-(--r-3) overflow-hidden"
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 30px oklch(0 0 0 / 0.08)",
          }}
        >
          <div className="px-3.5 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="text-[13px] font-medium truncate" style={{ color: "var(--ink)" }}>
              {fullName}
            </div>
            <div className="text-[11px] font-mono truncate" style={{ color: "var(--fg-3)" }}>
              {user.email}
            </div>
          </div>

          <div className="py-1">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                role="menuitem"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors"
                style={{ color: "var(--fg-2)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg-2)";
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--fg-2)";
                }}
              >
                <item.icon className="h-3.5 w-3.5 opacity-60" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="py-1" style={{ borderTop: "1px solid var(--border)" }}>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] transition-colors"
              style={{ color: "oklch(0.55 0.20 25)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "oklch(0.55 0.20 25 / 0.06)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
