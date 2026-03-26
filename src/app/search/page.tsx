"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import LocationFilter from "@/components/LocationFilter";
import { marketplaceService } from "@/lib/api/marketplace";
import type {
  MarketplaceListing,
  MarketplaceAccountType,
  MarketplaceVerificationBadge,
} from "@/lib/types";

type TypeFilter = "all" | MarketplaceAccountType;

function getTypeColor(type: MarketplaceAccountType): string {
  switch (type) {
    case "gym_owner":
      return "bg-accent-blue-500";
    case "personal_trainer":
      return "bg-accent-yellow-500";
    case "dietitian":
      return "bg-accent-purple-500";
  }
}

function getTypeLabel(type: MarketplaceAccountType): string {
  switch (type) {
    case "gym_owner":
      return "GYM";
    case "personal_trainer":
      return "TRAINER";
    case "dietitian":
      return "DIETITIAN";
  }
}

function getListingLink(listing: MarketplaceListing): string {
  switch (listing.account_type) {
    case "gym_owner":
      return `/gyms/${listing._id}`;
    case "personal_trainer":
      return `/trainers/${listing._id}`;
    case "dietitian":
      return `/dietitians/${listing._id}`;
  }
}

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

function isVerified(badge: MarketplaceVerificationBadge): boolean {
  return badge !== "none";
}

export default function SearchPage() {
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TypeFilter>("all");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
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

  const fetchResults = useCallback(
    async (
      query: string,
      type: TypeFilter,
      verified: boolean,
      sort: string,
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
        };
        if (query) params.q = query;
        if (type !== "all") params.account_type = type;
        if (sort === "rating") params.sort = "rating_desc";
        if (lat !== null && lng !== null) {
          params.lat = lat;
          params.lng = lng;
          params.radius_km = radius;
          if (sort !== "rating") params.sort = "nearest";
        }
        const res = await marketplaceService.searchListings(
          params as Parameters<typeof marketplaceService.searchListings>[0],
        );
        if (res.success && res.data) {
          let results = res.data.listings;
          if (verified)
            results = results.filter((l) => isVerified(l.verification_badge));
          setListings(results);
          setTotal(res.data.total);
          setTotalPages(res.data.total_pages);
        } else {
          setListings([]);
          setTotal(0);
          setTotalPages(1);
        }
      } catch {
        setError("Failed to load results. Please try again.");
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
    void fetchResults(searchQuery, selectedType, verifiedOnly, sortBy, page, geoLat, geoLng, radiusKm);
  }, [fetchResults, searchQuery, selectedType, verifiedOnly, sortBy, page, geoLat, geoLng, radiusKm]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Search Section */}
      <div className="bg-primary-500 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl font-black text-foreground mb-3">
              Find Your Perfect Fit
            </h1>
            <p className="text-base sm:text-lg text-foreground/80 max-w-2xl mx-auto">
              Discover gyms, trainers, and nutrition experts in 50+ countries
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white shadow-lg p-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Search gyms, trainers, dietitians..."
                className="flex-1 px-4 py-3 border-2 border-gray-200 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={() => {
                  setSearchQuery(inputValue);
                  setPage(1);
                }}
                className="px-6 sm:px-8 py-3 bg-accent-blue-500 text-foreground font-semibold hover:bg-accent-blue-600 transition-colors whitespace-nowrap"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card sticky top-4">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Filters
              </h2>
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Type</h3>
                <div className="space-y-2">
                  {[
                    { value: "all" as TypeFilter, label: "All" },
                    { value: "gym_owner" as TypeFilter, label: "Gym" },
                    {
                      value: "personal_trainer" as TypeFilter,
                      label: "Trainer",
                    },
                    { value: "dietitian" as TypeFilter, label: "Dietitian" },
                  ].map(({ value, label }) => (
                    <label
                      key={value}
                      className="flex items-center cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="type"
                        checked={selectedType === value}
                        onChange={() => {
                          setSelectedType(value);
                          setPage(1);
                        }}
                        className="w-4 h-4 text-primary-500"
                      />
                      <span className="ml-2 text-foreground">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mb-6">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verifiedOnly}
                    onChange={(e) => {
                      setVerifiedOnly(e.target.checked);
                      setPage(1);
                    }}
                    className="w-4 h-4 text-primary-500"
                  />
                  <span className="ml-2 text-foreground">Verified only</span>
                </label>
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
                    setPage(1);
                  }}
                  onRadiusChange={(km) => {
                    setRadiusKm(km);
                    setPage(1);
                  }}
                />
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3">
                  Browse by Type
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/gyms"
                    className="block px-4 py-2 bg-accent-blue-100 text-accent-blue-700 font-semibold hover:bg-accent-blue-200 transition-colors"
                  >
                    All Gyms
                  </Link>
                  <Link
                    href="/trainers"
                    className="block px-4 py-2 bg-accent-yellow-100 text-accent-yellow-700 font-semibold hover:bg-accent-yellow-200 transition-colors"
                  >
                    All Trainers
                  </Link>
                  <Link
                    href="/dietitians"
                    className="block px-4 py-2 bg-accent-purple-100 text-accent-purple-700 font-semibold hover:bg-accent-purple-200 transition-colors"
                  >
                    All Dietitians
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground order-2 sm:order-1">
                {isLoading ? "Searching..." : `${total} Results Found`}
              </h2>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
                className="w-full sm:w-auto order-1 sm:order-2 px-4 py-2 border-2 border-gray-200 focus:outline-none focus:border-primary-500 text-sm"
              >
                <option value="relevance">Most Relevant</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white shadow-card animate-pulse">
                    <div className="h-40 sm:h-48 bg-gray-200" />
                    <div className="p-4 sm:p-6 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-4 bg-gray-200 rounded w-1/2" />
                      <div className="h-4 bg-gray-200 rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!isLoading && !error && listings.length === 0 && (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">🔍</p>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  No results found
                </h3>
                <p className="text-foreground/60">
                  Try adjusting your search or filters
                </p>
              </div>
            )}

            {!isLoading && listings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {listings.map((listing) => {
                  const displayName = getDisplayName(listing);
                  const location = [
                    listing.city,
                    listing.country_code?.toUpperCase(),
                  ]
                    .filter(Boolean)
                    .join(", ");
                  const tags = listing.specialties?.length
                    ? listing.specialties
                    : (listing.certifications ?? []);

                  return (
                    <Link
                      key={listing._id}
                      href={getListingLink(listing)}
                      className="bg-white shadow-card hover:shadow-lg transition-shadow group"
                    >
                      <div className="relative h-40 sm:h-48 bg-gray-200 overflow-hidden">
                        {listing.profile_image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={listing.profile_image}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                            {listing.account_type === "gym_owner"
                              ? "🏋️"
                              : listing.account_type === "personal_trainer"
                                ? "💪"
                                : "🥗"}
                          </div>
                        )}
                        <div
                          className={`absolute top-4 left-4 px-3 py-1 ${getTypeColor(listing.account_type)} text-foreground text-xs sm:text-sm font-semibold`}
                        >
                          {getTypeLabel(listing.account_type)}
                        </div>
                        {isVerified(listing.verification_badge) && (
                          <div className="absolute top-4 right-4 bg-primary-500 text-foreground px-2 sm:px-3 py-1 text-xs font-semibold flex items-center gap-1">
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="hidden sm:inline">VERIFIED</span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 sm:p-6">
                        <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 group-hover:text-primary-500 transition-colors line-clamp-2">
                          {displayName}
                        </h3>
                        <p className="text-foreground/70 text-sm mb-1 line-clamp-2">
                          {listing.headline}
                        </p>
                        {location && (
                          <p className="text-foreground/60 text-xs sm:text-sm mb-3 truncate">
                            📍 {location}
                          </p>
                        )}
                        {listing.review_count > 0 && (
                          <div className="flex items-center gap-2 mb-3">
                            <span>⭐</span>
                            <span className="font-semibold text-foreground text-sm">
                              {listing.average_rating.toFixed(1)}
                            </span>
                            <span className="text-foreground/60 text-xs sm:text-sm">
                              ({listing.review_count} reviews)
                            </span>
                          </div>
                        )}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
                            {tags.slice(0, 2).map((tag, index) => (
                              <span
                                key={index}
                                className="px-2 sm:px-3 py-1 bg-gray-100 text-foreground text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div>
                            {listing.price_from ? (
                              <>
                                <p className="text-xs text-foreground/60">
                                  Starting at
                                </p>
                                <p className="text-lg sm:text-xl font-black text-foreground">
                                  {listing.price_label ??
                                    `${listing.currency ?? "$"}${listing.price_from}`}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm text-foreground/60">
                                Contact for pricing
                              </p>
                            )}
                          </div>
                          <button className="px-3 sm:px-6 py-2 text-xs sm:text-sm bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors whitespace-nowrap">
                            View Details
                          </button>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {!isLoading && totalPages > 1 && (
              <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 sm:px-4 py-2 border-2 border-gray-200 text-foreground text-xs sm:text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`px-2 sm:px-4 py-2 text-xs sm:text-sm font-semibold ${page === i + 1 ? "bg-primary-500 text-foreground" : "border-2 border-gray-200 text-foreground hover:bg-gray-50"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 sm:px-4 py-2 border-2 border-gray-200 text-foreground text-xs sm:text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
