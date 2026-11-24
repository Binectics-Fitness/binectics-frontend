"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { AsyncSpinner, DSCard, PageHeader } from "@/components/ds";
import {
  HEALTH_FORM_ALREADY_SENT,
  myHealthFormsService,
  type HealthFormQuestion,
  type HealthFormSubmitResult,
  type MyHealthFormDetail,
} from "@/lib/api/healthForms";
import { HEALTH_FORM_COPY as C } from "@/lib/constants/healthFormCopy";
import { answeredCount, buildHealthFormAnswers, isChoice, type HealthFormDraft } from "./healthFormAnswers";

/** Buttons and answer rows are at least 44px tall. */
const TARGET = 44;

export const healthFormKey = (id: string) => ["myHealthForm", id] as const;

/** What the sent state shows: from the submit reply, or from a form already sent. */
type Sent = Pick<HealthFormSubmitResult, "advice">;

/**
 * The gym's PAR-Q health form (board parq M2, M3), then a plain
 * confirmation (M4), with the template's own advice to speak with a doctor
 * when any answer is yes (M5). The questions, the options and the advice
 * all come from the API; the only words here are the frame around them,
 * the same as mobile #273. Nothing is blocked by not filling it in.
 *
 * Unlike the phone, answers are not kept as a draft between visits: on a
 * shared computer a health answer should not outlive the page.
 */
export function HealthFormClient({ id }: { id: string }) {
  const qc = useQueryClient();
  const { data: form, isLoading, isError, refetch } = useQuery({
    queryKey: healthFormKey(id),
    queryFn: async () => {
      const res = await myHealthFormsService.get(id);
      if (!res.success || !res.data) throw new Error(res.message || C.loadFailed);
      return res.data;
    },
    retry: false,
    // Answers in progress live in this page's state; a refetch on focus
    // must not swap the form out from under them.
    refetchOnWindowFocus: false,
  });
  const [sent, setSent] = useState<Sent | null>(null);

  if (isLoading) return <AsyncSpinner size="page" />;

  if (isError || !form) {
    return (
      <>
        <PageHeader title={C.formTitle} />
        <DSCard className="p-6 flex flex-col items-start gap-3">
          <p role="alert" className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
            {C.loadFailed}
          </p>
          <button
            type="button"
            className="btn-ghost-v2"
            style={{ height: TARGET }}
            onClick={() => void refetch()}
          >
            {C.tryAgain}
          </button>
        </DSCard>
      </>
    );
  }

  const gym = form.organization_name || C.yourGym;
  const done: Sent | null = sent ?? (form.status === "done" ? { advice: form.advice } : null);

  if (done) return <HealthFormSent gym={gym} advice={done.advice} />;

  return (
    <HealthFormFill
      form={form}
      gym={gym}
      onSent={(result) => {
        setSent(result);
        void qc.invalidateQueries({ queryKey: ["myHealthForms"] });
      }}
      onAlreadySent={() => {
        void qc.invalidateQueries({ queryKey: ["myHealthForms"] });
        void refetch();
      }}
    />
  );
}

function HealthFormSent({ gym, advice }: { gym: string; advice: string | null }) {
  return (
    <div className="mx-auto w-full max-w-[640px]" data-testid="health-form-done">
      <PageHeader title={C.formTitle} />
      <DSCard className="p-6 flex flex-col items-center gap-2 text-center">
        <span
          aria-hidden="true"
          className="inline-flex items-center justify-center rounded-full"
          style={{ width: 56, height: 56, background: "var(--signal-soft)", color: "var(--signal-ink)" }}
        >
          <Check size={26} strokeWidth={2} />
        </span>
        <h2 className="mt-1 text-[18px] font-medium" style={{ color: "var(--ink)", letterSpacing: "-0.012em" }}>
          {C.doneTitle(gym)}
        </h2>
        <p className="text-[14px]" style={{ color: "var(--fg-2)" }}>
          {C.doneBody}
        </p>
      </DSCard>
      {advice ? (
        // The template's own words: safety text, kept in full.
        <div
          data-testid="health-form-advice"
          className="mt-4 rounded-(--r-3) p-4 text-[14px] leading-relaxed"
          style={{ background: "var(--warn-soft)", color: "var(--warn-ink)" }}
        >
          {advice}
        </div>
      ) : null}
      <div className="mt-5 flex justify-end">
        <Link href="/dashboard/member" className="btn-primary-v2" style={{ height: TARGET }}>
          {C.doneButton}
        </Link>
      </div>
    </div>
  );
}

function HealthFormFill({
  form,
  gym,
  onSent,
  onAlreadySent,
}: {
  form: MyHealthFormDetail;
  gym: string;
  onSent: (result: HealthFormSubmitResult) => void;
  onAlreadySent: () => void;
}) {
  const questions = form.questions;
  const [draft, setDraft] = useState<HealthFormDraft>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const setAnswer = (index: number, value: string) => {
    setDraft((d) => ({ ...d, [index]: value }));
    if (errors[index]) {
      setErrors((e) => {
        const rest = { ...e };
        delete rest[index];
        return rest;
      });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    const { answers, errors: found } = buildHealthFormAnswers(questions, draft);
    const wrong = Object.keys(found).map(Number);
    if (wrong.length > 0) {
      setErrors(found);
      setSummary(C.needsAttention(wrong.length));
      // Move focus to the first question that needs an answer.
      const first = Math.min(...wrong);
      formRef.current?.querySelector<HTMLElement>(`[data-question="${first}"] input, [data-question="${first}"] textarea`)?.focus();
      return;
    }
    setSummary(null);
    setSending(true);
    try {
      const res = await myHealthFormsService.submit(form.id, answers);
      if (res.success && res.data) {
        onSent(res.data);
      } else if (res.status === 409 || res.code === HEALTH_FORM_ALREADY_SENT) {
        onAlreadySent();
      } else {
        setSummary(res.message || C.sendFailed);
      }
    } catch {
      setSummary(C.sendFailed);
    } finally {
      setSending(false);
    }
  };

  const answered = answeredCount(questions, draft);

  return (
    <div className="mx-auto w-full max-w-[640px]">
      <PageHeader
        title={C.formTitle}
        subtitle={
          <>
            <span className="block">{C.formIntro(gym)}</span>
            <span className="block mt-1">{C.formPrivacy(gym)}</span>
          </>
        }
      />
      <p
        className="mb-4 font-mono text-[11px] uppercase tracking-[0.06em]"
        style={{ color: "var(--fg-3)" }}
      >
        {C.formCount(questions.length)}
      </p>

      <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-3">
        {questions.map((q, i) => (
          <QuestionField
            key={q.index}
            number={i + 1}
            question={q}
            value={draft[q.index] ?? ""}
            error={errors[q.index]}
            onChange={(v) => setAnswer(q.index, v)}
          />
        ))}

        {summary && (
          <p role="alert" className="text-[13.5px]" style={{ color: "var(--danger-ink)" }} data-testid="health-form-summary">
            {summary}
          </p>
        )}

        <div className="mt-2 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-center sm:text-left" style={{ color: "var(--fg-3)" }} aria-live="polite">
            {C.answered(answered, questions.length)}
          </p>
          <button
            type="submit"
            className="btn-signal-v2 lg"
            style={{ height: TARGET }}
            disabled={sending}
            aria-busy={sending || undefined}
          >
            {sending ? C.sending : C.send}
          </button>
        </div>
      </form>
    </div>
  );
}

function QuestionField({
  number,
  question: q,
  value,
  error,
  onChange,
}: {
  number: number;
  question: HealthFormQuestion;
  value: string;
  error?: string;
  onChange: (v: string) => void;
}) {
  const uid = useId();
  const labelId = `${uid}-label`;
  const helpId = `${uid}-help`;
  const errorId = `${uid}-error`;
  const describedBy = [q.help_text ? helpId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;
  const border = error ? "var(--danger)" : "var(--border)";

  const label = (
    <>
      {number}. {q.label}
      {q.is_required && <span className="sr-only"> (required)</span>}
    </>
  );

  return (
    <div
      data-question={q.index}
      className="rounded-(--r-3) p-4"
      style={{ background: "var(--bg)", border: `1px solid ${border}` }}
    >
      {isChoice(q) ? (
        // A fieldset named by its legend, announced as a radio group.
        <fieldset
          role="radiogroup"
          aria-labelledby={labelId}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          aria-required={q.is_required || undefined}
        >
          <legend id={labelId} className="text-[14px] leading-snug" style={{ color: "var(--ink)" }}>
            {label}
          </legend>
          {q.help_text && (
            <p id={helpId} className="mt-1 text-[13px]" style={{ color: "var(--fg-2)" }}>
              {q.help_text}
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {q.options.map((o) => {
              const checked = value === o.value;
              return (
                <label
                  key={o.value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-(--r-2) px-3.5 text-[14px] focus-within:outline-2 focus-within:outline-offset-2"
                  style={{
                    minHeight: TARGET,
                    border: `1px solid ${checked ? "var(--ink)" : "var(--border)"}`,
                    background: checked ? "var(--bg-2)" : "var(--bg)",
                    color: "var(--ink)",
                    outlineColor: "var(--ink)",
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${q.index}`}
                    value={o.value}
                    checked={checked}
                    onChange={() => onChange(o.value)}
                    style={{ accentColor: "var(--ink)", width: 18, height: 18 }}
                  />
                  {o.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <>
          <label htmlFor={`${uid}-input`} id={labelId} className="block text-[14px] leading-snug" style={{ color: "var(--ink)" }}>
            {label}
          </label>
          {q.help_text && (
            // For the details question this is the template's advice to
            // speak with a doctor: safety text, kept in full.
            <p id={helpId} className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
              {q.help_text}
            </p>
          )}
          <textarea
            id={`${uid}-input`}
            value={value}
            maxLength={2000}
            rows={4}
            onChange={(e) => onChange(e.target.value)}
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            aria-required={q.is_required || undefined}
            className="mt-3 w-full rounded-(--r-2) px-3 py-2.5 text-[14px]"
            style={{ background: "var(--bg)", border: "1px solid var(--border-2)", color: "var(--ink)", minHeight: TARGET }}
          />
        </>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-[13px]" style={{ color: "var(--danger-ink)" }}>
          {error}
        </p>
      )}
    </div>
  );
}
