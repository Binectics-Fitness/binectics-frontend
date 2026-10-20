"use client";

import { useEffect, useMemo, useState } from "react";
import { DietitianDashboardShell } from "@/components/ds/DietitianDashboardShell";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  MealRating,
  progressService,
  type MealFeedback,
} from "@/lib/api/progress";
import { useOrgFormat } from "@/lib/format/useOrgFormat";
import {
  MAX_MEAL_REPLY,
  isOwnMealReply,
  mealReplyAuthorName,
  mealReplyError,
  mergeMealFeed,
} from "@/lib/progress/mealReplies";

type FeedbackRow = MealFeedback & {
  clientLabel: string;
};

const RATING_LABEL: Record<MealRating, string> = {
  [MealRating.GREAT]: "Great",
  [MealRating.GOOD]: "Good",
  [MealRating.OKAY]: "Okay",
  [MealRating.POOR]: "Poor",
};

function pillStyle(status: string) {
  if (status === "ok") return { background: "var(--signal-soft)", color: "var(--signal-ink)" };
  if (status === "warn") return { background: "var(--trainer-soft)", color: "var(--warn)" };
  return { background: "var(--danger-soft)", color: "var(--danger)" };
}

/**
 * Meals the dietitian's clients logged (the first 12 clients' latest 8
 * meals each, newest 30 shown), with the member's rating and note, and the
 * dietitian's reply. One reply per meal; the member is notified of it. A
 * reply another dietitian wrote is shown, not editable.
 */
export default function DietitianFeedbackPage() {
  const { fmtDate, fmtDateTime } = useOrgFormat();
  const { user } = useAuth();
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);

      const clientsRes = await progressService.getMyClientProfiles();
      if (!clientsRes.success || !clientsRes.data || !mounted) {
        setRows([]);
        setLoading(false);
        return;
      }

      const mealsByClient = await Promise.all(
        clientsRes.data.slice(0, 12).map(async (client) => {
          const res = await progressService.getMealFeedbacks(client._id, 8);
          if (!res.success || !res.data) return [];

          const label =
            typeof client.client_id === "object"
              ? `${client.client_id.first_name} ${client.client_id.last_name}`
              : `Client ${client.client_id.slice(-6).toUpperCase()}`;

          return res.data.map((entry) => ({
            ...entry,
            clientLabel: label,
          }));
        }),
      );

      if (!mounted) return;

      setRows(mergeMealFeed(mealsByClient, 30));
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const awaitingReply = useMemo(() => rows.filter((r) => !r.reply).length, [rows]);

  const renderStatus = (row: FeedbackRow) => {
    if (row.reply) return { status: "ok", text: "replied" };
    if (row.rating === MealRating.POOR) return { status: "danger", text: "needs a reply" };
    return { status: "warn", text: "awaiting reply" };
  };

  const startEdit = (row: FeedbackRow) => {
    setEditing(row._id);
    setDraft(row.reply?.text ?? "");
  };

  const save = async (row: FeedbackRow) => {
    const error = mealReplyError(draft);
    if (error) {
      toast.error(error);
      return;
    }
    setSaving(true);
    try {
      const res = await progressService.replyToMeal(row._id, draft.trim());
      if (!res.success || !res.data) {
        toast.error(res.message || "We couldn't send your reply.");
        return;
      }
      const updated = res.data;
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, reply: updated.reply ?? null } : r)));
      setEditing(null);
      toast.success(row.reply ? "Reply updated" : "Reply sent");
    } catch {
      toast.error("We couldn't send your reply. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: FeedbackRow) => {
    setSaving(true);
    try {
      const res = await progressService.deleteMealReply(row._id);
      if (!res.success) {
        toast.error(res.message || "We couldn't remove your reply.");
        return;
      }
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, reply: null } : r)));
      setEditing(null);
      toast.success("Reply removed");
    } catch {
      toast.error("We couldn't remove your reply. Check your connection.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DietitianDashboardShell activeItem="Meal feedback" crumb="Meal feedback">
      <PageHeader
        className="mb-0!"
        title={{ before: "Meal ", emphasis: "feedback", after: ` · ${loading ? "loading..." : `${awaitingReply} awaiting reply`}` }}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {rows.map((m) => {
          const state = renderStatus(m);
          const own = isOwnMealReply(m.reply, user?.id);
          const isEditing = editing === m._id;
          return (
          <DSCard key={m._id}>
            {/* Image placeholder */}
            <div className="aspect-[4/3]" style={{ background: "linear-gradient(135deg, var(--bg-2), var(--bg-3))" }} />
            <div className="p-5.5 pt-3.5">
              <div className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>{m.clientLabel}</div>
              <Eyebrow className="mt-0.5 mb-2">
                {m.meal_type.toLowerCase()} · {fmtDate(m.meal_date)}
                {m.rating ? ` · ${RATING_LABEL[m.rating]}` : ""}
              </Eyebrow>
              <div className="text-[13px] mb-2" style={{ color: "var(--fg-2)" }}>{m.description}</div>
              {m.feedback?.trim() && (
                <div className="text-[12.5px] mb-3" style={{ color: "var(--fg-3)" }}>&ldquo;{m.feedback.trim()}&rdquo;</div>
              )}
              <div className="flex justify-between items-center">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={pillStyle(state.status)}>{state.text}</span>
                <span className="font-mono text-[10.5px]" style={{ color: "var(--fg-3)" }}>{fmtDateTime(m.created_at)}</span>
              </div>

              {m.reply && !isEditing && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Eyebrow className="mb-1">{own ? "Your reply" : `Reply from ${mealReplyAuthorName(m.reply)}`}</Eyebrow>
                  <p className="text-[13px] whitespace-pre-wrap break-words" style={{ color: "var(--ink)" }}>{m.reply.text}</p>
                  {own && (
                    <div className="flex gap-2 mt-2">
                      <button type="button" className="btn-ghost-v2 sm" onClick={() => startEdit(m)} disabled={saving}>Edit</button>
                      <button type="button" className="btn-ghost-v2 sm" onClick={() => void remove(m)} disabled={saving}>Remove</button>
                    </div>
                  )}
                </div>
              )}

              {!m.reply && !isEditing && (
                <div className="mt-3">
                  <button type="button" className="btn-ghost-v2 sm" onClick={() => startEdit(m)}>Reply</button>
                </div>
              )}

              {isEditing && (
                <form
                  className="mt-3 pt-3 border-t border-border flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void save(m);
                  }}
                >
                  <label htmlFor={`reply-${m._id}`} className="sr-only">Reply to {m.clientLabel}</label>
                  <textarea
                    id={`reply-${m._id}`}
                    value={draft}
                    maxLength={MAX_MEAL_REPLY}
                    rows={3}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={`A note for ${m.clientLabel.split(" ")[0] || "your client"} about this meal`}
                    className="w-full px-3 py-2 rounded-(--r-2) border border-border-2 bg-bg text-[13px]"
                    style={{ color: "var(--ink)", resize: "vertical" }}
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary-v2 sm" disabled={saving}>{saving ? "Sending…" : m.reply ? "Save" : "Send reply"}</button>
                    <button type="button" className="btn-ghost-v2 sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </DSCard>
          );
        })}
        {loading && rows.length === 0 && (
          <DSCard className="px-4.5 py-6">
            <AsyncSpinner label="Loading meal feedback" />
          </DSCard>
        )}
        {!loading && rows.length === 0 && (
          <DSCard className="px-4.5 py-6">
            <EmptySlate message="No meal feedback entries yet." mt="mt-0" />
          </DSCard>
        )}
      </div>
    </DietitianDashboardShell>
  );
}
