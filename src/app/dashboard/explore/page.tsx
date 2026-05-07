"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useSearchListings } from "@/lib/queries/marketplace";
import { listingHref } from "@/lib/utils/listingHref";
import type { MarketplaceAccountType, MarketplaceSearchParams } from "@/lib/types";

type SortOption = "rating" | "newest";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    "all" | MarketplaceAccountType
  >("all");
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [page, setPage] = useState(1);

  // Debounce the search query
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value);
      setPage(1);
    }, 400);
  };

  const searchParams = useMemo<MarketplaceSearchParams>(() => {
    const params: MarketplaceSearchParams = {
      sort: sortBy,
      page,
      limit: 12,
    };
    if (selectedCategory !== "all") params.account_type = selectedCategory;
    if (debouncedQuery.trim()) params.q = debouncedQuery.trim();
    return params;
  }, [selectedCategory, sortBy, page, debouncedQuery]);

  const { data, isLoading, isError } = useSearchListings(searchParams);
  const listings = data?.listings ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.total_pages ?? 0;

  // Category counts (lightweight queries)
  const { data: allData } = useSearchListings({ limit: 1 });
  const { data: gymData } = useSearchListings({ account_type: "gym_owner", limit: 1 });
  const { data: trainerData } = useSearchListings({ account_type: "personal_trainer", limit: 1 });
  const { data: dietitianData } = useSearchListings({ account_type: "dietitian", limit: 1 });

  const categories = [
    { id: "all" as const, label: "All", count: allData?.pagination?.total ?? 0 },
    { id: "gym_owner" as const, label: "Gyms", count: gymData?.pagination?.total ?? 0 },
    { id: "personal_trainer" as const, label: "Personal Trainers", count: trainerData?.pagination?.total ?? 0 },
    { id: "dietitian" as const, label: "Dietitians", count: dietitianData?.pagination?.total ?? 0 },
  ];

  const accountTypeLabel = (type: string) => {
    switch (type) {
      case "gym_owner": return "Gym";
      case "personal_trainer": return "Trainer";
      case "dietitian": return "Dietitian";
      default: return type;
    }
  };

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-2">
            Explore
          </h1>
          <p className="text-sm text-foreground-secondary">
            Discover gyms, trainers, and dietitians worldwide
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search for gyms, trainers, or dietitians..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full border border-neutral-200 bg-background py-3 pl-12 pr-4 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-tertiary"
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
          </div>
        </div>

        {/* Category Filters */}
        <div className="mb-6 sm:mb-8">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setPage(1);
                }}
                className={`shrink-0 px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? "bg-foreground text-background"
                    : "bg-background text-foreground-secondary hover:bg-neutral-200"
                }`}
              >
                {category.label} ({category.count})
              </button>
            ))}
          </div>
        </div>

        {/* Results Grid */}
        <div>
          <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-sm text-foreground-secondary">
              {isLoading ? "Searching..." : `${total} results found`}
            </p>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setPage(1);
              }}
              className="w-full sm:w-auto border border-neutral-200 bg-background px-3 sm:px-4 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="rating">Sort by: Rating</option>
              <option value="newest">Sort by: Newest</option>
            </select>
          </div>

          {isLoading ? (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-background p-4 sm:p-6 shadow-[var(--shadow-card)] animate-pulse">
                  <div className="mb-4 h-6 w-16 bg-neutral-200 rounded" />
                  <div className="mb-2 h-5 w-3/4 bg-neutral-200 rounded" />
                  <div className="mb-3 h-4 w-1/2 bg-neutral-200 rounded" />
                  <div className="mb-4 flex gap-2">
                    <div className="h-6 w-14 bg-neutral-100 rounded" />
                    <div className="h-6 w-14 bg-neutral-100 rounded" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-16 bg-neutral-200 rounded" />
                    <div className="h-4 w-20 bg-neutral-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-sm font-medium text-foreground mb-1">Unable to load listings</p>
              <p className="text-sm text-foreground-secondary">
                There was a problem connecting to the server. Please try again.
              </p>
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center">
              <svg className="mx-auto mb-4 h-12 w-12 text-foreground-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-sm font-medium text-foreground mb-1">No results found</p>
              <p className="text-sm text-foreground-secondary">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map((listing) => (
                  <Link
                    key={listing._id}
                    href={listingHref(listing)}
                    className="group bg-background p-4 sm:p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] h-full flex flex-col"
                  >
                    {/* Type Badge */}
                    <div className="mb-4">
                      <span className="inline-block bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                        {accountTypeLabel(listing.account_type)}
                      </span>
                    </div>

                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-primary-500 transition-colors">
                      {listing.headline}
                    </h3>

                    <p className="text-sm text-foreground-secondary mb-3">
                      {listing.specialties.length > 0
                        ? listing.specialties.slice(0, 2).join(", ")
                        : [listing.city, listing.country_code].filter(Boolean).join(", ")}
                    </p>

                    {/* Facilities / Amenities */}
                    {listing.amenities.length > 0 && (
                      <div className="mb-4 flex flex-wrap gap-2">
                        {listing.amenities.slice(0, 3).map((amenity, i) => (
                          <span
                            key={i}
                            className="bg-neutral-100 px-2 py-1 text-xs text-foreground-tertiary"
                          >
                            {amenity}
                          </span>
                        ))}
                      </div>
                    )}

                    {listing.city && (
                      <p className="text-sm text-foreground-tertiary mb-4">
                        {[listing.city, listing.country_code].filter(Boolean).join(", ")}
                      </p>
                    )}

                    {/* Rating and Price */}
                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <svg
                          className="h-4 w-4 text-accent-yellow-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-foreground">
                          {listing.average_rating.toFixed(1)}
                        </span>
                        <span className="text-xs text-foreground-tertiary">
                          ({listing.review_count})
                        </span>
                      </div>
                      {listing.price_label ? (
                        <span className="text-sm font-semibold text-foreground">
                          {listing.price_label}
                        </span>
                      ) : listing.price_from ? (
                        <span className="text-sm font-semibold text-foreground">
                          From {listing.currency} {listing.price_from}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-background border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-foreground-secondary">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-sm font-medium text-foreground-secondary bg-background border border-neutral-200 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
