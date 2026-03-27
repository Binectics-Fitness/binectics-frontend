"use client";

import { useState, useEffect } from "react";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import {
  reviewsService,
  ReviewTargetType,
  type Review,
  type ReviewAggregate,
  type CreateProviderResponseRequest,
} from "@/lib/api/reviews";
import { formatLocal } from "@/utils/format";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-4 w-4 ${star <= rating ? "text-accent-yellow-500" : "text-neutral-300"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function DietitianReviewsPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sort, setSort] = useState<"newest" | "oldest" | "rating_high" | "rating_low">("newest");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    reviewsService
      .getTargetAggregate(ReviewTargetType.DIETITIAN, user.id)
      .then((res) => {
        if (res.success && res.data) setAggregate(res.data);
      });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoadingData(true);
    reviewsService
      .getTargetReviews(ReviewTargetType.DIETITIAN, user.id, { page, limit: 10, sort })
      .then((res) => {
        if (res.success && res.data) {
          setReviews(res.data.reviews);
          setTotalPages(res.data.pagination.totalPages);
        }
      })
      .finally(() => setLoadingData(false));
  }, [user, page, sort]);

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;
    setSubmitting(true);
    const payload: CreateProviderResponseRequest = { message: responseText.trim() };
    const res = await reviewsService.createProviderResponse(reviewId, payload);
    if (res.success && res.data) {
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? res.data! : r)));
      setRespondingTo(null);
      setResponseText("");
    }
    setSubmitting(false);
  };

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const ratingBreakdown = aggregate?.ratingBreakdown || {};

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            View and respond to client reviews
          </p>
        </div>

        {aggregate && aggregate.totalReviews > 0 && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-card">
              <div className="text-center">
                <p className="text-4xl font-black text-foreground">
                  {aggregate.averageRating.toFixed(1)}
                </p>
                <StarRating rating={Math.round(aggregate.averageRating)} />
                <p className="mt-1 text-sm text-foreground-secondary">
                  {aggregate.totalReviews} review{aggregate.totalReviews !== 1 ? "s" : ""}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-card">
              <h3 className="mb-3 text-sm font-semibold text-foreground-secondary">Rating Breakdown</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[String(star)] || 0;
                  const pct = aggregate.totalReviews > 0 ? (count / aggregate.totalReviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-3 text-foreground-secondary">{star}</span>
                      <svg className="h-3.5 w-3.5 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div className="flex-1 h-2 rounded-full bg-neutral-100">
                        <div className="h-2 rounded-full bg-accent-yellow-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-right text-foreground-secondary">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">All Reviews</h2>
          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value as typeof sort); setPage(1); }}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-foreground"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating_high">Highest Rating</option>
            <option value="rating_low">Lowest Rating</option>
          </select>
        </div>

        <div className="space-y-4">
          {loadingData ? (
            <DashboardLoading />
          ) : reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 shadow-card">
              <EmptyState title="No Reviews Yet" description="When clients leave reviews, they will appear here." />
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="rounded-2xl bg-white p-6 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-foreground">{review.reviewerName}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarRating rating={review.rating} />
                      <span className="text-sm text-foreground-secondary">
                        {formatLocal(review.createdAt, "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {review.comment && (
                  <p className="mt-3 text-sm text-foreground-secondary">{review.comment}</p>
                )}

                {review.providerResponse && (
                  <div className="mt-4 rounded-lg bg-neutral-50 p-4">
                    <p className="text-xs font-semibold text-foreground-secondary">Your Response</p>
                    <p className="mt-1 text-sm text-foreground">{review.providerResponse.message}</p>
                  </div>
                )}

                {!review.providerResponse && (
                  <>
                    {respondingTo === review.id ? (
                      <div className="mt-4 space-y-2">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Write your response..."
                          className="w-full rounded-lg border border-neutral-200 p-3 text-sm text-foreground placeholder:text-foreground-secondary/50 focus:border-accent-purple-500 focus:outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRespond(review.id)}
                            disabled={submitting || !responseText.trim()}
                            className="rounded-lg bg-accent-purple-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                          >
                            {submitting ? "Sending..." : "Send Response"}
                          </button>
                          <button
                            onClick={() => { setRespondingTo(null); setResponseText(""); }}
                            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-semibold text-foreground-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setRespondingTo(review.id)}
                        className="mt-3 text-sm font-semibold text-accent-purple-500 hover:text-accent-purple-600"
                      >
                        Respond
                      </button>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-foreground-secondary">Page {page} of {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
