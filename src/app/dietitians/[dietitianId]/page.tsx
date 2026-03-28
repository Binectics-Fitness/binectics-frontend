"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProviderReviewsSection from "@/components/ProviderReviewsSection";
import PhotoGallery from "@/components/PhotoGallery";
import { marketplaceService } from "@/lib/api/marketplace";
import { ReviewTargetType } from "@/lib/api/reviews";
import type {
  MarketplaceListing,
  MarketplaceMembershipPlan,
} from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function DietitianProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const dietitianId = Array.isArray(params.dietitianId)
    ? params.dietitianId[0]
    : params.dietitianId;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [reviewOwnerUserId, setReviewOwnerUserId] = useState<string | null>(
    null,
  );
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    if (!dietitianId) return;
    try {
      const res = await marketplaceService.getPublicListingPlans(
        String(dietitianId),
      );
      if (res.success && res.data) setPlans(res.data);
    } finally {
      setPlansLoading(false);
    }
  }, [dietitianId]);

  useEffect(() => {
    let mounted = true;

    async function loadListingOwner() {
      const response = await marketplaceService.getListingById(
        String(dietitianId),
      );
      if (!mounted || !response.success || !response.data) return;

      setListing(response.data);

      const professionalId =
        typeof response.data.professional_id === "object"
          ? response.data.professional_id._id
          : response.data.professional_id;

      setReviewOwnerUserId(professionalId ?? null);
      void loadPlans();
    }

    void loadListingOwner();

    return () => {
      mounted = false;
    };
  }, [dietitianId, loadPlans]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (!user) {
      router.push(`/login?redirect=/dietitians/${dietitianId}`);
      return;
    }
    setSubscribeLoading(true);
    setSubscribeSuccess(null);
    setSubscribeError(null);
    try {
      const res = await marketplaceService.subscribeToListingPlan(
        String(dietitianId),
        selectedPlan,
      );
      if (res.success) {
        setSubscribeSuccess("Successfully subscribed! Check your dashboard.");
        setSelectedPlan(null);
      } else {
        setSubscribeError(
          res.message ?? "Subscription failed. Please try again.",
        );
      }
    } catch {
      setSubscribeError("Something went wrong. Please try again.");
    } finally {
      setSubscribeLoading(false);
    }
  };

  // Computed display values from listing
  const displayName = listing
    ? (() => {
        const prof =
          typeof listing.professional_id === "object"
            ? listing.professional_id
            : null;
        if (prof?.first_name || prof?.last_name)
          return [prof.first_name, prof.last_name].filter(Boolean).join(" ");
        return listing.headline;
      })()
    : "Loading...";
  const location = listing
    ? [listing.city, listing.country_code?.toUpperCase()]
        .filter(Boolean)
        .join(", ")
    : "";
  const isVerified = listing ? listing.verification_badge !== "none" : false;

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-foreground/60 hover:text-foreground text-sm sm:text-base"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dietitians
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {/* Profile Image & Quick Stats */}
            <div className="space-y-4 sm:space-y-6">
              {/* Profile Image Gallery */}
              <PhotoGallery
                photos={listing?.photos ?? []}
                profileImage={listing?.profile_image}
                alt={displayName}
                fallbackEmoji="🥗"
                accentBg="bg-accent-purple-100"
              />

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-neutral-50 p-3 sm:p-4 text-center rounded-xl">
                  <p className="text-lg sm:text-2xl font-black text-foreground">
                    {listing?.average_rating?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1">
                    Rating
                  </p>
                </div>
                <div className="bg-neutral-50 p-3 sm:p-4 text-center rounded-xl">
                  <p className="text-lg sm:text-2xl font-black text-foreground">
                    {listing?.review_count ?? 0}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1">
                    Reviews
                  </p>
                </div>
                <div className="bg-neutral-50 p-3 sm:p-4 text-center rounded-xl">
                  <p className="text-lg sm:text-2xl font-black text-foreground">
                    {listing?.active_client_count ?? 0}
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/60 mt-1">
                    Clients
                  </p>
                </div>
              </div>
            </div>

            {/* Dietitian Info */}
            <div>
              <div className="flex items-start justify-between mb-3 sm:mb-4 flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-foreground mb-2">
                    {displayName}
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-foreground/60 flex items-center gap-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    {location || "Location not available"}
                  </p>
                </div>
                {isVerified && (
                  <div className="bg-primary-500 text-foreground px-3 sm:px-4 py-1.5 sm:py-2 font-semibold flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    VERIFIED RD
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="text-sm sm:text-base text-foreground/80 mb-4 sm:mb-6 leading-relaxed">
                {listing?.bio ?? listing?.headline ?? ""}
              </p>

              {/* About */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-neutral-50 border border-neutral-200 rounded-xl text-sm">
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                  Accepting Clients
                </p>
                <p className="text-xs sm:text-sm text-foreground/80">
                  {listing?.accepting_clients
                    ? "Yes, currently accepting new clients"
                    : "Not accepting new clients at this time"}
                </p>
              </div>

              {/* Specialties */}
              <div className="mb-4 sm:mb-6">
                <p className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {(listing?.specialties ?? []).map((specialty, index) => (
                    <span
                      key={index}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-accent-purple-100 text-accent-purple-700 text-xs sm:text-sm font-semibold"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              {listing?.languages && listing.languages.length > 0 && (
                <div className="mb-4 sm:mb-6 space-y-2 text-sm">
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">
                      Languages
                    </p>
                    <p className="text-xs sm:text-sm text-foreground/80">
                      {listing.languages.join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Contact */}
              <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
                <button
                  onClick={() => void handleSubscribe()}
                  disabled={!selectedPlan || subscribeLoading}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-accent-purple-500 text-foreground text-sm sm:text-base font-semibold hover:bg-accent-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscribeLoading
                    ? "Processing..."
                    : selectedPlan
                      ? "Subscribe Now"
                      : "Select a Program"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Certifications */}
            <div className="bg-white p-6 rounded-xl shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Certifications
              </h2>
              {(listing?.certifications ?? []).length === 0 ? (
                <p className="text-foreground/60 text-sm">
                  No certifications listed
                </p>
              ) : (
                <div className="space-y-2">
                  {(listing?.certifications ?? []).map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                    >
                      <svg
                        className="w-5 h-5 text-accent-purple-500 mt-0.5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-foreground/80">{cert}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* About / Approach */}
            <div className="bg-white p-6 rounded-xl shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold text-foreground mb-6">About</h2>
              <p className="text-foreground/80 leading-relaxed">
                {listing?.bio ??
                  listing?.headline ??
                  "No information available"}
              </p>
            </div>

            {/* Accepting Clients status */}
            <div className="bg-white p-6 rounded-xl shadow-[var(--shadow-card)]">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Availability
              </h2>
              <div
                className={`p-4 border rounded-xl ${listing?.accepting_clients ? "border-primary-500 bg-primary-500/10" : "border-neutral-200 bg-neutral-50"}`}
              >
                <p className="font-semibold text-foreground">
                  {listing?.accepting_clients
                    ? "✅ Accepting New Clients"
                    : "❌ Not Currently Accepting Clients"}
                </p>
                <p className="text-sm text-foreground/60 mt-1">
                  {listing?.accepting_clients
                    ? "This dietitian is currently taking on new clients."
                    : "This dietitian is not taking on new clients at this time."}
                </p>
              </div>
            </div>

            <ProviderReviewsSection
              targetType={ReviewTargetType.DIETITIAN}
              targetId={String(dietitianId)}
              title="Client Reviews"
              accentClassName="bg-accent-purple-100 text-accent-purple-700"
              providerOwnerUserId={reviewOwnerUserId}
            />
          </div>

          {/* Right Column - Programs */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow-[var(--shadow-card)] lg:sticky lg:top-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Nutrition Programs
              </h2>
              {subscribeSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
                  {subscribeSuccess}
                </div>
              )}
              {subscribeError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {subscribeError}
                </div>
              )}
              {plansLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-24 bg-neutral-100 animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <p className="text-foreground/60 text-sm">
                  No programs available at this time.
                </p>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan._id}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        selectedPlan === plan._id
                          ? "border-accent-purple-500 bg-accent-purple-500/5"
                          : "border-neutral-200 hover:border-neutral-300"
                      }`}
                      onClick={() => setSelectedPlan(plan._id)}
                    >
                      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-bold text-foreground">
                            {plan.name}
                          </h3>
                          {plan.description && (
                            <p className="text-sm text-foreground/60">
                              {plan.description}
                            </p>
                          )}
                        </div>
                        <div className="sm:text-right">
                          <p className="text-2xl font-black text-foreground">
                            {`${plan.currency ?? "$"}${plan.price}`}
                          </p>
                          {plan.duration_days && (
                            <p className="text-xs text-foreground/60">
                              {plan.duration_days} days
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => void handleSubscribe()}
                disabled={!selectedPlan || subscribeLoading}
                className="w-full mt-6 px-6 py-4 bg-accent-purple-500 text-foreground font-semibold hover:bg-accent-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribeLoading
                  ? "Processing..."
                  : selectedPlan
                    ? "Subscribe to Program"
                    : "Select a Program"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
