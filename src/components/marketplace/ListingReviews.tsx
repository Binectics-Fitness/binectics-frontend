"use client";

import { useId, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { reviewsService, ReviewTargetType } from "@/lib/api/reviews";
import { useTargetAggregate, useTargetReviews } from "@/lib/queries/reviews";
import { queryKeys } from "@/lib/queries/keys";
import { UserRole } from "@/lib/types";

/** The review target a listing's account type maps to (the API checks they match). */
export function reviewTargetFor(accountType: string): ReviewTargetType {
  if (accountType === "personal_trainer") return ReviewTargetType.TRAINER;
  if (accountType === "dietitian") return ReviewTargetType.DIETITIAN;
  return ReviewTargetType.GYM;
}

/**
 * A listing's rating and review count, from the reviews the listing page
 * shows (the /reviews store: the one members write to on both apps,
 * providers answer in and admins moderate). Falls back to the listing's
 * own figures until it loads, or if it can't.
 */
export function useListingRating(listingId: string, accountType: string, fallback: { average: number; count: number }) {
  const { data } = useTargetAggregate(reviewTargetFor(accountType), listingId);
  return data ? { average: data.averageRating, count: data.totalReviews } : fallback;
}

function Star({ size = 14, filled = true }: { size?: number; filled?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 1.5}>
      <path d="m12 2 3 7 7 .8-5.3 4.7L18 22l-6-4-6 4 1.3-7.5L2 9.8 9 9z" />
    </svg>
  );
}

function Stars({ rating, size }: { rating: number; size?: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="flex gap-px" style={{ color: "var(--ink)" }} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => <Star key={i} size={size} filled={i < r} />)}
    </span>
  );
}

const ratingLabel = (n: number) => `${n} star${n === 1 ? "" : "s"}`;
/** "4.5", or "–" before there is a rating to show. */
const ratingText = (avg: number) => (avg > 0 ? String(Math.round(avg * 10) / 10) : "–");

/**
 * The Reviews section of a listing (F10): its rating, the reviews, and,
 * for a member the API says may review (GET /reviews/.../eligibility: a
 * completed session with the provider, or membership of the gym), "Write
 * a review". Nobody else sees a form or a reason they can't use it.
 */
export function ListingReviews({
  listingId,
  accountType,
  providerName,
}: {
  listingId: string;
  accountType: string;
  providerName: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const targetType = reviewTargetFor(accountType);
  const [page, setPage] = useState(1);
  const { data: aggregate } = useTargetAggregate(targetType, listingId);
  const { data: reviewsPage, isLoading } = useTargetReviews(targetType, listingId, { page, limit: 10, sort: "newest" });
  const reviews = reviewsPage?.reviews ?? [];
  const totalPages = Math.max(1, reviewsPage?.pagination.totalPages ?? 1);

  const isMember = !!user && user.role === UserRole.USER;
  const { data: eligibility } = useQuery({
    queryKey: [...queryKeys.reviews.all, "eligibility", targetType, listingId, user?.id ?? ""],
    enabled: isMember,
    queryFn: async () => {
      const res = await reviewsService.getEligibility(targetType, listingId);
      return res.success && res.data ? res.data : null;
    },
  });

  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const formId = useId();

  const mine = !!user && reviews.some((r) => r.reviewerUserId === user.id);
  const canWrite = isMember && eligibility?.canReview === true && !mine && !alreadyReviewed;
  const average = aggregate?.averageRating ?? 0;
  const count = aggregate?.totalReviews ?? reviewsPage?.pagination.total ?? 0;

  const close = () => {
    setWriting(false);
    setRating(0);
    setComment("");
    setError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (rating < 1 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await reviewsService.createReview({
        targetType,
        targetId: listingId,
        rating,
        comment: comment.trim() || undefined,
        sourceBookingId: eligibility?.sourceBookingId,
        sourceSubscriptionId: eligibility?.sourceSubscriptionId,
      });
      if (res.success) {
        close();
        setPage(1);
        toast.success("Thanks, your review is posted.");
        void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
        return;
      }
      if (res.status === 409) {
        close();
        setAlreadyReviewed(true);
        return;
      }
      setError(res.message || "Couldn't post your review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="reviews" className="py-8 border-b border-border" aria-labelledby={`${formId}-heading`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <h2 id={`${formId}-heading`} className="text-[22px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
          Reviews
        </h2>
        {canWrite && !writing && (
          <button type="button" className="btn-ghost-v2 sm" onClick={() => setWriting(true)}>
            Write a review
          </button>
        )}
      </div>

      <div className="flex items-end gap-4 py-3">
        <div className="text-[48px] sm:text-[64px] font-medium leading-none" style={{ letterSpacing: "-0.03em", color: "var(--ink)" }}>
          {ratingText(average)}
        </div>
        <div className="pb-1.5">
          <Stars rating={average} />
          <div className="font-mono text-[13px] mt-1.5" style={{ color: "var(--fg-3)" }}>
            {count} {count === 1 ? "review" : "reviews"}
          </div>
        </div>
      </div>

      {(mine || alreadyReviewed) && (
        <p className="text-[13px] mt-2" style={{ color: "var(--fg-3)" }} data-testid="already-reviewed">
          You&rsquo;ve reviewed {providerName}.
        </p>
      )}

      {writing && (
        <form
          onSubmit={(e) => void submit(e)}
          aria-labelledby={`${formId}-title`}
          className="mt-4 flex flex-col gap-4 rounded-(--r-3) p-4 sm:p-5"
          style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}
        >
          <h3 id={`${formId}-title`} className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            Review {providerName}
          </h3>
          <fieldset className="border-0 p-0 m-0">
            <legend className="text-[13px] mb-2" style={{ color: "var(--fg-2)" }}>
              Your rating
            </legend>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  className="cursor-pointer rounded-(--r-1) p-1 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2"
                  style={{ color: n <= rating ? "var(--ink)" : "var(--border-2)" }}
                >
                  <input
                    type="radio"
                    name={`${formId}-rating`}
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                    className="sr-only"
                    aria-label={ratingLabel(n)}
                  />
                  <Star size={26} />
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`${formId}-comment`} className="text-[13px]" style={{ color: "var(--fg-2)" }}>
              What was it like? (optional)
            </label>
            <textarea
              id={`${formId}-comment`}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={2000}
              rows={4}
              className="w-full rounded-(--r-2) border border-border-2 bg-bg px-3 py-2 text-[14px]"
              style={{ color: "var(--ink)" }}
            />
          </div>
          {error && (
            <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="btn-primary-v2 sm disabled:opacity-50" disabled={rating < 1 || submitting}>
              {submitting ? "Posting…" : "Post review"}
            </button>
            <button type="button" className="btn-ghost-v2 sm" onClick={close} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div aria-hidden="true" className="mt-4 h-16 rounded-(--r-3) animate-pulse" style={{ background: "var(--bg-3)" }} />
      ) : reviews.length > 0 ? (
        <ul className="flex flex-col list-none p-0 mt-4">
          {reviews.map((rev) => {
            const initials = rev.reviewerName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const date = rev.createdAt
              ? new Date(rev.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
              : "";
            return (
              <li key={rev.id} className="flex gap-4 py-4.5 border-t border-border">
                <div className="w-9 h-9 rounded-full bg-bg-3 flex items-center justify-center text-[13px] font-semibold shrink-0" style={{ color: "var(--fg-2)" }} aria-hidden="true">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5">
                    <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{rev.reviewerName}</span>
                    <span className="font-mono text-[11.5px]" style={{ color: "var(--fg-3)" }}>{date}</span>
                  </div>
                  <div className="mt-1" role="img" aria-label={ratingLabel(rev.rating)}>
                    <Stars rating={rev.rating} size={12} />
                  </div>
                  {rev.comment && <p className="text-[14px] leading-relaxed mt-2" style={{ color: "var(--fg-2)" }}>{rev.comment}</p>}
                  {rev.providerResponse && (
                    <div className="mt-3 rounded-(--r-2) px-3 py-2" style={{ background: "var(--bg-2)" }}>
                      <p className="text-[12px] font-medium" style={{ color: "var(--ink)" }}>Response from {providerName}</p>
                      <p className="mt-1 text-[13.5px]" style={{ color: "var(--fg-2)" }}>{rev.providerResponse.message}</p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptySlate message={reviewsPage === null ? "Couldn\u2019t load reviews." : "No reviews yet."} mt="mt-2" />
      )}

      {totalPages > 1 && (
        <div className="mt-2 flex items-center justify-between">
          <button type="button" className="btn-ghost-v2 sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Newer
          </button>
          <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>
            Page {page} of {totalPages}
          </span>
          <button type="button" className="btn-ghost-v2 sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Older
          </button>
        </div>
      )}
    </section>
  );
}
