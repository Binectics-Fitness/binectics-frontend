"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BinecticsLogo from "@/components/BinecticsLogo";
import NotificationBell from "@/components/NotificationBell";
import type { ReactNode } from "react";
import {
  Settings,
  Users,
  HelpCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";

export interface NavItem {
  icon: ReactNode;
  label: string;
  href: string;
}

export interface RoleBadge {
  label: string;
  bgClass: string;
  textClass: string;
}

interface AppSidebarProps {
  navItems: NavItem[];
  settingsHref?: string;
  roleBadge?: RoleBadge;
}

export default function AppSidebar({
  navItems,
  settingsHref = "/dashboard/settings",
  roleBadge,
}: AppSidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout } = useAuth();

  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isMobileMenuOpen]);

  const bottomNavItems = [
    { icon: <Settings size={16} strokeWidth={1.5} />, label: "Settings", href: settingsHref, isLink: true as const },
    { icon: <Users size={16} strokeWidth={1.5} />, label: "Team", href: "/dashboard/team", isLink: true as const },
    { icon: <HelpCircle size={16} strokeWidth={1.5} />, label: "Help", href: "/help", isLink: true as const },
    { icon: <LogOut size={16} strokeWidth={1.5} />, label: "Logout", href: undefined, isLink: false as const },
  ];

  const renderNavItem = (item: { icon: ReactNode; label: string; href?: string; isLink?: boolean }, mobile = false) => {
    const isActive = item.href ? pathname === item.href : false;
    const cls = `flex items-center gap-2.5 px-2.5 h-[30px] rounded-[var(--r-2)] text-[13.5px] ${
      isActive
        ? "font-medium"
        : ""
    }`;
    const style: React.CSSProperties = {
      background: isActive ? "var(--bg-3)" : "transparent",
      color: isActive ? "var(--ink)" : "var(--fg-2)",
      transition: "background var(--motion-fast) var(--ease), color var(--motion-fast) var(--ease)",
    };
    const hoverHandlers = {
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--bg-2)";
          e.currentTarget.style.color = "var(--ink)";
        }
      },
      onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--fg-2)";
        }
      },
    };

    if (item.isLink === false) {
      return (
        <button
          onClick={() => { logout(); if (mobile) setIsMobileMenuOpen(false); }}
          className={`w-full ${cls}`}
          style={style}
          {...hoverHandlers}
        >
          <span className="shrink-0" style={{ color: isActive ? "var(--ink)" : "var(--fg-3)" }}>{item.icon}</span>
          {item.label}
        </button>
      );
    }

    return (
      <Link
        href={item.href!}
        className={cls}
        style={style}
        onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
        {...hoverHandlers}
      >
        <span className="shrink-0" style={{ color: isActive ? "var(--ink)" : "var(--fg-3)" }}>{item.icon}</span>
        {item.label}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile topbar */}
      <div
        className="fixed inset-x-0 top-0 z-40 md:hidden flex items-center justify-between h-14 px-4"
        style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <BinecticsLogo markSize={18} />
          <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Binectics</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-[var(--r-2)]"
          style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
          aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile slide-out */}
      <div
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "var(--bg)",
          borderRight: "1px solid var(--border)",
          transition: "transform var(--motion-slow) var(--ease-out)",
        }}
      >
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BinecticsLogo markSize={18} />
              <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Binectics</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-8 h-8 flex items-center justify-center rounded-[var(--r-2)]"
              style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <div key={item.href}>{renderNavItem(item, true)}</div>
          ))}
        </nav>
        <div className="px-3 py-4 flex flex-col gap-0.5" style={{ borderTop: "1px solid var(--border)" }}>
          <NotificationBell />
          {bottomNavItems.map((item) => (
            <div key={item.label}>{renderNavItem(item, true)}</div>
          ))}
        </div>
      </div>

      {/* Desktop sidebar — 232px, design system tokens */}
      <aside
        className="fixed left-0 top-0 hidden h-screen w-[232px] md:flex md:flex-col"
        style={{ background: "var(--bg)", borderRight: "1px solid var(--border)" }}
      >
        <div className="px-5 py-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <Link href="/" className="flex items-center gap-2">
            <BinecticsLogo markSize={18} />
            <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Binectics</span>
          </Link>
          {roleBadge && (
            <div className={`mt-3 px-2.5 py-1 rounded-[var(--r-1)] text-[11px] font-medium inline-block ${roleBadge.bgClass} ${roleBadge.textClass}`}>
              {roleBadge.label}
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <div key={item.href}>{renderNavItem(item)}</div>
          ))}
        </nav>

        <div className="px-3 py-4 flex flex-col gap-0.5" style={{ borderTop: "1px solid var(--border)" }}>
          <NotificationBell />
          {bottomNavItems.map((item) => (
            <div key={item.label}>{renderNavItem(item)}</div>
          ))}
        </div>
      </aside>
    </>
  );
}
