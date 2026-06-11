"use client";

import { useEffect, useMemo, useState } from "react";
import { use } from "react";
import Link from "next/link";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import {
  formsService,
  type Form,
  type FormQuestion,
  type FormResponse,
  type FormAnalytics,
} from "@/lib/api/forms";

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function FormResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const { formId } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"analytics" | "responses">("analytics");
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [formRes, questionsRes, responsesRes, analyticsRes] =
          await Promise.all([
            formsService.getFormById(formId),
            formsService.getFormQuestions(formId),
            formsService.getFormResponses(formId),
            formsService.getFormAnalytics(formId),
          ]);

        if (formRes.success && formRes.data) setForm(formRes.data);
        if (questionsRes.success && Array.isArray(questionsRes.data))
          setQuestions(questionsRes.data);
        if (responsesRes.success && Array.isArray(responsesRes.data))
          setResponses(responsesRes.data);
        if (analyticsRes.success && analyticsRes.data) setAnalytics(analyticsRes.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load responses");
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [formId]);

  const questionMap = useMemo(
    () => Object.fromEntries(questions.map((q) => [q._id, q])),
    [questions],
  );

  if (isLoading) {
    return (
      <MemberDashboardShell activeLabel="Forms">
        <div className="flex flex-col gap-5">
          <p className="text-sm" style={{ color: "var(--fg-3)" }}>
            Loading responses...
          </p>
        </div>
      </MemberDashboardShell>
    );
  }

  return (
    <MemberDashboardShell activeLabel="Forms">
      <div className="flex flex-col gap-5">
        <div>
          <div
            className="font-mono text-[11px] uppercase tracking-[0.06em]"
            style={{ color: "var(--fg-3)" }}
          >
            <Link href="/dashboard/forms" style={{ color: "var(--fg-3)", textDecoration: "none" }}>
              Forms
            </Link>
            &nbsp;/&nbsp;Responses
          </div>
          <h1
            className="text-[30px] font-medium mt-1"
            style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
          >
            {form?.title ?? "Form responses"}
          </h1>
          <div className="flex gap-3 mt-2">
            <Link
              href={`/dashboard/forms`}
              className="text-sm"
              style={{ color: "var(--fg-3)" }}
            >
              &larr; Back to forms
            </Link>
          </div>
        </div>

        {error && (
          <div
            className="rounded-(--r-3) p-3 text-sm"
            style={{ border: "1px solid var(--danger)", background: "var(--danger-soft)", color: "var(--danger)" }}
          >
            {error}
          </div>
        )}

        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Total responses
              </div>
              <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {analytics.total_responses.toLocaleString()}
              </div>
            </div>
            <div
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Completion rate
              </div>
              <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {Math.round(analytics.completion_rate * 100)}%
              </div>
            </div>
            <div
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Avg completion time
              </div>
              <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {analytics.average_completion_time > 0
                  ? `${Math.round(analytics.average_completion_time)}s`
                  : "-"}
              </div>
            </div>
            <div
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Questions
              </div>
              <div className="text-[36px] font-medium mt-2 tabular-nums" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>
                {questions.length}
              </div>
            </div>
          </div>
        )}

        <div
          className="rounded-(--r-3) overflow-hidden"
          style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
        >
          <div
            className="flex gap-1 p-2"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            {(["analytics", "responses"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveView(tab);
                  setSelectedResponse(null);
                }}
                className="rounded-(--r-2) px-3 py-1.5 text-sm font-medium capitalize"
                style={{
                  background: activeView === tab ? "var(--ink)" : "transparent",
                  color: activeView === tab ? "var(--bg)" : "var(--fg-2)",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeView === "analytics" && analytics && (
              <>
                {analytics.questions.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                    No question analytics yet.
                  </p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {analytics.questions.map((qStat) => (
                      <div
                        key={qStat.question_id}
                        className="rounded-(--r-2) p-4"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-medium" style={{ color: "var(--ink)" }}>
                              {qStat.label}
                            </div>
                            <div className="font-mono text-[10.5px] uppercase tracking-[0.04em] mt-1" style={{ color: "var(--fg-3)" }}>
                              {qStat.type} &middot; {qStat.responses_count} responses &middot; {Math.round(qStat.response_rate * 100)}% response rate
                            </div>
                          </div>
                          {qStat.average !== undefined && (
                            <div className="text-right">
                              <div className="font-mono text-[22px] tabular-nums" style={{ color: "var(--ink)" }}>
                                {qStat.average.toFixed(1)}
                              </div>
                              <div className="text-xs" style={{ color: "var(--fg-3)" }}>avg</div>
                            </div>
                          )}
                        </div>

                        {qStat.value_breakdown && qStat.value_breakdown.length > 0 && (
                          <div className="mt-3 flex flex-col gap-2">
                            {qStat.value_breakdown.map((opt) => (
                              <div key={opt.value} className="flex items-center gap-3">
                                <div className="text-sm flex-1 min-w-0" style={{ color: "var(--fg-2)" }}>
                                  {opt.value}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <div
                                    className="h-2 rounded-full"
                                    style={{
                                      background: "var(--signal)",
                                      width: `${opt.percentage}%`,
                                      minWidth: "4px",
                                      maxWidth: "160px",
                                    }}
                                  />
                                  <span className="font-mono text-xs tabular-nums" style={{ color: "var(--fg-3)" }}>
                                    {opt.count} ({opt.percentage}%)
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {qStat.sample_text_responses &&
                          qStat.sample_text_responses.length > 0 && (
                            <div className="mt-3 flex flex-col gap-1.5">
                              <div className="text-xs uppercase font-mono tracking-wider" style={{ color: "var(--fg-3)" }}>
                                Sample responses
                              </div>
                              {qStat.sample_text_responses.map((resp, idx) => (
                                <div
                                  key={idx}
                                  className="text-sm px-3 py-2 rounded-(--r-1)"
                                  style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}
                                >
                                  {resp}
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeView === "responses" && (
              <>
                {selectedResponse ? (
                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedResponse(null)}
                      className="text-sm"
                      style={{ color: "var(--fg-3)", cursor: "pointer", background: "none", border: "none", padding: 0, textAlign: "left" }}
                    >
                      &larr; Back to list
                    </button>
                    <div>
                      <div className="font-medium" style={{ color: "var(--ink)" }}>
                        {selectedResponse.submitted_by}
                      </div>
                      <div className="text-sm" style={{ color: "var(--fg-3)" }}>
                        Submitted {formatDate(selectedResponse.submitted_at)}
                        {selectedResponse.completion_time_seconds && ` · ${selectedResponse.completion_time_seconds}s`}
                      </div>
                    </div>
                    {selectedResponse.answers?.map((answer) => {
                      const question = questionMap[answer.question_id];
                      const displayValue = Array.isArray(answer.value)
                        ? answer.value.join(", ")
                        : String(answer.value ?? "-");

                      return (
                        <div
                          key={answer._id}
                          className="rounded-(--r-2) p-3"
                          style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
                        >
                          <div className="text-xs font-mono uppercase tracking-wider" style={{ color: "var(--fg-3)" }}>
                            {question?.label ?? answer.question_id}
                          </div>
                          <div className="mt-1 text-sm" style={{ color: "var(--ink)" }}>
                            {displayValue}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {responses.length === 0 ? (
                      <p className="text-sm" style={{ color: "var(--fg-3)" }}>
                        No responses yet.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] border-collapse text-sm">
                          <thead>
                            <tr style={{ borderBottom: "1px solid var(--border)" }}>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Respondent
                              </th>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Submitted
                              </th>
                              <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                Complete
                              </th>
                              <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                                View
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {responses.map((response) => (
                              <tr
                                key={response._id}
                                style={{ borderBottom: "1px solid var(--border)" }}
                              >
                                <td className="py-3 pr-4" style={{ color: "var(--ink)" }}>
                                  {response.submitted_by}
                                </td>
                                <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                                  {formatDate(response.submitted_at)}
                                </td>
                                <td className="py-3 pr-4">
                                  <span
                                    className="font-mono text-xs uppercase tracking-wider px-2 py-1 rounded-(--r-2)"
                                    style={{
                                      background: response.is_complete ? "var(--signal-soft)" : "var(--bg-2)",
                                      color: response.is_complete ? "var(--signal)" : "var(--fg-3)",
                                    }}
                                  >
                                    {response.is_complete ? "complete" : "partial"}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedResponse(response)}
                                    className="text-sm"
                                    style={{ color: "var(--ink)", cursor: "pointer", background: "none", border: "none", padding: 0, textDecoration: "underline" }}
                                  >
                                    View
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </MemberDashboardShell>
  );
}
