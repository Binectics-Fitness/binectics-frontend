"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useMyListing } from "@/lib/queries/marketplace";
import { useTargetAggregate, useTargetReviews } from "@/lib/queries/reviews";
import { queryKeys } from "@/lib/queries/keys";
import { reviewsService, type Review, type ReviewTargetType } from "@/lib/api/reviews";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import { ReportReviewButton } from "./ReportReviewButton";

/** Mobile's cap on a public response (CoachReviewsScreen RESPONSE_MAX). */
export const RESPONSE_MAX = 1000;

const PAGE_SIZE = 10;

/** 44px tap targets; the v2 button classes are unlayered, so a utility can't raise them. */
const TAP = { minHeight: 44 } as const;

export function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span className="text-[13px]" role="img" aria-label={`${full} out of 5 stars`} style={{ color: "var(--warn, var(--ink))" }}>
      <span aria-hidden="true">
        {"★".repeat(full)}
        <span style={{ color: "var(--border-2)" }}>{"★".repeat(5 - full)}</span>
      </span>
    </span>
  );
}

export interface ProviderReviewCardProps {
  review: Review;
  /** May write or change the public response (the listing's owner, or gym staff with manage_reviews). */
  canRespond: boolean;
  /** May report the review to Binectics. */
  canReport: boolean;
}

/**
 * One review of the provider's own listing: the reviewer, stars, date and
 * comment, the public response under it (written or changed here), and
 * Report.
 */
export function ProviderReviewCard({ review, canRespond, canReport }: ProviderReviewCardProps) {
  const { fmtDate } = useOrgFormat();
  const queryClient = useQueryClient();
  const response = review.providerResponse?.message?.trim() ? review.providerResponse : undefined;
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const helpId = useId();

  const respond = useMutation({
    mutationFn: (message: string) => reviewsService.createProviderResponse(review.id, { message }),
    onSuccess: (res) => {
      if (res.success) {
        setEditing(false);
        setDraft("");
        toast.success(response ? "Response updated" : "Response posted");
        void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
      } else {
        setError(res.message || "Couldn’t post the response. Try again.");
      }
    },
    onError: () => setError("Couldn’t post the response. Try again."),
  });

  const open = () => {
    setDraft(response?.message ?? "");
    setError(null);
    setEditing(true);
  };
  const cancel = () => {
    setEditing(false);
    setDraft("");
    setError(null);
  };

  return (
    <DSCard className="p-4.5">
      <article aria-label={`Review by ${review.reviewerName}`}>
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>{review.reviewerName}</span>
          <Stars rating={review.rating} />
          <span className="ml-auto text-[12.5px]" style={{ color: "var(--fg-3)" }}>{fmtDate(review.createdAt)}</span>
        </div>
        {review.comment && (
          <p className="text-[14px] mt-2 leading-relaxed" style={{ color: "var(--fg-2)" }}>{review.comment}</p>
        )}

        {response && !editing && (
          <div className="mt-3 pl-3.5 py-2" style={{ borderLeft: "2px solid var(--border-2)" }}>
            <p className="text-[12.5px] font-medium" style={{ color: "var(--ink)" }}>
              Your response <span style={{ color: "var(--fg-3)", fontWeight: 400 }}>· {fmtDate(response.createdAt)}</span>
            </p>
            <p className="text-[13.5px] mt-1 leading-relaxed" style={{ color: "var(--fg-2)" }}>{response.message}</p>
          </div>
        )}

        {editing ? (
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const message = draft.trim();
              if (message && !respond.isPending) respond.mutate(message);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape" && !respond.isPending) cancel();
            }}
          >
            <label htmlFor={inputId} className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
              Your response
            </label>
            <textarea
              id={inputId}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={RESPONSE_MAX}
              placeholder="Write a public response"
              aria-describedby={helpId}
              autoFocus
              className="rounded-(--r-2) px-3 py-2.5 text-[14px] resize-y"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 88 }}
            />
            <span id={helpId} className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              It’s public: anyone who opens your listing can read it.
            </span>
            {error && (
              <span role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>{error}</span>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="btn-primary-v2"
                style={TAP}
                disabled={respond.isPending || !draft.trim() || draft.trim() === response?.message.trim()}
              >
                {respond.isPending ? "Saving…" : response ? "Save response" : "Post response"}
              </button>
              <button type="button" className="btn-ghost-v2" style={TAP} disabled={respond.isPending} onClick={cancel}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          (canRespond || canReport) && (
            <div className="flex flex-wrap items-start gap-2">
              {canRespond && (
                <button
                  type="button"
                  className="btn-ghost-v2 mt-3"
                  style={TAP}
                  onClick={open}
                  aria-label={`${response ? "Edit your response to" : "Respond to"} ${review.reviewerName}`}
                >
                  {response ? "Edit response" : "Respond"}
                </button>
              )}
              {canReport && <ReportReviewButton reviewId={review.id} reviewerName={review.reviewerName} />}
            </div>
          )
        )}
      </article>
    </DSCard>
  );
}

export interface ProviderReviewsProps {
  targetType: ReviewTargetType;
  /** What a client completes before reviewing: "session" or "consultation". */
  sessionNoun: string;
  /** Shown when the provider has no listing yet (reviews belong to it). */
  noListing: ReactNode;
}

/**
 * Reviews of the signed-in trainer's or dietitian's own listing, newest
 * first: the rating summary, a page of reviews with Respond / Edit response
 * and Report, as on mobile's CoachReviewsScreen.
 */
export function ProviderReviews({ targetType, sessionNoun, noListing }: ProviderReviewsProps) {
  const listingQuery = useMyListing();
  const listingId = listingQuery.data?._id ?? "";
  const [page, setPage] = useState(1);

  const { data: aggregate } = useTargetAggregate(targetType, listingId, !!listingId);
  const reviewsQuery = useTargetReviews(targetType, listingId, { page, limit: PAGE_SIZE, sort: "newest" }, !!listingId);

  if (listingQuery.isLoading) return <AsyncSpinner size="page" label="Loading reviews" />;

  if (listingQuery.isError) {
    return <LoadError onRetry={() => void listingQuery.refetch()} />;
  }

  if (!listingId) return <>{noListing}</>;

  const reviews = reviewsQuery.data?.reviews ?? [];
  const pagination = reviewsQuery.data?.pagination;
  // useTargetReviews turns a failed response into null rather than an error.
  const failed = reviewsQuery.isError || (reviewsQuery.isSuccess && reviewsQuery.data === null);

  return (
    <div className="flex flex-col gap-3">
      {aggregate && aggregate.totalReviews > 0 && (
        <div className="flex flex-wrap items-baseline gap-2.5">
          <span className="text-[24px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {aggregate.averageRating.toFixed(1)}
          </span>
          <Stars rating={aggregate.averageRating} />
          <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            {aggregate.totalReviews === 1 ? "1 review" : `${aggregate.totalReviews} reviews`}
          </span>
        </div>
      )}

      {reviewsQuery.isLoading && <AsyncSpinner label="Loading reviews" />}

      {failed && <LoadError onRetry={() => void reviewsQuery.refetch()} />}

      {!reviewsQuery.isLoading && !failed && reviews.length === 0 && (
        <DSCard className="px-6 py-10 text-center">
          <EmptySlate message="No reviews yet" hint={`Clients can review you after a completed ${sessionNoun}.`} mt="mt-0" />
        </DSCard>
      )}

      {reviews.map((review) => (
        <ProviderReviewCard key={review.id} review={review} canRespond canReport />
      ))}

      {pagination && pagination.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Review pages">
          <button type="button" className="btn-ghost-v2" style={TAP} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span className="text-[13px]" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
            {page} / {pagination.totalPages}
          </span>
          <button
            type="button"
            className="btn-ghost-v2"
            style={TAP}
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </nav>
      )}
    </div>
  );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-(--r-2) px-4 py-3 text-[13.5px]"
      style={{ background: "var(--danger-soft)", color: "var(--danger-ink)", border: "1px solid var(--danger)" }}
    >
      <span>Couldn’t load your reviews.</span>
      <button type="button" className="btn-ghost-v2" style={TAP} onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

/** The no-listing state that links to where the listing is made. */
export function NoListingYet({ href, linkLabel = "Set up your profile" }: { href?: string; linkLabel?: string }) {
  return (
    <DSCard className="px-6 py-10 text-center">
      <EmptySlate
        message="No profile yet"
        hint="Publish your profile to get reviews."
        mt="mt-0"
        action={
          href ? (
            <Link href={href} className="btn-primary-v2 mx-auto" style={TAP}>
              {linkLabel}
            </Link>
          ) : undefined
        }
      />
    </DSCard>
  );
}
