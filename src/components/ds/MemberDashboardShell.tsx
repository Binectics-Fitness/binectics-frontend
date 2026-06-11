"use client";

import { useState } from "react";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { NavDropdown } from "./NavDropdown";

/* ── Lucide-style icon wrapper ── */
function I({ children, d }: { children?: React.ReactNode; d?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {d ? <path d={d} /> : children}
    </svg>
  );
}

/* ── Nav items ── */
const NAV_LINKS = [
  { label: "Home",        href: "/dashboard/member" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Bookings",    href: "/dashboard/bookings" },
  { label: "Messages",    href: "/dashboard/messages" },
  { label: "Activity",    href: "/dashboard/member/streaks" },
];

/* ── Workspace items ── grouped under a dropdown to keep the primary nav lean.
   These features ship as routes + API clients but were previously unreachable
   (no nav entry). Pages enforce their own permission/RBAC gating. */
const WORKSPACE_LINKS = [
  { label: "Forms",            href: "/dashboard/forms" },
  { label: "Loyalty",          href: "/dashboard/loyalty" },
  { label: "Team",             href: "/dashboard/team" },
  { label: "Assignment rules", href: "/dashboard/assignment-rules" },
  { label: "Billing",          href: "/dashboard/billing" },
];

/* ── Props ── */
interface MemberDashboardShellProps {
  activeLabel: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

/* ── Component ── */
export function MemberDashboardShell({ activeLabel, children, actions }: MemberDashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-2)" }}>
      {/* ── Desktop + Tablet top nav ── */}
      <header
        className="sticky top-0 z-50 hidden md:block"
        style={{
          background: "oklch(0.985 0.005 85 / 0.85)",
          backdropFilter: "blur(8px) saturate(140%)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          className="flex items-center justify-between mx-auto"
          style={{ height: 56, maxWidth: 1440, padding: "0 32px" }}
        >
          {/* Left — brand */}
          <Link href="/" className="shrink-0">
            <BinecticsLockup />
          </Link>

          {/* Center — nav links */}
          <nav className="flex items-center" style={{ gap: 4 }} aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const isActive = link.label === activeLabel;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`rounded-(--r-2) text-[13.5px] ${isActive ? "font-medium" : ""}`}
                  style={{
                    padding: "6px 10px",
                    color: isActive ? "var(--ink)" : "var(--fg-2)",
                    background: isActive ? "var(--bg-3)" : undefined,
                    letterSpacing: "-0.005em",
                    transition: `background var(--motion-fast), color var(--motion-fast)`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--bg-2)";
                      e.currentTarget.style.color = "var(--ink)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = "var(--fg-2)";
                    }
                  }}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Workspace — grouped dropdown for features beyond the core flow */}
            <NavDropdown
              label="Workspace"
              active={WORKSPACE_LINKS.some((l) => l.label === activeLabel)}
            >
              <div className="py-1.5" style={{ minWidth: 200 }}>
                {WORKSPACE_LINKS.map((link) => {
                  const isActive = link.label === activeLabel;
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`block text-[13.5px] ${isActive ? "font-medium" : ""}`}
                      style={{
                        padding: "8px 14px",
                        color: isActive ? "var(--ink)" : "var(--fg-2)",
                        background: isActive ? "var(--bg-2)" : undefined,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "var(--bg-2)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent";
                      }}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </NavDropdown>
          </nav>

          {/* Right — actions */}
          <div className="flex items-center" style={{ gap: 8 }}>
            {/* Search icon button */}
            <button
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                background: "var(--bg)",
                color: "var(--fg-2)",
                cursor: "pointer",
              }}
              aria-label="Search"
            >
              <I>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </I>
            </button>

            {/* Notifications icon button */}
            <button
              className="flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                border: "1px solid var(--border)",
                borderRadius: "var(--r-2)",
                background: "var(--bg)",
                color: "var(--fg-2)",
                cursor: "pointer",
              }}
              aria-label="Notifications"
            >
              <I>
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M14 21a2 2 0 0 1-4 0" />
              </I>
            </button>

            {/* Avatar */}
            <Link
              href="/dashboard/settings"
              className="flex items-center justify-center shrink-0"
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--bg-3)",
                color: "var(--fg-2)",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
              }}
            >
              AO
            </Link>
          </div>
        </div>
      </header>

      {/* ── Mobile top bar ── */}
      <header
        className="md:hidden sticky top-0 z-50 flex items-center justify-between"
        style={{
          height: 56,
          padding: "0 16px",
          background: "oklch(0.985 0.005 85 / 0.85)",
          backdropFilter: "blur(8px) saturate(140%)",
          WebkitBackdropFilter: "blur(8px) saturate(140%)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Left — brand */}
        <Link href="/" className="shrink-0">
          <BinecticsLockup markSize={20} />
        </Link>

        {/* Right — hamburger + avatar */}
        <div className="flex items-center" style={{ gap: 8 }}>
          <Link
            href="/dashboard/settings"
            className="flex items-center justify-center shrink-0"
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "var(--bg-3)",
              color: "var(--fg-2)",
              fontSize: 11,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            AO
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: "var(--r-2)",
              border: "1px solid var(--border)",
              background: "var(--bg)",
              color: "var(--ink)",
              cursor: "pointer",
            }}
            aria-label="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Mobile dropdown overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ animation: "fade-in var(--motion-base, 220ms) var(--ease, ease-out)" }}>
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel — full-screen slide */}
          <div
            className="absolute inset-0 flex flex-col"
            style={{ background: "var(--bg)" }}
          >
            {/* Panel header */}
            <div className="flex items-center justify-between" style={{ height: 56, padding: "0 16px", borderBottom: "1px solid var(--border)" }}>
              <Link href="/" onClick={() => setMobileOpen(false)} className="shrink-0">
                <BinecticsLockup markSize={20} />
              </Link>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--r-2)",
                  border: "1px solid var(--border)",
                  background: "var(--bg)",
                  color: "var(--fg-2)",
                  cursor: "pointer",
                }}
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-5 pt-6" style={{ gap: 4 }} aria-label="Mobile navigation">
              {NAV_LINKS.map((link) => {
                const isActive = link.label === activeLabel;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-(--r-2) text-[16px] ${isActive ? "font-medium" : ""}`}
                    style={{
                      height: 48,
                      padding: "0 12px",
                      color: isActive ? "var(--ink)" : "var(--fg-2)",
                      background: isActive ? "var(--bg-3)" : undefined,
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {/* Workspace group */}
              <p
                className="px-3 pt-5 pb-1 font-mono text-[11px] uppercase tracking-[0.06em]"
                style={{ color: "var(--fg-3)" }}
              >
                Workspace
              </p>
              {WORKSPACE_LINKS.map((link) => {
                const isActive = link.label === activeLabel;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center rounded-(--r-2) text-[16px] ${isActive ? "font-medium" : ""}`}
                    style={{
                      height: 48,
                      padding: "0 12px",
                      color: isActive ? "var(--ink)" : "var(--fg-2)",
                      background: isActive ? "var(--bg-3)" : undefined,
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom utility links */}
            <div className="mt-auto px-5 pb-8 flex flex-col" style={{ gap: 4, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
              <Link
                href="/dashboard/settings"
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-(--r-2) text-[16px]"
                style={{ height: 48, padding: "0 12px", color: "var(--fg-2)" }}
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content area ── */}
      <main
        className="mx-auto flex flex-col flex-1"
        style={{ maxWidth: 1100, padding: 28 }}
      >
        {actions && (
          <div className="flex justify-end mb-4" style={{ gap: 8 }}>
            {actions}
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
