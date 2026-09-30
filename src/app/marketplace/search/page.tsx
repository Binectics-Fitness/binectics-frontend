"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { MarketplaceAuthCluster } from "@/components/MarketplaceAuthCluster";
import { useSearchListings } from "@/lib/queries/marketplace";
import { useCurrencyList } from "@/lib/queries/currencies";
import { listingDisplayName, listingPriceFrom } from "@/lib/marketplace/listingDisplay";

/**
 * Marketplace search results (proto: marketplace-search-results.html).
 * Results come from GET /marketplace/listings (the same search as
 * /marketplace); each card's price is the listing's own "from" price in its
 * own currency, or nothing. It used to render eight made-up providers with
 * rand prices.
 */

const HUES = [0, 45, 90, 135, 180, 225, 270, 315];

function SearchIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}

export default function MarketplaceSearchPage() {
  return (
    <Suspense fallback={null}>
      <MarketplaceSearch />
    </Suspense>
  );
}

function MarketplaceSearch() {
  const params = useSearchParams();
  const [draft, setDraft] = useState(() => params.get("q") ?? "");
  const [q, setQ] = useState(draft);
  const { data, isPending, isError } = useSearchListings({ q: q.trim() || undefined, limit: 20 });
  const { data: currencies } = useCurrencyList();
  const results = data?.listings ?? [];
  const total = data?.pagination.total ?? results.length;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setQ(draft);
  };

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
        {/* Search bar */}
        <div className="mb-6">
          <form onSubmit={onSubmit} role="search" className="flex gap-2 items-center rounded-(--r-3) px-3.5 py-2.5 max-w-140" style={{ background: "var(--bg)", border: "1px solid var(--border-2)" }}>
            <span style={{ color: "var(--fg-3)" }}><SearchIcon /></span>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search providers"
              aria-label="Search providers"
              className="flex-1 min-w-0 border-0 outline-0 text-[14px]"
              style={{ background: "transparent", font: "inherit" }}
            />
          </form>
          <p className="mt-3 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
            {isPending ? "Searching" : isError ? "Search is unavailable right now" : `${total} provider${total === 1 ? "" : "s"}`}
          </p>
        </div>

        {/* Results grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {results.map((l, i) => {
            const price = listingPriceFrom(l, currencies);
            const hue = HUES[i % HUES.length];
            const verified = l.verification_badge && l.verification_badge !== "none";
            const sub = [l.specialties?.[0], l.city].filter(Boolean).join(" · ") || l.headline;
            return (
              <Link
                key={l._id}
                href={`/marketplace/${l._id}`}
                className="flex gap-3.5 rounded-(--r-3) p-4.5"
                style={{ background: "var(--bg)", border: "1px solid var(--border)", textDecoration: "none", color: "inherit" }}
              >
                <div className="w-16 h-16 rounded-(--r-2) shrink-0" style={{ background: `linear-gradient(135deg, oklch(0.86 0.04 ${hue}), oklch(0.74 0.06 ${hue + 30}))` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium mb-1" style={{ color: "var(--ink)" }}>{listingDisplayName(l)}</div>
                  <div className="text-[13px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>
                    {sub}
                    {price ? ` · ${price}` : ""}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {l.review_count > 0 && (
                      <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}>&#9733; {l.average_rating.toFixed(1)}</span>
                    )}
                    {verified && (
                      <span className="font-mono text-[10px] px-1.75 py-0.5 rounded-(--r-1) uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>verified</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
