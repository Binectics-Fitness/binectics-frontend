"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { formatMinor, isSelectable } from "@/lib/currencies/helpers";
import { useCurrencies } from "@/lib/queries/currencies";
import { planPerLabel, planSavingLabel } from "@/lib/marketplace/planDisplay";
import {
  addressLine,
  amenityLabel,
  galleryPhotos,
  listingNames,
  mapsUrl,
  providerSubtitle,
  providerTitle,
  publicLocations,
  listingPriceFrom,
} from "@/lib/marketplace/listingDisplay";
import {
  PLAN_CHOICE_COPY,
  addPlanLabel,
  chosenPlan,
  heldPlanIds,
  isPurchasable,
  manageMembershipHref,
  membershipHere,
  membershipLine,
  profileCta,
} from "@/lib/marketplace/listingMembership";
import { useMySubscriptions } from "@/lib/queries/marketplace";
import { ListingGallery, PhotoViewer, type GalleryPhoto } from "@/components/marketplace/ListingGallery";
import { FacilityStatus, type FacilityItem } from "@/lib/types";
import { FACILITY_CATEGORY_LABELS } from "@/lib/constants/facility-catalogue";
import type { PublicListing } from "@/lib/marketplace/publicListing";
import { useAuth } from "@/contexts/AuthContext";
import { ListingClassesSection } from "@/components/classes/ListingClassesSection";
import { MarketplaceAuthCluster } from "@/components/MarketplaceAuthCluster";
import { SaveListingButton } from "@/components/marketplace/SaveListingButton";
import { ConnectRequestButton } from "@/components/marketplace/ConnectRequestButton";
import { ShareListingButton } from "@/components/marketplace/ShareListingButton";
import { ListingMessageButton } from "@/components/marketplace/ListingMessageButton";
import { ListingReviews, useListingRating } from "@/components/marketplace/ListingReviews";
import type { MarketplaceMembershipPlan, MembershipPlanType } from "@/lib/types";
import { useFeatureFlags } from "@/hooks/useFeatureFlags";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { paidContentOn } from "@/lib/paidContent/helpers";
import { offersFromListing } from "@/lib/paidContent/offers";
import { ContentOffersStrip } from "@/components/content/ContentOffersStrip";
import { licenseBadgeSummary, populationLabel, specializationLabel } from "@/lib/credentials/dietitian";

/* ─── Icons ──────────────────────────────────────────────── */

function Star({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor"><path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" /></svg>;
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

/** "Strength Base, 4-week meal plan" from a plan's `includes[]` (paid items it unlocks), or "". */
function includesText(plan: unknown, on: boolean): string {
  if (!on) return "";
  const list = (plan as { includes?: { title?: unknown }[] }).includes;
  if (!Array.isArray(list)) return "";
  return list
    .map((i) => (typeof i?.title === "string" ? i.title : ""))
    .filter(Boolean)
    .join(", ");
}

/** The owner card's line: only an explicit `false` means not taking new clients. */
export function acceptingLabel(accepting: boolean | null | undefined): string {
  return accepting === false ? "Not taking new clients" : "Accepting clients";
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
  /** A gym's facility items (equipment, rooms), each maybe with a photo. */
  facility_items?: FacilityItem[];
  /** A gym's addresses (binectics-api #374); absent on an older API. */
  locations?: unknown;
  city?: string;
  country_code?: string;
  currency?: string;
  /** MINOR units (kobo/cents) — see MarketplaceListing.price_from_minor. */
  price_from_minor?: number;
  price_label?: string;
  verification_badge?: string;
  average_rating: number;
  review_count: number;
  accepting_clients?: boolean;
  active_client_count?: number;
  published_at?: string;
  organization?: { _id: string; name: string; logo?: string } | null;
  professional?: { _id: string; first_name: string; last_name: string; profile_picture?: string } | null;
  organization_id?: { _id: string; name: string; logo?: string } | null;
  professional_id?: { _id: string; first_name: string; last_name: string; profile_picture?: string } | null;
  /** Dietitians: codes, labelled through lib/credentials/dietitian. */
  specializations?: string[];
  populations?: string[];
  pronouns?: string | null;
  licensed?: boolean;
  license_badges?: { issuing_body: string; country_code: string }[];
}

interface Plan {
  _id: string;
  name: string;
  description?: string;
  plan_type: MembershipPlanType;
  duration_days: number;
  /** MINOR units (kobo/cents) — see MarketplaceMembershipPlan.price_minor. */
  price_minor: number;
  currency: string;
  features?: string[];
  is_active?: boolean;
  /** False for a negotiated, off-app plan the member can't buy here. */
  is_self_serve?: boolean;
  /** "Save N% vs <plan>" from the API, when the provider set one. */
  comparison?: MarketplaceMembershipPlan["comparison"];
}

/* ═══ PROFILE ════════════════════════════════════════════════ */

/**
 * The profile body. The listing and its plans arrive from the server render
 * (page.tsx), so the HTML already carries them; reviews and everything
 * interactive load and run here (reviews in ListingReviews).
 */
export function ListingProfile({
  listing: publicListing,
  initialPlans,
}: {
  listing: PublicListing;
  initialPlans: MarketplaceMembershipPlan[];
}) {
  const listing = publicListing as unknown as Listing;
  const plans = initialPlans as unknown as Plan[];
  const listingId = listing._id;
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { isEnabled } = useFeatureFlags();
  const currentOrgId = useOptionalOrganization()?.currentOrg?._id ?? null;
  // Paid programs and meal plans: only while the flag is on (signed-out and
  // flag-off visitors see the profile exactly as before).
  const contentOn = paidContentOn(isEnabled, currentOrgId);
  const contentOffers = contentOn ? offersFromListing(publicListing) : [];
  // What a plan's currency can be paid in right now, for the footer copy only;
  // the checkout itself is refused by the API, with its reason, if it can't.
  const { all: currencyList } = useCurrencies();

  const [chosenPlanId, setChosenPlanId] = useState<string | null>(null);
  // The rating the Reviews section shows, so a new review counts everywhere
  // on the page; the listing's own figures until it loads.
  const rating = useListingRating(listingId, listing.account_type, {
    average: listing.average_rating,
    count: listing.review_count,
  });
  const ratingShown = rating.average ? String(Math.round(rating.average * 10) / 10) : "–";

  // A gym is its business name; a trainer or dietitian is their own name,
  // with the headline as the line under it (mobile #304, listingDisplay.ts).
  const names = listingNames(listing);
  const name = providerTitle({ type: listing.account_type, ...names, headline: listing.headline });
  const ownerName = names.professionalName || "Provider";
  const ownerInitials = ownerName.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const professionalId = listing.professional_id?._id ?? listing.professional?._id ?? null;
  const organizationId = listing.organization_id?._id ?? listing.organization?._id ?? null;
  const badge = BADGE_STYLES[listing.account_type] || BADGE_STYLES.gym_owner;
  const typeLabel = ACCOUNT_LABELS[listing.account_type] || "Provider";
  const isVerified = listing.verification_badge && listing.verification_badge !== "none";
  const phBg = PH_BG[listing.account_type] || PH_BG.gym_owner;
  // The logo (gym) or portrait (coach) as a small avatar, never the hero.
  const avatarUrl =
    listing.profile_image ||
    listing.professional_id?.profile_picture ||
    listing.professional?.profile_picture ||
    listing.organization_id?.logo ||
    listing.organization?.logo ||
    undefined;
  const facilityItems = (listing.facility_items || []).filter((f) => f?.name?.trim());
  // The listing's own photos (the API puts the profile image first; it is
  // dropped), then facility photos, each opening the full-screen viewer.
  const listingPhotos: GalleryPhoto[] = galleryPhotos(listing.photos, listing.profile_image).map((src) => ({ src }));
  const facilityPhotos: GalleryPhoto[] = facilityItems
    .filter((f) => f.image_url && f.image_url !== listing.profile_image)
    .map((f) => ({ src: f.image_url as string, caption: f.name }));
  const galleryShown = listingPhotos.length > 0 ? listingPhotos : facilityPhotos;
  const [facilityViewer, setFacilityViewer] = useState<number | null>(null);
  const allAmenities = [...new Set([...(listing.amenities || []), ...(listing.facilities || [])])].map(amenityLabel);
  const locations = listing.account_type === "gym_owner" ? publicLocations(listing.locations) : [];
  const specialties = listing.specialties || [];
  const specializations = (listing.specializations || []).map(specializationLabel);
  const populations = (listing.populations || []).map(populationLabel);
  const licenseIssuers = licenseBadgeSummary(listing.license_badges);
  // The headline is only worth a line of its own when it isn't the name.
  const headline = providerSubtitle(name, listing.headline) ?? null;
  const priceFrom = listingPriceFrom(publicListing, currencyList);
  // The visitor's memberships, so a member here sees their membership and
  // "Manage membership" rather than a checkout (mobile #304, planChoice.ts).
  // Signed out (or the request failed): none.
  const { data: mySubs } = useMySubscriptions(!!user);
  const held = heldPlanIds(mySubs);
  const membership = membershipHere(mySubs, { listingId, organizationId });
  // A newcomer with one buyable plan has it ready; with several, they pick.
  // A member never has another plan picked for them.
  const selectedPlan = chosenPlan(plans, chosenPlanId, held);
  const hasPurchasable = plans.some((p) => isPurchasable(p, held));
  const cta = profileCta({ membership, selectedPlan, hasPurchasable });
  const planPrice = (p: Plan) => formatMinor(p.currency, p.price_minor, { list: currencyList });
  const selectedIsFree = selectedPlan ? selectedPlan.price_minor === 0 : false;
  const selectedPayable = selectedPlan ? isSelectable(selectedPlan.currency, currencyList, "charge_card") : false;
  const checkoutUrl = selectedPlan ? `/checkout?listing=${listing._id}&plan=${selectedPlan._id}` : null;
  const continueToCheckout = () => {
    if (!checkoutUrl) return;
    // Signed out goes through login and comes back here; while auth is still
    // loading, /checkout itself sends a signed-out visitor to login the same way.
    if (!user && !authLoading) {
      router.push(`/login?redirect=${encodeURIComponent(checkoutUrl)}`);
      return;
    }
    router.push(checkoutUrl);
  };
  const choosePlan = (id: string) => {
    setChosenPlanId(id);
    if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 1023px)").matches) {
      document.getElementById("booking-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div style={{ background: "var(--bg)" }}>

      {/* ═══ TOPBAR ═══ */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-360 flex items-center justify-between h-14 sm:h-16 px-5 sm:px-10">
          <Link href="/"><BinecticsLockup /></Link>
          <nav className="hidden md:flex gap-0.5">
            <Link href="/" className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>Home</Link>
            <Link href="/marketplace" className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>Marketplace</Link>
            <Link href="/pricing" className="px-3 py-2 rounded-(--r-2) text-[13.5px] hover:bg-bg-2" style={{ color: "var(--fg-2)" }}>Pricing</Link>
          </nav>
          <div className="flex items-center gap-2">
            <MarketplaceAuthCluster signupHref="/login?mode=signup&role=member" />
          </div>
        </div>
      </header>

      {/* ═══ GALLERY ═══ */}
      {galleryShown.length > 0 ? (
        <ListingGallery photos={galleryShown} title={name} placeholder={phBg} />
      ) : (
        // No photo yet: a plain panel with the logo, never a cropped logo hero.
        <section aria-hidden="true" className="mx-auto max-w-360 px-5 sm:px-10 pt-6">
          <div className="rounded-(--r-3) border border-border h-[160px] sm:h-[220px] relative flex items-center justify-center" style={{ background: phBg }}>
            {avatarUrl ? (
              <span className="relative w-20 h-20 rounded-full overflow-hidden border border-border bg-bg">
                <Image src={avatarUrl} alt="" fill className="object-cover" sizes="80px" />
              </span>
            ) : null}
            <span className="absolute bottom-2.5 left-3 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{typeLabel} · {name}</span>
          </div>
        </section>
      )}

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
              {listing.licensed && (
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg-3 border border-border" style={{ color: "var(--ink)" }} title={licenseIssuers ? `Licensed by ${licenseIssuers}` : "Licensed"}>
                  Licensed{licenseIssuers ? ` · ${licenseIssuers}` : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3.5">
              {avatarUrl && galleryShown.length > 0 && (
                <span className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden border border-border bg-bg" data-testid="listing-avatar">
                  <Image src={avatarUrl} alt="" fill className="object-cover" sizes="56px" />
                </span>
              )}
              <h1 className="min-w-0 text-[28px] sm:text-[36px] lg:text-[44px] font-medium leading-none" style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}>
                {name}
                {listing.pronouns && <span className="ml-3 align-middle text-[14px] sm:text-[15px] font-normal" style={{ letterSpacing: 0, color: "var(--fg-3)" }}>({listing.pronouns})</span>}
              </h1>
            </div>
            {headline && <p className="text-[16px] sm:text-[18px] max-w-[720px]" style={{ color: "var(--fg-2)" }}>{headline}</p>}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4.5 text-[13px] sm:text-[14px]" style={{ color: "var(--fg-2)" }}>
              <span className="flex items-center gap-2">
                <span className="flex gap-px" style={{ color: "var(--ink)" }}>{Array.from({ length: 5 }, (_, i) => <Star key={i} />)}</span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{ratingShown}</span>
                <span>· {rating.count} reviews</span>
              </span>
              {listing.city && <>
                <span className="w-[3px] h-[3px] rounded-full bg-border-2" />
                <span>{listing.city}{listing.country_code ? `, ${listing.country_code}` : ""}</span>
              </>}
              {ownerName !== name && ownerName !== "Provider" && <>
                <span className="w-[3px] h-[3px] rounded-full bg-border-2" />
                <span>{listing.account_type === "gym_owner" ? "Owned by" : "By"} {ownerName}</span>
              </>}
              {priceFrom && <>
                <span className="w-[3px] h-[3px] rounded-full bg-border-2" />
                <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{priceFrom}</span>
              </>}
            </div>
            <div className="flex flex-wrap gap-2">
              <SaveListingButton listingId={listing._id} listingName={name} variant="button" />
              {listing.account_type !== "gym_owner" && (
                <ConnectRequestButton
                  listingId={listing._id}
                  professionalId={professionalId}
                  providerName={ownerName.split(" ")[0] || ownerName}
                  acceptingClients={listing.accepting_clients}
                />
              )}
              <ShareListingButton listingId={listing._id} listingName={name} />
              <ListingMessageButton
                listingId={listing._id}
                accountType={listing.account_type}
                professionalId={professionalId}
                organizationId={organizationId}
                providerName={name}
              />
            </div>
          </div>

          {/* A member on a phone sees their membership here, not only in the
              booking card below the whole profile. */}
          {cta.kind === "member" && (
            <div className="lg:hidden mt-5 border border-border rounded-(--r-3) bg-bg p-4 flex flex-col gap-3" data-testid="member-strip">
              <div>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-1" style={{ color: "var(--fg-3)" }}>{PLAN_CHOICE_COPY.yourMembership}</div>
                <div className="text-[14px]" style={{ color: "var(--ink)" }}>{membershipLine(cta.membership)}</div>
              </div>
              <Link href={manageMembershipHref(cta.membership)} className="btn-signal-v2 w-full justify-center" style={{ textDecoration: "none", height: "44px" }}>
                {PLAN_CHOICE_COPY.manage}
              </Link>
            </div>
          )}

          {/* Tabs */}
          {/* Jump links to the sections this profile actually has. */}
          <nav className="flex gap-1 mt-6 border-b border-border overflow-x-auto" aria-label="On this page">
            {[
              { id: "about", label: "About" },
              ...(plans.length > 0 ? [{ id: "plans", label: `Plans · ${plans.length}` }] : []),
              ...(facilityItems.length > 0 ? [{ id: "facilities", label: `Facilities · ${facilityItems.length}` }] : []),
              ...(allAmenities.length > 0 ? [{ id: "amenities", label: `Amenities · ${allAmenities.length}` }] : []),
              { id: "book", label: listing.account_type === "gym_owner" ? "Classes" : "Book" },
              { id: "reviews", label: `Reviews · ${rating.count}` },
              ...(locations.length > 0 ? [{ id: "location", label: locations.length > 1 ? `Locations · ${locations.length}` : "Location" }] : []),
            ].map((t) => (
              <a key={t.id} href={`#${t.id}`} className="inline-flex items-center min-h-11 px-4 text-[14px] -mb-px shrink-0 hover:text-ink" style={{ color: "var(--fg-2)" }}>{t.label}</a>
            ))}
          </nav>

          {/* About */}
          <section id="about" className="py-8 border-b border-border scroll-mt-4">
            <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>About</h2>
            <div className="text-[15px] leading-[1.65] max-w-[720px]" style={{ color: "var(--fg-2)" }}>
              <p>{listing.bio || "No description provided."}</p>
            </div>
            {specialties.length > 0 && (
              <ul className="flex flex-wrap gap-2 mt-5 list-none p-0" aria-label="Specialties">
                {specialties.map((s) => (
                  <li key={s} className="px-3 py-1.5 border border-border rounded-(--r-2) text-[13px]" style={{ color: "var(--ink)" }}>{s}</li>
                ))}
              </ul>
            )}
            {specializations.length > 0 && (
              <div className="mt-5">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>Specializations</div>
                <ul className="flex flex-wrap gap-2 list-none p-0" aria-label="Specializations">
                  {specializations.map((s) => (
                    <li key={s} className="px-3 py-1.5 border border-border rounded-(--r-2) text-[13px]" style={{ color: "var(--ink)" }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {populations.length > 0 && (
              <div className="mt-4">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.05em] mb-2" style={{ color: "var(--fg-3)" }}>Works with</div>
                <ul className="flex flex-wrap gap-2 list-none p-0" aria-label="Works with">
                  {populations.map((s) => (
                    <li key={s} className="px-3 py-1.5 border border-border rounded-(--r-2) text-[13px]" style={{ color: "var(--ink)" }}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-l border-border mt-6">
              {[
                ["City", listing.city || "–"],
                // From the plans themselves: the listing's stored currency can
                // be a stale default (USD) that no price is actually in.
                ["Prices in", [...new Set(plans.map((p) => p.currency).filter(Boolean))].join(" · ") || "–"],
                ["Languages", listing.languages?.join(" · ") || "–"],
                ["Active clients", String(listing.active_client_count ?? "–")],
                ["Rating", rating.average ? `${ratingShown} / 5` : "–"],
                ["Reviews", String(rating.count)],
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
            <section id="plans" className="py-8 border-b border-border scroll-mt-4">
              <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Plans</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {plans.map((p) => {
                  const isSelected = selectedPlan?._id === p._id;
                  const isHeld = held.has(p._id);
                  const buyable = isPurchasable(p, held);
                  return (
                  <div key={p._id} className={`border rounded-(--r-3) p-5 flex flex-col gap-3 ${isSelected ? "border-ink bg-bg-2" : "border-border bg-bg"}`}>
                    <div>
                      <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>{p.name}</div>
                      <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{p.description || `${p.plan_type} · ${p.duration_days} days`}</div>
                    </div>
                    <div className="font-mono text-[26px]" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.015em", color: "var(--ink)" }}>
                      {planPrice(p)} <small className="font-mono text-[13px] font-normal" style={{ color: "var(--fg-3)" }}>{planPerLabel(p)}</small>
                    </div>
                    {planSavingLabel(p) && (
                      <div className="text-[13px] font-medium -mt-1.5" style={{ color: "var(--signal-ink)" }}>{planSavingLabel(p)}</div>
                    )}
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
                    {includesText(p, contentOn) && (
                      <div className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                        <span style={{ color: "var(--ink)" }}>Includes:</span> {includesText(p, contentOn)}
                      </div>
                    )}
                    <div className="mt-auto">
                      {isHeld ? (
                        <div className="h-11 flex items-center justify-center text-[13.5px] font-medium rounded-(--r-2) border border-border bg-bg-2" style={{ color: "var(--ink)" }}>
                          {PLAN_CHOICE_COPY.currentPlan}
                        </div>
                      ) : buyable ? (
                        <button
                          type="button"
                          className={`${isSelected ? "btn-primary-v2" : "btn-ghost-v2"} w-full`}
                          style={{ height: "44px" }}
                          aria-pressed={isSelected}
                          onClick={() => choosePlan(p._id)}
                        >
                          {isSelected ? `${p.name} chosen` : membership ? `${PLAN_CHOICE_COPY.add} ${p.name}` : `Choose ${p.name}`}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  );
                })}
              </div>
            </section>
          )}

          <ContentOffersStrip offers={contentOffers} />

          {/* Facilities: the gym's own items, with their photos. */}
          {facilityItems.length > 0 && (
            <section id="facilities" className="py-8 border-b border-border scroll-mt-4">
              <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Facilities</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3 list-none p-0">
                {facilityItems.map((f) => {
                  const photoIndex = facilityPhotos.findIndex((ph) => ph.src === f.image_url);
                  const maintenance = f.status === FacilityStatus.MAINTENANCE;
                  return (
                    <li key={f._id || f.name} className="border border-border rounded-(--r-3) overflow-hidden bg-bg flex flex-col">
                      {f.image_url && photoIndex >= 0 ? (
                        <button type="button" className="relative aspect-4/3 p-0 cursor-zoom-in border-b border-border" onClick={() => setFacilityViewer(photoIndex)} aria-label={`Open photo of ${f.name}`}>
                          <Image src={f.image_url} alt={f.name} fill className="object-cover" sizes="(max-width: 640px) 50vw, 240px" />
                        </button>
                      ) : (
                        <div className="aspect-4/3 border-b border-border" style={{ background: phBg }} aria-hidden="true" />
                      )}
                      <div className="p-3 flex flex-col gap-1">
                        <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{f.name}</div>
                        {f.category && FACILITY_CATEGORY_LABELS[f.category] && (
                          <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>{FACILITY_CATEGORY_LABELS[f.category]}</div>
                        )}
                        {maintenance && (
                          <span className="self-start mt-1 inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium" style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}>
                            Under maintenance
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {facilityViewer !== null && (
                <PhotoViewer photos={facilityPhotos} index={facilityViewer} onIndex={setFacilityViewer} onClose={() => setFacilityViewer(null)} title={name} />
              )}
            </section>
          )}

          {/* Amenities */}
          {allAmenities.length > 0 && (
            <section id="amenities" className="py-8 border-b border-border scroll-mt-4">
              <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>Amenities</h2>
              <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 list-none p-0">
                {allAmenities.map((a) => (
                  <li key={a} className="flex items-center gap-2.5 px-3.5 py-3 border border-border rounded-(--r-2) text-[13.5px]" style={{ color: "var(--ink)" }}>{a}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Booking: gyms run a class timetable; solo providers take 1:1
              consultation bookings. */}
          <div id="book" className="scroll-mt-4">
          {listing.account_type === "gym_owner" ? (
            <ListingClassesSection
              listingId={listingId}
              organizationId={listing.organization_id?._id ?? listing.organization?._id ?? null}
            />
          ) : (
            <section className="rounded-(--r-3) p-5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>Book a session</h2>
              <p className="text-[13.5px] mt-1.5 max-w-[52ch]" style={{ color: "var(--fg-3)" }}>
                Pick a time that works for you from {ownerName.split(" ")[0] || "the provider"}&rsquo;s available slots.
              </p>
              <Link
                href={`/booking?listingId=${listing._id}`}
                className="btn-primary-v2 sm mt-4 inline-flex"
                style={{ textDecoration: "none" }}
              >
                See available times
              </Link>
            </section>
          )}

          {/* Reviews: the rating, the reviews, and "Write a review" for a
              member the API says may review this provider (F10). */}
          </div>
          <div id="reviews" className="scroll-mt-4">
            <ListingReviews listingId={listingId} accountType={listing.account_type} providerName={name} />
          </div>

          {/* Where the gym is: each address with a maps link (api #374). */}
          {locations.length > 0 && (
            <section id="location" className="py-8 border-b border-border scroll-mt-4">
              <h2 className="text-[22px] font-medium mb-3.5" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>{locations.length > 1 ? "Locations" : "Location"}</h2>
              <ul className="flex flex-col gap-2 list-none p-0">
                {locations.map((loc) => (
                  <li key={loc.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 border border-border rounded-(--r-3) bg-bg">
                    <div className="min-w-0">
                      <div className="text-[14.5px] font-medium" style={{ color: "var(--ink)" }}>
                        {loc.name}
                        {loc.is_primary && locations.length > 1 && <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Main</span>}
                      </div>
                      {addressLine(loc) && <div className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>{addressLine(loc)}</div>}
                    </div>
                    <a href={mapsUrl(loc, name)} target="_blank" rel="noopener noreferrer" className="btn-ghost-v2 sm shrink-0" style={{ textDecoration: "none" }}>
                      Open in Maps
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* ─── RIGHT: BOOKING CARD ─── */}
        <aside id="booking-card" className="sticky min-w-0" style={{ top: "88px" }}>
          <div className="border border-border rounded-(--r-3) bg-bg overflow-hidden" data-testid="booking-card" data-cta={cta.kind}>
            <div className="px-5 pt-4.5 pb-3.5 border-b border-border flex justify-between items-start">
              <div>
                {cta.kind === "member" ? (
                  <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>
                    {PLAN_CHOICE_COPY.yourMembership}
                  </div>
                ) : selectedPlan ? (
                  <div className="font-mono text-[24px]" style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.012em", color: "var(--ink)" }}>
                    {planPrice(selectedPlan)}
                    <small className="font-mono text-[13px]" style={{ color: "var(--fg-3)" }}> {planPerLabel(selectedPlan)}</small>
                  </div>
                ) : (
                  <div className="text-[17px] font-medium" style={{ letterSpacing: "-0.015em", color: "var(--ink)" }}>
                    {plans.length > 0 ? "Choose a plan" : "Membership"}
                  </div>
                )}
                <div className="flex items-center gap-1 text-[12.5px] mt-1" style={{ color: "var(--fg-2)" }}>
                  <span style={{ color: "var(--ink)" }}><Star size={11} /></span>
                  <span style={{ color: "var(--ink)", fontWeight: 500 }}>{ratingShown}</span>
                  <span>· {rating.count} reviews</span>
                </div>
              </div>
              {isVerified && (
                <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-signal-soft border border-[oklch(0.88_0.05_148)]" style={{ color: "var(--signal-ink)" }}><span className="w-1.5 h-1.5 rounded-full bg-current" />Verified</span>
              )}
            </div>

            {cta.kind === "member" && (
              <div className="px-5 pt-4 flex flex-col gap-3">
                <div className="px-3.5 py-3 rounded-(--r-2) border border-ink bg-bg-2 text-[13.5px]" style={{ color: "var(--ink)" }} data-testid="membership-line">
                  {membershipLine(cta.membership)}
                </div>
                <Link href={manageMembershipHref(cta.membership)} className="btn-signal-v2 lg w-full justify-center" style={{ textDecoration: "none" }}>
                  {PLAN_CHOICE_COPY.manage}
                </Link>
              </div>
            )}

            <div className="px-5 py-4 flex flex-col gap-4">
              {plans.length === 0 ? (
                cta.kind === "member" ? null : <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>No membership plans yet.</p>
              ) : cta.kind === "member" && !hasPurchasable ? null : (
                <fieldset className="flex flex-col gap-1.5 border-0 p-0 m-0 min-w-0">
                  <legend className="font-mono text-[12px] uppercase tracking-[0.04em] mb-1.5" style={{ color: "var(--fg-3)" }}>
                    {cta.kind === "member" ? "Add a plan" : "Plan"}
                  </legend>
                  {cta.kind === "member" && (
                    <p className="text-[12.5px] mb-1" style={{ color: "var(--fg-3)" }}>{PLAN_CHOICE_COPY.addHint}</p>
                  )}
                  {plans.map((p) => {
                    const checked = selectedPlan?._id === p._id;
                    const buyable = isPurchasable(p, held);
                    return (
                      <label
                        key={p._id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-(--r-2) text-[13.5px] ${buyable ? "cursor-pointer" : "cursor-default"}`}
                        style={{
                          color: buyable ? "var(--ink)" : "var(--fg-3)",
                          background: checked ? "var(--bg-2)" : "var(--bg)",
                          border: `1px solid ${checked ? "var(--ink)" : "var(--border-2)"}`,
                        }}
                      >
                        <input
                          type="radio"
                          name="listing-plan"
                          value={p._id}
                          checked={checked}
                          disabled={!buyable}
                          onChange={() => setChosenPlanId(p._id)}
                          className="shrink-0"
                          style={{ accentColor: "var(--ink)" }}
                        />
                        <span className="flex-1 min-w-0 wrap-break-word">
                          {p.name}
                          {held.has(p._id) ? (
                            <small className="block text-[12px]" style={{ color: "var(--fg-3)" }}>{PLAN_CHOICE_COPY.currentPlan}</small>
                          ) : planSavingLabel(p) ? (
                            <small className="block text-[12px]" style={{ color: "var(--signal-ink)" }}>{planSavingLabel(p)}</small>
                          ) : null}
                        </span>
                        <span className="font-mono shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                          {planPrice(p)} <small style={{ color: "var(--fg-3)" }}>{planPerLabel(p)}</small>
                        </span>
                      </label>
                    );
                  })}
                </fieldset>
              )}

              {selectedPlan && (
                <div className="border-t border-border pt-3 mt-1">
                  <div className="flex justify-between text-[13.5px] py-1 font-medium" style={{ color: "var(--ink)" }}>
                    <span>Due today</span>
                    <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>{selectedIsFree ? "Free" : planPrice(selectedPlan)}</span>
                  </div>
                </div>
              )}
            </div>

            {(cta.kind === "choose" || cta.kind === "checkout" || (cta.kind === "member" && cta.add)) && (
              <div className="px-5 pt-4 pb-4.5 border-t border-border flex flex-col gap-2.5" style={{ background: "var(--bg-2)" }}>
                {cta.kind === "member" && cta.add ? (
                  // A second plan is added on purpose: an outline button naming it.
                  <button type="button" className="btn-ghost-v2 lg w-full" onClick={continueToCheckout}>
                    {addPlanLabel(cta.add, selectedIsFree ? "Free" : planPrice(cta.add as Plan))}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-signal-v2 lg w-full disabled:opacity-40 disabled:cursor-not-allowed"
                    disabled={!selectedPlan}
                    onClick={continueToCheckout}
                  >
                    {PLAN_CHOICE_COPY.checkout}
                  </button>
                )}
                {selectedPlan && (selectedIsFree || selectedPayable) && (
                  <div className="text-[12px] text-center leading-relaxed" style={{ color: "var(--fg-3)" }}>
                    {selectedIsFree ? "Free plan, no payment needed" : "Paid securely with Paystack"}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border border-border rounded-(--r-3) p-4 mt-4 flex items-center gap-3.5 bg-bg">
            <div className="w-12 h-12 rounded-full bg-bg-3 flex items-center justify-center font-semibold" style={{ color: "var(--fg-2)" }}>{ownerInitials}</div>
            <div className="flex-1">
              <div className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{ownerName}</div>
              {/* Only `false` means not taking: a listing without the field is accepting (mobile, Explore cards). */}
              <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>{acceptingLabel(listing.accepting_clients)}</div>
            </div>
            <ListingMessageButton
              listingId={listing._id}
              accountType={listing.account_type}
              professionalId={professionalId}
              organizationId={organizationId}
              providerName={ownerName}
              variant="icon"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
