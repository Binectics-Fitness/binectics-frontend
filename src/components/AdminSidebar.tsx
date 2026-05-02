"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Briefcase,
  CreditCard,
  BarChart3,
  DollarSign,
  Star,
  Megaphone,
  Award,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";

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
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Overview",
      href: "/admin/dashboard",
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: "Users",
      href: "/admin/users",
    },
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      label: "Verification",
      href: "/admin/verification",
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      label: "Providers",
      href: "/admin/providers",
    },
    {
      icon: <CreditCard className="h-5 w-5" />,
      label: "Subscriptions",
      href: "/admin/subscriptions",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      label: "Analytics",
      href: "/admin/analytics",
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "Revenue",
      href: "/admin/revenue",
    },
    {
      icon: <Star className="h-5 w-5" />,
      label: "Reviews",
      href: "/admin/reviews",
    },
    {
      icon: <Megaphone className="h-5 w-5" />,
      label: "Announcements",
      href: "/admin/announcements",
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Loyalty Rewards",
      href: "/admin/loyalty",
    },
    {
      icon: <DollarSign className="h-5 w-5" />,
      label: "Currencies",
      href: "/admin/currencies",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      label: "Forms",
      href: "/forms",
    },
  ];

  const bottomNavItems = [
    {
      icon: <Settings className="h-5 w-5" />,
      label: "Settings",
      href: "/admin/settings",
      isLink: true as const,
    },
    {
      icon: <LogOut className="h-5 w-5" />,
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
              <span
                className={`shrink-0 ${isActive ? "text-foreground" : "text-foreground-tertiary"}`}
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-neutral-200 text-foreground"
                    : "text-foreground-secondary hover:bg-neutral-200 hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`}
                title={collapsed ? item.label : ""}
                onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
              >
                <span
                  className={`shrink-0 ${isActive ? "text-foreground" : "text-foreground-tertiary"}`}
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
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-foreground-secondary transition-all duration-200 hover:bg-neutral-200 hover:text-foreground ${
                  collapsed ? "justify-center" : ""
                }`}
                title={collapsed ? item.label : ""}
              >
                <span className="shrink-0 text-foreground-tertiary">
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
              Admin
            </p>
            <p className="truncate text-sm font-bold text-foreground">
              Control Center
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
              href="/admin/dashboard"
              className="flex items-center gap-3"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-red-500">
                <span className="text-xl font-bold text-white">B</span>
              </div>
              <div>
                <span className="block font-display text-xl font-bold text-foreground">
                  Binectics
                </span>
                <span className="mt-1 inline-flex bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  Admin
                </span>
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
          {renderBottomNav(false, true)}
        </div>
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
              <span className="whitespace-nowrap font-display text-xl font-bold text-foreground">
                Binectics
              </span>
            )}
          </Link>
          {!isCollapsed && (
            <div className="mt-3 bg-red-50 px-3 py-1.5">
              <p className="text-xs font-semibold text-red-700">Admin</p>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {renderTopNav(isCollapsed)}
        </nav>

        <div className="border-t border-neutral-200 px-3 py-4">
          {renderBottomNav(isCollapsed)}
        </div>

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`fixed z-50 hidden h-8 w-8 items-center justify-center rounded-full border-2 border-neutral-200 bg-white shadow-lg transition-all duration-300 hover:border-red-500 md:flex ${
            isCollapsed ? "left-15" : "left-60"
          }`}
          style={{ top: "140px" }}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`h-4 w-4 text-foreground transition-transform duration-300 ${isCollapsed ? "rotate-180" : "rotate-0"}`}
          />
        </button>
      </aside>
    </>
  );
}
