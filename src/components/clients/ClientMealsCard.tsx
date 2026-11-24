"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { DSCard, IconTile, StatusPill } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { MealRating, progressService, type MealFeedback } from "@/lib/api/progress";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import type { Tone } from "@/lib/ui/tones";
import { MAX_MEAL_REPLY, isOwnMealReply, mealReplyAuthorName, mealReplyError } from "@/lib/progress/mealReplies";

/** How many meals the client page shows (mobile ClientMealsSection, SHOWN). */
export const MEALS_SHOWN = 5;

/** Every string on the card, from mobile ClientMealsSection and CoachMealReplyScreen. */
export const MEALS_COPY = {
  title: "Meals logged",
  none: "No meals logged yet.",
  loadFailed: "Couldn't load their meals.",
  retry: "Try again",
  loading: "Loading meals",
  across: "Meals across your clients",
  reply: "Reply",
  yourReply: "Your reply",
  replyFrom: (name: string) => `Reply from ${name}`,
  placeholder: (first: string) => `A note for ${first} about this meal`,
  replyLabel: (first: string) => `Reply to ${first}`,
  helpNew: (first: string) => `${first} sees it with the meal and gets a notification.`,
  helpOwn: (first: string) => `${first} sees your reply with the meal.`,
  send: "Send reply",
  save: "Save reply",
  sending: "Sending…",
  cancel: "Cancel",
  edit: "Edit",
  remove: "Remove reply",
  removeConfirm: "Remove it",
  removeAsk: (first: string) => `Remove your reply? ${first} will no longer see it.`,
  keep: "Keep it",
  sent: (first: string) => `Reply sent to ${first}`,
  updated: "Reply updated",
  removed: "Reply removed",
  sendFailed: "Couldn't send your reply. Try again.",
  removeFailed: "Couldn't remove your reply. Try again.",
} as const;
const C = MEALS_COPY;

const MEAL_TYPE_LABEL: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

export const RATING_LABEL: Record<MealRating, string> = {
  [MealRating.GREAT]: "Great",
  [MealRating.GOOD]: "Good",
  [MealRating.OKAY]: "Okay",
  [MealRating.POOR]: "Poor",
};

/** How the client rated it, in the shared tones: poor stands out (mobile ratingTone). */
export function ratingTone(rating: MealRating): Tone {
  if (rating === MealRating.POOR) return "danger";
  if (rating === MealRating.OKAY) return "warn";
  return "success";
}

const ink = { color: "var(--ink)" } as const;
const muted = { color: "var(--fg-3)" } as const;

/**
 * A dietitian's client page: the meals the client logged lately, how they
 * rated each, and the dietitian's reply, written or edited in place. One reply
 * per meal; a reply another dietitian left is shown, not editable. Once the
 * link has ended the page passes `canReply={false}`: the former dietitian
 * reads, and the API would refuse a reply anyway.
 */
export function ClientMealsCard({
  clientProfileId,
  clientFirstName,
  canReply,
}: {
  clientProfileId: string;
  clientFirstName: string;
  canReply: boolean;
}) {
  const { user } = useAuth();
  const { fmtDate } = useOrgFormat();
  const [meals, setMeals] = useState<MealFeedback[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    progressService
      .getMealFeedbacks(clientProfileId, MEALS_SHOWN)
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) setMeals(res.data);
        else setFailed(true);
      })
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [clientProfileId, attempt]);

  const retry = useCallback(() => {
    setFailed(false);
    setMeals(null);
    setAttempt((n) => n + 1);
  }, []);

  const startEdit = (meal: MealFeedback) => {
    setEditing(meal._id);
    setConfirmRemove(null);
    setDraft(meal.reply?.text ?? "");
    setError(null);
  };

  const replace = (id: string, reply: MealFeedback["reply"]) =>
    setMeals((cur) => (cur ? cur.map((m) => (m._id === id ? { ...m, reply } : m)) : cur));

  const send = async (meal: MealFeedback) => {
    const invalid = mealReplyError(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    const had = !!meal.reply;
    setBusy(true);
    setError(null);
    try {
      const res = await progressService.replyToMeal(meal._id, draft.trim());
      if (!res.success || !res.data) {
        setError(res.message || C.sendFailed);
        return;
      }
      replace(meal._id, res.data.reply ?? null);
      setEditing(null);
      toast.success(had ? C.updated : C.sent(clientFirstName));
    } catch {
      setError(C.sendFailed);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (meal: MealFeedback) => {
    setBusy(true);
    setError(null);
    try {
      const res = await progressService.deleteMealReply(meal._id);
      if (!res.success) {
        setError(res.message || C.removeFailed);
        return;
      }
      replace(meal._id, null);
      setConfirmRemove(null);
      setEditing(null);
      toast.success(C.removed);
    } catch {
      setError(C.removeFailed);
    } finally {
      setBusy(false);
    }
  };

  const shown = (meals ?? []).slice(0, MEALS_SHOWN);

  return (
    <DSCard className="p-3.5">
      <section aria-labelledby="meals-heading">
        <div className="flex items-center gap-2.5 mb-2">
          <IconTile icon={Utensils} tone="meal" size="sm" />
          <h2 id="meals-heading" className="text-[15px] font-medium" style={ink}>{C.title}</h2>
        </div>

        {meals === null && !failed ? (
          <div role="status" aria-label={C.loading} className="flex flex-col gap-2 py-1" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-(--r-1)" style={{ background: "var(--bg-3)", height: 44 }} />
            ))}
          </div>
        ) : failed ? (
          <div role="alert" className="text-[12.5px] py-1" style={muted}>
            {C.loadFailed}{" "}
            <button type="button" className="underline underline-offset-2 min-h-11" style={ink} onClick={retry}>
              {C.retry}
            </button>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-[12.5px] py-1" style={muted}>{C.none}</div>
        ) : (
          <ul>
            {shown.map((m) => {
              const own = isOwnMealReply(m.reply, user?.id);
              const someoneElses = !!m.reply && !own;
              const isEditing = editing === m._id;
              const meta = [MEAL_TYPE_LABEL[m.meal_type] ?? m.meal_type, fmtDate(m.meal_date), m.calories != null ? `${m.calories} kcal` : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <li key={m._id} className="py-2.5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13.5px] font-medium min-w-0 break-words" style={ink}>{m.description}</div>
                    {m.rating && <StatusPill tone={ratingTone(m.rating)} label={RATING_LABEL[m.rating]} />}
                  </div>
                  <div className="text-[12px] mt-0.5" style={muted}>{meta}</div>
                  {m.feedback?.trim() && (
                    <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-2)" }}>{m.feedback.trim()}</p>
                  )}

                  {m.reply && !isEditing && (
                    <div className="mt-2 pl-3" style={{ borderLeft: "2px solid var(--dietitian)" }}>
                      <div className="text-[11.5px] font-medium" style={{ color: "var(--fg-2)" }}>
                        {own ? C.yourReply : C.replyFrom(mealReplyAuthorName(m.reply))}
                      </div>
                      <p className="text-[13px] whitespace-pre-wrap break-words" style={ink}>{m.reply.text}</p>
                    </div>
                  )}

                  {canReply && !someoneElses && !isEditing && (
                    confirmRemove === m._id ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2" role="group" aria-label={C.remove}>
                        <span className="text-[12.5px]" style={{ color: "var(--fg-2)" }}>{C.removeAsk(clientFirstName)}</span>
                        <button type="button" className="btn-ghost-v2 sm min-h-11" disabled={busy} onClick={() => void remove(m)}>
                          {C.removeConfirm}
                        </button>
                        <button type="button" className="btn-ghost-v2 sm min-h-11" disabled={busy} onClick={() => setConfirmRemove(null)}>
                          {C.keep}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn-ghost-v2 sm min-h-11"
                          aria-label={own ? `${C.edit}: ${m.description}` : `${C.reply}: ${m.description}`}
                          onClick={() => startEdit(m)}
                        >
                          {own ? C.edit : C.reply}
                        </button>
                        {own && (
                          <button type="button" className="btn-ghost-v2 sm min-h-11" onClick={() => { setConfirmRemove(m._id); setError(null); }}>
                            {C.remove}
                          </button>
                        )}
                      </div>
                    )
                  )}

                  {isEditing && (
                    <form
                      className="mt-2 flex flex-col gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        void send(m);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditing(null);
                      }}
                    >
                      <label htmlFor={`meal-reply-${m._id}`} className="sr-only">{C.replyLabel(clientFirstName)}</label>
                      <textarea
                        id={`meal-reply-${m._id}`}
                        value={draft}
                        maxLength={MAX_MEAL_REPLY}
                        rows={3}
                        autoFocus
                        onChange={(e) => setDraft(e.target.value)}
                        placeholder={C.placeholder(clientFirstName)}
                        aria-describedby={`meal-reply-help-${m._id}`}
                        className="w-full px-3 py-2 rounded-(--r-2) border border-border-2 bg-bg text-[13px]"
                        style={{ color: "var(--ink)", resize: "vertical", fontFamily: "inherit" }}
                      />
                      <span id={`meal-reply-help-${m._id}`} className="text-[12px]" style={muted}>
                        {m.reply ? C.helpOwn(clientFirstName) : C.helpNew(clientFirstName)}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="btn-primary-v2 sm min-h-11" disabled={busy || !draft.trim()}>
                          {busy ? C.sending : m.reply ? C.save : C.send}
                        </button>
                        <button type="button" className="btn-ghost-v2 sm min-h-11" disabled={busy} onClick={() => setEditing(null)}>
                          {C.cancel}
                        </button>
                      </div>
                    </form>
                  )}

                  {error && (isEditing || confirmRemove === m._id) && (
                    <p role="alert" className="text-[12.5px] mt-1.5" style={{ color: "var(--danger-ink)" }}>{error}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Link href="/dashboard/dietitian/feedback" className="inline-flex items-center min-h-11 text-[12.5px] underline" style={ink}>
          {C.across}
        </Link>
      </section>
    </DSCard>
  );
}

