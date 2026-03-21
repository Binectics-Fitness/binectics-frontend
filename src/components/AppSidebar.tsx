"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import OrganizationSelector from "./OrganizationSelector";
import type { ReactNode } from "react";

export interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
}

export interface RoleBadge {
  label: string;
  /** Tailwind bg class, e.g. "bg-accent-purple-50" */
  bgClass: string;
  /** Tailwind text class, e.g. "text-accent-purple-700" */
  textClass: string;
}

interface AppSidebarProps {
  navItems: NavItem[];
  /** Role-specific settings page. Defaults to /dashboard/settings */
  settingsHref?: string;
  /** Optional role badge shown below the logo when expanded */
  roleBadge?: RoleBadge;
}

export default function AppSidebar({
  navItems,
  settingsHref = "/dashboard/settings",
  roleBadge,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    document.body.classList.add("dashboard-sidebar-mobile-offset");

    return () => {
      document.body.classList.remove("dashboard-sidebar-mobile-offset");
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileMenuOpen]);

  const bottomNavItems = [
    {
      icon: (
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
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
      label: "Settings",
      href: settingsHref,
      isLink: true as const,
    },
    {
      icon: (
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
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      label: "Team",
      href: "/dashboard/team",
      isLink: true as const,
    },
    {
      icon: (
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
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      label: "Help & Support",
      href: "/help",
      isLink: true as const,
    },
    {
      icon: (
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      ),
      label: "Logout",
      href: undefined,
      isLink: false as const,
    },
  ];

  const mobileTitle = roleBadge?.label ?? "Member Dashboard";

  const renderTopNav = (collapsed: boolean, mobile = false) => (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const isActive = pathname === item.href;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-neutral-200 text-foreground"
                  : "text-foreground-secondary hover:bg-neutral-200 hover:text-foreground"
              } ${collapsed ? "justify-center" : ""}`}
              title={collapsed ? item.label : ""}
              onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
            >
              <span
                className={`flex-shrink-0 ${
                  isActive ? "text-foreground" : "text-foreground-tertiary"
                }`}
              >
                {item.icon}
              </span>
              {!collapsed && item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const renderBottomNav = (collapsed: boolean, mobile = false) => (
    <ul className="space-y-1">
      {bottomNavItems.map((item) => {
        const isActive = item.isLink ? pathname === item.href : false;

        return (
          <li key={item.label}>
            {item.isLink ? (
              <Link
                href={item.href!}
                prefetch={false}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-neutral-200 text-foreground"
                    : "text-foreground-secondary hover:bg-neutral-200 hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : ""}
                onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
              >
                <span
                  className={`flex-shrink-0 ${
                    isActive ? "text-foreground" : "text-foreground-tertiary"
                  }`}
                >
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </Link>
            ) : (
              <button
                onClick={() => {
                  logout();
                  if (mobile) setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-all duration-200 hover:bg-neutral-200 hover:text-foreground ${
                  collapsed ? "justify-center" : ""
                }`}
                title={collapsed ? item.label : ""}
              >
                <span className="text-foreground-tertiary flex-shrink-0">
                  {item.icon}
                </span>
                {!collapsed && item.label}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 border-b border-neutral-200 bg-background/95 backdrop-blur md:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">
              Dashboard
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              {mobileTitle}
            </p>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-foreground shadow-sm"
            aria-label={
              isMobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7h16M4 12h16M4 17h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[88vw] max-w-sm flex-col border-r border-neutral-200 bg-background shadow-2xl transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-neutral-200 px-4 py-5">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              className="flex items-center gap-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex h-10 w-10 items-center justify-center bg-primary-500 flex-shrink-0">
                <span className="text-xl font-bold text-white">B</span>
              </div>
              <div>
                <span className="block font-display text-xl font-bold text-foreground">
                  Binectics
                </span>
                {roleBadge && (
                  <span
                    className={`mt-1 inline-flex px-2.5 py-1 text-xs font-semibold ${roleBadge.bgClass} ${roleBadge.textClass}`}
                  >
                    {roleBadge.label}
                  </span>
                )}
              </div>
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-foreground"
              aria-label="Close navigation menu"
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="border-b border-neutral-200 px-3 py-4">
          <OrganizationSelector />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {renderTopNav(false, true)}
        </nav>

        <div className="border-t border-neutral-200 px-3 py-4">
          {renderBottomNav(false, true)}
        </div>
      </div>

      <aside
        className={`fixed left-0 top-0 hidden h-screen border-r border-neutral-200 bg-background md:flex md:flex-col transition-all duration-300 ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-neutral-200">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-primary-500 flex-shrink-0">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            {!isCollapsed && (
              <span className="font-display text-xl font-bold text-foreground whitespace-nowrap">
                Binectics
              </span>
            )}
          </Link>
          {!isCollapsed && roleBadge && (
            <div className={`mt-3 ${roleBadge.bgClass} px-3 py-1.5`}>
              <p className={`text-xs font-semibold ${roleBadge.textClass}`}>
                {roleBadge.label}
              </p>
            </div>
          )}
        </div>

        {/* Organization Context */}
        {!isCollapsed && (
          <div className="px-3 py-4 border-b border-neutral-200">
            <OrganizationSelector />
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {renderTopNav(isCollapsed)}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-neutral-200 py-4 px-3">
          {renderBottomNav(isCollapsed)}
        </div>

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`fixed z-50 hidden h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-200 bg-white shadow-lg transition-all duration-300 hover:border-primary-500 md:flex ${
            isCollapsed ? "left-[60px]" : "left-[240px]"
          }`}
          style={{ top: roleBadge ? "148px" : "100px" }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`w-4 h-4 text-foreground transition-transform duration-300 ${isCollapsed ? "rotate-0" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </aside>
    </>
  );
}
