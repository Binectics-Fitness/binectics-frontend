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
      { name: "Members", href: "/register" },
    ],
  },
  company: {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Press", href: "/press" },
      { name: "Partners", href: "/partners" },
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
      <footer className="mx-auto max-w-360 px-5 sm:px-10 pt-12 sm:pt-16 pb-10 border-t border-border grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[2fr_repeat(4,1fr)] gap-8 sm:gap-12">
        {/* Brand block */}
        <div className="flex flex-col gap-4 max-w-xs col-span-2 sm:col-span-3 md:col-span-1">
          <Link href="/">
            <BinecticsLockup markSize={30} className="[&_.wordmark]:text-[22px]" />
          </Link>
          <p className="text-[13px] text-fg-3 leading-relaxed">
            The operating system for fitness. One marketplace, one set of
            dashboards, one tab. Available in 50+ countries.
          </p>
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
