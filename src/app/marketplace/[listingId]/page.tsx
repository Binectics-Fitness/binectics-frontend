"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PhotoGallery from "@/components/PhotoGallery";
import { marketplaceService } from "@/lib/api/marketplace";
import { useAuth } from "@/contexts/AuthContext";
import type {
  MarketplaceListing,
  MarketplaceReview,
  MarketplaceAccountType,
  MarketplaceRequestType,
  MarketplaceVerificationBadge,
} from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  marketplaceRequestSchema,
  marketplaceReviewSchema,
  type MarketplaceRequestFormData,
  type MarketplaceReviewFormData,
} from "@/lib/schemas/marketplace";

const ACCOUNT_TYPE_LABELS: Record<MarketplaceAccountType, string> = {
  gym_owner: "Gym",
  personal_trainer: "Personal Trainer",
  dietitian: "Dietitian",
};

const ACCOUNT_TYPE_COLORS: Record<MarketplaceAccountType, string> = {
  gym_owner: "bg-accent-blue-100 text-accent-blue-700",
  personal_trainer: "bg-accent-yellow-100 text-accent-yellow-700",
  dietitian: "bg-accent-purple-100 text-accent-purple-700",
};

function StarRating({
  rating,
  size = "md",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" }[size];
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${sizeClass} ${star <= Math.round(rating) ? "text-accent-yellow-500" : "text-neutral-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: MarketplaceReview }) {
  const client = typeof review.client_id === "object" ? review.client_id : null;
  const date = new Date(review.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="rounded-xl bg-white p-6 shadow-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden">
            {client?.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={client.profile_picture}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-bold text-foreground/40">
                {client ? client.first_name[0] : "?"}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {client
                ? `${client.first_name} ${client.last_name}`
                : "Anonymous"}
            </p>
            <p className="text-xs text-foreground-secondary">{date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>
      {review.comment && (
        <p className="text-sm text-foreground-secondary leading-relaxed">
          {review.comment}
        </p>
      )}
    </div>
  );
}

function ListingBadge({ badge }: { badge: MarketplaceVerificationBadge }) {
  if (badge === "none") return null;

  if (badge === "verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue-100 px-2 py-1 text-xs font-semibold text-accent-blue-700">
        ✓ Verified
      </span>
    );
  }

  if (badge === "premium_verified") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent-yellow-100 px-2 py-1 text-xs font-semibold text-accent-yellow-700">
        ✓ Premium
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700">
      ★ Featured
    </span>
  );
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const listingId = params.listingId as string;

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [reviews, setReviews] = useState<MarketplaceReview[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Request modal state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [requestError, setRequestError] = useState("");

  const {
    register: registerRequest,
    handleSubmit: handleRequestSubmit,
    watch: watchRequest,
    reset: resetRequest,
  } = useForm<MarketplaceRequestFormData>({
    resolver: zodResolver(marketplaceRequestSchema),
    defaultValues: {
      requestType: "connection",
      requestMessage: "",
      requestGoals: "",
    },
  });

  const requestType = watchRequest("requestType");

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const {
    register: registerReview,
    handleSubmit: handleReviewSubmit,
    watch: watchReview,
    setValue: setReviewValue,
    reset: resetReview,
  } = useForm<MarketplaceReviewFormData>({
    resolver: zodResolver(marketplaceReviewSchema),
    defaultValues: {
      reviewRating: 5,
      reviewComment: "",
    },
  });

  const reviewRating = watchReview("reviewRating");

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const [listingRes, reviewsRes] = await Promise.all([
        marketplaceService.getListingById(listingId),
        marketplaceService.getListingReviews(listingId),
      ]);

      if (listingRes.success && listingRes.data) {
        setListing(listingRes.data);
      } else {
        setError("Listing not found");
      }

      if (reviewsRes.success && reviewsRes.data) {
        setReviews(reviewsRes.data.reviews);
        setReviewTotal(reviewsRes.data.total);
      }

      setIsLoading(false);
    }
    loadData();
  }, [listingId]);

  const handleSendRequest = async (data: MarketplaceRequestFormData) => {
    if (!user) {
      router.push(`/login?redirect=/marketplace/${listingId}`);
      return;
    }

    setIsSubmitting(true);
    setRequestError("");

    const res = await marketplaceService.sendRequest(listingId, {
      type: data.requestType as MarketplaceRequestType,
      message: data.requestMessage || undefined,
      goals: data.requestGoals
        ? data.requestGoals
            .split(",")
            .map((g) => g.trim())
            .filter(Boolean)
        : undefined,
    });

    if (res.success) {
      setRequestSuccess(true);
    } else {
      setRequestError(res.message || "Failed to send request");
    }
    setIsSubmitting(false);
  };

  const handleSubmitReview = async (data: MarketplaceReviewFormData) => {
    if (!user) return;

    setIsSubmittingReview(true);
    const res = await marketplaceService.createReview(listingId, {
      rating: data.reviewRating,
      comment: data.reviewComment || undefined,
    });

    if (res.success && res.data) {
      setReviews((prev) => [res.data!, ...prev]);
      setReviewTotal((t) => t + 1);
      setShowReviewForm(false);
      resetReview();
    }
    setIsSubmittingReview(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 w-48 rounded bg-neutral-200 mb-8" />
            <div className="rounded-2xl bg-white p-8 shadow-card">
              <div className="flex items-start gap-6 mb-6">
                <div className="h-20 w-20 rounded-xl bg-neutral-200" />
                <div className="flex-1">
                  <div className="h-7 w-3/4 rounded bg-neutral-200 mb-3" />
                  <div className="h-5 w-1/3 rounded bg-neutral-200" />
                </div>
              </div>
              <div className="h-4 w-full rounded bg-neutral-200 mb-2" />
              <div className="h-4 w-full rounded bg-neutral-200 mb-2" />
              <div className="h-4 w-2/3 rounded bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Listing not found"}
          </h1>
          <Link
            href="/marketplace"
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const professional =
    typeof listing.professional_id === "object"
      ? listing.professional_id
      : null;
  const org =
    typeof listing.organization_id === "object"
      ? listing.organization_id
      : null;
  const isGymListing = listing.account_type === "gym_owner";
  const displayName = org
    ? org.name
    : professional
      ? `${professional.first_name} ${professional.last_name}`
      : "Professional";
  const profileImage = org ? org.logo : professional?.profile_picture;

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <nav className="flex items-center gap-2 text-sm text-foreground-secondary">
            <Link
              href="/marketplace"
              className="hover:text-primary-500 transition-colors"
            >
              Marketplace
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate">
              {listing.headline}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Main Card */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card mb-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-6">
            <div className="h-20 w-20 shrink-0 rounded-xl bg-neutral-200 overflow-hidden flex items-center justify-center">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profileImage}
                  alt={displayName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-foreground/40">
                  {displayName[0]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                  {listing.headline}
                </h1>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${ACCOUNT_TYPE_COLORS[listing.account_type]}`}
                >
                  {ACCOUNT_TYPE_LABELS[listing.account_type]}
                </span>
                <ListingBadge badge={listing.verification_badge} />
              </div>
              <p className="text-foreground-secondary mb-3">{displayName}</p>

              <div className="flex items-center gap-4 flex-wrap">
                {listing.review_count > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={listing.average_rating} />
                    <span className="text-sm text-foreground-secondary">
                      {listing.average_rating.toFixed(1)} (
                      {listing.review_count} review
                      {listing.review_count !== 1 ? "s" : ""})
                    </span>
                  </div>
                )}
                {listing.city && (
                  <span className="text-sm text-foreground-secondary">
                    📍 {listing.city}
                    {listing.country_code
                      ? `, ${listing.country_code.toUpperCase()}`
                      : ""}
                  </span>
                )}
                {listing.active_client_count > 0 && (
                  <span className="text-sm text-foreground-secondary">
                    👥 {listing.active_client_count} active client
                    {listing.active_client_count !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Photo Gallery */}
          {(listing.photos.length > 0 || listing.profile_image) && (
            <div className="mb-6">
              <PhotoGallery
                photos={listing.photos}
                profileImage={listing.profile_image}
                alt={listing.headline}
                fallbackEmoji={isGymListing ? "🏋️" : "📸"}
              />
            </div>
          )}

          {/* Bio */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground mb-2">About</h2>
            <p className="text-foreground-secondary leading-relaxed whitespace-pre-line">
              {listing.bio}
            </p>
          </div>

          {/* Specialties / Facilities */}
          {(isGymListing
            ? (listing.facilities ?? []).length > 0
            : listing.specialties.length > 0) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                {isGymListing ? "Facilities" : "Specialties"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {(isGymListing
                  ? (listing.facilities ?? [])
                  : listing.specialties
                ).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Certifications / Amenities */}
          {(isGymListing
            ? (listing.amenities ?? []).length > 0
            : listing.certifications.length > 0) && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                {isGymListing ? "Amenities" : "Certifications"}
              </h2>
              <div className="flex flex-wrap gap-2">
                {(isGymListing
                  ? (listing.amenities ?? [])
                  : listing.certifications
                ).map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-foreground-secondary"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Languages */}
          {listing.languages.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-foreground mb-3">
                Languages
              </h2>
              <div className="flex flex-wrap gap-2">
                {listing.languages.map((l) => (
                  <span
                    key={l}
                    className="rounded-full bg-neutral-100 px-3 py-1 text-sm text-foreground-secondary"
                  >
                    {l}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="mb-6 rounded-xl bg-background-secondary p-5">
            <h2 className="text-lg font-bold text-foreground mb-2">Pricing</h2>
            {listing.price_from != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-primary-500">
                  {listing.currency} {listing.price_from}
                </span>
                {listing.price_label && (
                  <span className="text-foreground-secondary">
                    / {listing.price_label}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-foreground-secondary">
                Contact for pricing details
              </p>
            )}
          </div>

          {/* CTA */}
          {listing.accepting_clients ? (
            <button
              onClick={() => setShowRequestModal(true)}
              className="w-full rounded-xl bg-primary-500 py-3.5 text-base font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Connect with {displayName}
            </button>
          ) : (
            <div className="rounded-xl bg-neutral-100 py-3.5 text-center">
              <span className="text-sm font-medium text-foreground-secondary">
                Not accepting new clients at this time
              </span>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">
              Reviews ({reviewTotal})
            </h2>
            {user && (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="rounded-lg border-2 border-primary-500 px-4 py-2 text-sm font-semibold text-primary-500 hover:bg-primary-50 transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form
              onSubmit={handleReviewSubmit(handleSubmitReview)}
              className="rounded-xl bg-background-secondary p-5 mb-6"
            >
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Rating
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewValue("reviewRating", star)}
                      className="focus:outline-none"
                    >
                      <svg
                        className={`h-8 w-8 ${star <= reviewRating ? "text-accent-yellow-500" : "text-neutral-300"} hover:text-accent-yellow-400 transition-colors`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Comment (optional)
                </label>
                <textarea
                  {...registerReview("reviewComment")}
                  rows={3}
                  className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none resize-none"
                  placeholder="Share your experience..."
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit Review"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="rounded-xl border-2 border-neutral-300 px-6 py-2.5 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}
            </div>
          ) : (
            <p className="text-center text-foreground-secondary py-8">
              No reviews yet. Be the first to leave a review!
            </p>
          )}
        </div>
      </div>

      {/* Connection Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            {requestSuccess ? (
              <div className="text-center py-4">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
                  <svg
                    className="h-8 w-8 text-primary-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Request Sent!
                </h3>
                <p className="text-foreground-secondary mb-6">
                  Your request has been sent to {displayName}. You&apos;ll be
                  notified when they respond.
                </p>
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setRequestSuccess(false);
                    resetRequest();
                  }}
                  className="rounded-xl bg-primary-500 px-8 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit(handleSendRequest)}>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  Connect with {displayName}
                </h3>
                <p className="text-sm text-foreground-secondary mb-6">
                  Send a request to start working together.
                </p>

                {requestError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-4">
                    <p className="text-sm text-red-800">{requestError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Request Type
                    </label>
                    <select
                      {...registerRequest("requestType")}
                      className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground focus:border-primary-500 focus:outline-none"
                    >
                      <option value="connection">
                        I want to become a client
                      </option>
                      <option value="inquiry">I have a question</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">
                      Message
                    </label>
                    <textarea
                      {...registerRequest("requestMessage")}
                      rows={3}
                      className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none resize-none"
                      placeholder="Tell the professional about yourself..."
                    />
                  </div>

                  {requestType === "connection" && (
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        Fitness Goals (comma-separated)
                      </label>
                      <input
                        type="text"
                        {...registerRequest("requestGoals")}
                        className="w-full rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-primary-500 focus:outline-none"
                        placeholder="e.g. weight loss, muscle gain"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-primary-500 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? "Sending..." : "Send Request"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRequestModal(false);
                      setRequestError("");
                    }}
                    className="rounded-xl border-2 border-neutral-300 px-6 py-2.5 text-sm font-medium text-foreground hover:border-foreground-secondary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
