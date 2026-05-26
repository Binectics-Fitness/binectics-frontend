"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { marketplaceService } from "@/lib/api/marketplace";

/* ─── Icons ──────────────────────────────────────────────── */

function Star({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" /></svg>;
}
function StarOutline({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" /></svg>;
}
function Chev() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m6 9 6 6 6-6" /></svg>;
}

/* ─── Helpers ────────────────────────────────────────────── */

const ACCOUNT_LABELS: Record<string, string> = { gym_owner: "Gym", personal_trainer: "Trainer", dietitian: "Dietitian" };
const BADGE_STYLES: Record<string, { cls: string; color: string }> = {
  gym_owner:         { cls: "bg-gym-soft border-[oklch(0.88_0.04_248)]",      color: "var(--gym)" },
  personal_trainer:  { cls: "bg-trainer-soft border-[oklch(0.88_0.05_75)]",    color: "oklch(0.45 0.12 75)" },
  dietitian:         { cls: "bg-dietitian-soft border-[oklch(0.88_0.04_300)]", color: "var(--dietitian)" },
};

const PH_BG: Record<string, string> = {
  gym_owner:        "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 10px, oklch(0.93 0.012 248) 10px 20px)",
  personal_trainer: "repeating-linear-gradient(135deg, oklch(0.92 0.012 75) 0 10px, oklch(0.94 0.01 75) 10px 20px)",
  dietitian:        "repeating-linear-gradient(135deg, oklch(0.90 0.018 300) 0 10px, oklch(0.93 0.014 300) 10px 20px)",
};

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", EUR: "€", GBP: "£", NGN: "₦", KES: "KSh", ZAR: "R", AED: "د.إ", INR: "₹" };
  return `${symbols[currency] || currency} ${amount.toLocaleString("en-US")}`;
}

/* ─── Types ──────────────────────────────────────────────── */

interface Listing {
  _id: string;
  account_type: string;
  headline: string;
  bio?: string;
  specialties?: string[];
  certifications?: string[];
  languages?: string[];
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
  active_client_count?: number;
  published_at?: string;
  organization?: { _id: string; name: string } | null;
  professional?: { _id: string; first_name: string; last_name: string; profile_picture?: string } | null;
  organization_id?: { _id: string; name: string } | null;
  professional_id?: { _id: string; first_name: string; last_name: string } | null;
}

interface Plan {
  _id: string;
  name: string;
  description?: string;
  plan_type: string;
  duration_days: number;
  price: number;
  currency: string;
  features?: string[];
  is_active?: boolean;
}

interface Review {
  _id: string;
  rating: number;
  comment?: string;
  user_id?: { first_name: string; last_name: string };
  created_at?: string;
}

/* ═══ PAGE ═══════════════════════════════════════════════════ */

export default function ProviderPage() {
  const params = useParams();
  const listingId = params.listingId as string;

  const [listing, setListing] = useState<Listing | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!listingId) return;
    (async () => {
      setLoading(true);
      const [listRes, planRes, revRes] = await Promise.all([
        marketplaceService.getListingById(listingId),
        marketplaceService.getPublicListingPlans(listingId),
        marketplaceService.getListingReviews(listingId),
      ]);
      if (listRes.success && listRes.data) setListing(listRes.data as unknown as Listing);
      if (planRes.success && planRes.data) setPlans((planRes.data as unknown as Plan[]) || []);
      if (revRes.success && revRes.data) {
        const rd = revRes.data as unknown as { reviews?: Review[] };
        setReviews(rd.reviews || []);
      }
      setLoading(false);
    })();
  }, [listingId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="h-6 w-6 border-2 border-solid border-t-transparent animate-spin rounded-full" style={{ borderColor: "var(--border-2)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <p className="text-[15px]" style={{ color: "var(--fg-3)" }}>Listing not found.</p>
      </div>
    );
  }

  const name = listing.organization_id?.name || listing.organization?.name || (listing.professional_id ? `${listing.professional_id.first_name} ${listing.professional_id.last_name}` : listing.professional ? `${listing.professional.first_name} ${listing.professional.last_name}` : listing.headline);
  const ownerName = listing.professional_id ? `${listing.professional_id.first_name} ${listing.professional_id.last_name}` : listing.professional ? `${listing.professional.first_name} ${listing.professional.last_name}` : "Provider";
  const ownerInitials = ownerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const badge = BADGE_STYLES[listing.account_type] || BADGE_STYLES.gym_owner;
  const typeLabel = ACCOUNT_LABELS[listing.account_type] || "Provider";
  const isVerified = listing.verification_badge && listing.verification_badge !== "none";
  const photos = listing.photos || [];
  const phBg = PH_BG[listing.account_type] || PH_BG.gym_owner;
  const allAmenities = [...(listing.amenities || []), ...(listing.facilities || [])];
  const price = listing.price_from && listing.currency ? formatCurrency(listing.price_from, listing.currency) : "–";
  const selectedPlan = plans[0];

  return (
    <div style={{ background: "var(--bg)" }}>

      {/* ═══ TOPBAR ═══ */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-360 flex items-center justify-between h-14 sm:h-16 px-5 sm:px-10">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="hidden md:flex gap-0.5">
            <Link href="/" className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>Home</Link>
            <Link href="/marketplace" className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>Marketplace</Link>
            <span className="px-3 py-2 rounded-(--r-2) text-[13.5px]" style={{ color: "var(--fg-2)" }}>For providers</span>
            <Link href="/pricing" className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost-v2 sm hidden sm:inline-flex">Log in</Link>
            <Link href="/register" className="btn-primary-v2 sm">Sign up</Link>
          </div>
        </div>
      </header>

      {/* ═══ GALLERY ═══ */}
      <section className="mx-auto max-w-360 px-5 sm:px-10 pt-6 grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr] sm:grid-rows-[200px_200px] gap-2 sm:h-[408px]">
        {Array.from({ length: 5 }).map((_, i) => {
          const photo = photos[i];
          return (
            <div key={i} className={`rounded-(--r-3) overflow-hidden relative border border-border min-h-[180px] sm:min-h-0 ${i >= 3 ? "hidden sm:block" : ""} ${i === 0 ? "sm:row-span-2" : ""}`} style={{ background: photo ? undefined : phBg }}>
              {photo && <Image src={photo} alt={`${name} photo ${i + 1}`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 50vw" />}
              {!photo && <span className="absolute bottom-2.5 left-3 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{typeLabel} · {name}</span>}
              {i === 4 && photos.length > 5 && (
                <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-bg border border-border px-3 py-1.5 rounded-full text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
                  Show all {photos.length}
                </span>
              )}
            </div>
          );
        })}
      </section>

      {/* ═══ LAYOUT ═══ */}
      <div className="mx-auto max-w-360 px-5 sm:px-10 pt-8 sm:pt-10 pb-20 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 lg:gap-12 items-start">

        {/* ─── LEFT ─── */}
        <div>
          {/* Head */}
          <div className="pb-7 border-b border-border flex flex-col gap-3.5">
            <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              <Link href="/marketplace" className="underline underline-offset-3 decoration-border-2">Marketplace</Link> / {listing.city || "–"} / {typeLabel} / {name}
            </div>
            <div className="flex items-center gap-3.5 flex-wrap">
              <span className={`inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium border ${badge.cls}`} style={{ color: badge.color }}>{typeLabel}</span>
              {isVerified && (
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-signal-soft border border-[oklch(0.88_0.05_148)]" style={{ color: "var(--signal-ink)" }}><span className="w-1.5 h-1.5 rounded-full bg-current" />Verified provider</span>
              )}
            </div>
            <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] font-medium leading-none" style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}>{name}</h1>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4.5 text-[13px] sm:text-[14px]" style={{ color: "var(--fg-2)" }}>
              <span className="flex items-center gap-2">
                <span className="flex gap-px" style={{ color: "var(--ink)" }}>{Array.from({ length: 5 }, (_, i) => <Star key={i} />)}</span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{listing.average_rating || "–"}</span>
                <span>· {listing.review_count} reviews</span>
              </span>
              {listing.city && <>
                <span className="w-[3px] h-[3px] rounded-full bg-border-2" />
                <span>{listing.city}{listing.country_code ? `, ${listing.country_code}` : ""}</span>
              </>}
              <span className="w-[3px] h-[3px] rounded-full bg-border-2" />
              <span>By {ownerName}</span>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost-v2 sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" /></svg>
                Save
              </button>
              <button className="btn-ghost-v2 sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8" /><path d="m17 8-5-5-5 5M12 3v12" /></svg>
                Share
              </button>
              <button className="btn-ghost-v2 sm">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /></svg>
                Message
              </button>
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-1 mt-6 border-b border-border overflow-x-auto">
            {["About", plans.length > 0 ? `Plans · ${plans.length}` : "Plans", allAmenities.length > 0 ? `Amenities · ${allAmenities.length}` : "Amenities", "Schedule", `Reviews · ${listing.review_count}`, "Location"].map((t, i) => (
              <span key={t} className={`px-4 py-3 text-[14px] -mb-px cursor-pointer shrink-0 ${i === 0 ? "border-b-[1.5px] border-ink font-medium" : ""}`} style={{ color: i === 0 ? "var(--ink)" : "var(--fg-2)" }}>{t}</span>
            ))}
          </nav>

          {/* About */}
          <section className="py-8 border-b border-border">
            <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>About</h2>
            <div className="text-[15px] leading-[1.65] max-w-[720px]" style={{ color: "var(--fg-2)" }}>
              <p>{listing.bio || "No description provided."}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-border mt-6">
              {[
                ["City", listing.city || "–"],
                ["Currency", listing.currency || "–"],
                ["Languages", listing.languages?.join(" · ") || "–"],
                ["Active clients", String(listing.active_client_count ?? "–")],
                ["Rating", listing.average_rating ? `${listing.average_rating} / 5` : "–"],
                ["Reviews", String(listing.review_count)],
              ].map(([l, v]) => (
                <div key={l} className="px-5 py-4 border-r border-b border-border">
                  <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-1.5" style={{ color: "var(--fg-3)" }}>{l}</div>
                  <div className="text-[15px]" style={{ color: "var(--ink)" }}>{v}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Plans */}
          {plans.length > 0 && (
            <section className="py-8 border-b border-border">
              <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Plans</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p, i) => (
                  <div key={p._id} className={`border rounded-(--r-3) p-5 flex flex-col gap-3 ${i === 0 ? "border-ink bg-bg-2" : "border-border bg-bg"}`}>
                    <div>
                      <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>{p.name}</div>
                      <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{p.description || `${p.plan_type} · ${p.duration_days} days`}</div>
                    </div>
                    <div className="font-mono text-[26px]" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em", color: "var(--ink)" }}>
                      {formatCurrency(p.price, p.currency)} <small className="font-mono text-[13px] font-normal" style={{ color: "var(--fg-3)" }}>/ {p.plan_type === "one_time" ? "once" : `${p.duration_days}d`}</small>
                    </div>
                    {p.features && p.features.length > 0 && (
                      <ul className="flex flex-col gap-1.5 list-none p-0">
                        {p.features.map((f) => (
                          <li key={f} className="text-[13px] pl-4.5 relative" style={{ color: "var(--fg-2)" }}>
                            <span className="absolute left-0 top-[5px] w-2.5 h-1.5 border-l-[1.5px] border-b-[1.5px] -rotate-45" style={{ borderColor: "var(--signal-ink)" }} />
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-auto">
                      {i === 0 ? (
                        <button className="btn-signal-v2 w-full" style={{ height: "34px" }}>Choose {p.name}</button>
                      ) : (
                        <button className="btn-ghost-v2 w-full" style={{ height: "34px" }}>Choose {p.name}</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Amenities */}
          {allAmenities.length > 0 && (
            <section className="py-8 border-b border-border">
              <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Amenities & facilities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {allAmenities.map((a) => (
                  <div key={a} className="flex items-center gap-2.5 px-3.5 py-3 border border-border rounded-(--r-2) text-[13.5px]" style={{ color: "var(--ink)" }}>{a}</div>
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="py-8 border-b border-border">
            <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Reviews</h2>
            <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 sm:gap-8 py-5">
              <div>
                <div className="text-[64px] font-medium leading-none" style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}>{listing.average_rating || "–"}</div>
                <div className="flex gap-px mt-2" style={{ color: "var(--ink)" }}>{Array.from({ length: 5 }, (_, i) => <Star key={i} />)}</div>
                <div className="font-mono text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>{listing.review_count} reviews</div>
              </div>
            </div>
            {reviews.length > 0 ? (
              <div className="flex flex-col">
                {reviews.map((rev) => {
                  const rName = rev.user_id ? `${rev.user_id.first_name} ${rev.user_id.last_name}` : "Anonymous";
                  const rInit = rName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
                  const rDate = rev.created_at ? new Date(rev.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "";
                  return (
                    <div key={rev._id} className="flex gap-4 py-4.5 border-t border-border">
                      <div className="w-9 h-9 rounded-full bg-bg-3 flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ color: "var(--fg-2)" }}>{rInit}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{rName}</span>
                          <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{rDate}</span>
                        </div>
                        <div className="flex gap-px mt-1" style={{ color: "var(--ink)" }}>
                          {Array.from({ length: 5 }, (_, i) => i < rev.rating ? <Star key={i} size={12} /> : <StarOutline key={i} />)}
                        </div>
                        {rev.comment && <p className="text-[14px] leading-relaxed mt-2" style={{ color: "var(--fg-2)" }}>{rev.comment}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[14px] mt-2" style={{ color: "var(--fg-3)" }}>No reviews yet.</p>
            )}
          </section>
        </div>

        {/* ─── RIGHT: BOOKING CARD ─── */}
        <aside className="sticky" style={{ top: "88px" }}>
          <div className="border border-border rounded-(--r-3) bg-bg overflow-hidden">
            <div className="px-5 pt-4.5 pb-3.5 border-b border-border flex justify-between items-start">
              <div>
                <div className="font-mono text-[24px]" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.012em", color: "var(--ink)" }}>
                  {selectedPlan ? formatCurrency(selectedPlan.price, selectedPlan.currency) : price}
                  <small className="font-mono text-[13px]" style={{ color: "var(--fg-3)" }}> / {selectedPlan ? (selectedPlan.plan_type === "one_time" ? "once" : `${selectedPlan.duration_days}d`) : "plan"}</small>
                </div>
                <div className="flex items-center gap-1 text-[12.5px] mt-1" style={{ color: "var(--fg-2)" }}>
                  <span style={{ color: "var(--ink)" }}><Star size={11} /></span>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{listing.average_rating || "–"}</span>
                  <span>· {listing.review_count} reviews</span>
                </div>
              </div>
              {isVerified && (
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-signal-soft border border-[oklch(0.88_0.05_148)]" style={{ color: "var(--signal-ink)" }}><span className="w-1.5 h-1.5 rounded-full bg-current" />Verified</span>
              )}
            </div>

            <div className="px-5 py-4 flex flex-col gap-4">
              {[
                { label: "Plan", value: selectedPlan?.name || "Select a plan" },
                { label: "Location", value: listing.city || "–" },
                { label: "Currency", value: listing.currency || "–" },
              ].map((f) => (
                <div key={f.label} className="flex flex-col gap-1.5">
                  <label className="font-mono text-[12px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{f.label}</label>
                  <div className="h-9 px-3 rounded-(--r-2) flex items-center justify-between text-[13.5px] cursor-pointer" style={{ color: "var(--ink)", background: "var(--bg)", border: "1px solid var(--border-2)" }}>
                    <span>{f.value}</span>
                    <Chev />
                  </div>
                </div>
              ))}

              {selectedPlan && (
                <div className="border-t border-border pt-3 mt-1">
                  <div className="flex justify-between text-[13.5px] py-1" style={{ color: "var(--fg-2)" }}>
                    <span>{selectedPlan.name}</span>
                    <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(selectedPlan.price, selectedPlan.currency)}</span>
                  </div>
                  <div className="flex justify-between text-[13.5px] py-1" style={{ color: "var(--fg-2)" }}>
                    <span>Platform fee</span>
                    <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>{selectedPlan.currency === "NGN" ? "₦" : "$"} 0.00</span>
                  </div>
                  <div className="flex justify-between text-[13.5px] py-1 pt-3 mt-1 border-t border-border font-medium" style={{ color: "var(--ink)" }}>
                    <span>Due today</span>
                    <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>{formatCurrency(selectedPlan.price, selectedPlan.currency)}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="px-5 pt-4 pb-4.5 border-t border-border flex flex-col gap-2.5" style={{ background: "var(--bg-2)" }}>
              <button className="btn-signal-v2 lg w-full">Continue to checkout →</button>
              <div className="flex items-center gap-2 justify-center font-mono text-[11px] tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
                <span style={{ color: "var(--ink)" }}>Paystack</span><span>·</span><span style={{ color: "var(--ink)" }}>Card</span>
              </div>
              <div className="text-[12px] text-center leading-relaxed" style={{ color: "var(--fg-3)" }}>Cancel any time · 24‑hr review window after each charge</div>
            </div>
          </div>

          <div className="border border-border rounded-(--r-3) p-4 mt-4 flex items-center gap-3.5 bg-bg">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center font-semibold" style={{ color: "var(--fg-2)" }}>{ownerInitials}</div>
            <div className="flex-1">
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{ownerName}</div>
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>{listing.accepting_clients ? "Accepting clients" : "Not accepting clients"}</div>
            </div>
            <button className="w-10 h-10 sm:w-8 sm:h-8 border border-border rounded-(--r-2) flex items-center justify-center bg-bg" style={{ color: "var(--fg-2)" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-1 4 8.5 8.5 0 0 1-7.5 4.5 8.5 8.5 0 0 1-4-1L3 21l2-5.5a8.5 8.5 0 1 1 16-4z" /></svg>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
