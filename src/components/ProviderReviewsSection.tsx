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
import SearchableSelect from "@/components/SearchableSelect";

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
  accentClassName = "bg-signal-soft text-signal-ink",
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
      (targetType === ReviewTargetType.DIETITIAN &&
        user.role === UserRole.DIETITIAN) ||
      (targetType === ReviewTargetType.TRAINER &&
        user.role === UserRole.TRAINER) ||
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
    <div className="bg-bg p-6 shadow-(--shadow-card)">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-ink">{title}</h2>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 text-xs font-semibold ${accentClassName}`}
          >
            {aggregate?.totalReviews ?? 0} reviews
          </span>
          <div className="text-right">
            <p className="text-lg font-black text-fg">
              {aggregate?.averageRating?.toFixed(1) ?? "0.0"}
            </p>
            <p className="text-xs text-fg-2">
              {stars(Math.round(aggregate?.averageRating ?? 0))}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-(--r-2) bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {canShowReviewForm && (
        <form
          onSubmit={onSubmitReview}
          className="mb-6 rounded-(--r-3) border border-border p-4"
        >
          <p className="mb-3 text-sm font-semibold text-fg">
            Leave a review
          </p>
          <div className="mb-3 flex items-center gap-2">
            <label
              htmlFor="rating"
              className="text-sm text-fg-2"
            >
              Rating
            </label>
            <SearchableSelect
              id="rating"
              value={String(ratingInput)}
              onChange={(v) => setRatingInput(Number(v))}
              options={[5, 4, 3, 2, 1].map((rating) => ({
                label: `${rating} - ${stars(rating)}`,
                value: String(rating),
              }))}
            />
          </div>

          <textarea
            value={commentInput}
            onChange={(event) => setCommentInput(event.target.value)}
            placeholder="Share your experience"
            rows={3}
            className="mb-3 w-full rounded-(--r-2) border border-border-2 px-3 py-2 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="rounded-(--r-2) bg-signal px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit Review"}
          </button>
        </form>
      )}

      {user && eligibility && !eligibility.canReview && (
        <p className="mb-6 text-sm text-fg-2">
          {eligibility.reason}
        </p>
      )}

      {loading ? (
        <div className="py-10 text-center text-sm text-fg-2">
          Loading reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="py-10 text-center text-sm text-fg-2">
          No reviews yet.
        </div>
      ) : (
        <div className="space-y-5">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="border-b border-border pb-5 last:border-0 last:pb-0"
            >
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-fg">
                    {review.reviewerName}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-sm text-fg">
                      {stars(review.rating)}
                    </span>
                    <span className="text-xs text-fg-2">
                      {formatLocal(review.createdAt, "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>

              {review.comment && (
                <p className="mb-3 text-sm leading-relaxed text-fg-2">
                  {review.comment}
                </p>
              )}

              {review.providerResponse && (
                <div className="mb-3 rounded-(--r-2) bg-bg-2 px-3 py-2">
                  <p className="text-xs font-semibold text-fg">
                    Provider response
                  </p>
                  <p className="mt-1 text-sm text-fg-2">
                    {review.providerResponse.message}
                  </p>
                </div>
              )}

              {isProviderOwner && !review.providerResponse && (
                <div className="mb-3 rounded-(--r-2) border border-border p-3">
                  <p className="mb-2 text-xs font-semibold text-fg">
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
                    className="mb-2 w-full rounded-(--r-2) border border-border-2 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => onSubmitProviderResponse(review.id)}
                    className="rounded-(--r-2) bg-signal px-3 py-1.5 text-xs font-semibold text-bg"
                  >
                    Post Response
                  </button>
                </div>
              )}

              {review.replies && review.replies.length > 0 && (
                <div className="mb-3 space-y-2 rounded-(--r-2) bg-bg-2 p-3">
                  <p className="text-xs font-semibold text-fg">
                    Discussion
                  </p>
                  {review.replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded-md bg-bg px-3 py-2"
                    >
                      <p className="text-xs text-fg-3">
                        {formatLocal(reply.createdAt, "MMM d, yyyy • h:mm a")}
                      </p>
                      <p className="text-sm text-fg-2">
                        {reply.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {user && (
                <div className="rounded-(--r-2) border border-border p-3">
                  <p className="mb-2 text-xs font-semibold text-fg">
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
                    className="mb-2 w-full rounded-(--r-2) border border-border-2 px-3 py-2 text-sm"
                  />
                  <button
                    onClick={() => onSubmitReply(review.id)}
                    className="rounded-(--r-2) bg-ink px-3 py-1.5 text-xs font-semibold text-bg"
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
              className="rounded-(--r-2) border border-border-2 px-3 py-1.5 text-sm text-fg-2 disabled:opacity-50"
            >
              Previous
            </button>
            <p className="text-xs text-fg-3">
              Page {page} of {Math.max(1, totalPages)}
            </p>
            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={page >= totalPages}
              className="rounded-(--r-2) border border-border-2 px-3 py-1.5 text-sm text-fg-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
