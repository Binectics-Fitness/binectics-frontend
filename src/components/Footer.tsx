import Link from "next/link";
import { BinecticsLockup } from "./BinecticsLogo";

/**
 * Footer — 5-column grid matching landing.html prototype.
 * Mono uppercase column headers, sentence-case links.
 * No social icons, no hover animations, no gradients.
 */

const columns = {
  product: {
    title: "Product",
    links: [
      { name: "Marketplace", href: "/marketplace" },
      { name: "For gyms", href: "/gyms" },
      { name: "For trainers", href: "/trainers" },
      { name: "For dietitians", href: "/dietitians" },
      { name: "Members", href: "/login?mode=signup" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Partners", href: "/partners" },
      { name: "Contact", href: "/contact" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { name: "Help center", href: "/help" },
      { name: "QR help", href: "/qr-help" },
      { name: "System status", href: "/status" },
      { name: "FAQ", href: "/faq" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "Cookies", href: "/cookies" },
      { name: "Security", href: "/security" },
    ],
  },
};

export default function Footer() {
  return (
    <>
      <footer className="mx-auto max-w-360 px-5 sm:px-10 pt-12 sm:pt-16 pb-10 border-t border-border grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[2fr_repeat(4,1fr)] gap-8 sm:gap-12" aria-label="Footer navigation">
        {/* Brand block */}
        <div className="flex flex-col gap-4 max-w-xs col-span-2 sm:col-span-3 md:col-span-1">
          <Link href="/">
            <BinecticsLockup markSize={30} className="[&_.wordmark]:text-[22px]" />
          </Link>
          <p className="text-[13px] text-fg-3 leading-relaxed">
            The operating system for fitness. One marketplace, one set of
            dashboards, one tab. Available in 50+ countries.
          </p>
          <div className="flex gap-3 mt-1">
            <a href="https://x.com/binectics" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="text-fg-3 hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://linkedin.com/company/binectics" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-fg-3 hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://instagram.com/binectics" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-fg-3 hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
            </a>
            <a href="https://youtube.com/@binectics" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-fg-3 hover:text-ink">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
          </div>
        </div>

        {/* Link columns */}
        {Object.values(columns).map((col) => (
          <div key={col.title} className="flex flex-col">
            <h4 className="font-mono text-[11px] text-fg-4 uppercase tracking-[0.05em] mb-3.5">
              {col.title}
            </h4>
            {col.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="text-[13.5px] text-fg-2 py-1 hover:text-ink"
              >
                {link.name}
              </Link>
            ))}
          </div>
        ))}
      </footer>

      {/* Copyright bar */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 py-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[11.5px] text-fg-3">
        <span>© {new Date().getFullYear()} Binectics, Inc. All rights reserved.</span>
        <span>v 1.0 · 162 routes · 56 components</span>
      </div>
    </>
  );
}
