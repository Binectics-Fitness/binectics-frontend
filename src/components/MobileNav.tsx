"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardRoute } from "@/lib/constants/routes";
import { BinecticsLockup } from "./BinecticsLogo";
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
          className="fixed inset-0 z-[9998] backdrop-blur-sm lg:hidden"
          style={{ background: "oklch(0.14 0.008 80 / 0.40)" }}
          onClick={close}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed right-0 top-0 z-[9999] h-full w-full max-w-sm transform shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ background: "var(--bg)" }}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <Link href="/" onClick={close} className="flex items-center gap-2">
              <BinecticsLockup />
            </Link>
            <button
              type="button"
              onClick={close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-(--r-2) transition-colors focus:outline-none"
              style={{ color: "var(--fg-2)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User card (when signed in) */}
          {user && (
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <Link
                href={dashboardHref}
                onClick={close}
                className="flex items-center gap-3 rounded-(--r-2) p-3 transition-colors"
                style={{ background: "var(--bg-2)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-3)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-2)")}
              >
                <span
                  className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold"
                  style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}
                >
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
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--ink)" }}>
                    {fullName}
                  </div>
                  <div className="text-xs truncate" style={{ color: "var(--fg-3)" }}>
                    {user.email}
                  </div>
                </div>
              </Link>
            </div>
          )}

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {/* Marketing */}
            <div
              className="px-2 pb-2 font-mono text-[10.5px] uppercase"
              style={{ letterSpacing: "0.06em", color: "var(--fg-3)" }}
            >
              Explore
            </div>
            <ul className="space-y-0.5 list-none p-0 m-0">
              {MARKETING_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      className="flex items-center rounded-(--r-2) px-3 py-2.5 text-[15px] font-medium transition-colors"
                      style={{
                        color: active ? "var(--signal-ink)" : "var(--fg-2)",
                        background: active ? "var(--signal-soft)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "var(--bg-2)";
                          e.currentTarget.style.color = "var(--ink)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--fg-2)";
                        }
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Account */}
            <div
              className="mt-6 px-2 pb-2 font-mono text-[10.5px] uppercase"
              style={{ letterSpacing: "0.06em", color: "var(--fg-3)" }}
            >
              Account
            </div>
            <ul className="space-y-0.5 list-none p-0 m-0">
              {user ? (
                <>
                  <li>
                    <Link
                      href={dashboardHref}
                      onClick={close}
                      className="flex items-center gap-3 rounded-(--r-2) px-3 py-2.5 text-[15px] font-medium transition-colors"
                      style={{ color: "var(--fg-2)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--ink)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}
                    >
                      <LayoutDashboard className="h-[18px] w-[18px]" style={{ color: "var(--fg-3)" }} aria-hidden="true" />
                      Dashboard
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`${dashboardHref}/profile`}
                      onClick={close}
                      className="flex items-center gap-3 rounded-(--r-2) px-3 py-2.5 text-[15px] font-medium transition-colors"
                      style={{ color: "var(--fg-2)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--ink)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}
                    >
                      <UserIcon className="h-[18px] w-[18px]" style={{ color: "var(--fg-3)" }} aria-hidden="true" />
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={`${dashboardHref}/settings`}
                      onClick={close}
                      className="flex items-center gap-3 rounded-(--r-2) px-3 py-2.5 text-[15px] font-medium transition-colors"
                      style={{ color: "var(--fg-2)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--ink)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}
                    >
                      <Settings className="h-[18px] w-[18px]" style={{ color: "var(--fg-3)" }} aria-hidden="true" />
                      Settings
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <Link
                    href="/login"
                    onClick={close}
                    className="flex items-center gap-3 rounded-(--r-2) px-3 py-2.5 text-[15px] font-medium transition-colors"
                    style={{ color: "var(--fg-2)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--ink)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}
                  >
                    <LogIn className="h-[18px] w-[18px]" style={{ color: "var(--fg-3)" }} aria-hidden="true" />
                    Sign in
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          {/* Footer CTA */}
          <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
            {user ? (
              <button
                type="button"
                onClick={() => {
                  close();
                  logout();
                }}
                className="flex w-full items-center justify-center gap-2 rounded-(--r-2) px-4 py-3 text-sm font-medium transition-colors"
                style={{
                  border: "1px solid oklch(0.70 0.18 25 / 0.25)",
                  color: "oklch(0.55 0.20 25)",
                  background: "transparent",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.55 0.20 25 / 0.06)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            ) : (
              <Link
                href="/register"
                prefetch={false}
                onClick={close}
                className="flex w-full items-center justify-center rounded-(--r-2) px-4 py-3 text-[14px] font-medium transition-colors"
                style={{
                  letterSpacing: "-0.005em",
                  background: "var(--ink)",
                  color: "var(--bg)",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.08 0.008 80)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--ink)")}
              >
                Get started free
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
        className="inline-flex lg:hidden h-10 w-10 items-center justify-center rounded-(--r-2) transition-colors focus:outline-none"
        style={{ color: "var(--fg-2)" }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-2)"; e.currentTarget.style.color = "var(--ink)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--fg-2)"; }}
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {mounted && createPortal(menuContent, document.body)}
    </>
  );
}
