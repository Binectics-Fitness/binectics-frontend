"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import LocationFilter from "@/components/LocationFilter";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceListing } from "@/lib/types";

function getDisplayName(listing: MarketplaceListing): string {
  const pro =
    typeof listing.professional_id === "object"
      ? listing.professional_id
      : null;
  if (pro) return `${pro.first_name} ${pro.last_name}`;
  return listing.headline;
}

export default function DietitiansPage() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [geoLat, setGeoLat] = useState<number | null>(null);
  const [geoLng, setGeoLng] = useState<number | null>(null);
  const [radiusKm, setRadiusKm] = useState(25);
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const specialties = [
    "All Specialties",
    "Weight Loss",
    "Sports Nutrition",
    "Diabetes Management",
    "Heart Health",
    "Gut Health",
    "Plant-Based Diets",
    "Pregnancy Nutrition",
  ];

  const fetchDietitians = useCallback(
    async (
      query: string,
      specialty: string,
      verified: boolean,
      currentPage: number,
      lat: number | null,
      lng: number | null,
      radius: number,
    ) => {
      setIsLoading(true);
      setError(null);
      try {
        const params: Record<string, unknown> = {
          page: currentPage,
          limit: 12,
          account_type: "dietitian",
        };
        if (query) params.q = query;
        if (specialty !== "all") params.specialties = specialty;
        if (lat !== null && lng !== null) {
          params.lat = lat;
          params.lng = lng;
          params.radius_km = radius;
          params.sort = "nearest";
        }
        const res = await marketplaceService.searchListings(
          params as Parameters<typeof marketplaceService.searchListings>[0],
        );
        if (res.success && res.data) {
          let results = res.data.listings;
          if (verified)
            results = results.filter((l) => l.verification_badge !== "none");
          setListings(results);
          setTotal(res.data.total);
          setTotalPages(res.data.total_pages);
        } else {
          setListings([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch {
        setError("Failed to load dietitians. Please try again.");
        setListings([]);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, 400);
  };

  useEffect(() => {
    void fetchDietitians(
      searchQuery,
      selectedSpecialty,
      verifiedOnly,
      page,
      geoLat,
      geoLng,
      radiusKm,
    );
  }, [
    fetchDietitians,
    searchQuery,
    selectedSpecialty,
    verifiedOnly,
    page,
    geoLat,
    geoLng,
    radiusKm,
  ]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-accent-purple-500 py-8 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-3 sm:mb-4">
              Find Your Certified Dietitian
            </h1>
            <p className="text-base sm:text-lg text-foreground/90">
              Connect with registered dietitians worldwide for personalized
              nutrition guidance
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search by name, location, or specialty..."
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full px-5 py-4 pl-12 border-2 border-foreground/20 focus:outline-none focus:border-foreground"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/60"
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
      </section>

      {/* Filters */}
      <section className="bg-background border-b border-neutral-300 py-4 sm:py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
            {/* Specialty Filter */}
            <div className="flex-1">
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">
                Specialty
              </label>
              <select
                value={selectedSpecialty}
                onChange={(e) => {
                  setSelectedSpecialty(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 sm:px-4 py-2 text-sm border-2 border-neutral-300 focus:border-accent-purple-500 focus:outline-none"
              >
                {specialties.map((specialty) => (
                  <option
                    key={specialty}
                    value={specialty === "All Specialties" ? "all" : specialty}
                  >
                    {specialty}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div className="flex-1">
              <LocationFilter
                lat={geoLat}
                lng={geoLng}
                radiusKm={radiusKm}
                onLocationChange={(lat, lng) => {
                  setGeoLat(lat);
                  setGeoLng(lng);
                  setPage(1);
                }}
                onRadiusChange={(km) => {
                  setRadiusKm(km);
                  setPage(1);
                }}
              />
            </div>

            {/* Verified Only */}
            <div className="flex items-end">
              <label className="flex w-full items-center rounded-lg border-2 border-neutral-300 px-4 py-3 transition-colors hover:border-accent-purple-500 lg:w-auto">
                <input
                  type="checkbox"
                  checked={verifiedOnly}
                  onChange={(e) => {
                    setVerifiedOnly(e.target.checked);
                    setPage(1);
                  }}
                  className="mr-2 h-4 w-4 text-accent-purple-500"
                />
                <span className="text-foreground font-semibold">
                  Verified only
                </span>
              </label>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-foreground-secondary">
            {isLoading
              ? "Loading..."
              : `Showing ${total} ${total === 1 ? "dietitian" : "dietitians"}`}
          </div>
        </div>
      </section>

      {/* Dietitians Grid */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {isLoading && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-white shadow-card">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && listings.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                No dietitians found
              </h3>
              <p className="text-foreground-secondary mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setInputValue("");
                  setSearchQuery("");
                  setSelectedSpecialty("all");
                  setVerifiedOnly(false);
                  setPage(1);
                }}
                className="border-2 border-neutral-300 px-6 py-2 font-semibold text-foreground transition-colors hover:bg-neutral-100"
              >
                Reset Filters
              </button>
            </div>
          )}

          {!isLoading && listings.length > 0 && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {listings.map((listing) => {
                const displayName = getDisplayName(listing);
                const location = [
                  listing.city,
                  listing.country_code?.toUpperCase(),
                ]
                  .filter(Boolean)
                  .join(", ");
                const isVerifiedBadge = listing.verification_badge !== "none";

                return (
                  <div
                    key={listing._id}
                    className="flex h-full flex-col bg-white shadow-card transition-shadow hover:shadow-lg"
                  >
                    <div className="flex flex-1 flex-col p-4 pb-4 sm:p-6">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center bg-accent-purple-100 text-2xl sm:h-16 sm:w-16 sm:text-3xl overflow-hidden">
                            {listing.profile_image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={listing.profile_image}
                                alt={displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>🥗</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-display text-lg font-bold text-foreground">
                              {displayName}
                            </h3>
                            {location && (
                              <p className="text-sm text-foreground-secondary">
                                📍 {location}
                              </p>
                            )}
                          </div>
                        </div>
                        {isVerifiedBadge && (
                          <div className="bg-primary-500 text-foreground px-2 py-1 text-xs font-semibold">
                            ✓
                          </div>
                        )}
                      </div>

                      {listing.review_count > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-accent-purple-500">★</span>
                          <span className="font-semibold text-foreground">
                            {listing.average_rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-foreground-secondary">
                            ({listing.review_count} reviews)
                          </span>
                          {listing.active_client_count > 0 && (
                            <span className="text-sm text-foreground-secondary">
                              • {listing.active_client_count} clients
                            </span>
                          )}
                        </div>
                      )}

                      {listing.bio && (
                        <p className="mb-4 text-sm text-foreground-secondary line-clamp-2">
                          {listing.bio}
                        </p>
                      )}

                      {listing.specialties &&
                        listing.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {listing.specialties
                              .slice(0, 3)
                              .map((specialty, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-accent-purple-100 text-accent-purple-700 text-xs font-semibold"
                                >
                                  {specialty}
                                </span>
                              ))}
                          </div>
                        )}

                      {listing.certifications &&
                        listing.certifications.length > 0 && (
                          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
                            <svg
                              className="w-4 h-4 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                              />
                            </svg>
                            <span className="truncate">
                              {listing.certifications.slice(0, 2).join(", ")}
                            </span>
                          </div>
                        )}
                    </div>

                    <div className="mt-auto flex flex-col gap-3 border-t border-gray-200 bg-gray-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div>
                        {listing.price_from ? (
                          <>
                            <p className="text-xs text-foreground-secondary">
                              Starting at
                            </p>
                            <p className="text-xl font-black text-foreground">
                              {listing.price_label ??
                                `${listing.currency ?? "$"}${listing.price_from}`}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-foreground-secondary">
                            Contact for pricing
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/dietitians/${listing._id}`}
                        className="inline-flex items-center justify-center bg-accent-purple-500 px-6 py-2 text-center font-semibold text-white transition-colors hover:bg-accent-purple-600"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!isLoading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border-2 border-neutral-300 text-foreground font-semibold hover:bg-neutral-100 disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-4 py-2 font-semibold ${page === i + 1 ? "bg-accent-purple-500 text-white" : "border-2 border-neutral-300 text-foreground hover:bg-neutral-100"}`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border-2 border-neutral-300 text-foreground font-semibold hover:bg-neutral-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent-purple-100 py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Ready to Transform Your Nutrition?
          </h2>
          <p className="text-lg text-foreground/80 mb-8">
            Connect with certified dietitians and achieve your health goals
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-8 py-3 bg-accent-purple-500 text-white font-semibold hover:bg-accent-purple-600 transition-colors"
            >
              Sign Up Now
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-8 py-3 border-2 border-foreground/20 bg-background text-foreground font-semibold hover:border-foreground/40 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
