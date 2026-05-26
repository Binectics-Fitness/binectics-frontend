import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * MarketingFooter — from landing.html prototype.
 * 5-column grid: brand block (2fr) + 4 link columns (1fr each).
 * padding: 64px 40px 40px. gap: 48px. max-width: 1440px.
 * Copyright bar: padding: 24px 40px 56px. border-top.
 */

const COLS = [
  { title: "Product", links: [
    { href: "/marketplace", label: "Marketplace" },
    { href: "/for-gyms", label: "For gyms" },
    { href: "/for-trainers", label: "For trainers" },
    { href: "/for-dietitians", label: "For dietitians" },
    { href: "/for-members", label: "Members" },
  ]},
  { title: "Company", links: [
    { href: "/about", label: "About" },
    { href: "/careers", label: "Careers" },
    { href: "/press", label: "Press" },
    { href: "/partners", label: "Partners" },
    { href: "/contact", label: "Contact" },
  ]},
  { title: "Resources", links: [
    { href: "/help", label: "Help center" },
    { href: "/qr-help", label: "QR help" },
    { href: "/blog", label: "Blog" },
  ]},
  { title: "Legal", links: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
    { href: "/security", label: "Security" },
  ]},
];

export function MarketingFooter() {
  return (
    <>
      <footer className="mx-auto max-w-360 grid grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]" style={{ padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px) clamp(24px, 4vw, 40px)", gap: "48px", borderTop: "1px solid var(--border)" }}>
        {/* Brand block */}
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-4 max-w-[320px]">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <svg className="w-7.5 h-7.5" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
              <path d="M 32 6 A 18 18 0 1 0 32 42"/>
              <path d="M 28 16 A 8 8 0 1 0 28 32"/>
            </svg>
            <span className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Binectics</span>
          </Link>
          <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-3)", margin: 0 }}>The operating system for fitness. One marketplace, one set of dashboards, one tab. Available in 50+ countries.</p>
        </div>

        {/* Link columns */}
        {COLS.map((c) => (
          <div key={c.title}>
            <h4 className="font-mono text-[11px] uppercase tracking-[0.05em] mb-3.5" style={{ color: "var(--fg-4)" }}>{c.title}</h4>
            {c.links.map((l) => (
              <Link key={l.label} href={l.href} className="block text-[13.5px] py-1 hover:text-ink" style={{ color: "var(--fg-2)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        ))}
      </footer>

      {/* Copyright bar */}
      <div className="mx-auto max-w-360 flex flex-wrap gap-2 justify-between items-center" style={{ padding: "24px clamp(20px, 5vw, 40px) 56px", borderTop: "1px solid var(--border)" }}>
        <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>© 2026 Binectics, Inc. All rights reserved.</span>
        <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>v 1.0 · 14,200 providers · 52 countries</span>
      </div>
    </>
  );
}
