"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  formsService,
  type Form,
  type FormQuestion,
  type FormResponse,
} from "@/lib/api/forms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";

export default function FormResponsesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(
    null,
  );

  const loadFormData = async () => {
    setIsLoading(true);
    setError(null);

    const [formResponse, questionsResponse, responsesResponse] =
      await Promise.all([
        formsService.getFormById(formId),
        formsService.getFormQuestions(formId),
        formsService.getFormResponses(formId),
      ]);

    if (formResponse.success && formResponse.data) {
      setForm(formResponse.data);
    } else {
      setError(formResponse.message || "Failed to load form");
    }

    if (questionsResponse.success && questionsResponse.data) {
      setQuestions(questionsResponse.data);
    }

    if (responsesResponse.success && responsesResponse.data) {
      setResponses(responsesResponse.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      void loadFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, formId, router]);

  const getAnswerValue = (
    response: FormResponse,
    questionId: string,
  ): string => {
    if (!response.answers) return "-";

    const answer = response.answers.find((a) => a.question_id === questionId);
    if (!answer || answer.value === null || answer.value === undefined)
      return "-";

    // Handle array values (checkboxes)
    if (Array.isArray(answer.value)) {
      return answer.value.join(", ");
    }

    return String(answer.value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
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

  if (authLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!user || !form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">
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
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">📝</div>
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
            {/* Responses Table */}
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
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
                          {formatDate(response.submitted_at)}
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
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="text-sm font-semibold text-foreground-secondary mb-2">
                  Total Responses
                </div>
                <div className="text-3xl font-black text-foreground">
                  {responses.length}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-card p-6">
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
              <div className="bg-white rounded-xl shadow-card p-6">
                <div className="text-sm font-semibold text-foreground-secondary mb-2">
                  Latest Response
                </div>
                <div className="text-sm font-bold text-foreground">
                  {responses.length > 0
                    ? formatDate(responses[responses.length - 1].submitted_at)
                    : "-"}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Response Detail Modal */}
        {selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Response Details
                  </h2>
                  <p className="text-sm text-foreground-secondary mt-1">
                    Submitted on {formatDate(selectedResponse.submitted_at)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResponse(null)}
                  className="p-2 text-foreground-secondary hover:text-foreground"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {/* Response Metadata */}
                <div className="bg-neutral-50 rounded-lg p-4 mb-6">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-semibold text-foreground-secondary">
                        Submitted By:
                      </span>
                      <div className="text-foreground mt-1">
                        {selectedResponse.submitted_by_id || "Anonymous"}
                      </div>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground-secondary">
                        Completion Time:
                      </span>
                      <div className="text-foreground mt-1">
                        {selectedResponse.completion_time_seconds
                          ? formatDuration(
                              selectedResponse.completion_time_seconds,
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Answers */}
                <div className="space-y-4">
                  {questions.map((question, index) => {
                    const answerValue = getAnswerValue(
                      selectedResponse,
                      question._id,
                    );
                    return (
                      <div
                        key={question._id}
                        className="border-b border-neutral-200 pb-4 last:border-0"
                      >
                        <div className="font-semibold text-foreground mb-2">
                          {index + 1}. {question.label}
                        </div>
                        <div className="text-foreground-secondary pl-6">
                          {answerValue}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-6 border-t border-neutral-200 flex justify-end">
                <Button onClick={() => setSelectedResponse(null)}>Close</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
