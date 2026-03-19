"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { marketplaceService } from "@/lib/api/marketplace";
import type {
  MarketplaceListing,
  MarketplaceAccountType,
  MarketplaceSearchParams,
} from "@/lib/types";

const ACCOUNT_TYPE_LABELS: Record<MarketplaceAccountType, string> = {
  gym_owner: "Gym",
  personal_trainer: "Personal Trainer",
  dietician: "Dietician",
};

const ACCOUNT_TYPE_COLORS: Record<MarketplaceAccountType, string> = {
  gym_owner: "bg-accent-blue-100 text-accent-blue-700",
  personal_trainer: "bg-accent-yellow-100 text-accent-yellow-700",
  dietician: "bg-accent-purple-100 text-accent-purple-700",
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

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= Math.round(rating) ? "text-accent-yellow-500" : "text-neutral-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="ml-1 text-sm text-foreground-secondary">
        {rating.toFixed(1)}
      </span>
    </div>
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
      : "Professional";

  const profileImage = org
    ? org.logo
    : professional?.profile_picture;

  return (
    <Link
      href={`/marketplace/${listing._id}`}
      className="group block rounded-2xl bg-white shadow-card hover:shadow-lg transition-shadow duration-200"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="h-14 w-14 shrink-0 rounded-xl bg-neutral-200 overflow-hidden flex items-center justify-center">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImage}
                alt={displayName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-foreground/40">
                {displayName[0]}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate group-hover:text-primary-500 transition-colors">
              {listing.headline}
            </h3>
            <p className="text-sm text-foreground-secondary truncate">
              {displayName}
            </p>
          </div>
        </div>

        {/* Type Badge + Location */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ACCOUNT_TYPE_COLORS[listing.account_type]}`}
          >
            {ACCOUNT_TYPE_LABELS[listing.account_type]}
          </span>
          {listing.city && (
            <span className="text-xs text-foreground-secondary">
              📍 {listing.city}
              {listing.country_code ? `, ${listing.country_code.toUpperCase()}` : ""}
            </span>
          )}
        </div>

        {/* Bio */}
        <p className="text-sm text-foreground-secondary mb-4 line-clamp-2">
          {listing.bio}
        </p>

        {/* Specialties */}
        {listing.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {listing.specialties.slice(0, 3).map((s) => (
              <span
                key={s}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-foreground-secondary"
              >
                {s}
              </span>
            ))}
            {listing.specialties.length > 3 && (
              <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-foreground-secondary">
                +{listing.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer: Rating + Price */}
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            {listing.review_count > 0 ? (
              <div className="flex items-center gap-1">
                <StarRating rating={listing.average_rating} />
                <span className="text-xs text-foreground-secondary">
                  ({listing.review_count})
                </span>
              </div>
            ) : (
              <span className="text-xs text-foreground-secondary">
                No reviews yet
              </span>
            )}
          </div>
          <div className="text-right">
            {listing.price_from != null ? (
              <div>
                <span className="text-sm font-semibold text-foreground">
                  {listing.currency} {listing.price_from}
                </span>
                {listing.price_label && (
                  <span className="text-xs text-foreground-secondary ml-1">
                    / {listing.price_label}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-xs text-foreground-secondary">
                Contact for pricing
              </span>
            )}
          </div>
        </div>

        {/* Accepting clients indicator */}
        {!listing.accepting_clients && (
          <div className="mt-3 rounded-lg bg-neutral-100 px-3 py-1.5 text-center">
            <span className="text-xs font-medium text-foreground-secondary">
              Not accepting new clients
            </span>
          </div>
        )}
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
  const [accountType, setAccountType] = useState<
    MarketplaceAccountType | ""
  >("");
  const [city, setCity] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [minRating, setMinRating] = useState<number | "">("");
  const [sortBy, setSortBy] = useState<"rating" | "newest" | "nearest">(
    "newest",
  );

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

    const res = await marketplaceService.searchListings(params);
    if (res.success && res.data) {
      setListings(res.data.listings);
      setTotal(res.data.total);
      setTotalPages(res.data.total_pages);
    }
    setIsLoading(false);
  }, [page, searchQuery, accountType, city, selectedSpecialty, minRating, sortBy]);

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
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="bg-background-secondary py-16 border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
            Find Your Perfect{" "}
            <span className="text-primary-500">Fitness Professional</span>
          </h1>
          <p className="text-lg text-foreground-secondary max-w-2xl mx-auto mb-8">
            Browse verified gyms, personal trainers, and dieticians. Connect
            with the right professional for your fitness journey.
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
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
              className="w-full rounded-xl border-2 border-neutral-300 bg-white px-5 py-4 pl-12 text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-primary-500 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-card sticky top-20">
              <div className="flex items-center justify-between mb-6">
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
                  <option value="dietician">Dieticians</option>
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
                <select
                  value={selectedSpecialty}
                  onChange={(e) => {
                    setSelectedSpecialty(e.target.value);
                    setPage(1);
                  }}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                >
                  <option value="">All Specialties</option>
                  {SPECIALTY_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Rating */}
              <div className="mb-6">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(
                      e.target.value ? Number(e.target.value) : "",
                    );
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
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-foreground-secondary">
                {isLoading
                  ? "Searching..."
                  : `${total} professional${total !== 1 ? "s" : ""} found`}
              </p>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl bg-white p-6 shadow-card animate-pulse"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-14 w-14 rounded-xl bg-neutral-200" />
                      <div className="flex-1">
                        <div className="h-5 w-3/4 rounded bg-neutral-200 mb-2" />
                        <div className="h-4 w-1/2 rounded bg-neutral-200" />
                      </div>
                    </div>
                    <div className="h-4 w-full rounded bg-neutral-200 mb-2" />
                    <div className="h-4 w-2/3 rounded bg-neutral-200" />
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && listings.length === 0 && (
              <div className="rounded-2xl bg-white p-12 shadow-card text-center">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listings.map((listing) => (
                    <ListingCard key={listing._id} listing={listing} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
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
