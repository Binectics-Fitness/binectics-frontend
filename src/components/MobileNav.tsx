"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import {
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  LogOut,
  Settings,
  User as UserIcon,
} from "lucide-react";

const MARKETING_LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it Works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/#faq", label: "FAQ" },
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

export default function MobileNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname() ?? "/";
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll + close on Escape when open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  // Auto-close on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const dashboardHref = user ? getDashboardRoute(user.role) : "/dashboard";
  const fullName = user
    ? `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() || user.email
    : "";

  const close = () => setIsOpen(false);

  const menuContent = (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-full max-w-sm transform bg-background shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
            <Link
              href="/"
              onClick={close}
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-500">
                <span className="text-base font-bold text-foreground">B</span>
              </div>
              <span className="text-lg font-bold text-foreground">
                Binectics
              </span>
            </Link>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User card (when signed in) */}
          {user && (
            <div className="border-b border-neutral-200 px-5 py-4">
              <Link
                href={dashboardHref}
                onClick={close}
                className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 transition-colors hover:bg-neutral-100"
              >
                <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                  {user.profile_picture ? (
                    <Image
                      src={user.profile_picture}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                    />
                  ) : (
                    getInitials(user.first_name, user.last_name)
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-foreground truncate">
                    {fullName}
                  </div>
                  <div className="text-xs text-foreground-tertiary truncate">
                    {user.email}
                  </div>
                </div>
              </Link>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Marketing */}
            <div className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
              Explore
            </div>
            <ul className="space-y-1">
              {MARKETING_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      className={`flex items-center rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                        active
                          ? "bg-accent-blue-50 text-accent-blue-700"
                          : "text-foreground-secondary hover:bg-neutral-100 hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Account */}
            <div className="mt-6 px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-foreground-tertiary">
              Account
            </div>
            <ul className="space-y-1">
              {user ? (
                <>
                  <li>
                    <Link
                      href={dashboardHref}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
                    >
                      <LayoutDashboard className="h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`${dashboardHref}/profile`}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
                    >
                      <UserIcon className="h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`${dashboardHref}/settings`}
                      onClick={close}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
                    >
                      <Settings className="h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                      Settings
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
                  >
                    <LogIn className="h-5 w-5 text-foreground-tertiary" aria-hidden="true" />
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Footer CTA */}
          <div className="border-t border-neutral-200 p-4">
            {user ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Logout
              </button>
            ) : (
              <Link
                href="/register"
                prefetch={false}
                onClick={close}
                className="flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-primary-600"
              >
                Join Free
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-lg text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue-500"
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}
