"use client";

import { useState } from "react";
import { feedbackService, type FeedbackPromptContext } from "@/lib/api/feedback";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: FeedbackPromptContext;
  title?: string;
  subtitle?: string;
}

export function FeedbackModal({
  isOpen,
  onClose,
  context,
  title = "How are we doing?",
  subtitle = "Your feedback helps us improve Binectics.",
}: FeedbackModalProps) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!score) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await feedbackService.submit({
        score,
        comment: comment.trim() || undefined,
        prompt_context: context,
      });

      if (res.success) {
        setSubmitted(true);
      } else {
        setError("Failed to submit feedback. Please try again.");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setScore(null);
    setComment("");
    setSubmitted(false);
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-(--r-3) p-6 relative"
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.16)",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 text-xl"
          style={{ color: "var(--fg-4)", cursor: "pointer", background: "none", border: "none" }}
        >
          &times;
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div
              className="text-[40px] mb-3 font-medium"
              style={{ color: "var(--signal)" }}
            >
              ✓
            </div>
            <h2 className="text-[22px] font-medium" style={{ color: "var(--ink)" }}>
              Thank you
            </h2>
            <p className="text-sm mt-2" style={{ color: "var(--fg-3)" }}>
              Your feedback helps us improve.
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="mt-5 rounded-(--r-2) px-4 py-2 text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--bg)", cursor: "pointer" }}
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-[22px] font-medium" style={{ color: "var(--ink)" }}>
              {title}
            </h2>
            <p className="text-sm mt-1.5" style={{ color: "var(--fg-3)" }}>
              {subtitle}
            </p>

            <div className="mt-5">
              <label
                className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                style={{ color: "var(--fg-3)" }}
              >
                Rating *
              </label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScore(value)}
                    className="w-11 h-11 rounded-(--r-2) text-base font-medium"
                    style={{
                      border: `2px solid ${score === value ? "var(--ink)" : "var(--border)"}`,
                      background: score === value ? "var(--ink)" : "var(--bg-2)",
                      color: score === value ? "var(--bg)" : "var(--fg-2)",
                      cursor: "pointer",
                    }}
                  >
                    {value}
                  </button>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs" style={{ color: "var(--fg-4)" }}>Not satisfied</span>
                <span className="text-xs" style={{ color: "var(--fg-4)" }}>Very satisfied</span>
              </div>
            </div>

            <div className="mt-4">
              <label
                className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                style={{ color: "var(--fg-3)" }}
              >
                Comments (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="What could we improve?"
                className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
              />
            </div>

            {error && (
              <div
                className="mt-3 rounded-(--r-2) p-3 text-sm"
                style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}
              >
                {error}
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <button
                type="submit"
                disabled={!score || submitting}
                className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                style={{
                  background: !score || submitting ? "var(--bg-3)" : "var(--ink)",
                  color: !score || submitting ? "var(--fg-4)" : "var(--bg)",
                  cursor: !score || submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting ? "Submitting..." : "Submit feedback"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-(--r-2) border px-4 py-2 text-sm"
                style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
              >
                Skip
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default FeedbackModal;
