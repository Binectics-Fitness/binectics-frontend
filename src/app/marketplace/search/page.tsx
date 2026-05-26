"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";

/**
 * Marketplace Search Results — search results grid with search bar.
 * Proto: marketplace-search-results.html
 * Topbar + search input + 2-col result cards with avatar, name, desc, pills.
 * "use client" for search input interactivity.
 */

const RESULTS = [
  { name: "Thandi Nkosi", desc: "postnatal specialist · Sea Point · R 850", rating: "4.8", hue: 0 },
  { name: "Sarah Okafor", desc: "strength + postnatal · CBD · R 1,200", rating: "4.9", hue: 45 },
  { name: "Camilla Lapwing", desc: "postnatal pilates · Camps Bay · R 950", rating: "4.8", hue: 90 },
  { name: "Iron Lab", desc: "group postnatal class · Wed 10am · R 280", rating: "4.9", hue: 135 },
  { name: "Dr Nadia Hassan", desc: "postnatal nutrition · online · R 950", rating: "4.8", hue: 180 },
  { name: "Studio Move", desc: "postnatal yoga · Woodstock · R 200/class", rating: "4.9", hue: 225 },
  { name: "Marcus Bell", desc: "postnatal mobility · home visits · R 800", rating: "4.8", hue: 270 },
  { name: "Olive & Oak", desc: "mom & baby classes · Sea Point · R 320", rating: "4.9", hue: 315 },
];

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

export default function MarketplaceSearchPage() {
  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <Link href="/login" className="btn-primary-v2 sm">Sign in</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-320 px-5 sm:px-8 py-8">
        {/* Search bar */}
        <div className="mb-6">
          <div className="flex gap-2 items-center rounded-(--r-3) px-3.5 py-2.5 max-w-140" style={{ background: "var(--bg)", border: "1px solid var(--border-2)" }}>
            <span style={{ color: "var(--fg-3)" }}><SearchIcon /></span>
            <input
              defaultValue="postnatal strength · cape town"
              className="flex-1 border-0 outline-0 text-[14px]"
              style={{ background: "transparent", font: "inherit" }}
            />
            <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>&#8984; K</span>
          </div>
          <p className="mt-3 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            8 providers · sorted by relevance · <Link href="#" style={{ color: "var(--ink)" }}>filter by price</Link>
          </p>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {RESULTS.map((r) => (
            <Link
              key={r.name}
              href="/marketplace"
              className="flex gap-3.5 rounded-(--r-3) p-4.5"
              style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}
            >
              <div className="w-16 h-16 rounded-(--r-2) shrink-0" style={{ background: `linear-gradient(135deg, oklch(0.86 0.04 ${r.hue}), oklch(0.74 0.06 ${r.hue + 30}))` }} />
              <div className="flex-1">
                <div className="text-[15px] font-medium mb-1" style={{ color: "var(--ink)" }}>{r.name}</div>
                <div className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>{r.desc}</div>
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>&#9733; {r.rating}</span>
                  <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>verified</span>
                  <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>in 3 days</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
