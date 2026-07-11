"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { formatCurrency } from "@/utils/format";

/**
 * Marketplace Map — map view with provider sidebar list.
 * Proto: marketplace-map.html
 * Topbar + grid: map placeholder (SVG) + sidebar listing cards.
 * "use client" needed for interactive map placeholder.
 */

const LISTINGS = [
  { name: "Iron Lab Sea Point", type: "gym", amount: 850, currency: "ZAR", unit: "/mo", rating: "4.9", hue: 60 },
  { name: "Sarah Okafor", type: "trainer", amount: 1200, currency: "ZAR", unit: "/session", rating: "4.9", hue: 100 },
  { name: "Dr Nadia Hassan", type: "dietitian", amount: 950, currency: "ZAR", unit: "/consult", rating: "4.8", hue: 140 },
  { name: "Strathmore Strength", type: "gym", amount: 720, currency: "ZAR", unit: "/mo", rating: "4.7", hue: 180 },
  { name: "Marcus Bell", type: "mobility", amount: 800, currency: "ZAR", unit: "/session", rating: "4.9", hue: 220 },
];

export default function MarketplaceMapPage() {
  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/login" prefetch={false} className="btn-primary-v2 sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-320 px-5 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-3">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-medium" style={{ letterSpacing: "-0.026em", color: "var(--ink)" }}>Marketplace · map view</h1>
            <p className="mt-1.5 text-[14px]" style={{ color: "var(--fg-3)" }}>142 providers in Cape Town · drag to pan, scroll to zoom</p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace" className="btn-ghost-v2 sm">List view</Link>
            <button className="btn-ghost-v2 sm">Filters · 4</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-4">
          {/* Map placeholder */}
          <div className="rounded-(--r-3) overflow-hidden relative" style={{ background: "var(--bg)", border: "1px solid var(--border)", height: "clamp(400px, 60vh, 640px)" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, oklch(0.93 0.012 75) 0%, oklch(0.88 0.012 200) 100%)" }}>
              <svg viewBox="0 0 800 640" className="absolute inset-0 w-full h-full">
                <path d="M 100 200 Q 200 180 300 220 T 500 250 T 700 280 L 700 640 L 100 640 Z" fill="oklch(0.83 0.04 240 / 0.5)" />
                <path d="M 0 380 Q 150 350 280 380 T 520 400 T 800 420 L 800 640 L 0 640 Z" fill="oklch(0.88 0.03 230 / 0.4)" />
                {/* Map pins */}
                <circle cx="80" cy="100" r="9" fill="var(--ink)" stroke="oklch(0.62 0.13 47)" strokeWidth="3" />
                <circle cx="140" cy="139" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="200" cy="178" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="260" cy="256" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="320" cy="295" r="9" fill="var(--ink)" stroke="oklch(0.62 0.13 47)" strokeWidth="3" />
                <circle cx="380" cy="373" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="440" cy="412" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="500" cy="430" r="9" fill="var(--ink)" stroke="oklch(0.62 0.13 47)" strokeWidth="3" />
                <circle cx="560" cy="469" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="620" cy="547" r="6" fill="oklch(0.4 0.012 80)" />
                <circle cx="680" cy="145" r="9" fill="var(--ink)" stroke="oklch(0.62 0.13 47)" strokeWidth="3" />
                <circle cx="740" cy="184" r="6" fill="oklch(0.4 0.012 80)" />
              </svg>

              {/* City label */}
              <div className="absolute top-5 left-5 rounded-(--r-2) px-3.5 py-2.5 font-mono text-[11px] uppercase tracking-[0.04em]" style={{ background: "var(--bg)", color: "var(--fg-3)", boxShadow: "0 2px 8px oklch(0 0 0 / 0.06)" }}>
                <strong className="text-[13px] font-medium normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", letterSpacing: "-0.005em" }}>Cape Town</strong> · 142 providers
              </div>

              {/* Zoom controls */}
              <div className="absolute bottom-5 right-5 flex flex-col gap-0.5">
                <button className="w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center text-[16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>+</button>
                <button className="w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center text-[16px]" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>&minus;</button>
              </div>
            </div>
          </div>

          {/* Sidebar listings */}
          <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto">
            {LISTINGS.map((l) => (
              <Link
                key={l.name}
                href="/marketplace"
                className="flex gap-2.5 rounded-(--r-2) p-3.5 cursor-pointer"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none" }}
              >
                <div className="w-10 h-10 rounded-(--r-2) shrink-0" style={{ background: `linear-gradient(135deg, oklch(0.85 0.04 ${l.hue}), oklch(0.75 0.06 ${l.hue - 10}))` }} />
                <div>
                  <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{l.name}</div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>{l.type} · {formatCurrency(l.amount, l.currency)}{l.unit} · {l.rating}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
