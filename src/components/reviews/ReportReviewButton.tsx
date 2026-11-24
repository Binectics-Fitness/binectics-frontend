"use client";

import { useId, useState } from "react";
import { reviewsService } from "@/lib/api/reviews";
import { toast } from "@/components/Toast";

/** The API's cap on a report's reason (CreateReviewReportDto.reason, MaxLength 255). */
export const REPORT_REASON_MAX = 255;

/** 44px tap targets; the v2 button classes are unlayered, so a utility can't raise them. */
const TAP = { minHeight: 44 } as const;

/**
 * "Report" under a review of the provider's own listing, as on mobile
 * (ReportReviewAction): a reason, sent to Binectics to look at. Reporting
 * does not hide the review. Once sent (or already sent before), it says so
 * and cannot be sent again.
 */
export function ReportReviewButton({ reviewId, reviewerName }: { reviewId: string; reviewerName: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const helpId = useId();

  if (sent) {
    return (
      <p className="text-[13px] mt-3" role="status" style={{ color: "var(--fg-3)" }}>
        {sent}
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-ghost-v2 mt-3"
        style={{ ...TAP, color: "var(--danger-ink)" }}
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        aria-label={`Report the review by ${reviewerName}`}
      >
        Report
      </button>
    );
  }

  const close = () => {
    setOpen(false);
    setReason("");
    setError(null);
  };

  const send = async () => {
    const text = reason.trim();
    if (!text || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await reviewsService.reportReview(reviewId, { reason: text });
      if (res.success) {
        setSent("Reported. Our team will look at it.");
        toast.success("Review reported");
      } else if (res.status === 409) {
        setSent("You already reported this review.");
      } else {
        setError(res.message || "Couldn’t send the report. Try again.");
      }
    } catch {
      setError("Couldn’t send the report. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="mt-3 flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && !busy) close();
      }}
    >
      <label htmlFor={inputId} className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
        Why are you reporting this review?
      </label>
      <textarea
        id={inputId}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        maxLength={REPORT_REASON_MAX}
        placeholder="What is wrong with this review?"
        aria-describedby={helpId}
        autoFocus
        className="rounded-(--r-2) px-3 py-2.5 text-[14px] resize-y"
        style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 72 }}
      />
      <span id={helpId} className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
        Binectics looks at reports. The review stays up until it decides.
      </span>
      {error && (
        <span role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
          {error}
        </span>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          className="btn-primary-v2"
          style={{ ...TAP, background: "var(--danger-ink)" }}
          disabled={busy || !reason.trim()}
        >
          {busy ? "Sending…" : "Send report"}
        </button>
        <button type="button" className="btn-ghost-v2" style={TAP} disabled={busy} onClick={close}>
          Cancel
        </button>
      </div>
    </form>
  );
}
