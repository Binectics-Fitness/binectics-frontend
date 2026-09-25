"use client";

import { useEffect, useRef, useState } from "react";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
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
 */

const fieldStyle: React.CSSProperties = {
  background: "var(--bg-2)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
};

const MAX_DUE_DAYS = 60;

/** The provider's local calendar day, YYYY-MM-DD. */
function localDay(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/** "Mon 28 Sep" for a YYYY-MM-DD day, without shifting it by timezone. */
function formatDay(day: string): string {
  return new Date(`${day}T12:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function oneOffStatus(task: OneOffTask, today: string): { label: string; tone: "done" | "open" | "late" | "quiet" } {
  const isForm = task.type === "form";
  switch (task.status) {
    case "done":
      return {
        label: task.completed_late ? (isForm ? "Submitted late" : "Done late") : isForm ? "Submitted" : "Done",
        tone: "done",
      };
    case "skipped":
      return { label: "Skipped", tone: "quiet" };
    case "missed":
      return { label: "Missed", tone: "late" };
    default:
      if (task.due_date < today) return { label: "Overdue", tone: "late" };
      if (task.due_date === today) return { label: "Due today", tone: "open" };
      return { label: `Due ${formatDay(task.due_date)}`, tone: "open" };
  }
}

const TONES: Record<"done" | "open" | "late" | "quiet", { bg: string; color: string }> = {
  done: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  open: { bg: "var(--bg-3)", color: "var(--fg-2)" },
  late: { bg: "var(--danger-soft)", color: "var(--danger)" },
  quiet: { bg: "var(--bg-2)", color: "var(--fg-3)" },
};

export default function OneOffTasksCard({
  clientProfileId,
  accentInk,
}: {
  clientProfileId: string;
  /** Role accent for the send action (legible as text). */
  accentInk: string;
}) {
  const [tasks, setTasks] = useState<OneOffTask[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const today = localDay();

  useEffect(() => {
    let active = true;
    void (async () => {
      const res = await programsService.listOneOffTasks(clientProfileId);
      if (!active) return;
      if (res.success && res.data) setTasks(res.data);
      else setError(res.message ?? "Couldn't load what you've sent.");
    })();
    return () => {
      active = false;
    };
  }, [clientProfileId]);

  const withdraw = async (task: OneOffTask) => {
    if (confirmId !== task.id) {
      setConfirmId(task.id);
      return;
    }
    setConfirmId(null);
    const res = await programsService.withdrawOneOffTask(clientProfileId, task.id);
    if (res.success) {
      setTasks((t) => (t ?? []).filter((x) => x.id !== task.id));
      toast.success(`"${task.title}" withdrawn.`);
    } else {
      toast.error(res.message ?? "Couldn't withdraw it.");
    }
  };

  const open = (tasks ?? []).filter((t) => t.status === "pending").length;

  return (
    <div className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h3 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Forms and tasks</h3>
          <div className="text-[12px]" style={{ color: "var(--fg-3)" }}>
            {tasks === null && !error
              ? "Loading…"
              : `Sent on their own, outside a program${tasks && tasks.length > 0 ? ` · ${open} open` : ""}`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSending(true)}
          className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2.5 py-1.5 rounded-(--r-1)"
          style={{ border: "1px solid var(--border)", color: accentInk, background: "transparent" }}
        >
          + Send a form or task
        </button>
      </div>

      {tasks === null && !error ? (
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
          const s = oneOffStatus(t, today);
          const tone = TONES[s.tone];
          return (
            <div key={t.id} className="flex items-center gap-3 px-5.5 py-3.5 flex-wrap" style={{ borderBottom: i < arr.length - 1 ? "1px solid var(--border)" : "none" }}>
              <div className="min-w-0 flex-1">
                <div className="text-[13.5px] font-medium truncate" style={{ color: "var(--ink)" }}>{t.title}</div>
                <div className="font-mono text-[11.5px] mt-0.5" style={{ color: "var(--fg-3)" }}>
                  {t.type === "form" ? "Form" : "Task"} · due {formatDay(t.due_date)}
                  {t.detail ? ` · ${t.detail}` : ""}
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-[0.05em] px-1.75 py-0.5 rounded-full" style={{ background: tone.bg, color: tone.color }}>
                {s.label}
              </span>
              {t.status === "pending" && (
                <button
                  type="button"
                  onClick={() => void withdraw(t)}
                  onBlur={() => setConfirmId((c) => (c === t.id ? null : c))}
                  className="font-mono text-[10.5px] uppercase tracking-[0.04em] px-2 py-1 rounded-(--r-1)"
                  style={{ border: "1px solid var(--border)", color: confirmId === t.id ? "var(--danger)" : "var(--fg-3)", background: "transparent" }}
                >
                  {confirmId === t.id ? "Confirm withdraw" : "Withdraw"}
                </button>
              )}
            </div>
          );
        })
      )}

      {sending && (
        <SendTaskModal
          clientProfileId={clientProfileId}
          onClose={() => setSending(false)}
          onSent={(task) => setTasks((t) => [task, ...(t ?? [])])}
        />
      )}
    </div>
  );
}

function SendTaskModal({
  clientProfileId,
  onClose,
  onSent,
}: {
  clientProfileId: string;
  onClose: () => void;
  onSent: (task: OneOffTask) => void;
}) {
  const [type, setType] = useState<OneOffTaskType>("form");
  const [formId, setFormId] = useState("");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [due, setDue] = useState(localDay());
  const [forms, setForms] = useState<{ label: string; value: string }[]>([]);
  const [formsLoading, setFormsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const { requestClose, dirtyProps, confirmationModal } = useUnsavedChangesGuard(onClose);

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
    const res = await programsService.sendOneOffTask(clientProfileId, {
      type,
      form_id: type === "form" ? formId : undefined,
      title: title.trim() || undefined,
      detail: detail.trim() || undefined,
      due_date: due,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  const label = (text: string, required = false) => (
    <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
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
      <div className="w-full max-w-md rounded-(--r-3)" style={{ background: "var(--bg)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(3,20,30,0.2)" }} {...dirtyProps}>
        <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>Send a form or task</h2>
          <p className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>
            It shows on the client&apos;s Today from now until it&apos;s due.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1.5">
            {label("What")}
            <SearchableSelect
              value={type}
              onChange={(v) => setType(v as OneOffTaskType)}
              options={[
                { label: "A form to fill in", value: "form" },
                { label: "A task to do", value: "instruction" },
              ]}
            />
          </div>

          {type === "form" && (
            <div className="flex flex-col gap-1.5">
              {label("Form", true)}
              {!formsLoading && forms.length === 0 ? (
                <div className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
                  No published forms yet. Publish one under Forms, then send it here.
                </div>
              ) : (
                <SearchableSelect
                  value={formId}
                  onChange={setFormId}
                  options={forms}
                  placeholder={formsLoading ? "Loading forms…" : "Pick a form…"}
                  loading={formsLoading}
                />
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            {label(type === "form" ? "Title" : "Task", type !== "form")}
            <input
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
            {label("Note")}
            <textarea
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
            {label("Due", true)}
            <input
              type="date"
              required
              value={due}
              min={localDay()}
              max={localDay(MAX_DUE_DAYS)}
              onChange={(e) => setDue(e.target.value)}
              className="h-9 rounded-(--r-2) px-3 text-[13.5px]"
              style={{ ...fieldStyle, fontVariantNumeric: "tabular-nums" }}
            />
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
