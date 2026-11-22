import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { RegionSelector } from "@/components/ds/RegionSelector";

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
    { href: "/contact", label: "Contact" },
  ]},
  { title: "Resources", links: [
    { href: "/help", label: "Help center" },
    { href: "/qr-help", label: "QR help" },
  ]},
  { title: "Legal", links: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
    { href: "/cookies", label: "Cookies" },
  ]},
];

export function MarketingFooter() {
  return (
    <>
      <footer className="mx-auto max-w-360 grid grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)]" style={{ padding: "clamp(32px, 6vw, 64px) clamp(20px, 5vw, 40px) clamp(24px, 4vw, 40px)", gap: "48px", borderTop: "1px solid var(--border)" }} aria-label="Footer navigation">
        {/* Brand block */}
        <div className="col-span-2 lg:col-span-1 flex flex-col gap-4 max-w-[320px]">
          <Link href="/" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
            <svg className="w-7.5 h-7.5" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
              <path d="M 32 6 A 18 18 0 1 0 32 42"/>
              <path d="M 28 16 A 8 8 0 1 0 28 32"/>
            </svg>
            <span className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Binectics</span>
          </Link>
          <p className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-3)", margin: 0 }}>Memberships, coaching, and payments in one place for gyms, trainers, and dietitians. Built for Nigeria, with no cut of your takings.</p>
          {/* 44px tap targets; the negative margin keeps the icons aligned with the text. */}
          <div className="flex -ml-3.5 -my-2">
            <a href="https://x.com/binectics" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="inline-flex items-center justify-center w-11 h-11 hover:text-ink" style={{ color: "var(--fg-3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com/company/binectics" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="inline-flex items-center justify-center w-11 h-11 hover:text-ink" style={{ color: "var(--fg-3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://instagram.com/binectics" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="inline-flex items-center justify-center w-11 h-11 hover:text-ink" style={{ color: "var(--fg-3)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
            </a>
          </div>
        </div>

        {/* Link columns */}
        {COLS.map((c) => (
          <div key={c.title}>
            <h2 className="font-mono text-[11px] font-normal uppercase tracking-[0.05em] mb-3.5" style={{ color: "var(--fg-3)" }}>{c.title}</h2>
            {c.links.map((l) => (
              <Link key={l.label} href={l.href} className="block text-[13.5px] py-1 hover:text-ink" style={{ color: "var(--fg-2)", textDecoration: "none" }}>{l.label}</Link>
            ))}
          </div>
        ))}
      </footer>

      {/* Copyright bar */}
      <div className="mx-auto max-w-360 flex flex-wrap gap-2 justify-between items-center" style={{ padding: "24px clamp(20px, 5vw, 40px) 56px", borderTop: "1px solid var(--border)" }}>
        <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>© {new Date().getFullYear()} Binectics. All rights reserved.</span>
        <div className="flex items-center gap-3">
          <RegionSelector />
          <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>v 1.0 · early access · built for Nigeria</span>
        </div>
      </div>
    </>
  );
}
