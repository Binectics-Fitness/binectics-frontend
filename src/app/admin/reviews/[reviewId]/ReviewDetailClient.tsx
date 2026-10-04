"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminDashboardShell } from "@/components/ds/AdminDashboardShell";
import { ActionModal } from "@/components/ds/ActionModal";
import {
  AsyncSpinner,
  EmptySlate,
  StatusPill,
  DSTable,
  DSTableHead,
  DSTableTh,
  DSTableRow,
  DSTableTd,
} from "@/components/ds";
import { toast } from "@/components/Toast";
import { adminService, type AdminReviewReport, type AdminReviewView } from "@/lib/api/admin";
import {
  REVIEW_STATUS_PILL,
  formatAdminDate,
  formatAdminDateTime,
  reportPill,
  reviewSubject,
  stars,
} from "@/lib/admin/moderation";

type PendingAction = { kind: "hide" } | { kind: "restore" } | { kind: "dismiss"; report: AdminReviewReport };

const ACTION_COPY: Record<PendingAction["kind"], { title: string; description: string; confirm: string }> = {
  hide: {
    title: "Hide review",
    description:
      "The review leaves the provider's page and stops counting toward their rating. Every open report on it is closed as acted on.",
    confirm: "Hide review",
  },
  restore: {
    title: "Restore review",
    description:
      "The review goes back on the provider's page and counts toward their rating again. Closed reports stay closed.",
    confirm: "Restore review",
  },
  dismiss: {
    title: "Dismiss report",
    description: "The review stays public. Only this report is closed.",
    confirm: "Dismiss report",
  },
};

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-(--r-3) p-5" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      {title ? (
        <h3 className="text-[14px] font-medium mb-3" style={{ color: "var(--ink)" }}>
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}

export function ReviewDetailClient({ reviewId }: { reviewId: string }) {
  const [review, setReview] = useState<AdminReviewView | null>(null);
  const [reports, setReports] = useState<AdminReviewReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await adminService.getReview(reviewId);
    if (res.success && res.data) {
      setReview(res.data.review);
      setReports(res.data.reports);
      setError(null);
    } else {
      setError(res.status === 404 ? "This review doesn't exist." : res.message || "We couldn't load this review.");
    }
    setLoading(false);
  }, [reviewId]);

  useEffect(() => {
    const kick = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(kick);
  }, [load]);

  const open = (action: PendingAction) => {
    setNote("");
    setPending(action);
  };

  const confirm = async () => {
    if (!pending) return;
    setSaving(true);
    const trimmed = note.trim() || undefined;
    const res =
      pending.kind === "dismiss"
        ? await adminService.resolveReviewReport(pending.report.id, "dismiss", trimmed)
        : await adminService.setReviewStatus(reviewId, pending.kind === "hide" ? "HIDDEN" : "VISIBLE", trimmed);
    setSaving(false);
    if (!res.success) {
      toast.error(res.message || "That didn't go through. Try again.");
      return;
    }
    toast.success(
      pending.kind === "hide" ? "Review hidden" : pending.kind === "restore" ? "Review restored" : "Report dismissed",
    );
    setPending(null);
    await load();
  };

  const openReports = reports.filter((r) => r.status === "OPEN").length;
  const statusPill = review ? REVIEW_STATUS_PILL[review.status] : null;

  // Modals sit outside the shell: it renders its body twice (desktop and
  // phone), which would open two copies of each dialog.
  return (
    <>
      <AdminDashboardShell
        activeItem="Reviews"
        crumb="Review"
        actions={
          review && review.status !== "REMOVED" ? (
            <div className="flex flex-wrap items-center gap-2">
              {review.status === "VISIBLE" ? (
                <button
                  type="button"
                  className="btn-primary-v2"
                  style={{
                    background: "var(--danger)",
                    borderColor: "var(--danger)",
                    color: "white",
                  }}
                  onClick={() => open({ kind: "hide" })}
                >
                  Hide review
                </button>
              ) : (
                <button type="button" className="btn-primary-v2" onClick={() => open({ kind: "restore" })}>
                  Restore review
                </button>
              )}
            </div>
          ) : undefined
        }
      >
        <div>
          <Link href="/admin/reviews" className="text-[12.5px] no-underline" style={{ color: "var(--fg-3)" }}>
            &larr; Report queue
          </Link>
          <h1 className="text-[28px] font-medium mt-1" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>
            {review ? `Review of ${reviewSubject(review)}` : "Review"}
          </h1>
          {review ? (
            <p className="text-[13.5px] mt-1.5 flex flex-wrap items-center gap-2" style={{ color: "var(--fg-3)" }}>
              {statusPill ? <StatusPill tone={statusPill.tone} label={statusPill.label} /> : null}
              <span>
                Posted {formatAdminDate(review.created_at)} · {reports.length} report{reports.length === 1 ? "" : "s"}
                {openReports ? `, ${openReports} open` : ""}
              </span>
            </p>
          ) : null}
        </div>

        {loading ? (
          <AsyncSpinner size="page" />
        ) : error || !review ? (
          <div
            role="alert"
            className="rounded-(--r-3) p-4 text-[13px]"
            style={{
              background: "var(--danger-soft)",
              border: "1px solid oklch(0.92 0.05 25)",
              color: "var(--danger)",
            }}
          >
            <div className="font-medium">Couldn&apos;t load the review</div>
            <div className="mt-1" style={{ color: "var(--ink)" }}>
              {error}
            </div>
          </div>
        ) : (
          <>
            <Card>
              <div className="flex flex-wrap gap-2.5 items-baseline">
                <strong className="text-[14px]" style={{ color: "var(--ink)" }}>
                  {review.author?.name ?? "Unknown author"}
                </strong>
                <span
                  aria-label={`${review.rating} out of 5`}
                  style={{ color: "oklch(0.65 0.18 75)", letterSpacing: 1 }}
                >
                  {stars(review.rating)}
                </span>
                <span className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
                  {review.rating}/5 · {formatAdminDate(review.created_at)}
                </span>
              </div>
              <p className="text-[14px] leading-relaxed mt-2 whitespace-pre-wrap" style={{ color: "var(--fg-2)" }}>
                {review.comment ? `“${review.comment}”` : "No comment, rating only."}
              </p>
              {review.status === "REMOVED" ? (
                <p className="text-[12.5px] mt-3" style={{ color: "var(--fg-3)" }}>
                  The author removed this review, so it is already off the provider&apos;s page. Reports on it can still
                  be dismissed.
                </p>
              ) : null}
            </Card>

            <Card title="Who is involved">
              <dl className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-x-4 gap-y-2.5 text-[13px]">
                <dt style={{ color: "var(--fg-3)" }}>Author</dt>
                <dd>
                  {review.author ? (
                    <Link href={`/admin/users/${review.author.id}`} style={{ color: "var(--ink)" }}>
                      {review.author.name}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                  {review.author?.email ? (
                    <span className="font-mono text-[11.5px] ml-2" style={{ color: "var(--fg-3)" }}>
                      {review.author.email}
                    </span>
                  ) : null}
                </dd>
                <dt style={{ color: "var(--fg-3)" }}>Provider</dt>
                <dd>
                  {review.provider ? (
                    <Link href={`/admin/users/${review.provider.id}`} style={{ color: "var(--ink)" }}>
                      {review.provider.name}
                    </Link>
                  ) : (
                    "Unknown"
                  )}
                </dd>
                {review.listing ? (
                  <>
                    <dt style={{ color: "var(--fg-3)" }}>Listing</dt>
                    <dd>
                      <Link href={`/marketplace/${review.listing.id}`} style={{ color: "var(--ink)" }}>
                        {review.listing.headline ?? "Untitled listing"}
                      </Link>
                    </dd>
                  </>
                ) : null}
              </dl>
            </Card>

            <div
              className="rounded-(--r-3)"
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="px-5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
                <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                  Reports
                </h3>
              </div>
              {reports.length === 0 ? (
                <EmptySlate message="No reports on this review" />
              ) : (
                <DSTable minWidth={760}>
                  <DSTableHead>
                    <DSTableTh>Reporter</DSTableTh>
                    <DSTableTh>Reason</DSTableTh>
                    <DSTableTh>Filed</DSTableTh>
                    <DSTableTh>Outcome</DSTableTh>
                    <DSTableTh align="right">{""}</DSTableTh>
                  </DSTableHead>
                  <tbody>
                    {reports.map((r, i) => {
                      const pill = reportPill(r);
                      return (
                        <DSTableRow key={r.id} last={i === reports.length - 1}>
                          <DSTableTd className="text-[13px]">
                            {r.reporter ? (
                              <Link href={`/admin/users/${r.reporter.id}`} style={{ color: "var(--ink)" }}>
                                {r.reporter.name}
                              </Link>
                            ) : (
                              "Unknown"
                            )}
                          </DSTableTd>
                          <DSTableTd className="text-[13px]">
                            <span className="block">{r.reason}</span>
                            {r.details ? (
                              <span className="block text-[12.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                                {r.details}
                              </span>
                            ) : null}
                          </DSTableTd>
                          <DSTableTd className="whitespace-nowrap text-[12.5px]">
                            {formatAdminDate(r.created_at)}
                          </DSTableTd>
                          <DSTableTd className="text-[12.5px]">
                            <StatusPill tone={pill.tone} label={pill.label} />
                            {r.resolution ? (
                              <span className="block mt-1" style={{ color: "var(--fg-3)" }}>
                                {r.resolution.resolved_by?.name ?? "An admin"} ·{" "}
                                {formatAdminDateTime(r.resolution.resolved_at)}
                                {r.resolution.note ? (
                                  <span className="block" style={{ color: "var(--fg-2)" }}>
                                    “{r.resolution.note}”
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </DSTableTd>
                          <DSTableTd align="right">
                            {r.status === "OPEN" ? (
                              <button
                                type="button"
                                className="btn-ghost-v2 sm"
                                onClick={() => open({ kind: "dismiss", report: r })}
                              >
                                Dismiss
                              </button>
                            ) : null}
                          </DSTableTd>
                        </DSTableRow>
                      );
                    })}
                  </tbody>
                </DSTable>
              )}
            </div>
          </>
        )}
      </AdminDashboardShell>

      <ActionModal
        open={pending !== null}
        onClose={() => (saving ? undefined : setPending(null))}
        title={pending ? ACTION_COPY[pending.kind].title : ""}
        description={pending ? ACTION_COPY[pending.kind].description : undefined}
        footer={
          <>
            <button type="button" className="btn-ghost-v2" onClick={() => setPending(null)} disabled={saving}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary-v2 disabled:opacity-40"
              onClick={() => void confirm()}
              disabled={saving}
              style={
                pending?.kind === "hide"
                  ? {
                      background: "var(--danger)",
                      borderColor: "var(--danger)",
                      color: "white",
                    }
                  : undefined
              }
            >
              {saving ? "Saving..." : pending ? ACTION_COPY[pending.kind].confirm : ""}
            </button>
          </>
        }
      >
        <label
          htmlFor="moderation-note"
          className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3"
        >
          Note (optional)
        </label>
        <textarea
          id="moderation-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={1000}
          rows={3}
          className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
          placeholder="Recorded with the decision for other admins."
        />
      </ActionModal>
    </>
  );
}
