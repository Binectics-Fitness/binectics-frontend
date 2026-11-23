"use client";

import Link from "next/link";
import Image from "next/image";
import { EXPLORE_CARD_COPY, listingPriceParts } from "@/lib/marketplace/exploreCardCopy";
import { placeLabel } from "@/lib/marketplace/exploreFilters";
import { SaveListingButton } from "@/components/marketplace/SaveListingButton";
import { specializationLabel } from "@/lib/credentials/dietitian";

/** A listing as GET /marketplace/listings returns it on a card. */
export interface ExploreListing {
  _id: string;
  account_type: string;
  headline: string;
  bio?: string;
  specialties?: string[];
  facilities?: string[];
  amenities?: string[];
  photos?: string[];
  profile_image?: string;
  city?: string;
  country_code?: string;
  currency?: string;
  /** MINOR units (kobo/cents). */
  price_from_minor?: number;
  price_label?: string;
  price_cadence?: "session" | "recurring" | "one_off";
  price_period_days?: number;
  has_free_intro?: boolean;
  verification_badge?: string;
  average_rating: number;
  review_count: number;
  accepting_clients?: boolean;
  /** Only when the search sent lat/lng; null for a listing with no real point. */
  distance_km?: number | null;
  /** "exact" when the provider placed the pin, else the city centre. */
  location_precision?: string | null;
  organization?: { _id: string; name: string } | null;
  professional?: { _id: string; first_name: string; last_name: string; profile_picture?: string } | null;
  specializations?: string[];
  licensed?: boolean;
}

type Kind = "gym" | "trainer" | "dietitian";
const ACCOUNT_MAP: Record<string, Kind> = { gym_owner: "gym", personal_trainer: "trainer", dietitian: "dietitian" };

const TYPE_BADGE: Record<Kind, { label: string; cls: string; color: string }> = {
  gym: { label: "Gym", cls: "bg-gym-soft border-[oklch(0.88_0.04_248)]", color: "var(--gym)" },
  trainer: { label: "Trainer", cls: "bg-trainer-soft border-[oklch(0.88_0.05_75)]", color: "var(--trainer-ink)" },
  dietitian: { label: "Dietitian", cls: "bg-dietitian-soft border-[oklch(0.88_0.04_300)]", color: "var(--dietitian)" },
};

const PH_BG: Record<Kind, string> = {
  gym: "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 10px, oklch(0.93 0.012 248) 10px 20px)",
  trainer: "repeating-linear-gradient(135deg, oklch(0.92 0.012 75) 0 10px, oklch(0.94 0.01 75) 10px 20px)",
  dietitian: "repeating-linear-gradient(135deg, oklch(0.90 0.018 300) 0 10px, oklch(0.93 0.014 300) 10px 20px)",
};

export function listingName(l: ExploreListing): string {
  if (l.organization?.name) return l.organization.name;
  if (l.professional) return `${l.professional.first_name} ${l.professional.last_name}`;
  return l.headline;
}

/** "PCOS · Lagos, NG · About 4 km": what they do, where, and how far. */
export function listingSubline(l: ExploreListing, distance?: string): string {
  const parts: string[] = [];
  if (l.specializations?.length) parts.push(specializationLabel(l.specializations[0]));
  else if (l.specialties?.length) parts.push(l.specialties[0]);
  const where = placeLabel(l);
  if (where) parts.push(where);
  if (distance) parts.push(distance);
  return parts.join(" · ") || l.headline;
}

function listingTags(l: ExploreListing): string[] {
  const tags: string[] = [];
  if (l.specializations?.length) tags.push(...l.specializations.slice(0, 3).map(specializationLabel));
  if (l.specialties) tags.push(...l.specialties.slice(0, 3 - tags.length));
  if (l.facilities) tags.push(...l.facilities.slice(0, 3 - tags.length));
  if (l.amenities) tags.push(...l.amenities.slice(0, 3 - tags.length));
  return tags.slice(0, 3);
}

function listingStatus(l: ExploreListing): { text: string; muted: boolean } {
  // Only `false` says not taking: an older API without the field is accepting.
  if (l.accepting_clients !== false) return { text: l.licensed ? "Licensed · accepting clients" : "Accepting clients", muted: false };
  if (l.licensed) return { text: "Licensed", muted: false };
  return { text: "", muted: true };
}

function Star() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" />
    </svg>
  );
}

/** "From ₦25,000/month": the amount in ink, "From" and the cadence in grey (board web-explore-card). */
function CardPrice({ l }: { l: ExploreListing }) {
  const parts = listingPriceParts(l);
  return (
    <span
      className="font-mono text-[13.5px] font-medium whitespace-nowrap"
      style={{ fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}
      data-testid="card-price"
    >
      {parts ? (
        <>
          <small className="text-[length:inherit] font-normal" style={{ color: "var(--fg-3)" }}>{EXPLORE_CARD_COPY.from} </small>
          {parts.amount}
          {parts.rest && <small className="text-[length:inherit] font-normal" style={{ color: "var(--fg-3)" }}>{parts.rest}</small>}
        </>
      ) : (
        l.price_label || "–"
      )}
    </span>
  );
}

export function ExploreCard({ l, distance }: { l: ExploreListing; distance?: string }) {
  const type = ACCOUNT_MAP[l.account_type] || "gym";
  const tb = TYPE_BADGE[type];
  const name = listingName(l);
  const tags = listingTags(l);
  const status = listingStatus(l);
  const notTaking = l.accepting_clients === false;
  const isVerified = !!l.verification_badge && l.verification_badge !== "none";
  const photoUrl = l.photos?.[0] || l.profile_image;
  const hasRating = l.review_count > 0 && l.average_rating > 0;

  return (
    <div className="relative">
      <Link
        href={`/marketplace/${l._id}`}
        className="block h-full border border-border rounded-(--r-3) bg-bg overflow-hidden hover:border-ink focus-visible:border-ink"
        style={{ transition: "border-color 120ms" }}
      >
        <div className="relative aspect-4/3" style={{ background: photoUrl ? undefined : PH_BG[type], borderBottom: "1px solid var(--border)" }}>
          {photoUrl && <Image src={photoUrl} alt={name} fill className="object-cover" sizes="(max-width: 640px) 100vw, 33vw" />}
          <div className="absolute top-2.5 left-2.5 flex gap-1.5">
            <span className={`inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium border ${tb.cls}`} style={{ color: tb.color }}>{tb.label}</span>
            {isVerified && (
              <span className="inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-signal-soft border border-[oklch(0.88_0.05_148)]" style={{ color: "var(--signal-ink)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />Verified
              </span>
            )}
          </div>
          {!photoUrl && (
            <span className="absolute bottom-2.5 left-3 font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
              {type} · {name}
            </span>
          )}
        </div>
        <div className="p-3.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-[12.5px]" style={{ color: "var(--fg-2)" }}>
            {hasRating ? (
              <>
                <span style={{ color: "var(--ink)" }}><Star /></span>
                <span style={{ color: "var(--ink)", fontWeight: 500 }}>{Math.round(l.average_rating * 10) / 10}</span>
                <span>· {l.review_count} {l.review_count === 1 ? "review" : "reviews"}</span>
              </>
            ) : (
              <span>No reviews</span>
            )}
          </div>
          <div className="text-[16px] font-medium" style={{ letterSpacing: "-0.014em", color: "var(--ink)" }}>{name}</div>
          <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{listingSubline(l, distance)}</div>
          {notTaking && <div className="text-[13px]" style={{ color: "var(--fg-3)" }}>{EXPLORE_CARD_COPY.notTakingClients}</div>}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.25 mt-1">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{t}</span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap justify-between items-start gap-x-2 gap-y-1 mt-2 pt-3 border-t border-border">
            <div className="flex flex-col items-start gap-1.5">
              <CardPrice l={l} />
              {l.has_free_intro && (
                <span className="inline-flex items-center h-5 px-1.5 rounded-(--r-1) font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>
                  {EXPLORE_CARD_COPY.freeFirstSession}
                </span>
              )}
            </div>
            {status.text && (
              <span className="ml-auto whitespace-nowrap font-mono text-[11.5px] leading-5" style={{ color: status.muted ? "var(--fg-3)" : "var(--signal-ink)" }}>
                {status.text}
              </span>
            )}
          </div>
        </div>
      </Link>
      {/* Outside the link: a button can't sit inside an <a>. */}
      <SaveListingButton listingId={l._id} listingName={name} className="absolute top-2.5 right-2.5" />
    </div>
  );
}
