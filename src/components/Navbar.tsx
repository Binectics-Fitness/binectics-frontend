"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  ChevronDown,
  User as UserIcon,
} from "lucide-react";
import MobileNav from "./MobileNav";

const MARKETING_LINKS = [
  { href: "/#features", label: "Features", match: "/#features" },
  { href: "/#how-it-works", label: "How it Works", match: "/#how-it-works" },
  { href: "/pricing", label: "Pricing", match: "/pricing" },
  { href: "/marketplace", label: "Marketplace", match: "/marketplace" },
  { href: "/#faq", label: "FAQ", match: "/#faq" },
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
  if (href.startsWith("/#")) return false;
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
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-background-secondary shadow-[0_1px_3px_rgb(0_0_0/0.04)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500 focus-visible:ring-offset-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
              <span className="text-xl font-bold text-foreground">B</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Binectics
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {MARKETING_LINKS.map((link) => {
              const active = isActiveLink(pathname, link.match);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500 focus-visible:ring-offset-2 ${
                    active
                      ? "text-accent-blue-600"
                      : "text-foreground-secondary hover:text-accent-blue-500"
                  }`}
                >
                  {link.label}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent-blue-500"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="hidden lg:inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-neutral-100 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500"
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
                  Dashboard
                </Link>

                {/* User menu */}
                <div className="relative hidden lg:block" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    className="flex h-10 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 pr-3 text-sm font-medium text-foreground transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500"
                  >
                    <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {user.profile_picture ? (
                        <Image
                          src={user.profile_picture}
                          alt=""
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      ) : (
                        getInitials(user.first_name, user.last_name)
                      )}
                    </span>
                    <span className="max-w-[8rem] truncate">
                      {user.first_name || user.email}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 text-foreground-tertiary transition-transform ${
                        menuOpen ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-neutral-200 bg-white shadow-lg ring-1 ring-black/5 focus:outline-none"
                    >
                      <div className="border-b border-neutral-100 px-4 py-3">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {fullName}
                        </div>
                        <div className="text-xs text-foreground-tertiary truncate">
                          {user.email}
                        </div>
                      </div>
                      <div className="py-1">
                        <Link
                          href={dashboardHref}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-neutral-50"
                        >
                          <LayoutDashboard
                            className="h-4 w-4 text-foreground-tertiary"
                            aria-hidden="true"
                          />
                          Dashboard
                        </Link>
                        <Link
                          href={`${dashboardHref}/profile`}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-neutral-50"
                        >
                          <UserIcon
                            className="h-4 w-4 text-foreground-tertiary"
                            aria-hidden="true"
                          />
                          Profile
                        </Link>
                        <Link
                          href={`${dashboardHref}/settings`}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-neutral-50"
                        >
                          <Settings
                            className="h-4 w-4 text-foreground-tertiary"
                            aria-hidden="true"
                          />
                          Settings
                        </Link>
                      </div>
                      <div className="border-t border-neutral-100 py-1">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setMenuOpen(false);
                            logout();
                          }}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" aria-hidden="true" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden lg:inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-foreground-secondary transition-colors hover:bg-neutral-100 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500"
                >
                  <LogIn className="h-4 w-4" aria-hidden="true" />
                  Sign In
                </Link>
                <Link
                  href="/register"
                  prefetch={false}
                  className="hidden lg:inline-flex h-10 items-center justify-center rounded-lg bg-primary-500 px-5 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600 active:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  Join Free
                </Link>
              </>
            )}
            <MobileNav />
          </div>
        </div>
      </div>
    </header>
  );
}
