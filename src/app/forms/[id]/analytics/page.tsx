"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { formsService, type Form, type FormAnalytics } from "@/lib/api/forms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";

export default function FormAnalyticsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    const [formResponse, analyticsResponse] = await Promise.all([
      formsService.getFormById(formId),
      formsService.getFormAnalytics(formId),
    ]);

    if (formResponse.success && formResponse.data) {
      setForm(formResponse.data);
    } else {
      setError(formResponse.message || "Failed to load form");
    }

    if (analyticsResponse.success && analyticsResponse.data) {
      setAnalytics(analyticsResponse.data);
    } else {
      setError(analyticsResponse.message || "Failed to load analytics");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      void loadAnalytics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, formId, router]);

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getCompletionRateColor = (rate: number) => {
    if (rate >= 0.8) return "text-green-600";
    if (rate >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  if (authLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!user || !form || !analytics) {
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
            { label: "Analytics", href: `/forms/${formId}/analytics` },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">
              Analytics
            </h1>
            <p className="text-foreground-secondary">{form.title}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push(`/forms/${formId}/responses`)}
              variant="secondary"
            >
              View Responses
            </Button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-semibold text-foreground-secondary mb-2">
              Total Responses
            </div>
            <div className="text-3xl font-black text-foreground">
              {analytics.total_responses}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-semibold text-foreground-secondary mb-2">
              Completion Rate
            </div>
            <div
              className={`text-3xl font-black ${getCompletionRateColor(analytics.completion_rate)}`}
            >
              {formatPercentage(analytics.completion_rate)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-semibold text-foreground-secondary mb-2">
              Avg. Completion Time
            </div>
            <div className="text-3xl font-black text-foreground">
              {formatDuration(analytics.average_completion_time)}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="text-sm font-semibold text-foreground-secondary mb-2">
              Total Questions
            </div>
            <div className="text-3xl font-black text-foreground">
              {analytics.questions.length}
            </div>
          </div>
        </div>

        {/* Submission Trend Chart */}
        {analytics.submission_trend &&
          analytics.submission_trend.length > 0 && (
            <div className="bg-white rounded-xl shadow-card p-6 mb-8">
              <h2 className="font-display text-xl font-bold text-foreground mb-6">
                Submission Trend (Last 30 Days)
              </h2>
              <div className="h-64 flex items-end justify-between gap-2">
                {analytics.submission_trend.map((point) => {
                  const maxCount = Math.max(
                    ...analytics.submission_trend.map((p) => p.count),
                    1,
                  );
                  const height = (point.count / maxCount) * 100;
                  return (
                    <div
                      key={point.date}
                      className="flex-1 flex flex-col items-center"
                    >
                      <div
                        className="w-full bg-primary-500 rounded-t hover:bg-primary-600 transition-colors relative group"
                        style={{
                          height: `${height}%`,
                          minHeight: point.count > 0 ? "4px" : "0",
                        }}
                      >
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-foreground text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {point.count}{" "}
                          {point.count === 1 ? "response" : "responses"}
                        </div>
                      </div>
                      <div className="text-xs text-foreground-tertiary mt-2 transform -rotate-45 origin-left">
                        {new Date(point.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Question Analytics */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Question Breakdown
          </h2>
          {analytics.questions.map((questionAnalytics, index) => (
            <div
              key={questionAnalytics.question_id}
              className="bg-white rounded-xl shadow-card p-6"
            >
              <div className="mb-4">
                <h3 className="font-semibold text-foreground mb-1">
                  {index + 1}. {questionAnalytics.label}
                </h3>
                <p className="text-sm text-foreground-secondary">
                  {questionAnalytics.responses_count} responses •{" "}
                  {formatPercentage(questionAnalytics.response_rate)} response
                  rate
                </p>
              </div>

              {/* Multiple Choice / Checkbox - Bar Chart */}
              {questionAnalytics.value_breakdown &&
                questionAnalytics.value_breakdown.length > 0 && (
                  <div className="space-y-2">
                    {questionAnalytics.value_breakdown.map((item) => {
                      const percentage =
                        (item.count / questionAnalytics.responses_count) * 100;
                      return (
                        <div key={item.value}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-foreground">
                              {item.value}
                            </span>
                            <span className="text-foreground-secondary">
                              {item.count} ({percentage.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-100 rounded-full h-3">
                            <div
                              className="bg-primary-500 h-3 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              {/* Number / Rating - Summary Stats */}
              {(questionAnalytics.average !== undefined ||
                questionAnalytics.min !== undefined ||
                questionAnalytics.max !== undefined) && (
                <div className="grid grid-cols-3 gap-4">
                  {questionAnalytics.average !== undefined && (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-foreground-secondary mb-1">
                        Average
                      </div>
                      <div className="text-2xl font-black text-foreground">
                        {questionAnalytics.average.toFixed(2)}
                      </div>
                    </div>
                  )}
                  {questionAnalytics.min !== undefined && (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-foreground-secondary mb-1">
                        Minimum
                      </div>
                      <div className="text-2xl font-black text-foreground">
                        {questionAnalytics.min}
                      </div>
                    </div>
                  )}
                  {questionAnalytics.max !== undefined && (
                    <div className="bg-neutral-50 rounded-lg p-4">
                      <div className="text-sm font-semibold text-foreground-secondary mb-1">
                        Maximum
                      </div>
                      <div className="text-2xl font-black text-foreground">
                        {questionAnalytics.max}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Text / Textarea - Sample Responses */}
              {questionAnalytics.sample_text_responses &&
                questionAnalytics.sample_text_responses.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-foreground-secondary mb-2">
                      Sample Responses:
                    </div>
                    {questionAnalytics.sample_text_responses.map(
                      (response, idx) => (
                        <div
                          key={idx}
                          className="bg-neutral-50 rounded-lg p-3 text-sm text-foreground-secondary"
                        >
                          &ldquo;{response}&rdquo;
                        </div>
                      ),
                    )}
                  </div>
                )}
            </div>
          ))}
        </div>

        {/* No Data State */}
        {analytics.total_responses === 0 && (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="font-display text-2xl font-bold text-foreground mb-2">
              No Analytics Yet
            </h2>
            <p className="text-foreground-secondary mb-6">
              Analytics will appear here once you receive responses
            </p>
            <Button onClick={() => router.push(`/forms/${formId}/submit`)}>
              Preview Form
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
