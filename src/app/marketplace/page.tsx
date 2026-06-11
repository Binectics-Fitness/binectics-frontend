"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useRegion } from "@/contexts/RegionContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { formatCurrency } from "@/utils/format";

/* ─── Types (from API response) ──────────────────────────── */

interface Listing {
  _id: string;
  account_type: string;
  headline: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  facilities?: string[];
  amenities?: string[];
  photos?: string[];
  profile_image?: string;
  city?: string;
  country_code?: string;
  currency?: string;
  price_from?: number;
  price_label?: string;
  verification_badge?: string;
  average_rating: number;
  review_count: number;
  accepting_clients?: boolean;
  organization?: { _id: string; name: string } | null;
  professional?: { _id: string; first_name: string; last_name: string; profile_picture?: string } | null;
  published_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/* ─── Helpers ────────────────────────────────────────────── */

const ACCOUNT_MAP: Record<string, "gym" | "trainer" | "dietitian"> = {
  gym_owner: "gym",
  personal_trainer: "trainer",
  dietitian: "dietitian",
};

function listingName(l: Listing): string {
  if (l.organization?.name) return l.organization.name;
  if (l.professional) return `${l.professional.first_name} ${l.professional.last_name}`;
  return l.headline;
}

function listingSubline(l: Listing): string {
  const parts: string[] = [];
  if (l.specialties?.length) parts.push(l.specialties[0]);
  if (l.city) parts.push(l.city);
  if (l.country_code) parts.push(l.country_code);
  return parts.join(" · ") || l.headline;
}

function listingTags(l: Listing): string[] {
  const tags: string[] = [];
  if (l.specialties) tags.push(...l.specialties.slice(0, 3));
  if (l.facilities) tags.push(...l.facilities.slice(0, 3 - tags.length));
  if (l.amenities) tags.push(...l.amenities.slice(0, 3 - tags.length));
  return tags.slice(0, 3);
}

function listingStatus(l: Listing): { text: string; muted: boolean } {
  if (l.accepting_clients) return { text: "Accepting clients", muted: false };
  if (l.verification_badge === "none") return { text: "Pending verification", muted: true };
  return { text: "", muted: true };
}

/* ─── Design tokens ──────────────────────────────────────── */

const TYPE_BADGE = {
  gym:       { label: "Gym",       cls: "bg-gym-soft border-[oklch(0.88_0.04_248)]",      color: "var(--gym)" },
  trainer:   { label: "Trainer",   cls: "bg-trainer-soft border-[oklch(0.88_0.05_75)]",    color: "oklch(0.45 0.12 75)" },
  dietitian: { label: "Dietitian", cls: "bg-dietitian-soft border-[oklch(0.88_0.04_300)]", color: "var(--dietitian)" },
} as const;

const PH_BG: Record<string, string> = {
  gym:       "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 10px, oklch(0.93 0.012 248) 10px 20px)",
  trainer:   "repeating-linear-gradient(135deg, oklch(0.92 0.012 75) 0 10px, oklch(0.94 0.01 75) 10px 20px)",
  dietitian: "repeating-linear-gradient(135deg, oklch(0.90 0.018 300) 0 10px, oklch(0.93 0.014 300) 10px 20px)",
};

const TABS = [
  { label: "All", value: "" },
  { label: "Gyms", value: "gym_owner" },
  { label: "Trainers", value: "personal_trainer" },
  { label: "Dietitians", value: "dietitian" },
];

const SORT_OPTIONS = [
  { label: "Top rated", value: "rating" },
  { label: "Newest", value: "newest" },
  { label: "Nearest", value: "nearest" },
  { label: "Price · low", value: "price_asc" },
];

/* ─── Icons ──────────────────────────────────────────────── */

function Star() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" /></svg>;
}
function Heart() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" /></svg>;
}
function Search() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>;
}
function Chev() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg>;
}

/* ─── Checkbox ───────────────────────────────────────────── */

function Check({ on = false }: { on?: boolean }) {
  return (
    <span className={`w-4 h-4 rounded-1 border flex items-center justify-center shrink-0 ${on ? "bg-ink border-ink" : "bg-bg border-border-2"}`}>
      {on && <span className="w-2 h-1 border-l-[1.5px] border-b-[1.5px] -rotate-45 -translate-y-px" style={{ borderColor: "var(--bg)" }} />}
    </span>
  );
}

function CheckRow({ label, count, on = false }: { label: string; count: number; on?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-[13.5px] cursor-pointer" style={{ color: "var(--ink)" }}>
      <span className="flex items-center gap-2.25"><Check on={on} />{label}</span>
      <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-4)" }}>{count.toLocaleString()}</span>
    </div>
  );
}

/* ═══ PAGE ═══════════════════════════════════════════════════ */

export default function MarketplacePage() {
  const { formatAmount } = useRegion();
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");
  const [activeSort, setActiveSort] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { page: currentPage, limit: 20 };
    if (activeTab) params.account_type = activeTab;

    const res = await marketplaceService.searchListings(params);
    if (res.success && res.data) {
      const data = res.data as unknown as { listings: Listing[]; pagination: Pagination };
      setListings(data.listings || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 });
    }
    setLoading(false);
  }, [activeTab, currentPage]);

  useEffect(() => {
    const id = setTimeout(() => {
      void fetchListings();
    }, 0);
    return () => clearTimeout(id);
  }, [fetchListings]);

  const total = pagination.total;
  const totalPages = pagination.total_pages;

  // Tab counts — derive from total when "All" is selected
  const tabCounts: Record<string, string> = {
    "": total.toLocaleString(),
    gym_owner: activeTab === "gym_owner" ? total.toLocaleString() : "–",
    personal_trainer: activeTab === "personal_trainer" ? total.toLocaleString() : "–",
    dietitian: activeTab === "dietitian" ? total.toLocaleString() : "–",
  };

  return (
    <div style={{ background: "var(--bg)" }}>

      {/* ═══ TOPBAR ═══ */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-360 flex items-center justify-between h-14 sm:h-16 px-5 sm:px-10 gap-4 sm:gap-6">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="hidden md:flex gap-0.5">
            {[
              { href: "/", label: "Home", active: false },
              { href: "/marketplace", label: "Marketplace", active: true },
              { href: "#", label: "For providers", active: false },
              { href: "/pricing", label: "Pricing", active: false },
            ].map((l) => (
              <Link key={l.label} href={l.href} className={`px-3 py-2 rounded-(--r-2) text-[13.5px] ${l.active ? "bg-bg-2" : "hover:bg-bg-2"}`} style={{ color: l.active ? "var(--ink)" : "var(--fg-2)" }}>{l.label}</Link>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2.5 h-9.5 px-3.5 border border-border rounded-full w-90 bg-bg">
            <span style={{ color: "var(--fg-3)" }}><Search /></span>
            <span className="flex-1 text-[14px]" style={{ color: "var(--fg-3)" }}>Search gyms, trainers, dietitians…</span>
            <span className="font-mono text-[10.5px] px-1.25 py-px border border-border rounded-1" style={{ color: "var(--fg-3)", background: "var(--bg-2)" }}>⌘ K</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="lg:hidden w-10 h-10 sm:w-8 sm:h-8 rounded-(--r-2) flex items-center justify-center" style={{ border: "1px solid var(--border)", background: "var(--bg)", color: "var(--fg-2)" }}><Search /></button>
            <Link href="/login" className="btn-ghost-v2 sm hidden sm:inline-flex">Log in</Link>
            <Link href="/login?mode=signup&role=member" className="btn-primary-v2 sm">Sign up</Link>
          </div>
        </div>
      </header>

      {/* ═══ HEAD ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-8 sm:pt-14 pb-4 sm:pb-6">
        <div className="eyebrow mb-3">Marketplace · Lagos, NG</div>
        <h1 className="text-[32px] sm:text-[44px] lg:text-[56px] font-medium leading-[0.98] max-w-[16ch]" style={{ letterSpacing: "-0.035em", color: "var(--ink)" }}>
          {total > 0 ? total.toLocaleString() : "–"} verified ways<br />to <em className="font-serif font-normal italic" style={{ letterSpacing: "-0.01em" }}>show up</em>.
        </h1>
        <p className="text-[15px] sm:text-[17px] mt-4 sm:mt-5 max-w-135 leading-relaxed" style={{ color: "var(--fg-2)" }}>
          Browse gyms, trainers, and dietitians by city, rating, and price. Every listing on this page has been verified by our team.
        </p>
      </section>

      {/* ═══ TABS + SORT ═══ */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 py-4 sm:py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border">
        <nav className="flex gap-0.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {TABS.map((t) => (
            <button
              key={t.label}
              onClick={() => { setActiveTab(t.value); setCurrentPage(1); }}
              className={`inline-flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-(--r-2) text-[13px] sm:text-[14px] cursor-pointer shrink-0 ${activeTab === t.value ? "bg-ink" : "hover:bg-bg-2"}`}
              style={{ color: activeTab === t.value ? "var(--bg)" : "var(--fg-2)" }}
            >
              {t.label}
              <span className="font-mono text-[11px] px-1.5 py-px rounded-full" style={{ background: activeTab === t.value ? "oklch(0.30 0.008 80)" : "oklch(0.92 0.005 85)", color: activeTab === t.value ? "oklch(0.85 0.008 85)" : "var(--fg-3)" }}>
                {tabCounts[t.value]}
              </span>
            </button>
          ))}
        </nav>
        <div className="hidden sm:flex items-center gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Sort</span>
          <div className="inline-flex border border-border rounded-(--r-2) overflow-hidden">
            {SORT_OPTIONS.map((s, i) => (
              <button key={s.value} onClick={() => setActiveSort(i)} className={`px-3 py-1.5 text-[12.5px] cursor-pointer ${i < 3 ? "border-r border-border" : ""} ${activeSort === i ? "bg-bg-3" : ""}`} style={{ color: activeSort === i ? "var(--ink)" : "var(--fg-2)" }}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ LAYOUT ═══ */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 pt-7 pb-20 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 sm:gap-8 items-start">

        {/* ─── FILTERS ─── */}
        <aside className="hidden lg:block border border-border rounded-(--r-3) bg-bg overflow-hidden sticky top-20">
          <div className="p-4.5 border-b border-border">
            <h4 className="font-mono text-[12.5px] uppercase tracking-[0.04em] font-normal mb-3" style={{ color: "var(--fg-3)" }}>Location</h4>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between h-8 px-2.5 border border-border-2 rounded-(--r-2) bg-bg text-[13px] cursor-pointer" style={{ color: "var(--ink)" }}>Nigeria <Chev /></div>
              <div className="flex items-center justify-between h-8 px-2.5 border border-border-2 rounded-(--r-2) bg-bg text-[13px] cursor-pointer" style={{ color: "var(--ink)" }}>Lagos <Chev /></div>
            </div>
          </div>
          <div className="p-4.5 border-b border-border">
            <h4 className="font-mono text-[12.5px] uppercase tracking-[0.04em] font-normal mb-3" style={{ color: "var(--fg-3)" }}>Price · monthly</h4>
            <div className="relative h-1 bg-bg-3 rounded-full my-4.5 mx-1">
              <div className="absolute left-[18%] right-[22%] top-0 bottom-0 bg-ink rounded-full" />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-bg border border-ink rounded-full" style={{ left: "18%" }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-bg border border-ink rounded-full" style={{ left: "78%" }} />
            </div>
            <div className="flex justify-between font-mono text-[11px]" style={{ color: "var(--fg-3)" }}><span>{formatAmount(5000)}</span><span>{`${formatAmount(200000)}+`}</span></div>
          </div>
          <div className="p-4.5 border-b border-border">
            <h4 className="font-mono text-[12.5px] uppercase tracking-[0.04em] font-normal mb-3" style={{ color: "var(--fg-3)" }}>Specializations</h4>
            <CheckRow label="Weight loss" count={3} on />
            <CheckRow label="Strength & conditioning" count={2} />
            <CheckRow label="Sports nutrition" count={2} />
            <CheckRow label="PCOS" count={1} />
            <CheckRow label="Muscle build" count={1} />
          </div>
          <div className="p-4.5 border-b border-border">
            <h4 className="font-mono text-[12.5px] uppercase tracking-[0.04em] font-normal mb-3" style={{ color: "var(--fg-3)" }}>Amenities</h4>
            <CheckRow label="Wifi" count={1} />
            <CheckRow label="Shower" count={1} />
            <CheckRow label="Parking" count={1} />
          </div>
          <div className="p-4.5 border-b border-border">
            <h4 className="font-mono text-[12.5px] uppercase tracking-[0.04em] font-normal mb-3" style={{ color: "var(--fg-3)" }}>Rating</h4>
            <CheckRow label="4.5 & up" count={total} on />
            <CheckRow label="4.0 & up" count={total} />
            <CheckRow label="Any" count={total} />
          </div>
          <div className="p-4.5 border-b border-border">
            <h4 className="font-mono text-[12.5px] uppercase tracking-[0.04em] font-normal mb-3" style={{ color: "var(--fg-3)" }}>Currency</h4>
            <div className="flex flex-wrap gap-1.5">
              {["NGN", "USD", "EUR", "GBP", "ZAR", "KES"].map((c, i) => (
                <span key={c} className="inline-flex items-center h-6 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg-3 border" style={{ color: i === 0 ? "var(--ink)" : "var(--fg-2)", borderColor: i === 0 ? "var(--ink)" : "var(--border)" }}>{c}</span>
              ))}
            </div>
          </div>
          <div className="p-4.5 flex gap-2">
            <button className="btn-primary-v2 sm flex-1">Apply</button>
            <button className="btn-ghost-v2 sm">Reset</button>
          </div>
        </aside>

        {/* ─── RESULTS ─── */}
        <div>
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
              {loading ? "Loading…" : "Featured · this week"}
            </h2>
            <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>
              Page {pagination.page} / {totalPages || 1} · {total.toLocaleString()} results
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-6 w-6 border-2 border-solid border-t-transparent animate-spin rounded-full" style={{ borderColor: "var(--border-2)", borderTopColor: "transparent" }} />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[15px]" style={{ color: "var(--fg-3)" }}>No listings found. Try changing your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((l, idx) => {
                const type = ACCOUNT_MAP[l.account_type] || "gym";
                const tb = TYPE_BADGE[type];
                const bg = l.photos?.[0]
                  ? undefined
                  : PH_BG[type] || PH_BG.gym;
                const isFeatured = idx === 0;
                const name = listingName(l);
                const sub = listingSubline(l);
                const tags = listingTags(l);
                const status = listingStatus(l);
                const price = l.price_from && l.currency
                  ? formatCurrency(l.price_from, l.currency)
                  : l.price_label || "–";
                const per = l.price_label?.replace(/^From\s+\S+\s*/, "") || "plan";
                const isVerified = l.verification_badge && l.verification_badge !== "none";
                const photoUrl = l.photos?.[0] || l.profile_image;

                return (
                  <Link
                    href={`/marketplace/${l._id}`}
                    key={l._id}
                    className={`block border border-border rounded-(--r-3) bg-bg overflow-hidden cursor-pointer hover:border-ink ${isFeatured ? "sm:col-span-2" : ""}`}
                    style={{ transition: "border-color 120ms" }}
                  >
                    {/* Photo / Placeholder */}
                    <div
                      className={`relative ${isFeatured ? "aspect-video" : "aspect-4/3"}`}
                      style={{
                        background: photoUrl ? undefined : bg,
                        borderBottom: "1px solid var(--border)",
                      }}
                    >
                      {photoUrl && (
                        <Image
                          src={photoUrl}
                          alt={name}
                          fill
                          className="object-cover"
                          sizes={isFeatured ? "(max-width: 640px) 100vw, 66vw" : "(max-width: 640px) 100vw, 33vw"}
                        />
                      )}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                        <span className={`inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium border ${tb.cls}`} style={{ color: tb.color }}>{tb.label}</span>
                        {isVerified && (
                          <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-signal-soft border border-[oklch(0.88_0.05_148)]" style={{ color: "var(--signal-ink)" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />Verified
                          </span>
                        )}
                        {isFeatured && (
                          <span className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-ink border border-ink" style={{ color: "var(--bg)" }}>Featured</span>
                        )}
                      </div>
                      <div className="absolute top-2.5 right-2.5 w-10 h-10 sm:w-7 sm:h-7 rounded-full flex items-center justify-center backdrop-blur-sm" style={{ background: "oklch(0.985 0.005 85 / 0.85)", color: "var(--fg-2)" }}>
                        <Heart />
                      </div>
                      {!photoUrl && (
                        <span className="absolute bottom-2.5 left-3 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                          {type} · {name}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    {isFeatured ? (
                      <div className="p-3.5 flex flex-col sm:flex-row justify-between items-start gap-3">
                        <div className="flex flex-col gap-1.5">
                          <div className="text-[22px] font-medium" style={{ letterSpacing: "-0.014em", color: "var(--ink)" }}>{name}</div>
                          <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{l.review_count} reviews · {sub}</div>
                          <div className="flex flex-wrap gap-1.25 mt-1">
                            {tags.map((t) => (
                              <span key={t} className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 items-end text-right">
                          <div className="flex items-center gap-1.5 text-[12.5px]">
                            <span style={{ color: "var(--ink)" }}><Star /></span>
                            <span style={{ color: "var(--ink)", fontWeight: 500 }}>{l.average_rating || "–"}</span>
                          </div>
                          <span className="font-mono text-[16px] font-medium" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
                            {price} <small className="text-[13px] font-normal" style={{ color: "var(--fg-3)" }}>/ {per}</small>
                          </span>
                          <span className="btn-primary-v2 sm">View profile →</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--fg-2)" }}>
                          <span style={{ color: "var(--ink)" }}><Star /></span>
                          <span style={{ color: "var(--ink)", fontWeight: 500 }}>{l.average_rating || "–"}</span>
                          <span>· {l.review_count} reviews</span>
                        </div>
                        <div className="text-[16px] font-medium" style={{ letterSpacing: "-0.014em", color: "var(--ink)" }}>{name}</div>
                        <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{sub}</div>
                        <div className="flex flex-wrap gap-1.25 mt-1">
                          {tags.map((t) => (
                            <span key={t} className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{t}</span>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-3 border-t border-border">
                          <span className="font-mono text-[13.5px] font-medium" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>
                            {price} <small className="font-normal" style={{ color: "var(--fg-3)" }}>/ {per}</small>
                          </span>
                          <span className="font-mono text-[11.5px]" style={{ color: status.muted ? "var(--fg-3)" : "var(--signal-ink)" }}>
                            {status.text}
                          </span>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="flex justify-center items-center gap-1 mt-8">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono disabled:opacity-30"
                style={{ color: "var(--fg-2)" }}
              >‹</button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => setCurrentPage(n)}
                  className={`w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono cursor-pointer ${currentPage === n ? "bg-ink" : "hover:bg-bg-2"}`}
                  style={{ color: currentPage === n ? "var(--bg)" : "var(--fg-2)" }}
                >{n}</button>
              ))}
              {totalPages > 5 && (
                <>
                  <span className="font-mono text-[13px] px-1" style={{ color: "var(--fg-4)" }}>…</span>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono cursor-pointer hover:bg-bg-2"
                    style={{ color: "var(--fg-2)" }}
                  >{totalPages}</button>
                </>
              )}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-(--r-2) text-[13px] font-mono disabled:opacity-30"
                style={{ color: "var(--fg-2)" }}
              >›</button>
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
