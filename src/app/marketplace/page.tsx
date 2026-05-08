"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Apple, Dumbbell, MapPin, ShieldCheck, Sparkles, Star } from "lucide-react";
import LocationFilter from "@/components/LocationFilter";
import SearchableSelect from "@/components/SearchableSelect";
import { CardSkeleton } from "@/components/CardSkeleton";
import { stripHtml } from "@/utils";
import { marketplaceService } from "@/lib/api/marketplace";
import { listingHref } from "@/lib/utils/listingHref";
import type {
  MarketplaceListing,
  MarketplaceAccountType,
  MarketplaceSearchParams,
  MarketplaceVerificationBadge,
} from "@/lib/types";

const ACCOUNT_TYPE_LABELS: Record<MarketplaceAccountType, string> = {
  gym_owner: "Gym",
  personal_trainer: "Personal Trainer",
  dietitian: "Dietitian",
};

interface AccountTypeStyle {
  chip: string;
  bg: string;
  text: string;
  ring: string;
  icon: typeof Dumbbell;
  gradient: string;
}

const ACCOUNT_TYPE_STYLES: Record<MarketplaceAccountType, AccountTypeStyle> = {
  gym_owner: {
    chip: "bg-accent-blue-100 text-accent-blue-700",
    bg: "bg-accent-blue-50",
    text: "text-accent-blue-700",
    ring: "ring-accent-blue-200",
    icon: Dumbbell,
    gradient:
      "bg-[radial-gradient(circle_at_30%_20%,rgba(2,103,242,0.18),rgba(2,103,242,0.04))]",
  },
  personal_trainer: {
    chip: "bg-accent-yellow-100 text-accent-yellow-700",
    bg: "bg-accent-yellow-50",
    text: "text-accent-yellow-700",
    ring: "ring-accent-yellow-200",
    icon: Dumbbell,
    gradient:
      "bg-[radial-gradient(circle_at_30%_20%,rgba(253,185,14,0.22),rgba(253,185,14,0.04))]",
  },
  dietitian: {
    chip: "bg-accent-purple-100 text-accent-purple-700",
    bg: "bg-accent-purple-50",
    text: "text-accent-purple-700",
    ring: "ring-accent-purple-200",
    icon: Apple,
    gradient:
      "bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.20),rgba(139,92,246,0.04))]",
  },
};

const SPECIALTY_OPTIONS = [
  "Weight Loss",
  "Muscle Building",
  "Strength Training",
  "HIIT",
  "Yoga",
  "CrossFit",
  "Sports Nutrition",
  "Meal Planning",
  "Body Recomposition",
  "Rehabilitation",
  "Pre/Post Natal",
  "Senior Fitness",
];

function ListingBadge({
  badge,
  className = "",
}: {
  badge: MarketplaceVerificationBadge;
  className?: string;
}) {
  if (badge === "none") return null;

  if (badge === "verified") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-accent-blue-700 shadow-sm ring-1 ring-accent-blue-200 ${className}`}
      >
        <ShieldCheck className="h-3 w-3" /> Verified
      </span>
    );
  }

  if (badge === "premium_verified") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-accent-yellow-700 shadow-sm ring-1 ring-accent-yellow-200 ${className}`}
      >
        <ShieldCheck className="h-3 w-3" /> Premium
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-neutral-200 ${className}`}
    >
      <Sparkles className="h-3 w-3 text-accent-yellow-500" /> Featured
    </span>
  );
}

function ListingCard({ listing }: { listing: MarketplaceListing }) {
  const professional =
    typeof listing.professional_id === "object"
      ? listing.professional_id
      : null;
  const org =
    typeof listing.organization_id === "object"
      ? listing.organization_id
      : null;

  const displayName = org
    ? org.name
    : professional
      ? `${professional.first_name} ${professional.last_name}`
      : listing.headline;

  const profileImage = org ? org.logo : professional?.profile_picture;
  // Only treat real cover photos (not the small avatar/logo) as cover image
  const coverImage = listing.photos?.[0] ?? null;
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const style = ACCOUNT_TYPE_STYLES[listing.account_type];
  const TypeIcon = style.icon;

  const location = [listing.city, listing.country_code?.toUpperCase()]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={listingHref(listing)}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-neutral-100 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)] hover:ring-neutral-200"
    >
      {/* Cover */}
      <div
        className={`relative aspect-[16/9] w-full overflow-hidden ${style.gradient}`}
      >
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={displayName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="relative flex h-full w-full items-center justify-center">
            {/* Decorative pattern */}
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  "radial-gradient(currentColor 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            {/* Avatar / logo */}
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-4 ring-white/60">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className={`text-2xl font-black tracking-tight ${style.text}`}
                >
                  {initials || <TypeIcon className="h-8 w-8" />}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Top-left: type chip */}
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${style.chip}`}
        >
          <TypeIcon className="h-3 w-3" />
          {ACCOUNT_TYPE_LABELS[listing.account_type]}
        </span>

        {/* Top-right: verification badge */}
        <ListingBadge
          badge={listing.verification_badge}
          className="absolute right-3 top-3"
        />

        {/* Bottom-right: not accepting pill */}
        {!listing.accepting_clients && (
          <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-foreground/85 px-2.5 py-1 text-xs font-medium text-white">
            Not accepting clients
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div>
          <h3 className="line-clamp-1 text-base font-bold text-foreground transition-colors group-hover:text-primary-600">
            {displayName}
          </h3>
          <p className="mt-0.5 line-clamp-1 text-sm text-foreground-secondary">
            {listing.headline}
          </p>
        </div>

        {/* Meta row: location · rating */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-foreground-secondary">
          {location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {location}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <Star
              className={`h-3.5 w-3.5 ${listing.review_count > 0 ? "fill-accent-yellow-500 text-accent-yellow-500" : "text-neutral-300"}`}
            />
            {listing.review_count > 0 ? (
              <>
                <span className="font-semibold text-foreground">
                  {listing.average_rating.toFixed(1)}
                </span>
                <span>· {listing.review_count} reviews</span>
              </>
            ) : (
              <span>No reviews yet</span>
            )}
          </span>
        </div>

        {/* Bio preview */}
        {listing.bio ? (
          <p className="line-clamp-2 text-sm text-foreground-secondary">
            {stripHtml(listing.bio)}
          </p>
        ) : null}

        {/* Specialties */}
        {listing.specialties.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {listing.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-foreground/70"
              >
                {s}
              </span>
            ))}
            {listing.specialties.length > 3 && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-foreground/50">
                +{listing.specialties.length - 3}
              </span>
            )}
          </div>
        ) : null}

        {/* Footer: price + cta hint */}
        <div className="mt-auto flex items-end justify-between border-t border-neutral-100 pt-3">
          <div>
            {listing.price_from != null ? (
              <>
                <div className="text-xs font-medium text-foreground-secondary">
                  From
                </div>
                <div className="text-base font-black text-foreground">
                  {listing.currency} {listing.price_from}
                  {listing.price_label && (
                    <span className="ml-1 text-xs font-medium text-foreground-secondary">
                      / {listing.price_label}
                    </span>
                  )}
                </div>
              </>
            ) : (
              <span className="text-sm font-medium text-foreground-secondary">
                Contact for pricing
              </span>
            )}
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${style.bg} ${style.text} ring-1 ${style.ring} transition-colors group-hover:bg-foreground group-hover:text-white group-hover:ring-foreground`}
          >
            View profile →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function MarketplacePage() {
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [accountType, setAccountType] = useState<MarketplaceAccountType | "">(
    "",
  );
  const [city, setCity] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"rating" | "newest" | "nearest">(
    "newest",
  );
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    const params: MarketplaceSearchParams = {
      page,
      limit: 12,
      sort: sortBy,
    };

    if (searchQuery.trim()) params.q = searchQuery.trim();
    if (accountType) params.account_type = accountType;
    if (city.trim()) params.city = city.trim();
    if (selectedSpecialty) params.specialties = selectedSpecialty;
    if (minRating) params.min_rating = minRating;
    if (geoLat !== null && geoLng !== null) {
      params.lat = geoLat;
      params.lng = geoLng;
      params.radius_km = radiusKm;
    }

    const res = await marketplaceService.searchListings(params);
    if (res.success && res.data) {
      setListings(res.data.listings);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.total_pages);
    }
    setIsLoading(false);
  }, [
    page,
    searchQuery,
    accountType,
    city,
    selectedSpecialty,
    minRating,
    sortBy,
    geoLat,
    geoLng,
    radiusKm,
  ]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setAccountType("");
    setCity("");
    setSelectedSpecialty("");
    setMinRating("");
    setSortBy("newest");
    setGeoLat(null);
    setGeoLng(null);
    setRadiusKm(25);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-background-secondary py-10 sm:py-16">
        <div className="absolute inset-0 gradient-section-green" />
        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <h1 className="mb-4 font-display text-3xl font-black text-foreground sm:text-5xl">
            Find Your Perfect{" "}
            <span className="text-primary-500">Fitness Professional</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base text-foreground-secondary sm:text-lg">
            Browse verified gyms, personal trainers, and dietitians. Connect
            with the right professional for your fitness journey.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-foreground-secondary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name, specialty, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-5 py-4 pl-12 pr-4 text-foreground shadow-[var(--shadow-card)] placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-[var(--shadow-card-hover)] sm:pr-28"
              />
              <button
                type="submit"
                className="mt-3 w-full rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-600 sm:absolute sm:right-2 sm:top-1/2 sm:mt-0 sm:w-auto sm:-translate-y-1/2 sm:py-2"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] sm:p-6 lg:sticky lg:top-20">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-foreground">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                >
                  Clear all
                </button>
              </div>

              {/* Type Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Professional Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => {
                    setAccountType(
                      e.target.value as MarketplaceAccountType | "",
                    );
                    setPage(1);
                  }}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="gym_owner">Gyms</option>
                  <option value="personal_trainer">Personal Trainers</option>
                  <option value="dietitian">Dietitians</option>
                </select>
              </div>

              {/* City Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g. London"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {/* Specialty Filter */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Specialty
                </label>
                <SearchableSelect
                  value={selectedSpecialty}
                  onChange={(val) => {
                    setSelectedSpecialty(val);
                    setPage(1);
                  }}
                  options={[
                    { label: "All Specialties", value: "" },
                    ...SPECIALTY_OPTIONS.map((s) => ({ label: s, value: s })),
                  ]}
                  placeholder="All Specialties"
                />
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <LocationFilter
                  lat={geoLat}
                  lng={geoLng}
                  radiusKm={radiusKm}
                  onLocationChange={(lat, lng) => {
                    setGeoLat(lat);
                    setGeoLng(lng);
                    if (lat !== null && lng !== null) setSortBy("nearest");
                    setPage(1);
                  }}
                  onRadiusChange={(km) => {
                    setRadiusKm(km);
                    setPage(1);
                  }}
                />
              </div>

              {/* Min Rating */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value ? Number(e.target.value) : "");
                    setPage(1);
                  }}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                >
                  <option value="">Any Rating</option>
                  <option value="4">4+ Stars</option>
                  <option value="3">3+ Stars</option>
                  <option value="2">2+ Stars</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(
                      e.target.value as "rating" | "newest" | "nearest",
                    );
                    setPage(1);
                  }}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                >
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="nearest">Nearest</option>
                </select>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="lg:col-span-3">
            {/* Results Header */}
            <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground-secondary">
                {isLoading
                  ? "Searching..."
                  : `${total} professional${total !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {/* Loading */}
            {isLoading && (
              <CardSkeleton count={6} columns="2" variant="avatar" />
            )}

            {/* Empty State */}
            {!isLoading && listings.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-card)] sm:p-12">
                <svg
                  className="mx-auto h-16 w-16 text-neutral-300 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No listings found
                </h3>
                <p className="text-foreground-secondary mb-4">
                  Try adjusting your search or filters to find professionals.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}

            {/* Results Grid */}
            {!isLoading && listings.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
                  {listings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="rounded-lg border-2 border-neutral-300 px-4 py-2 text-sm font-medium text-foreground hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-foreground-secondary px-4">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-lg border-2 border-neutral-300 px-4 py-2 text-sm font-medium text-foreground hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
