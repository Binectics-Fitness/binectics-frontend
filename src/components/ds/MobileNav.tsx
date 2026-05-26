"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * MobileNav — two variants:
 *
 * 1. Marketing (landing, about, pricing, help, legal):
 *    Full-screen overlay with stacked nav links, fade in at 220ms.
 *
 * 2. Dashboard (gym, trainer, dietitian, admin):
 *    280px slide-in panel from left, same styling as desktop sidebar.
 *    Overlay behind at oklch(0.14 0.008 80 / 0.3).
 *
 * Trigger: the brand mark (dual-arc logo), not a hamburger icon.
 */

interface MarketingMobileNavProps {
  links: { href: string; label: string; active?: boolean }[];
}

export function MarketingMobileNav({ links }: MarketingMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger — visible only on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden w-9 h-9 rounded-(--r-2) flex items-center justify-center"
        style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
        aria-label="Open menu"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
          <path d="M 32 6 A 18 18 0 1 0 32 42"/>
          <path d="M 28 16 A 8 8 0 1 0 28 32"/>
        </svg>
      </button>

      {/* Overlay + Panel */}
      {open && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          style={{ animation: "fade-in var(--motion-base, 220ms) var(--ease, ease-out)" }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.14 0.008 80 / 0.3)" }}
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div
            className="absolute inset-0 flex flex-col"
            style={{ background: "var(--bg)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between h-14 px-5" style={{ borderBottom: "1px solid var(--border)" }}>
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" style={{ color: "var(--ink)" }}>
                  <path d="M 32 6 A 18 18 0 1 0 32 42"/>
                  <path d="M 28 16 A 8 8 0 1 0 28 32"/>
                </svg>
                <span className="text-[16px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>Binectics</span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-(--r-2) flex items-center justify-center"
                style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col px-5 pt-6 gap-1" aria-label="Mobile navigation">
              {links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center h-12 px-3 rounded-(--r-2) text-[16px] ${l.active ? "bg-bg-2 font-medium" : ""}`}
                  style={{ color: l.active ? "var(--ink)" : "var(--fg-2)" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            {/* Bottom actions */}
            <div className="mt-auto px-5 pb-8 flex flex-col gap-3">
              <Link href="/login" onClick={() => setOpen(false)} className="btn-ghost-v2 lg w-full justify-center">Log in</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="btn-primary-v2 lg w-full justify-center">Sign up</Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * DashboardMobileNav — slide-in panel for dashboard sidebars.
 * Takes sidebar content as children.
 */
interface DashboardMobileNavProps {
  children: React.ReactNode;
}

export function DashboardMobileNav({ children }: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Trigger — mobile topbar with mark */}
      <div className="lg:hidden flex items-center gap-3 h-14 px-5 sticky top-0 z-20" style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-(--r-2) flex items-center justify-center shrink-0"
          style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--ink)" }}
          aria-label="Open navigation"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
            <path d="M 32 6 A 18 18 0 1 0 32 42"/>
            <path d="M 28 16 A 8 8 0 1 0 28 32"/>
          </svg>
        </button>
        <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Binectics</span>
      </div>

      {/* Overlay + Slide panel */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "oklch(0.14 0.008 80 / 0.3)", transition: "opacity var(--motion-base, 220ms)" }}
            onClick={() => setOpen(false)}
          />
          {/* Sidebar panel */}
          <div
            className="absolute top-0 left-0 h-full w-[280px] overflow-y-auto"
            style={{
              background: "var(--bg)",
              borderRight: "1px solid var(--border)",
              transform: "translateX(0)",
              transition: "transform var(--motion-base, 220ms) var(--ease, ease-out)",
            }}
          >
            {/* Close button */}
            <div className="flex justify-end p-3">
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-(--r-2) flex items-center justify-center"
                style={{ border: "1px solid var(--border)", color: "var(--fg-2)" }}
                aria-label="Close navigation"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            {/* Sidebar content — passed as children */}
            <div onClick={() => setOpen(false)}>
              {children}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
