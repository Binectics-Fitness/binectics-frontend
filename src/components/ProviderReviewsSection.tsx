"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { reviewsService } from "@/lib/api/reviews";
import {
  type Review,
  ReviewTargetType,
  type ReviewAggregate,
  type ReviewEligibility,
} from "@/lib/api/reviews";
import { useAuth } from "@/contexts/AuthContext";
import { UserRole } from "@/lib/types";
import { formatLocal } from "@/utils/format";

interface ProviderReviewsSectionProps {
  targetType: ReviewTargetType;
  targetId: string;
  title?: string;
  accentClassName?: string;
  providerOwnerUserId?: string | null;
  canRespondAsProvider?: boolean;
}

function stars(rating: number) {
  const safeRating = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
}

export default function ProviderReviewsSection({
  targetType,
  targetId,
  title = "Reviews",
  accentClassName = "bg-primary-100 text-primary-700",
  providerOwnerUserId,
  canRespondAsProvider,
}: ProviderReviewsSectionProps) {
  const { user } = useAuth();

  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(
    null,
  );
  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [providerResponseDrafts, setProviderResponseDrafts] = useState<
    Record<string, string>
  >({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const canShowReviewForm = Boolean(user && eligibility?.canReview);

  const isProviderOwner = useMemo(() => {
    if (!user) return false;
    if (user.role === UserRole.ADMIN) return true;

    if (typeof canRespondAsProvider === "boolean") {
      return canRespondAsProvider;
    }

    if (!providerOwnerUserId) return false;

    const roleMatchesTarget =
      (targetType === ReviewTargetType.DIETICIAN && user.role === UserRole.DIETICIAN) ||
      (targetType === ReviewTargetType.TRAINER && user.role === UserRole.TRAINER) ||
      (targetType === ReviewTargetType.GYM && user.role === UserRole.GYM_OWNER);

    if (!roleMatchesTarget) return false;

    return user.id === providerOwnerUserId;
  }, [canRespondAsProvider, providerOwnerUserId, targetType, user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [aggregateRes, reviewsRes] = await Promise.all([
      reviewsService.getTargetAggregate(targetType, targetId),
      reviewsService.getTargetReviews(targetType, targetId, {
        page,
        limit: 10,
        sort: "newest",
      }),
    ]);

    if (aggregateRes.success && aggregateRes.data) {
      setAggregate(aggregateRes.data);
    }

    if (reviewsRes.success && reviewsRes.data) {
      setReviews(reviewsRes.data.reviews);
      setTotalPages(reviewsRes.data.pagination.totalPages || 1);
    } else {
      setError(reviewsRes.message || "Failed to load reviews.");
    }

    if (user) {
      const eligibilityRes = await reviewsService.getEligibility(
        targetType,
        targetId,
      );
      if (eligibilityRes.success && eligibilityRes.data) {
        setEligibility(eligibilityRes.data);
      }
    } else {
      setEligibility(null);
    }

    setLoading(false);
  }, [page, targetId, targetType, user]);

  useEffect(() => {
    if (!targetId) return;
    const handle = setTimeout(() => {
      void loadData();
    }, 0);

    return () => clearTimeout(handle);
  }, [loadData, targetId]);

  const onSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError("Sign in to leave a review.");
      return;
    }
    if (!eligibility?.canReview) {
      setError(eligibility?.reason || "You are not eligible to review yet.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const response = await reviewsService.createReview({
      targetType,
      targetId,
      rating: ratingInput,
      comment: commentInput || undefined,
      sourceBookingId: eligibility?.sourceBookingId,
      sourceSubscriptionId: eligibility?.sourceSubscriptionId,
    });

    setSubmitting(false);

    if (response.success) {
      setCommentInput("");
      await loadData();
      return;
    }

    setError(response.message || "Failed to submit review.");
  };

  const onSubmitProviderResponse = async (reviewId: string) => {
    const message = providerResponseDrafts[reviewId]?.trim();
    if (!message) return;

    const response = await reviewsService.createProviderResponse(reviewId, {
      message,
    });

    if (response.success && response.data) {
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? response.data! : review,
        ),
      );
      setProviderResponseDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      return;
    }

    setError(response.message || "Failed to post provider response.");
  };

  const onSubmitReply = async (reviewId: string) => {
    const message = replyDrafts[reviewId]?.trim();
    if (!message) return;

    const response = await reviewsService.addReply(reviewId, { message });

    if (response.success && response.data) {
      setReviews((prev) =>
        prev.map((review) =>
          review.id === reviewId ? response.data! : review,
        ),
      );
      setReplyDrafts((prev) => ({ ...prev, [reviewId]: "" }));
      return;
    }

    setError(response.message || "Failed to post reply.");
  };

  return (
    <div className="bg-white p-6 shadow-card">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-semibold ${accentClassName}`}
          >
            {aggregate?.totalReviews ?? 0} reviews
          </span>
          <div className="text-right">
            <p className="text-lg font-black text-foreground">
              {aggregate?.averageRating?.toFixed(1) ?? "0.0"}
            </p>
            <p className="text-xs text-foreground-secondary">
              {stars(Math.round(aggregate?.averageRating ?? 0))}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {canShowReviewForm && (
        <form
          onSubmit={onSubmitReview}
          className="mb-6 rounded-xl border border-neutral-200 p-4"
        >
          <p className="mb-3 text-sm font-semibold text-foreground">
            Leave a review
          </p>
          <div className="mb-3 flex items-center gap-2">
            <label
              htmlFor="rating"
              className="text-sm text-foreground-secondary"
            >
              Rating
            </label>
            <select
              id="rating"
              value={ratingInput}
              onChange={(event) => setRatingInput(Number(event.target.value))}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} - {stars(rating)}
                </option>
              ))}
            </select>
          </div>

          <textarea
            value={commentInput}
            onChange={(event) => setCommentInput(event.target.value)}
            placeholder="Share your experience"
            rows={3}
            className="mb-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {user && eligibility && !eligibility.canReview && (
        <p className="mb-6 text-sm text-foreground-secondary">
          {eligibility.reason}
        </p>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-foreground-secondary">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center text-sm text-foreground-secondary">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-gray-100 pb-5 last:border-0 last:pb-0"
            >
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">
                    {review.reviewerName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-foreground">
                      {stars(review.rating)}
                    </span>
                    <span className="text-xs text-foreground-secondary">
                      {formatLocal(review.createdAt, "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {review.comment && (
                <p className="mb-3 text-sm leading-relaxed text-foreground/80">
                  {review.comment}
                </p>
              )}

              {review.providerResponse && (
                <div className="mb-3 rounded-lg bg-neutral-50 px-3 py-2">
                  <p className="text-xs font-semibold text-foreground">
                    Provider response
                  </p>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {review.providerResponse.message}
                  </p>
                </div>
              )}

              {isProviderOwner && !review.providerResponse && (
                <div className="mb-3 rounded-lg border border-neutral-200 p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">
                    Respond as provider
                  </p>
                  <textarea
                    rows={2}
                    value={providerResponseDrafts[review.id] ?? ""}
                    onChange={(event) =>
                      setProviderResponseDrafts((prev) => ({
                        ...prev,
                        [review.id]: event.target.value,
                      }))
                    }
                    placeholder="Write a response"
                    className="mb-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => onSubmitProviderResponse(review.id)}
                    className="rounded-lg bg-accent-blue-500 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Post Response
                  </button>
                </div>
              )}

              {review.replies && review.replies.length > 0 && (
                <div className="mb-3 space-y-2 rounded-lg bg-neutral-50 p-3">
                  <p className="text-xs font-semibold text-foreground">
                    Discussion
                  </p>
                  {review.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-md bg-white px-3 py-2"
                    >
                      <p className="text-xs text-foreground-tertiary">
                        {formatLocal(reply.createdAt, "MMM d, yyyy • h:mm a")}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {reply.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {user && (
                <div className="rounded-lg border border-neutral-200 p-3">
                  <p className="mb-2 text-xs font-semibold text-foreground">
                    Add a reply
                  </p>
                  <textarea
                    rows={2}
                    value={replyDrafts[review.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [review.id]: event.target.value,
                      }))
                    }
                    placeholder="Write a reply"
                    className="mb-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => onSubmitReply(review.id)}
                    className="rounded-lg bg-neutral-800 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}

          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-foreground-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-xs text-foreground-tertiary">
              Page {page} of {Math.max(1, totalPages)}
            </p>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-foreground-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
