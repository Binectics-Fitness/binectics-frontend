"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProviderReviewsSection from "@/components/ProviderReviewsSection";
import PhotoGallery from "@/components/PhotoGallery";
import { marketplaceService } from "@/lib/api/marketplace";
import { ReviewTargetType } from "@/lib/api/reviews";
import {
  MarketplaceVerificationBadge,
  MarketplaceListing,
  MarketplaceMembershipPlan,
  MembershipPlanType,
} from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function GymProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const gymId = Array.isArray(params.gymId) ? params.gymId[0] : params.gymId;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [reviewOwnerUserId, setReviewOwnerUserId] = useState<string | null>(
    null,
  );
  const [verificationBadge, setVerificationBadge] =
    useState<MarketplaceVerificationBadge>(MarketplaceVerificationBadge.NONE);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);

  // fallback display helpers
  const displayName = listing
    ? (() => {
        const org =
          typeof listing.organization_id === "object"
            ? listing.organization_id
            : null;
        return org?.name ?? listing.headline;
      })()
    : "Loading...";
  const gymLocation = listing
    ? [listing.city, listing.country_code?.toUpperCase()]
        .filter(Boolean)
        .join(", ")
    : "";
  const gymFacilities = listing?.facilities ?? [];
  const gymAmenities = listing?.amenities ?? [];
  const gymDescription = listing?.bio ?? listing?.headline ?? "";

  useEffect(() => {
    let mounted = true;

    async function loadListingOwner() {
      const response = await marketplaceService.getListingById(String(gymId));
      if (!mounted || !response.success || !response.data) return;

      setListing(response.data);

      const professionalId =
        typeof response.data.professional_id === "object"
          ? response.data.professional_id._id
          : response.data.professional_id;

      setReviewOwnerUserId(professionalId ?? null);
      setVerificationBadge(
        response.data.verification_badge ?? MarketplaceVerificationBadge.NONE,
      );
    }

    void loadListingOwner();

    return () => {
      mounted = false;
    };
  }, [gymId]);

  const loadPlans = useCallback(async () => {
    if (!gymId) return;
    setPlansLoading(true);
    try {
      const response = await marketplaceService.getPublicListingPlans(
        String(gymId),
      );
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } finally {
      setPlansLoading(false);
    }
  }, [gymId]);

  useEffect(() => {
    window.setTimeout(() => void loadPlans(), 0);
  }, [loadPlans]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (!user) {
      router.push(`/login?redirect=/gyms/${String(gymId)}`);
      return;
    }
    setSubscribeLoading(true);
    setSubscribeError(null);
    setSubscribeSuccess(null);
    try {
      const response = await marketplaceService.subscribeToListingPlan(
        String(gymId),
        selectedPlan,
      );
      if (response.success) {
        const plan = plans.find((p) => p._id === selectedPlan);
        setSubscribeSuccess(
          `You\'re now subscribed to ${plan?.name ?? "this plan"}! View your subscriptions in the dashboard.`,
        );
        setSelectedPlan(null);
        void loadPlans();
      } else {
        setSubscribeError(
          response.message ?? "Failed to subscribe. Please try again.",
        );
      }
    } catch {
      setSubscribeError("An unexpected error occurred. Please try again.");
    } finally {
      setSubscribeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground sm:text-base"
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
            Back to Search
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <PhotoGallery
                photos={listing?.photos ?? []}
                profileImage={listing?.profile_image}
                alt={displayName}
                fallbackEmoji="🏋️"
                accentBg="bg-gray-200"
              />
            </div>

            {/* Gym Info */}
            <div>
              <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h1 className="mb-2 text-3xl font-black text-foreground sm:text-4xl">
                    {displayName}
                  </h1>
                  <p className="text-foreground/60 flex items-center gap-2">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    {gymLocation || "Location not available"}
                  </p>
                </div>
                {verificationBadge !== MarketplaceVerificationBadge.NONE && (
                  <div
                    className={`flex items-center gap-2 self-start px-4 py-2 font-semibold text-foreground ${
                      verificationBadge ===
                      MarketplaceVerificationBadge.PREMIUM_VERIFIED
                        ? "bg-accent-yellow-500"
                        : verificationBadge ===
                            MarketplaceVerificationBadge.FEATURED
                          ? "bg-accent-blue-100"
                          : "bg-primary-500"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {verificationBadge ===
                    MarketplaceVerificationBadge.PREMIUM_VERIFIED
                      ? "PREMIUM VERIFIED"
                      : verificationBadge ===
                          MarketplaceVerificationBadge.FEATURED
                        ? "FEATURED"
                        : "VERIFIED"}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div className="mb-6 flex flex-wrap items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">⭐</span>
                  <span className="text-2xl font-black text-foreground">
                    {listing?.average_rating?.toFixed(1) ?? "—"}
                  </span>
                </div>
                <span className="text-foreground/60">
                  ({listing?.review_count ?? 0} reviews)
                </span>
              </div>

              {/* Description */}
              <p className="text-foreground/80 mb-6 leading-relaxed">
                {gymDescription}
              </p>

              {/* Address */}
              {listing?.bio && (
                <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    About
                  </p>
                  <p className="text-foreground/80">{listing.bio}</p>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="flex-1 px-6 py-3 bg-accent-blue-500 text-foreground font-semibold hover:bg-accent-blue-600 transition-colors">
                  Get Directions
                </button>
                <button className="px-6 py-3 border-2 border-gray-200 text-foreground font-semibold hover:border-accent-blue-500 transition-colors">
                  Share
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
            {/* Facilities */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Facilities & Amenities
              </h2>
              {gymFacilities.length === 0 && gymAmenities.length === 0 ? (
                <p className="text-foreground/60">No facilities listed</p>
              ) : (
                <div className="space-y-6">
                  {gymFacilities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
                        Facilities
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {gymFacilities.map((facility, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-primary-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-foreground">{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {gymAmenities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
                        Amenities
                      </h3>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {gymAmenities.map((amenity, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <svg
                              className="w-5 h-5 text-accent-blue-500"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-foreground">{amenity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hours - removed (not in API), show accepting note */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Opening Hours
              </h2>
              <p className="text-foreground/60 text-sm">
                Please contact the gym directly for current opening hours.
              </p>
            </div>

            <ProviderReviewsSection
              targetType={ReviewTargetType.GYM}
              targetId={String(gymId)}
              title="Member Reviews"
              accentClassName="bg-primary-100 text-primary-700"
              providerOwnerUserId={reviewOwnerUserId}
            />
          </div>

          {/* Right Column - Plans & CTA */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card lg:sticky lg:top-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Membership Plans
              </h2>

              {subscribeSuccess && (
                <div className="mb-4 p-4 bg-primary-500/10 border border-primary-500 text-foreground text-sm">
                  {subscribeSuccess}
                </div>
              )}
              {subscribeError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                  {subscribeError}
                </div>
              )}

              {plansLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-32 bg-neutral-100 animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <p className="text-foreground/60 text-sm py-4">
                  No membership plans available at this time.
                </p>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan._id}
                      className={`p-4 border-2 cursor-pointer transition-all ${
                        selectedPlan === plan._id
                          ? "border-primary-500 bg-primary-500/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => {
                        setSelectedPlan(
                          selectedPlan === plan._id ? null : plan._id,
                        );
                        setSubscribeError(null);
                        setSubscribeSuccess(null);
                      }}
                    >
                      <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-foreground">
                              {plan.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 font-semibold ${
                                plan.plan_type ===
                                MembershipPlanType.SUBSCRIPTION
                                  ? "bg-accent-blue-500/10 text-accent-blue-500"
                                  : "bg-accent-yellow-500/20 text-foreground"
                              }`}
                            >
                              {plan.plan_type ===
                              MembershipPlanType.SUBSCRIPTION
                                ? "Subscription"
                                : "One-time"}
                            </span>
                          </div>
                          {plan.description && (
                            <p className="text-sm text-foreground/60">
                              {plan.description}
                            </p>
                          )}
                        </div>
                        <div className="sm:text-right shrink-0">
                          <p className="text-2xl font-black text-foreground">
                            {plan.currency} {plan.price}
                          </p>
                          <p className="text-xs text-foreground/60">
                            {plan.duration_days === 1
                              ? "1 day"
                              : plan.duration_days % 30 === 0
                                ? `${plan.duration_days / 30} month${
                                    plan.duration_days / 30 === 1 ? "" : "s"
                                  }`
                                : `${plan.duration_days} days`}
                          </p>
                        </div>
                      </div>
                      {plan.features.length > 0 && (
                        <ul className="space-y-1 mt-3">
                          {plan.features.map((feature, index) => (
                            <li
                              key={index}
                              className="text-sm text-foreground/80 flex items-start gap-2"
                            >
                              <svg
                                className="w-4 h-4 text-primary-500 mt-0.5 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => void handleSubscribe()}
                disabled={!selectedPlan || subscribeLoading}
                className="w-full mt-6 px-6 py-4 bg-primary-500 text-foreground font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribeLoading
                  ? "Processing..."
                  : selectedPlan
                    ? user
                      ? "Subscribe Now"
                      : "Sign in to Subscribe"
                    : "Select a Plan"}
              </button>

              {/* QR Check-in */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="font-semibold text-foreground mb-3">
                  QR Check-in
                </h3>
                <div className="bg-gray-50 p-4 text-center">
                  <div className="w-32 h-32 bg-white mx-auto mb-2 flex items-center justify-center">
                    <span className="text-6xl">📱</span>
                  </div>
                  <p className="text-sm text-foreground/60">
                    Scan to check in when you arrive
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
