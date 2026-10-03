"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import {
  AsyncSpinner,
  EmptySlate,
  FilterPill,
  StatusPill,
  DSTable,
  DSTableHead,
  DSTableTh,
  DSTableRow,
  DSTableTd,
} from "@/components/ds";
import {
  adminService,
  type AdminPaginated,
  type AdminReviewReport,
  type AdminReviewReportFilters,
} from "@/lib/api/admin";
import { formatAdminDate, reportPill, reviewSubject, stars } from "@/lib/admin/moderation";

const PAGE_SIZE = 25;

type QueueFilter = NonNullable<AdminReviewReportFilters["status"]> | "all";

const FILTERS: { value: QueueFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Resolved" },
  { value: "all", label: "All" },
];

const EMPTY_HINT: Record<QueueFilter, string> = {
  open: "Nothing waiting. Reports members file on reviews appear here.",
  resolved: "No report has been dismissed or acted on yet.",
  all: "No member has reported a review yet.",
};

/** The review-report queue: one row per report, newest first. */
export function ReviewReportsClient() {
  const [filter, setFilter] = useState<QueueFilter>("open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AdminPaginated<AdminReviewReport> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      setLoading(true);
      const res = await adminService.listReviewReports({
        status: filter === "all" ? undefined : filter,
        page,
        limit: PAGE_SIZE,
      });
      if (!active) return;
      if (res.success && res.data) {
        setData(res.data);
        setError(null);
      } else {
        setError(res.message || "We couldn't load the report queue.");
      }
      setLoading(false);
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [filter, page]);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <AdminDashboardShell activeItem="Reviews" crumb="Reviews">
      <div>
        <h1 className="text-[28px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
          Reviews
        </h1>
        <p className="text-[13.5px] mt-1.5 max-w-[64ch]" style={{ color: "var(--fg-3)" }}>
          Reports members file on reviews. Open one to dismiss the report or hide the review; a hidden review leaves the
          provider&apos;s page and their rating.
        </p>
      </div>

      <div className="flex items-center gap-2 mt-4 flex-wrap">
        {FILTERS.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            count={filter === f.value && data ? data.total : undefined}
            active={filter === f.value}
            onClick={() => {
              setFilter(f.value);
              setPage(1);
            }}
          />
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-(--r-3) p-4 mt-4 text-[13px]"
          style={{ background: "var(--danger-soft)", border: "1px solid oklch(0.92 0.05 25)", color: "var(--danger)" }}
        >
          <div className="font-medium">Couldn&apos;t load reports</div>
          <div className="mt-1" style={{ color: "var(--ink)" }}>
            {error}
          </div>
        </div>
      ) : null}

      {loading ? (
        <AsyncSpinner />
      ) : !error && data && data.items.length === 0 ? (
        <EmptySlate message="No reports" hint={EMPTY_HINT[filter]} />
      ) : !error && data ? (
        <>
          <div className="rounded-(--r-3) mt-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <DSTable minWidth={820}>
              <DSTableHead>
                <DSTableTh>Reported</DSTableTh>
                <DSTableTh>Review</DSTableTh>
                <DSTableTh>About</DSTableTh>
                <DSTableTh>Reason</DSTableTh>
                <DSTableTh>Status</DSTableTh>
              </DSTableHead>
              <tbody>
                {data.items.map((r, i) => {
                  const pill = reportPill(r);
                  return (
                    <DSTableRow key={r.id} last={i === data.items.length - 1}>
                      <DSTableTd className="whitespace-nowrap text-[12.5px]">{formatAdminDate(r.created_at)}</DSTableTd>
                      <DSTableTd>
                        <Link
                          href={`/admin/reviews/${r.review_id}`}
                          className="block no-underline"
                          style={{ color: "var(--ink)" }}
                        >
                          <span
                            aria-label={`${r.review?.rating ?? 0} out of 5`}
                            style={{ color: "oklch(0.65 0.18 75)", letterSpacing: 1 }}
                          >
                            {r.review ? stars(r.review.rating) : ""}
                          </span>
                          <span
                            className="block text-[13px] mt-0.5 line-clamp-2 max-w-[38ch]"
                            style={{ color: "var(--fg-2)" }}
                          >
                            {r.review?.comment || (r.review ? "No comment, rating only" : "Review no longer exists")}
                          </span>
                          <span className="block font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                            by {r.review?.author?.name ?? "unknown"}
                          </span>
                        </Link>
                      </DSTableTd>
                      <DSTableTd className="text-[13px]">{reviewSubject(r.review)}</DSTableTd>
                      <DSTableTd className="text-[13px]">
                        <span className="block">{r.reason}</span>
                        <span className="block font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                          {r.reporter?.name ?? "unknown reporter"}
                        </span>
                      </DSTableTd>
                      <DSTableTd>
                        <StatusPill variant={pill.variant} label={pill.label} />
                      </DSTableTd>
                    </DSTableRow>
                  );
                })}
              </tbody>
            </DSTable>
          </div>

          <div className="flex items-center justify-between mt-3 text-[13px]">
            <div style={{ color: "var(--fg-3)" }}>
              {data.total} report{data.total === 1 ? "" : "s"}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span style={{ color: "var(--fg-3)" }}>
                Page {data.page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn-ghost-v2 sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : null}
    </AdminDashboardShell>
  );
}
