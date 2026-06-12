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
      <div className="bg-bg rounded-(--r-3) shadow-(--shadow-2) border border-border p-5">
        {submitted ? (
          <div className="text-center py-4">
            <p className="text-2xl mb-2">🙏</p>
            <p className="font-bold text-fg">Thanks for your feedback!</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-bold text-fg">
                How&apos;s your Binectics experience so far?
              </h3>
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-fg/40 hover:text-fg -mt-1 -mr-1 p-1"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-between gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  className={`flex-1 h-12 rounded-(--r-2) text-2xl transition-colors ${
                    score === n
                      ? "bg-signal text-fg"
                      : "bg-bg-2 hover:bg-bg-3"
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
                className="w-full text-sm border border-border-2 rounded-(--r-2) p-2 mb-3 focus:outline-none focus:border-signal"
              />
            )}

            <div className="flex gap-2">
              <button
                onClick={dismiss}
                className="flex-1 h-10 rounded-(--r-2) text-sm font-semibold text-fg/70 hover:bg-bg-2"
              >
                Maybe later
              </button>
              <button
                onClick={submit}
                disabled={score === null || submitting}
                className="flex-1 h-10 rounded-(--r-2) text-sm font-semibold bg-fg text-bg disabled:opacity-40"
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
