"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ProviderListingProfile } from "@/components/provider/ProviderListingProfile";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import { useMyListing } from "@/lib/queries/marketplace";
import { useTargetAggregate, useTargetReviews } from "@/lib/queries/reviews";
import { queryKeys } from "@/lib/queries/keys";
import { reviewsService, ReviewTargetType, type Review } from "@/lib/api/reviews";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

type Tab = "Listing" | "Reviews";

/**
 * Two-tab wrapper for the dietitian profile page: the existing marketplace
 * listing editor, plus reviews of that listing with inline provider responses.
 */
export function ProfileTabs() {
  const [tab, setTab] = useState<Tab>("Listing");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1">
        {(["Listing", "Reviews"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-3 py-[6px] rounded-full cursor-pointer"
            style={{
              background: tab === t ? "var(--ink)" : "var(--bg)",
              color: tab === t ? "var(--bg)" : "var(--fg-3)",
              border: tab === t ? "1px solid var(--ink)" : "1px solid var(--border)",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Keep the listing editor mounted so tab switches don't drop unsaved edits. */}
      <div style={{ display: tab === "Listing" ? undefined : "none" }}>
        <ProviderListingProfile />
      </div>
      {tab === "Reviews" && <ReviewsTab />}
    </div>
  );
}

/* ─── Reviews ────────────────────────────────────────────── */

export function ReviewsTab() {
  const { data: listing, isLoading: listingLoading, isError: listingError } = useMyListing();
  const listingId = listing?._id ?? "";

  const [page, setPage] = useState(1);

  const { data: aggregate } = useTargetAggregate(ReviewTargetType.DIETITIAN, listingId, !!listingId);
  const {
    data: reviewsPage,
    isLoading,
    isError,
  } = useTargetReviews(ReviewTargetType.DIETITIAN, listingId, { page, limit: 10, sort: "newest" }, !!listingId);

  const reviews = reviewsPage?.reviews ?? [];
  const pagination = reviewsPage?.pagination;

  if (listingLoading) {
    return <AsyncSpinner size="page" label="Loading reviews" />;
  }

  if (listingError) {
    return (
      <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
        We couldn&rsquo;t load your listing, reviews are attached to it. Try refreshing.
      </div>
    );
  }

  if (!listingId) {
    return (
      <div className="rounded-(--r-3) px-6 py-10 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
        <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
          Reviews appear once your marketplace listing is live. Create and publish it on the Listing tab.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {aggregate && aggregate.totalReviews > 0 && (
        <div className="flex items-baseline gap-2.5">
          <span className="text-[24px] font-medium" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>
            {aggregate.averageRating.toFixed(1)}
          </span>
          <Stars rating={Math.round(aggregate.averageRating)} />
          <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>
            {aggregate.totalReviews} review{aggregate.totalReviews === 1 ? "" : "s"}
          </span>
        </div>
      )}

      {isLoading && <AsyncSpinner label="Loading reviews" />}

      {isError && (
        <div className="rounded-(--r-2) px-4 py-3 text-[13px]" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid var(--danger)" }}>
          We couldn&rsquo;t load your reviews. Try refreshing.
        </div>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <div className="rounded-(--r-3) px-6 py-10 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <EmptySlate
            message="No reviews yet."
            hint="Clients can leave a review after a completed consultation."
            mt="mt-0"
          />
        </div>
      )}

      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} listingId={listingId} />
      ))}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button className="btn-ghost-v2 sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{page} / {pagination.totalPages}</span>
          <button className="btn-ghost-v2 sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  const full = Math.max(0, Math.min(5, rating));
  return (
    <span className="text-[13px]" style={{ color: "var(--warn, var(--ink))" }}>
      {"★".repeat(full)}
      <span style={{ color: "var(--border-2)" }}>{"★".repeat(5 - full)}</span>
    </span>
  );
}

function ReviewCard({ review, listingId }: { review: Review; listingId: string }) {
  const { fmtDate } = useOrgFormat();
  const queryClient = useQueryClient();
  const [replying, setReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  const respond = useMutation({
    mutationFn: (message: string) =>
      reviewsService.createProviderResponse(review.id, { message }),
    onSuccess: (res) => {
      if (res.success) {
        setReplying(false);
        void queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.reviews.targetAggregate(ReviewTargetType.DIETITIAN, listingId),
        });
      } else {
        setError(res.message || "Couldn't post the response.");
      }
    },
    onError: () => setError("Couldn't post the response."),
  });

  return (
    <div className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5">
        <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{review.reviewerName}</span>
        <Stars rating={review.rating} />
        <span className="ml-auto font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{fmtDate(review.createdAt)}</span>
      </div>
      {review.comment && (
        <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "var(--fg-2)" }}>{review.comment}</p>
      )}

      {review.providerResponse ? (
        <div className="mt-3 pl-3.5 py-2" style={{ borderLeft: "2px solid var(--border-2)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            Your response · {fmtDate(review.providerResponse.createdAt)}
          </div>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--fg-2)" }}>{review.providerResponse.message}</p>
        </div>
      ) : replying ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Write a public response…"
            className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-y"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 70 }}
          />
          {error && <span className="text-[12px]" style={{ color: "var(--danger)" }}>{error}</span>}
          <div className="flex gap-2">
            <button className="btn-primary-v2 sm" disabled={respond.isPending || !draft.trim()} onClick={() => respond.mutate(draft.trim())}>
              {respond.isPending ? "Posting…" : "Post response"}
            </button>
            <button className="btn-ghost-v2 sm" disabled={respond.isPending} onClick={() => setReplying(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <button className="btn-ghost-v2 sm mt-3" onClick={() => { setReplying(true); setError(null); }}>Respond</button>
      )}
    </div>
  );
}
