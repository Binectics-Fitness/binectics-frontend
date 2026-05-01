"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormResponses } from "@/hooks/useForms";
import {
  QuestionType,
  type FormQuestion,
  type FormResponse,
} from "@/lib/api/forms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";
import {
  FileText,
  X,
  User,
  Clock,
  Calendar,
  Mail,
  Phone,
  Hash,
  Star,
  CheckSquare,
  ListChecks,
  AlignLeft,
  Type,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDate } from "@/utils/format";

export default function FormResponsesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const { form, questions, responses, isLoading, error, loadResponses } =
    useFormResponses(formId);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(
    null,
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      void loadResponses();
    }
  }, [user, authLoading, loadResponses, router]);

  const formatResponseDate = (date: string) => {
    return formatDate(date, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "?";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Close modal on Escape
  useEffect(() => {
    if (!selectedResponse) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedResponse(null);
    };
    window.addEventListener("keydown", onKey);
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [selectedResponse]);

  if (authLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!user || !form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Edit Form", href: `/forms/${formId}/edit` },
            { label: "Responses", href: `/forms/${formId}/responses` },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground mb-2">
              Form Responses
            </h1>
            <p className="text-foreground-secondary">{form.title}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-primary-600">
              {responses.length}
            </div>
            <div className="text-sm text-foreground-secondary">
              {responses.length === 1 ? "Response" : "Responses"}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {responses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-foreground-tertiary">
              <FileText className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              No Responses Yet
            </h2>
            <p className="text-foreground-secondary mb-6">
              Share your form to start collecting responses
            </p>
            <Button onClick={() => router.push(`/forms/${formId}/submit`)}>
              Preview Form
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {responses.map((response, index) => (
                <div
                  key={response._id}
                  className="bg-white rounded-xl shadow-[var(--shadow-card)] p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground">
                      #{index + 1}
                    </span>
                    <button
                      onClick={() => setSelectedResponse(response)}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                  <div className="text-sm font-medium text-foreground mb-1">
                    {response.submitted_by || "Anonymous"}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-foreground-secondary">
                    <span>{formatResponseDate(response.submitted_at)}</span>
                    <span>
                      {response.completion_time_seconds
                        ? formatDuration(response.completion_time_seconds)
                        : "-"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-xl shadow-[var(--shadow-card)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Submitted By
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Submitted At
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Completion Time
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {responses.map((response, index) => (
                      <tr key={response._id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 text-sm text-foreground-secondary">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">
                            {response.submitted_by || "Anonymous"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground-secondary">
                          {formatResponseDate(response.submitted_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-foreground-secondary">
                          {response.completion_time_seconds
                            ? formatDuration(response.completion_time_seconds)
                            : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedResponse(response)}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
                <div className="text-sm font-semibold text-foreground-secondary mb-2">
                  Total Responses
                </div>
                <div className="text-3xl font-black text-foreground">
                  {responses.length}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
                <div className="text-sm font-semibold text-foreground-secondary mb-2">
                  Avg. Completion Time
                </div>
                <div className="text-3xl font-black text-foreground">
                  {responses.length > 0
                    ? formatDuration(
                        Math.round(
                          responses.reduce(
                            (sum, r) => sum + (r.completion_time_seconds || 0),
                            0,
                          ) / responses.length,
                        ),
                      )
                    : "-"}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
                <div className="text-sm font-semibold text-foreground-secondary mb-2">
                  Latest Response
                </div>
                <div className="text-sm font-bold text-foreground">
                  {responses.length > 0
                    ? formatResponseDate(
                        responses[responses.length - 1].submitted_at,
                      )
                    : "-"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Response Detail Modal */}
        {selectedResponse && (
          <ResponseDetailModal
            response={selectedResponse}
            questions={questions}
            index={
              responses.findIndex((r) => r._id === selectedResponse._id) + 1
            }
            onClose={() => setSelectedResponse(null)}
            formatResponseDate={formatResponseDate}
            formatDuration={formatDuration}
            getInitials={getInitials}
          />
        )}
      </div>
    </div>
  );
}

// ==================== Response Detail Modal ====================

const QUESTION_TYPE_META: Record<
  QuestionType,
  { icon: LucideIcon; iconClass: string }
> = {
  [QuestionType.TEXT]: {
    icon: Type,
    iconClass: "bg-neutral-100 text-foreground-secondary",
  },
  [QuestionType.TEXTAREA]: {
    icon: AlignLeft,
    iconClass: "bg-neutral-100 text-foreground-secondary",
  },
  [QuestionType.MULTIPLE_CHOICE]: {
    icon: ListChecks,
    iconClass: "bg-blue-50 text-blue-600",
  },
  [QuestionType.CHECKBOX]: {
    icon: CheckSquare,
    iconClass: "bg-purple-50 text-purple-600",
  },
  [QuestionType.SELECT]: {
    icon: ChevronDown,
    iconClass: "bg-blue-50 text-blue-600",
  },
  [QuestionType.DATE]: {
    icon: Calendar,
    iconClass: "bg-amber-50 text-amber-600",
  },
  [QuestionType.NUMBER]: {
    icon: Hash,
    iconClass: "bg-neutral-100 text-foreground-secondary",
  },
  [QuestionType.EMAIL]: {
    icon: Mail,
    iconClass: "bg-blue-50 text-blue-600",
  },
  [QuestionType.PHONE]: {
    icon: Phone,
    iconClass: "bg-green-50 text-green-600",
  },
  [QuestionType.RATING]: {
    icon: Star,
    iconClass: "bg-amber-50 text-amber-600",
  },
};

function ResponseDetailModal({
  response,
  questions,
  index,
  onClose,
  formatResponseDate,
  formatDuration,
  getInitials,
}: {
  response: FormResponse;
  questions: FormQuestion[];
  index: number;
  onClose: () => void;
  formatResponseDate: (d: string) => string;
  formatDuration: (s: number) => string;
  getInitials: (name: string) => string;
}) {
  const submitterName = response.submitted_by || "Anonymous";
  const isAnonymous = submitterName === "Anonymous";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="response-detail-title"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-3xl max-h-[95vh] sm:max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-neutral-200">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-2.5 py-0.5 text-xs font-semibold">
                Response #{index}
              </span>
              {response.is_complete ? (
                <span className="inline-flex items-center rounded-full bg-green-50 text-green-700 px-2.5 py-0.5 text-xs font-semibold">
                  Complete
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-semibold">
                  Incomplete
                </span>
              )}
            </div>
            <h2
              id="response-detail-title"
              className="font-display text-xl sm:text-2xl font-bold text-foreground"
            >
              Response Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary hover:bg-neutral-100 hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Submitter card */}
        <div className="px-5 sm:px-6 pt-5">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isAnonymous
                    ? "bg-neutral-200 text-foreground-secondary"
                    : "bg-primary-100 text-primary-700"
                }`}
                aria-hidden="true"
              >
                {isAnonymous ? (
                  <User className="h-5 w-5" />
                ) : (
                  getInitials(submitterName)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-base font-semibold text-foreground capitalize">
                  {submitterName}
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground-secondary">
                  <div className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-foreground-tertiary" />
                    <span>{formatResponseDate(response.submitted_at)}</span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-foreground-tertiary" />
                    <span>
                      {response.completion_time_seconds
                        ? `Completed in ${formatDuration(response.completion_time_seconds)}`
                        : "Time not recorded"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Answers */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">
          {questions.length === 0 ? (
            <div className="text-center py-10 text-foreground-secondary text-sm">
              No questions in this form.
            </div>
          ) : (
            <ol className="space-y-3">
              {questions.map((question, i) => (
                <AnswerItem
                  key={question._id}
                  index={i + 1}
                  question={question}
                  response={response}
                />
              ))}
            </ol>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-4 sm:p-5 flex items-center justify-between gap-3 bg-white">
          <span className="text-xs text-foreground-tertiary">
            {questions.length} {questions.length === 1 ? "question" : "questions"}
          </span>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function AnswerItem({
  index,
  question,
  response,
}: {
  index: number;
  question: FormQuestion;
  response: FormResponse;
}) {
  const meta = QUESTION_TYPE_META[question.type] ?? QUESTION_TYPE_META[QuestionType.TEXT];
  const Icon = meta.icon;
  const answer = response.answers?.find((a) => a.question_id === question._id);
  const rawValue = answer?.value;
  const isEmpty =
    rawValue === null ||
    rawValue === undefined ||
    rawValue === "" ||
    (Array.isArray(rawValue) && rawValue.length === 0);

  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4 hover:border-neutral-300 transition-colors">
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg ${meta.iconClass}`}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-semibold text-foreground-tertiary">
              Q{index}
            </span>
            <h3 className="text-sm font-semibold text-foreground">
              {question.label}
            </h3>
            {question.is_required && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-red-600">
                Required
              </span>
            )}
          </div>
          {question.help_text && (
            <p className="mt-0.5 text-xs text-foreground-tertiary">
              {question.help_text}
            </p>
          )}
          <div className="mt-2.5">
            {isEmpty ? (
              <span className="text-sm italic text-foreground-tertiary">
                Not answered
              </span>
            ) : (
              <AnswerValue question={question} value={rawValue!} />
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function AnswerValue({
  question,
  value,
}: {
  question: FormQuestion;
  value: string | number | boolean | string[];
}) {
  // Multi-select / checkbox arrays → chips
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {value.map((v, i) => (
          <span
            key={`${v}-${i}`}
            className="inline-flex items-center rounded-full bg-primary-50 text-primary-700 px-2.5 py-1 text-xs font-medium"
          >
            {v}
          </span>
        ))}
      </div>
    );
  }

  const stringValue = String(value);

  switch (question.type) {
    case QuestionType.RATING: {
      const rating = Number(value);
      const max = question.max_value ?? 5;
      if (!Number.isFinite(rating)) {
        return <span className="text-sm text-foreground">{stringValue}</span>;
      }
      return (
        <div className="inline-flex items-center gap-2">
          <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} of ${max}`}>
            {Array.from({ length: max }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < rating
                    ? "fill-amber-400 text-amber-400"
                    : "text-neutral-300"
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-foreground">
            {rating}
            <span className="text-foreground-tertiary font-normal"> / {max}</span>
          </span>
        </div>
      );
    }

    case QuestionType.EMAIL:
      return (
        <a
          href={`mailto:${stringValue}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline break-all"
        >
          {stringValue}
        </a>
      );

    case QuestionType.PHONE:
      return (
        <a
          href={`tel:${stringValue}`}
          className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
        >
          {stringValue}
        </a>
      );

    case QuestionType.DATE: {
      const date = new Date(stringValue);
      const display = isNaN(date.getTime())
        ? stringValue
        : formatDate(date.toISOString(), {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
      return <span className="text-sm text-foreground">{display}</span>;
    }

    case QuestionType.NUMBER:
      return (
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {stringValue}
        </span>
      );

    case QuestionType.MULTIPLE_CHOICE:
    case QuestionType.SELECT:
      return (
        <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2.5 py-1 text-xs font-medium">
          {stringValue}
        </span>
      );

    case QuestionType.TEXTAREA:
      return (
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {stringValue}
        </p>
      );

    default:
      return <span className="text-sm text-foreground break-words">{stringValue}</span>;
  }
}
