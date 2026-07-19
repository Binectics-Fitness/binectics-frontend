"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  formsService,
  QuestionType,
  type Form,
  type FormQuestion,
} from "@/lib/api/forms";
import SearchableSelect from "@/components/SearchableSelect";

type AnswerValue = string | number | string[] | null;

const inputClass =
  "w-full rounded-(--r-2) px-3.5 py-2.75 text-[14px] focus:outline-none";
const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
};

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: FormQuestion;
  value: AnswerValue;
  onChange: (v: AnswerValue) => void;
}) {
  switch (question.type) {
    case QuestionType.TEXTAREA:
      return (
        <textarea
          rows={4}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      );
    case QuestionType.SELECT:
      return (
        <SearchableSelect
          value={(value as string) ?? ""}
          onChange={(v) => onChange(v || null)}
          options={(question.options ?? []).map((o) => ({ label: o.label, value: o.value }))}
          placeholder="Select…"
        />
      );
    case QuestionType.MULTIPLE_CHOICE:
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center gap-2.5 cursor-pointer text-[14px]" style={{ color: "var(--ink)" }}>
              <input
                type="radio"
                name={question._id}
                checked={value === o.value}
                onChange={() => onChange(o.value)}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    case QuestionType.CHECKBOX: {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="flex flex-col gap-2">
          {(question.options ?? []).map((o) => (
            <label key={o.value} className="flex items-center gap-2.5 cursor-pointer text-[14px]" style={{ color: "var(--ink)" }}>
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.value]
                      : selected.filter((v) => v !== o.value),
                  )
                }
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
    case QuestionType.RATING: {
      const min = question.min_value ?? 1;
      // Guard against a misconfigured range (max < min) that would otherwise
      // render zero buttons and make a required rating unanswerable.
      const max = Math.max(min, question.max_value ?? 5);
      const steps = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      return (
        <div className="flex flex-wrap gap-1.5">
          {steps.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="w-9 h-9 rounded-(--r-2) text-[13.5px] font-medium"
              style={{
                border: "1px solid var(--border-2)",
                background: value === n ? "var(--ink)" : "var(--bg)",
                color: value === n ? "var(--bg)" : "var(--ink)",
                cursor: "pointer",
              }}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }
    case QuestionType.NUMBER:
      // No native min/max — range is validated in handleSubmit so the styled
      // error panel fires instead of a native browser bubble.
      return (
        <input
          type="number"
          value={(value as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={inputClass}
          style={inputStyle}
        />
      );
    case QuestionType.DATE:
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
          className={inputClass}
          style={inputStyle}
        />
      );
    case QuestionType.EMAIL:
    case QuestionType.PHONE:
    case QuestionType.TEXT:
    default:
      return (
        <input
          type={question.type === QuestionType.EMAIL ? "email" : question.type === QuestionType.PHONE ? "tel" : "text"}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          style={inputStyle}
        />
      );
  }
}

function isAnswered(value: AnswerValue): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export default function FormFillClient() {
  const params = useParams<{ formId: string }>();
  const { user } = useAuth();

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startedAt = useRef<number | null>(null);

  useEffect(() => {
    if (!params.formId) return;
    let active = true;
    const run = async () => {
      setLoading(true);
      try {
        const formRes = await formsService.getFormById(params.formId);
        if (!active) return;
        if (!formRes.success || !formRes.data) {
          setLoadError(formRes.message || "This form could not be loaded.");
          return;
        }
        const loadedForm = formRes.data;
        setForm(loadedForm);

        // Don't fetch the questions of an auth-required form for a viewer who
        // hasn't signed in — otherwise the question text is exposed over the
        // wire before the sign-in gate. They load once the user authenticates
        // (this effect re-runs when `user` changes).
        if (loadedForm.require_authentication && !user) {
          setQuestions([]);
          setLoadError(null);
          return;
        }

        const questionsRes = await formsService.getFormQuestions(params.formId);
        if (!active) return;
        if (!questionsRes.success || !questionsRes.data) {
          // A form that loaded but whose questions failed is an error, not an
          // empty form — surface it instead of "no questions yet".
          setLoadError("This form's questions could not be loaded. Try again shortly.");
          return;
        }
        setQuestions(
          questionsRes.data
            .filter((q) => q.is_active)
            .sort((a, b) => a.order_index - b.order_index),
        );
        setLoadError(null);
        startedAt.current = performance.now();
      } catch {
        if (active) setLoadError("This form could not be loaded. Try again shortly.");
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, [params.formId, user]);

  const missingRequired = questions.filter(
    (q) => q.is_required && !isAnswered(answers[q._id] ?? null),
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form || submitting) return;
    if (missingRequired.length > 0) {
      setSubmitError(`Please answer the required question${missingRequired.length === 1 ? "" : "s"}: ${missingRequired.map((q) => `"${q.label}"`).join(", ")}`);
      return;
    }
    // Range-check numbers here (native min/max is dropped) so the styled panel
    // shows instead of a native bubble.
    const outOfRange = questions.find((q) => {
      if (q.type !== QuestionType.NUMBER) return false;
      const v = answers[q._id];
      if (typeof v !== "number") return false;
      return (
        (q.min_value != null && v < q.min_value) ||
        (q.max_value != null && v > q.max_value)
      );
    });
    if (outOfRange) {
      const lo = outOfRange.min_value;
      const hi = outOfRange.max_value;
      const bounds =
        lo != null && hi != null
          ? `between ${lo} and ${hi}`
          : lo != null
          ? `at least ${lo}`
          : `at most ${hi}`;
      setSubmitError(`"${outOfRange.label}" must be ${bounds}.`);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await formsService.submitFormResponse(form._id, {
        answers: questions
          .filter((q) => isAnswered(answers[q._id] ?? null))
          .map((q) => ({ question_id: q._id, value: answers[q._id] ?? null })),
        completion_time_seconds: startedAt.current
          ? Math.round((performance.now() - startedAt.current) / 1000)
          : undefined,
      });
      if (res.success) {
        setSubmitted(true);
      } else {
        setSubmitError(res.message || "Your response could not be submitted.");
      }
    } catch {
      setSubmitError("Your response could not be submitted. Try again shortly.");
    } finally {
      setSubmitting(false);
    }
  }

  const needsSignIn = Boolean(form?.require_authentication && !user);

  return (
    <main className="min-h-screen px-4 py-10" style={{ background: "var(--bg-2)" }}>
      <div className="mx-auto w-full max-w-[640px]">
        {loading ? (
          <div className="rounded-(--r-3) p-8 text-center text-[14px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-3)" }}>
            Loading form…
          </div>
        ) : loadError || !form ? (
          <div className="rounded-(--r-3) p-8" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>Form unavailable</h1>
            <p className="text-[14px] mt-2" style={{ color: "var(--fg-3)" }}>{loadError ?? "This form could not be found."}</p>
          </div>
        ) : !form.is_published || !form.is_active ? (
          <div className="rounded-(--r-3) p-8" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h1 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>This form isn&apos;t accepting responses</h1>
            <p className="text-[14px] mt-2" style={{ color: "var(--fg-3)" }}>The owner hasn&apos;t published it yet.</p>
          </div>
        ) : submitted ? (
          <div className="rounded-(--r-3) p-8 text-center" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            <h1 className="text-[22px] font-medium" style={{ color: "var(--ink)" }}>Thanks — response received.</h1>
            <p className="text-[14px] mt-2" style={{ color: "var(--fg-3)" }}>
              {form.company_name ? `${form.company_name} has your answers.` : "Your answers have been recorded."}
            </p>
            {form.allow_multiple_submissions && (
              <button
                type="button"
                className="mt-5 rounded-(--r-2) px-4 py-2 text-sm font-medium"
                style={{ background: "var(--ink)", color: "var(--bg)", cursor: "pointer" }}
                onClick={() => {
                  setAnswers({});
                  setSubmitted(false);
                  startedAt.current = performance.now();
                }}
              >
                Submit another response
              </button>
            )}
          </div>
        ) : (
          <>
            <header
              className="rounded-t-(--r-3) p-6"
              style={{
                background: form.custom_header_color || "var(--ink)",
                color: "var(--bg)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {form.custom_logo && <img src={form.custom_logo} alt="" className="h-10 mb-3 rounded" />}
              {form.company_name && (
                <div className="font-mono text-[11px] uppercase tracking-[0.08em] opacity-80">{form.company_name}</div>
              )}
              <h1 className="text-[24px] font-medium mt-1" style={{ letterSpacing: "-0.015em" }}>{form.title}</h1>
              {form.description && <p className="text-[14px] mt-2 opacity-90">{form.description}</p>}
            </header>

            <div className="rounded-b-(--r-3) p-6" style={{ background: "var(--bg)", border: "1px solid var(--border)", borderTop: "none" }}>
              {needsSignIn ? (
                <div className="text-center py-6">
                  <p className="text-[14.5px]" style={{ color: "var(--ink)" }}>This form requires you to sign in before responding.</p>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/forms/${form._id}`)}`}
                    className="inline-block mt-4 rounded-(--r-2) px-4 py-2 text-sm font-medium"
                    style={{ background: "var(--ink)", color: "var(--bg)", textDecoration: "none" }}
                  >
                    Sign in to continue
                  </Link>
                </div>
              ) : questions.length === 0 ? (
                <p className="text-[14px] py-4 text-center" style={{ color: "var(--fg-3)" }}>This form has no questions yet.</p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  {questions.map((q, index) => (
                    <div key={q._id}>
                      <label className="block text-[14.5px] font-medium mb-1" style={{ color: "var(--ink)" }}>
                        <span className="font-mono text-[12px] mr-1.5" style={{ color: "var(--fg-4)" }}>{index + 1}.</span>
                        {q.label}
                        {q.is_required && <span style={{ color: "var(--danger)" }}> *</span>}
                      </label>
                      {q.help_text && (
                        <p className="text-[12.5px] mb-2" style={{ color: "var(--fg-3)" }}>{q.help_text}</p>
                      )}
                      <QuestionField
                        question={q}
                        value={answers[q._id] ?? null}
                        onChange={(v) => setAnswers((prev) => ({ ...prev, [q._id]: v }))}
                      />
                    </div>
                  ))}

                  {submitError && (
                    <div className="rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}>
                      {submitError}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[12px]" style={{ color: "var(--fg-4)" }}>
                      {user ? `Responding as ${user.email}` : "Responding anonymously"}
                    </span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-(--r-2) px-5 py-2.5 text-sm font-medium disabled:opacity-50"
                      style={{ background: "var(--ink)", color: "var(--bg)", cursor: submitting ? "not-allowed" : "pointer" }}
                    >
                      {submitting ? "Submitting…" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
            <p className="text-center text-[11.5px] mt-4" style={{ color: "var(--fg-4)" }}>
              Powered by Binectics
            </p>
          </>
        )}
      </div>
    </main>
  );
}
