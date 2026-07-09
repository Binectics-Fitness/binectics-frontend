"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgListing } from "@/lib/queries/marketplace";
import { useTargetAggregate, useTargetReviews } from "@/lib/queries/reviews";
import { queryKeys } from "@/lib/queries/keys";
import { reviewsService, ReviewTargetType, type Review } from "@/lib/api/reviews";
import { useOrgFormat } from "@/lib/format/useOrgFormat";

type Sort = "newest" | "oldest" | "rating_high" | "rating_low";

/**
 * Reviews of the org's marketplace listing — real aggregate, paginated list,
 * and owner replies via the provider-response endpoint. Replaces the
 * hardcoded "Linda Mokoena" mockup.
 */
export function GymReviewsClient() {
  const { currentOrg } = useOrganization();
  const { data: listing } = useOrgListing(currentOrg?._id);
  const listingId = listing?._id ?? "";

  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<Sort>("newest");

  const { data: aggregate } = useTargetAggregate(ReviewTargetType.GYM, listingId, !!listingId);
  const { data: reviewsPage, isLoading } = useTargetReviews(
    ReviewTargetType.GYM,
    listingId,
    { page, limit: 10, sort },
    !!listingId,
  );

  const reviews = reviewsPage?.reviews ?? [];
  const pagination = reviewsPage?.pagination;
  const fiveStars = aggregate?.ratingBreakdown?.["5"] ?? 0;
  const needsResponse = reviews.filter((r) => !r.providerResponse).length;

  const kpis = [
    { label: "Overall rating", value: aggregate ? aggregate.averageRating.toFixed(1) : "—", delta: aggregate ? `${aggregate.totalReviews} review${aggregate.totalReviews === 1 ? "" : "s"}` : "" },
    { label: "5-star reviews", value: aggregate ? String(fiveStars) : "—", delta: aggregate && aggregate.totalReviews > 0 ? `${Math.round((fiveStars / aggregate.totalReviews) * 100)}% of total` : "" },
    { label: "Needs response", value: String(needsResponse), delta: "on this page", danger: needsResponse > 0 },
  ];

  return (
    <GymDashboardShell activeItem="Settings" crumb="Reviews">
      <h1 className="text-[30px] font-medium tracking-[-0.024em]" style={{ color: "var(--ink)" }}>Reviews</h1>

      {!listingId && !isLoading && (
        <div className="rounded-(--r-3) px-6 py-10 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
          <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>Reviews appear once your marketplace listing is live.</p>
        </div>
      )}

      {listingId && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {kpis.map((k) => (
              <div key={k.label} className="flex flex-col gap-1 rounded-(--r-3) px-4 py-3.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
                <div className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: k.danger ? "var(--danger, var(--ink))" : "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{k.value}</div>
                <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{k.delta}</div>
              </div>
            ))}
          </div>

          {/* Sort + list */}
          <div className="flex items-center justify-between">
            <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              {pagination ? `${pagination.total} review${pagination.total === 1 ? "" : "s"}` : ""}
            </span>
            <select value={sort} onChange={(e) => { setSort(e.target.value as Sort); setPage(1); }}
              className="rounded-(--r-2) px-3 py-1.5 text-[13px]"
              style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit" }}>
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="rating_high">Highest rated</option>
              <option value="rating_low">Lowest rated</option>
            </select>
          </div>

          <div className="flex flex-col gap-2.5">
            {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading reviews…</p>}
            {!isLoading && reviews.length === 0 && (
              <div className="rounded-(--r-3) px-6 py-10 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>No reviews yet — they&rsquo;ll appear here once members start rating your gym.</p>
              </div>
            )}
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} listingId={listingId} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button className="btn-ghost-v2 sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="font-mono text-[12px]" style={{ color: "var(--fg-3)" }}>{page} / {pagination.totalPages}</span>
              <button className="btn-ghost-v2 sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </GymDashboardShell>
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
          queryKey: queryKeys.reviews.targetAggregate(ReviewTargetType.GYM, listingId),
        });
      } else {
        setError(res.message || "Couldn't post the response.");
      }
    },
  });

  return (
    <div className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5">
        <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{review.reviewerName}</span>
        <span className="text-[13px]" style={{ color: "var(--warn, var(--ink))" }}>{"★".repeat(review.rating)}<span style={{ color: "var(--border-2)" }}>{"★".repeat(Math.max(0, 5 - review.rating))}</span></span>
        <span className="ml-auto font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>{fmtDate(review.createdAt)}</span>
      </div>
      {review.comment && (
        <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: "var(--fg-2)" }}>{review.comment}</p>
      )}

      {review.providerResponse ? (
        <div className="mt-3 pl-3.5 py-2" style={{ borderLeft: "2px solid var(--border-2)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>Your response · {fmtDate(review.providerResponse.createdAt)}</div>
          <p className="text-[13px] mt-1 leading-relaxed" style={{ color: "var(--fg-2)" }}>{review.providerResponse.message}</p>
        </div>
      ) : replying ? (
        <div className="mt-3 flex flex-col gap-2">
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={1000} placeholder="Write a public response…"
            className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-y"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 70 }} />
          {error && <span className="text-[12px]" style={{ color: "var(--danger, #b00020)" }}>{error}</span>}
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
