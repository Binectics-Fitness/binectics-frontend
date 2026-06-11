"use client";

import { useState } from "react";
import {
  reviewsService,
  ReviewStatus,
  type Review,
} from "@/lib/api/reviews";

interface ReviewCardProps {
  review: Review;
  onUpdate?: (updated: Review) => void;
  showModeration?: boolean;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{
            color: i < rating ? "var(--trainer)" : "var(--fg-4)",
            fontSize: "14px",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function ReviewCard({
  review,
  onUpdate,
  showModeration = false,
}: ReviewCardProps) {
  const [replyText, setReplyText] = useState("");
  const [providerResponseText, setProviderResponseText] = useState(
    review.providerResponse?.message ?? "",
  );
  const [reportReason, setReportReason] = useState("");
  const [view, setView] = useState<"default" | "reply" | "provider_response" | "report">(
    "default",
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleProviderResponse(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!providerResponseText.trim()) return;

    setSubmitting(true);
    const res = await reviewsService.createProviderResponse(review.id, {
      message: providerResponseText.trim(),
    });

    if (res.success && res.data) {
      onUpdate?.(res.data);
      setView("default");
      showMessage("Response posted.");
    } else {
      showMessage("Failed to post response.", "error");
    }
    setSubmitting(false);
  }

  async function handleAddReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!replyText.trim()) return;

    setSubmitting(true);
    const res = await reviewsService.addReply(review.id, {
      message: replyText.trim(),
    });

    if (res.success && res.data) {
      onUpdate?.(res.data);
      setReplyText("");
      setView("default");
      showMessage("Reply posted.");
    } else {
      showMessage("Failed to post reply.", "error");
    }
    setSubmitting(false);
  }

  async function handleReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!reportReason.trim()) return;

    setSubmitting(true);
    const res = await reviewsService.reportReview(review.id, {
      reason: reportReason.trim(),
    });

    if (res.success) {
      setReportReason("");
      setView("default");
      showMessage("Review reported. Our team will review it.");
    } else {
      showMessage("Failed to submit report.", "error");
    }
    setSubmitting(false);
  }

  const isHidden = review.status !== ReviewStatus.VISIBLE;

  return (
    <div
      className="rounded-(--r-3) p-4 flex flex-col gap-3"
      style={{
        border: `1px solid ${isHidden ? "var(--border-2)" : "var(--border)"}`,
        background: isHidden ? "var(--bg-2)" : "var(--bg)",
        opacity: isHidden ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-medium"
            style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
          >
            {review.reviewerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-medium text-sm" style={{ color: "var(--ink)" }}>
              {review.reviewerName}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <StarRating rating={review.rating} />
              <span className="text-xs" style={{ color: "var(--fg-3)" }}>
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showModeration && (
            <span
              className="font-mono text-xs uppercase tracking-wider px-2 py-1 rounded-(--r-2)"
              style={{
                background:
                  review.status === ReviewStatus.VISIBLE
                    ? "var(--signal-soft)"
                    : "var(--bg-2)",
                color:
                  review.status === ReviewStatus.VISIBLE
                    ? "var(--signal)"
                    : "var(--fg-3)",
              }}
            >
              {review.status.toLowerCase()}
            </span>
          )}
        </div>
      </div>

      {review.comment && (
        <p className="text-sm" style={{ color: "var(--fg-2)" }}>
          {review.comment}
        </p>
      )}

      {review.providerResponse && (
        <div
          className="rounded-(--r-2) p-3 mt-1"
          style={{ border: "1px solid var(--border-2)", background: "var(--bg-3)" }}
        >
          <div
            className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-1.5"
            style={{ color: "var(--fg-3)" }}
          >
            Provider response
          </div>
          <p className="text-sm" style={{ color: "var(--fg-2)" }}>
            {review.providerResponse.message}
          </p>
          <div className="text-xs mt-1" style={{ color: "var(--fg-4)" }}>
            {formatDate(review.providerResponse.createdAt)}
          </div>
        </div>
      )}

      {review.replies && review.replies.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          {review.replies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-(--r-2) p-3"
              style={{ border: "1px solid var(--border-2)", background: "var(--bg-3)" }}
            >
              <p className="text-sm" style={{ color: "var(--fg-2)" }}>
                {reply.message}
              </p>
              <div className="text-xs mt-1" style={{ color: "var(--fg-4)" }}>
                {formatDate(reply.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}

      {message && (
        <div
          className="rounded-(--r-2) p-2 text-xs"
          style={{
            border: `1px solid ${messageType === "success" ? "var(--signal)" : "var(--danger)"}`,
            background:
              messageType === "success" ? "var(--signal-soft)" : "var(--danger-soft)",
            color: messageType === "success" ? "var(--signal)" : "var(--danger)",
          }}
        >
          {message}
        </div>
      )}

      {view === "default" && (
        <div className="flex gap-2 mt-1 flex-wrap">
          {!review.providerResponse && (
            <button
              type="button"
              onClick={() => setView("provider_response")}
              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
            >
              Respond
            </button>
          )}
          <button
            type="button"
            onClick={() => setView("reply")}
            className="rounded-(--r-2) border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
          >
            Reply
          </button>
          <button
            type="button"
            onClick={() => setView("report")}
            className="rounded-(--r-2) border px-3 py-1.5 text-xs"
            style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "transparent", cursor: "pointer" }}
          >
            Report
          </button>
        </div>
      )}

      {view === "provider_response" && (
        <form className="flex flex-col gap-2" onSubmit={handleProviderResponse}>
          <label
            className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Your response
          </label>
          <textarea
            value={providerResponseText}
            onChange={(e) => setProviderResponseText(e.target.value)}
            rows={3}
            placeholder="Thank you for your feedback..."
            className="w-full rounded-(--r-2) border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!providerResponseText.trim() || submitting}
              className="rounded-(--r-2) px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--ink)", color: "var(--bg)", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Posting..." : "Post response"}
            </button>
            <button
              type="button"
              onClick={() => setView("default")}
              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {view === "reply" && (
        <form className="flex flex-col gap-2" onSubmit={handleAddReply}>
          <label
            className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Your reply
          </label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={2}
            placeholder="Add a reply..."
            className="w-full rounded-(--r-2) border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!replyText.trim() || submitting}
              className="rounded-(--r-2) px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--ink)", color: "var(--bg)", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Posting..." : "Post reply"}
            </button>
            <button
              type="button"
              onClick={() => setView("default")}
              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {view === "report" && (
        <form className="flex flex-col gap-2" onSubmit={handleReport}>
          <label
            className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            Reason for report
          </label>
          <textarea
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={2}
            placeholder="Describe the issue with this review..."
            className="w-full rounded-(--r-2) border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!reportReason.trim() || submitting}
              className="rounded-(--r-2) px-3 py-1.5 text-xs font-medium"
              style={{ background: "var(--danger)", color: "white", cursor: "pointer", opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? "Reporting..." : "Submit report"}
            </button>
            <button
              type="button"
              onClick={() => setView("default")}
              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
              style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ReviewCard;
