"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { ROLE_LABEL, personInitials, shortName } from "@/lib/identity";

/* ─── Icon helper ──────────────────────────────────────────── */

function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

/* ─── Sidebar config ───────────────────────────────────────── */

interface SideItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  alert?: boolean;
}

const SIDEBAR: { label: string; items: SideItem[] }[] = [
  { label: "Moderate", items: [
    { name: "Overview", href: "/admin/dashboard", icon: <I><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></I> },
    { name: "Listings", badge: "38", alert: true, href: "/admin/listings", icon: <I d="M9 12l2 2 4-4M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /> },
    { name: "Reviews", badge: "12", href: "/admin/reviews", icon: <I d="m13 3 1 7 7 1-7 1-1 7-1-7-7-1 7-1z" /> },
    { name: "Fraud", badge: "4", alert: true, href: "/admin/fraud", icon: <I><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></I> },
    { name: "Disputes", badge: "7", href: "/admin/disputes", icon: <I><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/><path d="M16 8 8 16M8 8l8 8"/></I> },
    { name: "Tickets", badge: "42", href: "/admin/tickets", icon: <I><path d="M3 21l1.6-4.7A9 9 0 1 1 12 21z"/></I> },
  ]},
  { label: "Platform", items: [
    { name: "Countries", href: "/admin/countries", icon: <I><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></I> },
    { name: "Payments", href: "/admin/payments", icon: <I><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20"/></I> },
    { name: "Users", href: "/admin/users", icon: <I><circle cx="9" cy="8" r="4"/><circle cx="17" cy="10" r="3"/><path d="M2 21a7 7 0 0 1 14 0M14 21a5 5 0 0 1 10 0"/></I> },
    { name: "Analytics", href: "/admin/analytics", icon: <I d="M3 3v18h18M7 14l4-4 3 3 5-7" /> },
  ]},
  { label: "Operate", items: [
    { name: "Forms", href: "/dashboard/forms", icon: <I><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></I> },
    { name: "Feature flags", href: "/admin/feature-flags", icon: <I><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8M4.6 9a1.7 1.7 0 0 0-.3-1.8"/></I> },
    { name: "Audit log", href: "/admin/audit-log", icon: <I d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5" /> },
    { name: "Team & roles", href: "/admin/team-roles", icon: <I><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/><path d="M19 8v6M16 11h6"/></I> },
    { name: "Compliance", href: "/admin/compliance", icon: <I><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></I> },
  ]},
];

/* ─── Props ────────────────────────────────────────────────── */

interface AdminDashboardShellProps {
  activeItem: string;
  crumb: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

/* ─── Sidebar content (shared between desktop + mobile) ───── */

function SidebarContent({ activeItem }: { activeItem: string }) {
  const { user } = useAuth();
  const name = shortName(user) || "Your account";
  const initials = personInitials(user) || "··";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : "";
  return (
    <div className="flex flex-col gap-5.5 px-3.5 pb-6">
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 px-1.5 py-1" style={{ color: "var(--bg)" }}>
        <BinecticsMark size={22} />
        <span className="font-semibold text-[17px]" style={{ letterSpacing: "-0.02em" }}>Binectics</span>
      </Link>

      {/* Env pill */}
      <span
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em] px-2 py-[3px] rounded-full w-fit ml-1"
        style={{ border: "1px solid oklch(0.35 0.01 80)", color: "oklch(0.75 0.005 85)" }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--signal)" }} />
        {process.env.NODE_ENV === "production" ? "Production" : "Staging"} · admin
      </span>

      {/* Nav sections */}
      {SIDEBAR.map((s) => (
        <nav key={s.label} className="flex flex-col gap-0.5" aria-label={s.label}>
          <div
            className="font-mono text-[10.5px] uppercase tracking-[0.06em] px-2 py-1 mb-1"
            style={{ color: "oklch(0.55 0.008 80)" }}
          >
            {s.label}
          </div>
          {s.items.map((item) => {
            const isActive = item.name === activeItem;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-2.5 py-[7px] px-2 rounded-(--r-2) text-[13.5px] cursor-pointer"
                style={{
                  color: isActive ? "var(--bg)" : "oklch(0.80 0.005 85)",
                  background: isActive ? "oklch(0.22 0.008 80)" : "transparent",
                  fontWeight: isActive ? 500 : 400,
                }}
              >
                {item.icon}
                <span className="flex-1">{item.name}</span>
                {item.badge && (
                  <span
                    className="font-mono text-[11px] px-1.5 py-px rounded-full"
                    style={{
                      background: item.alert ? "var(--danger)" : "oklch(0.30 0.01 80)",
                      color: item.alert ? "oklch(0.98 0 0)" : "oklch(0.85 0.005 85)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      ))}

      {/* Admin user */}
      <div className="mt-auto flex items-center gap-2.5 pt-3.5" style={{ borderTop: "1px solid oklch(0.30 0.008 80)" }}>
        <span
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
          style={{ background: "oklch(0.30 0.01 80)", color: "var(--bg)" }}
        >
          {initials}
        </span>
        <div className="flex-1">
          <div className="text-[13px] font-medium" style={{ color: "var(--bg)" }}>{name}</div>
          <div className="font-mono text-[11px]" style={{ color: "oklch(0.65 0.008 80)" }}>{roleLabel}</div>
        </div>
      </div>
    </div>
  );
}

/* ─── Dark mobile nav for admin ───────────────────────────── */

function AdminMobileNav({ activeItem }: { activeItem: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar — dark */}
      <div
        className="lg:hidden flex items-center gap-3 h-14 px-5 sticky top-0 z-20"
        style={{ background: "var(--ink)", borderBottom: "1px solid oklch(0.25 0.005 85)", color: "var(--bg)" }}
      >
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-(--r-2) flex items-center justify-center shrink-0"
          style={{ border: "1px solid oklch(0.30 0.008 80)", background: "transparent", color: "var(--bg)" }}
          aria-label="Open navigation"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <BinecticsMark size={18} />
        <span className="text-[14px] font-medium">Binectics Admin</span>
      </div>

      {/* Slide-in panel */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.08 0.005 80 / 0.5)", transition: "opacity var(--motion-base, 220ms)" }}
            onClick={() => setOpen(false)}
          />
          {/* Dark sidebar panel */}
          <div
            className="absolute top-0 left-0 h-full w-[280px] overflow-y-auto"
            style={{
              background: "var(--ink)",
              borderRight: "1px solid oklch(0.25 0.005 85)",
              color: "oklch(0.85 0.005 85)",
            }}
          >
            {/* Close button */}
            <div className="flex justify-end p-3">
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-(--r-2) flex items-center justify-center"
                style={{ border: "1px solid oklch(0.30 0.008 80)", color: "oklch(0.65 0.005 85)" }}
                aria-label="Close navigation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* Sidebar content */}
            <div onClick={() => setOpen(false)}>
              <SidebarContent activeItem={activeItem} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ═══ Shell ═══ */

export function AdminDashboardShell({ activeItem, crumb, actions, children }: AdminDashboardShellProps) {
  const { isAuthorized, isLoading } = useRoleGuard(UserRole.ADMIN);
  if (!isLoading && !isAuthorized) return null;
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-2)" }}>
      {/* Mobile nav — dark variant */}
      <AdminMobileNav activeItem={activeItem} />

      {/* Desktop layout */}
      <div className="hidden lg:grid" style={{ gridTemplateColumns: "248px 1fr", minHeight: "100vh" }}>
        {/* Desktop sidebar — dark (ink) */}
        <aside
          className="flex flex-col gap-5.5 sticky top-0 h-screen overflow-y-auto"
          style={{
            background: "var(--ink)",
            borderRight: "1px solid var(--ink)",
            padding: "18px 14px",
            color: "oklch(0.85 0.005 85)",
          }}
          aria-label="Sidebar navigation"
        >
          <SidebarContent activeItem={activeItem} />
        </aside>

        {/* Main */}
        <div className="flex flex-col min-w-0">
          {/* Header bar — 56px, sticky, breadcrumb + actions */}
          <header
            className="flex items-center justify-between h-14 px-7 sticky top-0 z-10"
            style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
          >
            <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              <Link
                href="/admin/dashboard"
                className="hover:underline"
                style={{ color: "var(--fg-3)", textDecoration: "none" }}
              >
                Admin
              </Link>
              <span className="mx-1.5" style={{ color: "var(--fg-4)" }}>/</span>
              <span className="font-medium" style={{ color: "var(--ink)" }}>{crumb}</span>
            </div>
            {actions && <div className="flex items-center gap-2.5">{actions}</div>}
          </header>

          {/* Body */}
          <main className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-7 flex-1">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile content (no sidebar grid) */}
      <div className="lg:hidden">
        <header
          className="flex items-center justify-between h-12 px-5 sticky top-14 z-10"
          style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
        >
          <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            <span className="font-medium" style={{ color: "var(--ink)" }}>{crumb}</span>
          </div>
          {actions && <div className="flex items-center gap-2.5">{actions}</div>}
        </header>
        <main className="flex flex-col gap-4 sm:gap-6 p-4 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
