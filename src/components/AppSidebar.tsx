"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import type { ReactNode } from "react";
import {
  Settings,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

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
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: settingsHref,
      isLink: true as const,
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Team",
      href: "/dashboard/team",
      isLink: true as const,
    },
    {
      icon: <HelpCircle className="h-5 w-5" />,
      label: "Help & Support",
      href: "/help",
      isLink: true as const,
    },
    {
      icon: <LogOut className="h-5 w-5" />,
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
            {isMobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
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
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {renderTopNav(false, true)}
        </nav>

        <div className="border-t border-neutral-200 px-3 py-4">
          <div className="mb-1">
            <NotificationBell />
          </div>
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

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {renderTopNav(isCollapsed)}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-neutral-200 py-4 px-3">
          <div className="mb-1">
            <NotificationBell collapsed={isCollapsed} />
          </div>
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
          <ChevronLeft
            className={`w-4 h-4 text-foreground transition-transform duration-300 ${isCollapsed ? "rotate-180" : "rotate-0"}`}
          />
        </button>
      </aside>
    </>
  );
}
