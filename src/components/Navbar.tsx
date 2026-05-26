"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import {
  LayoutDashboard,
  LogOut,
  Settings,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import { BinecticsLockup } from "./BinecticsLogo";
import MobileNav from "./MobileNav";

/**
 * Navbar — marketing topbar.
 * Sticky, 56px, backdrop-blur, 1px bottom border.
 * Matches shared.css .topbar pattern.
 */

const MARKETING_LINKS = [
  { href: "#how", label: "How it works" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "#roles", label: "For providers" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

function getInitials(first?: string, last?: string) {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return "?";
  return (
    ((f[0] ?? "") + (l[0] ?? "")).toUpperCase() || f.slice(0, 2).toUpperCase()
  );
}

function isActiveLink(pathname: string, href: string) {
  if (href.startsWith("#")) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? "/";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const dashboardHref = user ? getDashboardRoute(user.role) : "/dashboard";
  const fullName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email
    : "";

  return (
    <header
      className="sticky top-0 z-50 border-b border-border"
      style={{
        background: "oklch(0.985 0.005 85 / 0.85)",
        backdropFilter: "blur(8px) saturate(140%)",
        WebkitBackdropFilter: "blur(8px) saturate(140%)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-360 items-center justify-between px-5 sm:px-10">
        {/* Logo */}
        <Link href="/" className="focus:outline-none">
          <BinecticsLockup />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1" aria-label="Main navigation">
          {MARKETING_LINKS.map((link) => {
            const active = isActiveLink(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-1.5 rounded-(--r-2) text-[13.5px] ${
                  active
                    ? "text-ink bg-bg-2"
                    : "text-fg-2 hover:text-ink hover:bg-bg-2"
                }`}
                style={{ letterSpacing: "-0.005em" }}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative hidden lg:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Open account menu"
                className="flex h-8 items-center gap-2 rounded-(--r-2) border border-border bg-bg px-2 text-[13px] text-fg-2 hover:bg-bg-2 hover:text-ink"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-bg-3 text-[11px] font-semibold text-fg-2 overflow-hidden">
                  {user.profile_picture ? (
                    <Image
                      src={user.profile_picture}
                      alt=""
                      fill
                      sizes="24px"
                      className="object-cover"
                    />
                  ) : (
                    getInitials(user.first_name, user.last_name)
                  )}
                </span>
                <ChevronDown
                  className={`h-3 w-3 text-fg-3 transition-transform ${
                    menuOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 rounded-(--r-3) border border-border bg-bg"
                  style={{ boxShadow: "var(--shadow-2)" }}
                >
                  <div className="border-b border-border px-3.5 py-3">
                    <div className="text-[13px] font-medium text-ink truncate">
                      {fullName}
                    </div>
                    <div className="text-[11px] font-mono text-fg-3 truncate">
                      {user.email}
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href={dashboardHref}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-fg-2 hover:bg-bg-2 hover:text-ink"
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                      Dashboard
                    </Link>
                    <Link
                      href="/dashboard/settings/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-fg-2 hover:bg-bg-2 hover:text-ink"
                    >
                      <UserIcon className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                      Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2 text-[13px] text-fg-2 hover:bg-bg-2 hover:text-ink"
                    >
                      <Settings className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
                      Settings
                    </Link>
                  </div>
                  <div className="border-t border-border py-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-[13px] text-danger hover:bg-danger-soft"
                    >
                      <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden lg:inline-flex h-7 items-center px-2.5 rounded-(--r-2) text-[13.5px] border border-border hover:bg-bg-2"
                style={{ letterSpacing: "-0.005em", color: "var(--fg-2)" }}
              >
                Log in
              </Link>
              <Link
                href="/register"
                prefetch={false}
                className="hidden lg:inline-flex h-7 items-center px-2.5 rounded-(--r-2) text-[13.5px] bg-ink hover:bg-[oklch(0.08_0.008_80)]"
                style={{ letterSpacing: "-0.005em", color: "var(--bg)" }}
              >
                Get started
              </Link>
            </>
          )}
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
