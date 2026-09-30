"use client";

import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketplaceAuthCluster } from "@/components/MarketplaceAuthCluster";
import { useRegion } from "@/contexts/RegionContext";
import { useSearchListings } from "@/lib/queries/marketplace";
import { useCurrencyList } from "@/lib/queries/currencies";
import { listingDisplayName, listingPriceFrom } from "@/lib/marketplace/listingDisplay";

/**
 * Marketplace map view (proto: marketplace-map.html). The map itself is
 * still a drawing; the provider list beside it is the real marketplace
 * search for the visitor's country (GET /marketplace/listings), each with
 * its own "from" price in its own currency. It used to list made-up
 * providers with rand prices.
 */

const HUES = [60, 100, 140, 180, 220];
const TYPE_LABEL: Record<string, string> = {
  gym_owner: "gym",
  personal_trainer: "trainer",
  dietitian: "dietitian",
};

export default function MarketplaceMapPage() {
  const { country, isDetected } = useRegion();
  const { data, isPending } = useSearchListings({ country_code: country, limit: 20 }, isDetected);
  const { data: currencies } = useCurrencyList();
  const listings = data?.listings ?? [];
  const total = data?.pagination.total ?? listings.length;
  const countLabel = isPending ? "Loading providers" : `${total} provider${total === 1 ? "" : "s"}`;
  return (
    <div style={{ background: "var(--bg-2)", minHeight: "100vh" }}>
      {/* Topbar */}
      <header className="border-b border-border" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-320 flex items-center justify-between h-14 px-5 sm:px-8">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="flex items-center gap-4 text-[13.5px]">
            <Link href="/marketplace" style={{ color: "var(--fg-2)", textDecoration: "none" }}>Marketplace</Link>
            <MarketplaceAuthCluster compact />
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-320 px-5 sm:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-5 gap-3">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-medium" style={{ letterSpacing: "-0.026em", color: "var(--ink)" }}>Marketplace · map view</h1>
            <p className="mt-1.5 text-[14px]" style={{ color: "var(--fg-3)" }}>{countLabel}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/marketplace" className="btn-ghost-v2 sm">List view</Link>
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
                <strong className="text-[13px] font-medium normal-case" style={{ color: "var(--ink)", fontFamily: "var(--font-sans)", letterSpacing: "-0.005em" }}>Map preview</strong> · {countLabel}
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
            {!isPending && listings.length === 0 && (
              <p className="text-[13px] p-3.5" style={{ color: "var(--fg-3)" }}>No providers listed here yet.</p>
            )}
            {listings.map((l, i) => {
              const price = listingPriceFrom(l, currencies);
              const hue = HUES[i % HUES.length];
              const meta = [TYPE_LABEL[l.account_type] ?? l.account_type, price, l.review_count > 0 ? l.average_rating.toFixed(1) : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <Link
                  key={l._id}
                  href={`/marketplace/${l._id}`}
                  className="flex gap-2.5 rounded-(--r-2) p-3.5 cursor-pointer"
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none" }}
                >
                  <div className="w-10 h-10 rounded-(--r-2) shrink-0" style={{ background: `linear-gradient(135deg, oklch(0.85 0.04 ${hue}), oklch(0.75 0.06 ${hue - 10}))` }} />
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{listingDisplayName(l)}</div>
                    <div className="font-mono text-[11px] uppercase tracking-[0.04em] mt-0.75" style={{ color: "var(--fg-3)" }}>{meta}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
