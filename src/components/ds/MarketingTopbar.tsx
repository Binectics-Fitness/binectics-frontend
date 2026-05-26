"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketingMobileNav } from "./MobileNav";

/**
 * MarketingTopbar — shared topbar for all marketing/public pages.
 * 3-part layout: brand (left) · nav links (center) · buttons (right).
 * Mobile: brand + MobileNav trigger.
 */

const DEFAULT_LINKS = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
];

interface MarketingTopbarProps {
  activeLabel?: string;
  links?: { href: string; label: string }[];
}

export function MarketingTopbar({ activeLabel, links = DEFAULT_LINKS }: MarketingTopbarProps) {
  const navLinks = links.map(l => ({ ...l, active: l.label === activeLabel }));

  return (
    <header style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between mx-auto max-w-360 px-5 sm:px-10" style={{ height: "64px" }}>
        {/* Left: brand */}
        <Link href="/"><BinecticsLockup /></Link>

        {/* Center: nav links */}
        <nav className="hidden md:flex gap-0.5">
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`px-3 py-2 rounded-(--r-2) text-[13.5px] ${l.active ? "bg-bg-2" : "hover:bg-bg-2"}`}
              style={{ color: l.active ? "var(--ink)" : "var(--fg-2)" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right: buttons + mobile trigger */}
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost-v2 sm hidden sm:inline-flex">Log in</Link>
          <Link href="/register" className="btn-primary-v2 sm hidden sm:inline-flex">Sign up</Link>
          <MarketingMobileNav links={navLinks} />
        </div>
      </div>
    </header>
  );
}
