"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ProviderReviewsSection from "@/components/ProviderReviewsSection";
import PhotoGallery from "@/components/PhotoGallery";
import { marketplaceService } from "@/lib/api/marketplace";
import { ReviewTargetType } from "@/lib/api/reviews";
import type {
  MarketplaceListing,
  MarketplaceMembershipPlan,
} from "@/lib/types";
import { useAuth } from "@/contexts/AuthContext";

export default function TrainerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const trainerId = Array.isArray(params.trainerId)
    ? params.trainerId[0]
    : params.trainerId;
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [plans, setPlans] = useState<MarketplaceMembershipPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState<string | null>(null);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [reviewOwnerUserId, setReviewOwnerUserId] = useState<string | null>(
    null,
  );

  const loadPlans = useCallback(async () => {
    if (!trainerId) return;
    setPlansLoading(true);
    try {
      const response = await marketplaceService.getPublicListingPlans(
        String(trainerId),
      );
      if (response.success && response.data) {
        setPlans(response.data);
      }
    } finally {
      setPlansLoading(false);
    }
  }, [trainerId]);

  useEffect(() => {
    let mounted = true;

    async function loadListingOwner() {
      const response = await marketplaceService.getListingById(
        String(trainerId),
      );
      if (!mounted || !response.success || !response.data) return;

      setListing(response.data);

      const professionalId =
        typeof response.data.professional_id === "object"
          ? response.data.professional_id._id
          : response.data.professional_id;

      setReviewOwnerUserId(professionalId ?? null);
    }

    void loadListingOwner();
    void loadPlans();

    return () => {
      mounted = false;
    };
  }, [trainerId, loadPlans]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (!user) {
      router.push(`/login?redirect=/trainers/${String(trainerId)}`);
      return;
    }
    setSubscribeLoading(true);
    setSubscribeError(null);
    setSubscribeSuccess(null);
    try {
      const response = await marketplaceService.subscribeToListingPlan(
        String(trainerId),
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

  const displayName = listing
    ? (() => {
        const pro =
          typeof listing.professional_id === "object"
            ? listing.professional_id
            : null;
        return pro ? `${pro.first_name} ${pro.last_name}` : listing.headline;
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
            Back to Trainers
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
            {/* Profile Image & Quick Stats */}
            <div className="space-y-6">
              <PhotoGallery
                photos={listing?.photos ?? []}
                profileImage={listing?.profile_image}
                alt={displayName}
                fallbackEmoji="💪"
                accentBg="bg-accent-yellow-100"
              />

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-gray-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-black text-foreground sm:text-2xl">
                    {listing?.average_rating?.toFixed(1) ?? "—"}
                  </p>
                  <p className="text-sm text-foreground/60">Rating</p>
                </div>
                <div className="bg-gray-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-black text-foreground sm:text-2xl">
                    {listing?.review_count ?? 0}
                  </p>
                  <p className="text-sm text-foreground/60">Reviews</p>
                </div>
                <div className="bg-gray-50 p-3 text-center sm:p-4">
                  <p className="text-xl font-black text-foreground sm:text-2xl">
                    {listing?.active_client_count ?? 0}
                  </p>
                  <p className="text-sm text-foreground/60">Clients</p>
                </div>
              </div>
            </div>

            {/* Trainer Info */}
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
                    {location || "Location not available"}
                  </p>
                </div>
                {isVerified && (
                  <div className="flex items-center gap-2 self-start bg-primary-500 px-4 py-2 font-semibold text-foreground">
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
                    VERIFIED
                  </div>
                )}
              </div>

              {/* Bio */}
              <p className="text-foreground/80 mb-6 leading-relaxed">
                {listing?.bio ?? listing?.headline ?? ""}
              </p>

              {/* Availability */}
              <div className="mb-6 p-4 bg-gray-50 border border-gray-200">
                <p className="text-sm font-semibold text-foreground mb-1">
                  Availability
                </p>
                <p className="text-foreground/80">
                  {listing?.accepting_clients
                    ? "Currently accepting new clients"
                    : "Not accepting new clients at the moment"}
                </p>
              </div>

              {/* Specialties */}
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3">
                  Specialties
                </p>
                <div className="flex flex-wrap gap-2">
                  {(listing?.specialties ?? []).map((specialty, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-accent-yellow-100 text-accent-yellow-700 text-sm font-semibold"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              {listing?.languages && listing.languages.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm font-semibold text-foreground mb-2">
                    Languages
                  </p>
                  <p className="text-foreground/80">
                    {listing.languages.join(", ")}
                  </p>
                </div>
              )}

              {/* Quick Contact */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => void handleSubscribe()}
                  disabled={!selectedPlan || subscribeLoading}
                  className="flex-1 px-6 py-3 bg-accent-yellow-500 text-foreground font-semibold hover:bg-accent-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subscribeLoading
                    ? "Processing..."
                    : selectedPlan
                      ? "Book Now"
                      : "Select a Package"}
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
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Certifications & Credentials
              </h2>
              {(listing?.certifications ?? []).length === 0 ? (
                <p className="text-foreground/60 text-sm">
                  No certifications listed
                </p>
              ) : (
                <div className="space-y-3">
                  {(listing?.certifications ?? []).map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50"
                    >
                      <svg
                        className="w-6 h-6 text-accent-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="font-medium text-foreground">
                        {cert}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Achievements / Bio Details */}
            {listing?.bio && (
              <div className="bg-white p-6 shadow-card">
                <h2 className="text-2xl font-bold text-foreground mb-6">
                  About
                </h2>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                  {listing.bio}
                </p>
              </div>
            )}

            {/* Availability - removed (not in API response), show accepting clients status */}
            <div className="bg-white p-6 shadow-card">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Availability
              </h2>
              {listing?.accepting_clients ? (
                <div className="flex items-center gap-3 p-4 bg-primary-50 border border-primary-200">
                  <svg
                    className="w-5 h-5 text-primary-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="font-semibold text-foreground">
                    Currently accepting new clients
                  </p>
                </div>
              ) : (
                <p className="text-foreground/60">
                  Not currently accepting new clients
                </p>
              )}
            </div>

            <ProviderReviewsSection
              targetType={ReviewTargetType.TRAINER}
              targetId={String(trainerId)}
              title="Client Reviews"
              accentClassName="bg-accent-yellow-100 text-accent-yellow-700"
              providerOwnerUserId={reviewOwnerUserId}
            />
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 shadow-card lg:sticky lg:top-4">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Training Packages
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
                    <div key={i} className="h-24 bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : plans.length === 0 ? (
                <p className="text-foreground/60 text-sm">No plans available</p>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div
                      key={plan._id}
                      className={`p-4 border-2 cursor-pointer transition-all ${
                        selectedPlan === plan._id
                          ? "border-accent-yellow-500 bg-accent-yellow-500/5"
                          : "border-gray-200 hover:border-gray-300"
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
                className="w-full mt-6 px-6 py-4 bg-accent-yellow-500 text-foreground font-semibold hover:bg-accent-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {subscribeLoading
                  ? "Processing..."
                  : selectedPlan
                    ? "Subscribe to Plan"
                    : "Select a Plan"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
