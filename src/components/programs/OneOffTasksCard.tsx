"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { AsyncSpinner, EmptySlate, StatusPill } from "@/components/ds";
import { sentTaskTone } from "@/lib/ui/statusTones";
import type { Tone } from "@/lib/ui/tones";
import SearchableSelect from "@/components/SearchableSelect";
import { toast } from "@/components/Toast";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { formsService, type Form } from "@/lib/api/forms";
import {
  programsService,
  type OneOffTask,
  type OneOffTaskType,
} from "@/lib/api/programs";

/**
 * "Forms and tasks" on a client's page: send a form (or a one-line task) on
 * its own, outside any program, due by a date, and see where each one
 * stands. It reaches the client's Today under the provider's name and
 * follows the same done / late / missed rules as program tasks.
 *
 * Due dates are the CLIENT's calendar days. The API returns the client's
 * "today" with the list, and everything here (date bounds, "due today",
 * "past due") uses it, never the provider's browser clock.
 */

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

/** "Mon 28 Sep" for a YYYY-MM-DD day, without shifting it by timezone. */
function formatDay(day: string): string {
  return new Date(`${day}T12:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/**
 * The label beside a sent task, and its tone (lib/ui/statusTones
 * sentTaskTone, the same rule as the mobile coach view): done or submitted
 * is success; missed, or still open past its due day, needs a nudge (warn,
 * not danger: inside the catch-up window the client can still do it);
 * skipped and not-yet-due are neutral.
 */
export function oneOffStatus(task: OneOffTask, today: string): { label: string; tone: Tone } {
  const isForm = task.type === "form";
  const tone = sentTaskTone(task, today);
  switch (task.status) {
    case "done":
      return {
        label: task.completed_late ? (isForm ? "Submitted late" : "Done late") : isForm ? "Submitted" : "Done",
        tone,
      };
    case "skipped":
      return { label: "Skipped", tone };
    case "missed":
      return { label: "Missed", tone };
    default:
      if (task.due_date < today) return { label: "Past due, still open", tone };
      if (task.due_date === today) return { label: "Due today", tone };
      return { label: `Due ${formatDay(task.due_date)}`, tone };
  }
}

/** Newest due date first - the order the API lists them in. */
export function insertByDueDate(tasks: OneOffTask[], task: OneOffTask): OneOffTask[] {
  const at = tasks.findIndex((t) => t.due_date < task.due_date);
  return at === -1 ? [...tasks, task] : [...tasks.slice(0, at), task, ...tasks.slice(at)];
}

interface Calendar {
  today: string;
  max_due: string;
}

export default function OneOffTasksCard({
  clientProfileId,
}: {
  clientProfileId: string;
}) {
  const [tasks, setTasks] = useState<OneOffTask[] | null>(null);
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const apply = useCallback((res: Awaited<ReturnType<typeof programsService.listOneOffTasks>>) => {
    if (res.success && res.data) {
      setTasks(res.data.tasks);
      setCalendar({ today: res.data.today, max_due: res.data.max_due });
      setError(null);
    } else {
      setError(res.message ?? "Couldn't load what you've sent.");
    }
  }, []);
  const reload = async () => apply(await programsService.listOneOffTasks(clientProfileId));

  useEffect(() => {
    let active = true;
    void programsService.listOneOffTasks(clientProfileId).then((res) => {
      if (active) apply(res);
    });
    return () => {
      active = false;
    };
  }, [clientProfileId, apply]);

  const withdraw = async (task: OneOffTask) => {
    if (confirmId !== task.id) {
      setConfirmId(task.id);
      return;
    }
    setConfirmId(null);
    setWithdrawingId(task.id);
    const res = await programsService.withdrawOneOffTask(clientProfileId, task.id);
    setWithdrawingId(null);
    if (res.success) {
      setTasks((t) => (t ?? []).filter((x) => x.id !== task.id));
      toast.success(`"${task.title}" withdrawn.`);
    } else {
      toast.error(res.message ?? "Couldn't withdraw it.");
      // Usually the client acted on it in the meantime: show where it
      // stands now rather than a Withdraw button that can't work.
      void reload();
    }
  };

  const open = (tasks ?? []).filter((t) => t.status === "pending").length;
  const loading = tasks === null && !error;

  return (
    <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Forms and tasks</h3>
          <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            {loading
              ? "Loading…"
              : `Sent on their own, outside a program${tasks && tasks.length > 0 ? ` · ${open} open` : ""}`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSending(true)}
          disabled={!calendar}
          className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.5 rounded-(--r-1) disabled:opacity-50"
          // Actions are neutral; role accents identify providers, not buttons.
          style={{ border: "1px solid var(--border)", color: "var(--ink)", background: "transparent" }}
        >
          + Send a form or task
        </button>
      </div>

      {loading ? (
        <div className="px-5.5 py-5"><AsyncSpinner label="Loading forms and tasks" /></div>
      ) : error ? (
        <div className="px-5.5 py-4 text-[13px]" style={{ color: "var(--danger)" }}>{error}</div>
      ) : tasks!.length === 0 ? (
        <div className="px-5.5 py-4">
          <EmptySlate
            message="Nothing sent yet."
            hint="Send a check-in form or a one-off task. It shows on the client's Today until it's due."
            mt="mt-0"
          />
        </div>
      ) : (
        tasks!.map((t, i, arr) => {
          const s = oneOffStatus(t, calendar!.today);
          const confirming = confirmId === t.id;
          return (
            <div key={t.id} className="flex items-center gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{t.title}</div>
                <div className="font-mono text-[11.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                  {t.type === "form" ? "Form" : "Task"} · due {formatDay(t.due_date)}
                  {t.detail ? ` · ${t.detail}` : ""}
                </div>
              </div>
              <StatusPill tone={s.tone} label={s.label} />
              {t.status === "pending" && (
                <button
                  type="button"
                  onClick={() => void withdraw(t)}
                  onBlur={() => setConfirmId((c) => (c === t.id ? null : c))}
                  disabled={withdrawingId === t.id}
                  aria-label={confirming ? `Confirm withdrawing ${t.title}` : `Withdraw ${t.title}`}
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1) disabled:opacity-50"
                  style={{ border: "1px solid var(--border)", color: confirming ? "var(--danger)" : "var(--fg-3)", background: "transparent" }}
                >
                  {withdrawingId === t.id ? "Withdrawing…" : confirming ? "Confirm withdraw" : "Withdraw"}
                </button>
              )}
            </div>
          );
        })
      )}
      {/* Announces the switch to "Confirm withdraw" to screen readers. */}
      <span className="sr-only" aria-live="polite">
        {confirmId ? "Press again to confirm withdrawing this task." : ""}
      </span>

      {sending && calendar && (
        <SendTaskModal
          clientProfileId={clientProfileId}
          calendar={calendar}
          onClose={() => setSending(false)}
          onSent={(task) => setTasks((t) => insertByDueDate(t ?? [], task))}
        />
      )}
    </div>
  );
}

function SendTaskModal({
  clientProfileId,
  calendar,
  onClose,
  onSent,
}: {
  clientProfileId: string;
  calendar: Calendar;
  onClose: () => void;
  onSent: (task: OneOffTask) => void;
}) {
  const [type, setType] = useState<OneOffTaskType>("form");
  const [formId, setFormId] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [due, setDue] = useState(calendar.today);
  const [forms, setForms] = useState<{ label: string; value: string }[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { requestClose, dirtyProps, markDirty, confirmationModal } = useUnsavedChangesGuard(onClose);
  const ids = useId();
  const id = (name: string) => `${ids}-${name}`;

  // Published forms only: the client opens a form through its public read,
  // which serves nothing else.
  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await formsService.getMyForms();
      if (!active) return;
      if (res.success && Array.isArray(res.data)) {
        setForms(
          res.data
            .filter((f: Form) => f.is_published && f.is_active !== false)
            .map((f) => ({ label: f.title, value: f._id })),
        );
      } else {
        setFormsError(res.message ?? "Couldn't load your forms.");
      }
      setFormsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const ready = type === "form" ? !!formId : !!title.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    setSaving(true);
    // No timezone: the API anchors due dates to the client's own programs,
    // and the provider's browser zone would be the wrong guess.
    const res = await programsService.sendOneOffTask(clientProfileId, {
      type,
      form_id: type === "form" ? formId : undefined,
      title: title.trim() || undefined,
      detail: detail.trim() || undefined,
      due_date: due,
    });
    setSaving(false);
    if (res.success && res.data) {
      toast.success(type === "form" ? "Form sent." : "Task sent.");
      onSent(res.data);
      onClose();
    } else {
      toast.error(res.message ?? "Couldn't send it.");
    }
  };

  const label = (text: string, forId: string, required = false) => (
    <label htmlFor={forId} className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
      {text} {required && <span style={{ color: "var(--danger)" }}>*</span>}
    </label>
  );

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(3,20,30,0.55)" }}
      onClick={(e) => e.target === overlayRef.current && requestClose()}
    >
      {confirmationModal}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={id("title")}
        className="w-full max-w-md rounded-(--r-3)"
        style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }}
        {...dirtyProps}
      >
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 id={id("title")} className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
            Send a form or task
          </h2>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            It shows on the client&apos;s Today from now until it&apos;s due.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            {label("What", id("type"))}
            <SearchableSelect
              id={id("type")}
              value={type}
              onChange={(v) => {
                markDirty();
                setType(v as OneOffTaskType);
              }}
              options={[
                { label: "A form to fill in", value: "form" },
                { label: "A task to do", value: "instruction" },
              ]}
            />
          </div>

          {type === "form" && (
            <div className="flex flex-col gap-1.5">
              {label("Form", id("form"), true)}
              {formsError ? (
                <div className="text-[12.5px]" style={{ color: "var(--danger)" }}>{formsError}</div>
              ) : !formsLoading && forms.length === 0 ? (
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  No published forms yet. Publish one under Forms, then send it here.
                </div>
              ) : (
                <SearchableSelect
                  id={id("form")}
                  value={formId}
                  onChange={(v) => {
                    markDirty();
                    setFormId(v);
                  }}
                  options={forms}
                  placeholder={formsLoading ? "Loading forms…" : "Pick a form…"}
                  loading={formsLoading}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {label(type === "form" ? "Title" : "Task", id("text"), type !== "form")}
            <input
              id={id("text")}
              required={type !== "form"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "form" ? "Defaults to the form's title" : "e.g. Book your fasting blood test"}
              maxLength={200}
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={fieldStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {label("Note", id("note"))}
            <textarea
              id={id("note")}
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Optional, e.g. Before our call on Friday."
              rows={2}
              maxLength={2000}
              className="rounded-(--r-2) px-3 py-2.5 text-[13.5px] resize-none"
              style={fieldStyle}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            {label("Due", id("due"), true)}
            <input
              id={id("due")}
              type="date"
              required
              value={due}
              min={calendar.today}
              max={calendar.max_due}
              onChange={(e) => setDue(e.target.value)}
              aria-describedby={id("due-help")}
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums" }}
            />
            <span id={id("due-help")} className="text-[12px]" style={{ color: "var(--fg-3)" }}>
              In the client&apos;s calendar. Today for them is {formatDay(calendar.today)}.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-1" style={{ borderTop: "1px solid var(--border)" }}>
            <button type="button" onClick={onClose} className="h-9 px-4 rounded-(--r-2) text-[13px] font-medium" style={{ background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--ink)" }}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !ready}
              className="h-9 px-5 rounded-(--r-2) text-[13px] font-medium disabled:opacity-50"
              style={{ background: "var(--ink)", color: "var(--bg)", border: "none" }}
            >
              {saving ? "Sending..." : type === "form" ? "Send form" : "Send task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
