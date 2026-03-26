"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import LocationFilter from "@/components/LocationFilter";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceListing } from "@/lib/types";

function getDisplayName(listing: MarketplaceListing): string {
  const org =
    typeof listing.organization_id === "object"
      ? listing.organization_id
      : null;
  const pro =
    typeof listing.professional_id === "object"
      ? listing.professional_id
      : null;
  if (org?.name) return org.name;
  if (pro) return `${pro.first_name} ${pro.last_name}`;
  return listing.headline;
}

export default function GymsPage() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
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

  const countries = [
    { code: "all", name: "All Countries", flag: "🌍" },
    { code: "US", name: "United States", flag: "🇺🇸" },
    { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
    { code: "DE", name: "Germany", flag: "🇩🇪" },
    { code: "JP", name: "Japan", flag: "🇯🇵" },
    { code: "CA", name: "Canada", flag: "🇨🇦" },
    { code: "AU", name: "Australia", flag: "🇦🇺" },
  ];

  const fetchGyms = useCallback(
    async (
      query: string,
      country: string,
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
          account_type: "gym_owner",
        };
        if (query) params.q = query;
        if (country !== "all") params.country_code = country;
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
          setListings(res.data.listings);
          setTotal(res.data.total);
          setTotalPages(res.data.total_pages);
        } else {
          setListings([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch {
        setError("Failed to load gyms. Please try again.");
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
    void fetchGyms(
      searchQuery,
      selectedCountry,
      page,
      geoLat,
      geoLng,
      radiusKm,
    );
  }, [fetchGyms, searchQuery, selectedCountry, page, geoLat, geoLng, radiusKm]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-10 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="mb-4 font-display text-3xl font-black text-foreground sm:text-5xl">
              Find Your Perfect Gym
            </h1>
            <p className="text-base text-foreground-secondary sm:text-lg">
              Access 500+ gyms worldwide with your Binectics membership
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search by gym name, city, or country..."
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              className="w-full rounded-lg border-2 border-neutral-300 bg-background px-5 py-4 pl-12 text-foreground placeholder-foreground-secondary focus:border-primary-500 focus:outline-none"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-secondary"
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
      <section className="bg-background border-b border-neutral-300 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Country Filter */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Country
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => {
                  setSelectedCountry(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-lg border-2 border-neutral-300 bg-background px-4 py-2 text-foreground focus:border-primary-500 focus:outline-none"
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.name}
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
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-foreground-secondary">
            {isLoading
              ? "Loading..."
              : `Showing ${total} ${total === 1 ? "gym" : "gyms"}`}
          </div>
        </div>
      </section>

      {/* Gym Listings */}
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
                <div
                  key={i}
                  className="animate-pulse rounded-lg border-2 border-neutral-200 overflow-hidden"
                >
                  <div className="h-48 bg-neutral-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-5 bg-neutral-200 rounded w-3/4" />
                    <div className="h-4 bg-neutral-200 rounded w-1/2" />
                    <div className="h-4 bg-neutral-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !error && listings.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                No gyms found
              </h3>
              <p className="text-foreground-secondary mb-6">
                Try adjusting your search or filters
              </p>
              <button
                onClick={() => {
                  setInputValue("");
                  setSearchQuery("");
                  setSelectedCountry("all");
                  setPage(1);
                }}
                className="rounded-lg border-2 border-neutral-300 px-6 py-2 font-semibold text-foreground transition-colors hover:bg-neutral-100"
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
                const facilities = listing.specialties ?? [];
                const isVerified = listing.verification_badge !== "none";

                return (
                  <div
                    key={listing._id}
                    className="flex h-full flex-col overflow-hidden rounded-lg border-2 border-neutral-300 bg-background transition-all hover:border-primary-500 hover:shadow-lg"
                  >
                    {/* Image */}
                    <div className="relative h-48 bg-neutral-100 flex items-center justify-center text-6xl">
                      {listing.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.profile_image}
                          alt={displayName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>🏋️</span>
                      )}
                      {isVerified && (
                        <div className="absolute top-3 right-3 bg-primary-500 text-foreground px-2 py-1 text-xs font-semibold flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          ✓
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-1 flex-col p-4 sm:p-6">
                      <div className="mb-3">
                        <h3 className="font-display text-xl font-bold text-foreground mb-1">
                          {displayName}
                        </h3>
                        {location && (
                          <p className="text-sm text-foreground-secondary">
                            📍 {location}
                          </p>
                        )}
                      </div>

                      {listing.headline && (
                        <p className="text-sm text-foreground-secondary mb-3 line-clamp-2">
                          {listing.headline}
                        </p>
                      )}

                      {listing.review_count > 0 && (
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-accent-yellow-500">★</span>
                          <span className="font-semibold text-foreground">
                            {listing.average_rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-foreground-secondary">
                            ({listing.review_count} reviews)
                          </span>
                        </div>
                      )}

                      {facilities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {facilities.slice(0, 3).map((f, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary"
                            >
                              {f}
                            </span>
                          ))}
                          {facilities.length > 3 && (
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-foreground-secondary">
                              +{facilities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <Link
                        href={`/gyms/${listing._id}`}
                        className="mt-auto block w-full rounded-lg bg-primary-500 px-4 py-3 text-center font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
                      >
                        View Details
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
                  className={`px-4 py-2 font-semibold ${page === i + 1 ? "bg-primary-500 text-foreground" : "border-2 border-neutral-300 text-foreground hover:bg-neutral-100"}`}
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
      <section className="bg-background-secondary py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Ready to Start Training?
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Join Binectics today and get instant access to all these gyms and
            more
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-8 py-3 text-base font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border-2 border-neutral-300 bg-background px-8 py-3 text-base font-semibold text-foreground transition-colors hover:bg-neutral-100"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
