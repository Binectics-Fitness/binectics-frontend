"use client";

import { useState } from "react";
import Link from "next/link";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { DSCard, DSStatCard, PageHeader } from "@/components/ds";
import { ProviderReviewCard } from "@/components/reviews/ProviderReviews";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrgListing } from "@/lib/queries/marketplace";
import { useTargetAggregate, useTargetReviews } from "@/lib/queries/reviews";
import { ReviewTargetType } from "@/lib/api/reviews";
import SearchableSelect from "@/components/SearchableSelect";
import { useGymViewer } from "@/hooks/useGymViewer";
import { TeamPermission, holds } from "@/lib/gymStaffNav";

type Sort = "newest" | "oldest" | "rating_high" | "rating_low";

/**
 * Reviews of the org's marketplace listing — real aggregate, paginated list,
 * and owner replies via the provider-response endpoint. Replaces the
 * hardcoded "Linda Mokoena" mockup.
 */
export function GymReviewsClient() {
  const { currentOrg } = useOrganization();
  const { data: listing } = useOrgListing(currentOrg?._id);
  // Replying in public, and reporting, is marketplace:manage_reviews; a
  // Manager can read the reviews but not act on them (as on mobile).
  const canRespond = holds(useGymViewer(), TeamPermission.MARKETPLACE_MANAGE_REVIEWS);
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
    { label: "Overall rating", value: aggregate ? aggregate.averageRating.toFixed(1) : "-", delta: aggregate ? `${aggregate.totalReviews} review${aggregate.totalReviews === 1 ? "" : "s"}` : "" },
    { label: "5-star reviews", value: aggregate ? String(fiveStars) : "-", delta: aggregate && aggregate.totalReviews > 0 ? `${Math.round((fiveStars / aggregate.totalReviews) * 100)}% of total` : "" },
    { label: "Needs response", value: String(needsResponse), delta: "on this page", danger: needsResponse > 0 },
  ];

  return (
    <GymDashboardShell activeItem="Settings" crumb="Reviews">
      {/* The shell's <main> already spaces its children (gap-5). */}
      <PageHeader className="mb-0!" title="Reviews" />

      {!listingId && !isLoading && (
        <DSCard className="px-6 py-10 text-center">
          <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>Reviews start once your listing is live.</p>
          <Link href="/dashboard/profile-edit" className="btn-ghost-v2 sm mt-4 inline-flex">Open listing</Link>
        </DSCard>
      )}

      {listingId && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
            {kpis.map((k) => (
              <DSStatCard
                key={k.label}
                size="sm"
                label={k.label}
                // Unanswered reviews keep their red value; the card has no tone for it.
                value={k.danger ? <span style={{ color: "var(--danger, var(--ink))" }}>{k.value}</span> : k.value}
                delta={k.delta}
              />
            ))}
          </div>

          {/* Sort + list */}
          <div className="flex items-center justify-between">
            <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
              {pagination ? `${pagination.total} review${pagination.total === 1 ? "" : "s"}` : ""}
            </span>
            <SearchableSelect
              value={sort}
              onChange={(v) => { setSort(v as Sort); setPage(1); }}
              options={[
                { label: "Newest first", value: "newest" },
                { label: "Oldest first", value: "oldest" },
                { label: "Highest rated", value: "rating_high" },
                { label: "Lowest rated", value: "rating_low" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-2.5">
            {isLoading && <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>Loading reviews…</p>}
            {!isLoading && reviews.length === 0 && (
              <DSCard className="px-6 py-10 text-center">
                <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>No reviews yet, they&rsquo;ll appear here once members start rating your gym.</p>
              </DSCard>
            )}
            {reviews.map((r) => (
              <ProviderReviewCard key={r.id} review={r} canRespond={canRespond} canReport={canRespond} />
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
