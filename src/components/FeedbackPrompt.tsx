"use client";

import { useEffect, useState } from "react";
import { feedbackService } from "@/lib/api/feedback";

const SNOOZE_KEY = "feedback_prompt_snoozed_until";
const SNOOZE_HOURS = 24;

/**
 * In-app CSAT prompt. Mounts in the dashboard layout, polls the backend
 * once on mount to decide whether the current user is due for a prompt,
 * and lets users dismiss/snooze for 24h client-side without spamming the API.
 */
export default function FeedbackPrompt() {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const snoozedUntil = Number(localStorage.getItem(SNOOZE_KEY) || 0);
    if (snoozedUntil && Date.now() < snoozedUntil) return;

    let cancelled = false;
    feedbackService
      .getPromptStatus()
      .then((res) => {
        if (cancelled) return;
        if (res?.success && res.data?.shouldPrompt) {
          // small delay so it doesn't pop the moment the dashboard mounts
          setTimeout(() => !cancelled && setOpen(true), 4000);
        }
      })
      .catch(() => {
        // silent — user is unauthenticated or API offline
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(
      SNOOZE_KEY,
      String(Date.now() + SNOOZE_HOURS * 60 * 60 * 1000),
    );
    setOpen(false);
  };

  const submit = async () => {
    if (score === null) return;
    setSubmitting(true);
    try {
      await feedbackService.submit({
        score,
        comment: comment.trim() || undefined,
        prompt_context: "periodic",
      });
      setSubmitted(true);
      localStorage.removeItem(SNOOZE_KEY);
      setTimeout(() => setOpen(false), 1800);
    } catch {
      // keep modal open so user can retry
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:bottom-6 sm:right-6">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-5">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🙏</p>
            <p className="font-bold text-foreground">Thanks for your feedback!</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-foreground">
                How&apos;s your Binectics experience so far?
              </h3>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-foreground/40 hover:text-foreground -mt-1 -mr-1 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-between gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`flex-1 h-12 rounded-lg text-2xl transition-colors ${
                    score === n
                      ? "bg-primary-500 text-foreground"
                      : "bg-neutral-100 hover:bg-neutral-200"
                  }`}
                  aria-label={`Score ${n}`}
                >
                  {["😞", "🙁", "😐", "🙂", "😄"][n - 1]}
                </button>
              ))}
            </div>

            {score !== null && (
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Anything we should know? (optional)"
                rows={3}
                maxLength={1000}
                className="w-full text-sm border border-neutral-300 rounded-lg p-2 mb-3 focus:outline-none focus:border-primary-500"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 h-10 rounded-lg text-sm font-semibold text-foreground/70 hover:bg-neutral-100"
              >
                Maybe later
              </button>
              <button
                onClick={submit}
                disabled={score === null || submitting}
                className="flex-1 h-10 rounded-lg text-sm font-semibold bg-foreground text-white disabled:opacity-40"
              >
                {submitting ? "Sending…" : "Send"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
