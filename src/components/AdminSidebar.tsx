"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    document.body.classList.add("admin-sidebar-mobile-offset");

    return () => {
      document.body.classList.remove("admin-sidebar-mobile-offset");
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

  const navItems = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      label: "Overview",
      href: "/admin/dashboard",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      label: "Users",
      href: "/admin/users",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      label: "Verification",
      href: "/admin/verification",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      label: "Providers",
      href: "/admin/providers",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      label: "Subscriptions",
      href: "/admin/subscriptions",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      label: "Analytics",
      href: "/admin/analytics",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      label: "Revenue",
      href: "/admin/revenue",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      label: "Reviews",
      href: "/admin/reviews",
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      label: "Forms",
      href: "/forms",
    },
  ];

  const bottomNavItems = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Settings",
      href: "/admin/settings",
      isLink: true as const,
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      label: "Logout",
      isLink: false as const,
    },
  ];

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
              <span className={`shrink-0 ${isActive ? "text-foreground" : "text-foreground-tertiary"}`}>
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-neutral-200 text-foreground"
                    : "text-foreground-secondary hover:bg-neutral-200 hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : ""}
                onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
              >
                <span className={`shrink-0 ${isActive ? "text-foreground" : "text-foreground-tertiary"}`}>
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
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-all duration-200 hover:bg-neutral-200 hover:text-foreground ${
                  collapsed ? "justify-center" : ""
                }`}
                title={collapsed ? item.label : ""}
              >
                <span className="shrink-0 text-foreground-tertiary">{item.icon}</span>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground-tertiary">Admin</p>
            <p className="truncate text-sm font-bold text-foreground">Control Center</p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen((current) => !current)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-neutral-300 bg-white text-foreground shadow-sm"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16M4 12h16M4 17h16" />
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
            <Link href="/admin/dashboard" className="flex items-center gap-3" onClick={() => setIsMobileMenuOpen(false)}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-500">
                <span className="text-xl font-bold text-white">B</span>
              </div>
              <div>
                <span className="block font-display text-xl font-bold text-foreground">Binectics</span>
                <span className="mt-1 inline-flex bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Admin</span>
              </div>
            </Link>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-foreground"
              aria-label="Close navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">{renderTopNav(false, true)}</nav>

        <div className="border-t border-neutral-200 px-3 py-4">{renderBottomNav(false, true)}</div>
      </div>

      <aside
        className={`fixed left-0 top-0 hidden h-screen flex-col overflow-y-auto border-r border-neutral-200 bg-background transition-all duration-300 md:flex ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        <div className="border-b border-neutral-200 p-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-500">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            {!isCollapsed && (
              <span className="whitespace-nowrap font-display text-xl font-bold text-foreground">Binectics</span>
            )}
          </Link>
          {!isCollapsed && (
            <div className="mt-3 bg-red-50 px-3 py-1.5">
              <p className="text-xs font-semibold text-red-700">Admin</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">{renderTopNav(isCollapsed)}</nav>

        <div className="border-t border-neutral-200 px-3 py-4">{renderBottomNav(isCollapsed)}</div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`fixed z-50 hidden h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-200 bg-white shadow-lg transition-all duration-300 hover:border-red-500 md:flex ${
            isCollapsed ? "left-15" : "left-60"
          }`}
          style={{ top: "140px" }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            className={`h-4 w-4 text-foreground transition-transform duration-300 ${isCollapsed ? "rotate-0" : "rotate-180"}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </aside>
    </>
  );
}
