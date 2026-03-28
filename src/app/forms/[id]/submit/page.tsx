"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useFormSubmission } from "@/hooks/useForms";
import { QuestionType, type FormQuestion } from "@/lib/api/forms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { showAlert } from "@/lib/ui/dialogs";

export default function FormSubmitPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const {
    form,
    questions,
    isLoading,
    error: loadError,
    loadFormDetail,
    isSubmitting,
    submitError,
    submitForm,
  } = useFormSubmission(formId);
  const [answers, setAnswers] = useState<
    Record<string, string | number | string[]>
  >({});
  const [submitted, setSubmitted] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  const error = loadError || submitError;

  useEffect(() => {
    if (!authLoading) {
      void loadFormDetail();
    }
  }, [authLoading, loadFormDetail]);

  // Check auth requirement after form loads
  useEffect(() => {
    if (form && form.require_authentication && !user) {
      setShowAuthRequired(true);
    } else {
      setShowAuthRequired(false);
    }
  }, [form, user]);

  const handleAnswerChange = (
    questionId: string,
    value: string | number | string[],
  ) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const handleCheckboxChange = (
    questionId: string,
    value: string,
    checked: boolean,
  ) => {
    const currentValues = (answers[questionId] as string[]) || [];
    if (checked) {
      handleAnswerChange(questionId, [...currentValues, value]);
    } else {
      handleAnswerChange(
        questionId,
        currentValues.filter((v: string) => v !== value),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required questions
    const missingRequired = questions.filter(
      (q) => q.is_required && !answers[q._id],
    );

    if (missingRequired.length > 0) {
      await showAlert(
        `Please answer all required questions (${missingRequired.length} missing)`,
      );
      return;
    }

    // Calculate completion time in seconds
    const completionTimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    // Format answers for API
    const formattedAnswers = questions
      .filter((q) => answers[q._id] !== undefined && answers[q._id] !== "")
      .map((q) => ({
        question_id: q._id,
        value: answers[q._id],
      }));

    const success = await submitForm({
      answers: formattedAnswers,
      completion_time_seconds: completionTimeSeconds,
    });

    if (success) {
      setSubmitted(true);
    }
  };

  const renderQuestionInput = (question: FormQuestion) => {
    const value = answers[question._id];

    switch (question.type) {
      case QuestionType.TEXT:
      case QuestionType.EMAIL:
      case QuestionType.PHONE:
        return (
          <Input
            type={
              question.type === QuestionType.EMAIL
                ? "email"
                : question.type === QuestionType.PHONE
                  ? "tel"
                  : "text"
            }
            placeholder={question.help_text || "Your answer"}
            value={value || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            required={question.is_required}
            minLength={question.min_length}
            maxLength={question.max_length}
          />
        );

      case QuestionType.TEXTAREA:
        return (
          <textarea
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-30"
            placeholder={question.help_text || "Your answer"}
            value={value || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            required={question.is_required}
            minLength={question.min_length}
            maxLength={question.max_length}
          />
        );

      case QuestionType.NUMBER:
      case QuestionType.RATING:
        return (
          <Input
            type="number"
            placeholder={question.help_text || "Your answer"}
            value={value || ""}
            onChange={(e) =>
              handleAnswerChange(question._id, Number(e.target.value))
            }
            required={question.is_required}
            min={question.min_value}
            max={question.max_value}
          />
        );

      case QuestionType.DATE:
        return (
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            required={question.is_required}
          />
        );

      case QuestionType.MULTIPLE_CHOICE:
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={question._id}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) =>
                    handleAnswerChange(question._id, e.target.value)
                  }
                  required={question.is_required}
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case QuestionType.CHECKBOX:
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-3 p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  value={option.value}
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) =>
                    handleCheckboxChange(
                      question._id,
                      option.value,
                      e.target.checked,
                    )
                  }
                  className="w-4 h-4 text-primary-600 focus:ring-primary-500 rounded"
                />
                <span className="text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case QuestionType.SELECT:
        return (
          <select
            value={value || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            required={question.is_required}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select an option</option>
            {question.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <Input
            type="text"
            placeholder={question.help_text || "Your answer"}
            value={value || ""}
            onChange={(e) => handleAnswerChange(question._id, e.target.value)}
            required={question.is_required}
          />
        );
    }
  };

  if (authLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Form Not Available
          </h2>
          <p className="text-foreground-secondary mb-6">{error}</p>
          <Button onClick={() => router.push("/forms")}>Back to Forms</Button>
        </div>
      </div>
    );
  }

  if (!form) {
    return null;
  }

  // Show authentication required onboarding
  if (showAuthRequired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 sm:p-8 text-white">
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h1 className="font-display text-3xl font-black mb-2">
                Authentication Required
              </h1>
              <p className="text-primary-100 text-lg">
                This form requires you to be signed in
              </p>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 sm:p-8">
            <div className="bg-neutral-50 rounded-lg p-6 mb-6">
              <h2 className="font-display text-xl font-bold text-foreground mb-2">
                {form.title}
              </h2>
              {form.description && (
                <p className="text-foreground-secondary">{form.description}</p>
              )}
            </div>

            {/* Explanation */}
            <div className="mb-8">
              <h3 className="font-semibold text-foreground mb-3">
                Why do I need to sign in?
              </h3>
              <div className="space-y-2 text-foreground-secondary">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-500 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Ensures your responses are securely stored and associated
                    with your account
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-500 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Prevents duplicate or spam submissions</span>
                </div>
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-primary-500 mt-0.5 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Allows you to track your submission and receive updates if
                    needed
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      Already have an account?
                    </h4>
                    <p className="text-sm text-foreground-secondary">
                      Sign in to continue to the form
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/login?redirect=/forms/${formId}/submit`)
                  }
                  className="w-full mt-3"
                >
                  Sign In
                </Button>
              </div>

              <div className="bg-accent-blue-50 border border-accent-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">
                      New to Binectics?
                    </h4>
                    <p className="text-sm text-foreground-secondary">
                      Create a free account in just a few seconds
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() =>
                    router.push(`/register?redirect=/forms/${formId}/submit`)
                  }
                  variant="secondary"
                  className="w-full mt-3 bg-accent-blue-500 hover:bg-accent-blue-600 text-white"
                >
                  Create Account
                </Button>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-6 border-t border-neutral-200 text-center">
              <p className="text-sm text-foreground-tertiary">
                Don't worry, signing up is quick and free. You'll be redirected
                back to this form after authentication.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6 sm:p-8 max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            Form Submitted!
          </h2>
          <p className="text-foreground-secondary mb-6">
            Thank you for your response. Your submission has been recorded.
          </p>
          {!form.allow_multiple_submissions && (
            <p className="text-sm text-foreground-tertiary mb-6">
              Multiple submissions are not allowed for this form.
            </p>
          )}
          <Button onClick={() => router.push("/forms")}>Back to Forms</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Branded Header */}
      {(form.custom_logo || form.company_name) && (
        <div
          className="py-6 px-4 sm:px-6 lg:px-8 border-b border-neutral-200"
          style={{
            backgroundColor: form.custom_header_color || "#f7f4ef",
          }}
        >
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {form.custom_logo && (
                <img
                  src={form.custom_logo}
                  alt={form.company_name || "Company logo"}
                  className="h-12 w-auto object-contain"
                />
              )}
              {form.company_name && (
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">
                    {form.company_name}
                  </h2>
                  {form.company_description && (
                    <p className="text-sm text-foreground-secondary">
                      {form.company_description}
                    </p>
                  )}
                </div>
              )}
            </div>
            <div className="text-sm text-foreground-tertiary">
              Form Submission
            </div>
          </div>
        </div>
      )}

      <div className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {user && !form.custom_logo && !form.company_name && (
            <Breadcrumb
              items={[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Forms", href: "/forms" },
                { label: "Submit", href: `/forms/${formId}/submit` },
              ]}
            />
          )}

          {/* Form Header */}
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6 sm:p-8 mb-6">
            <h1 className="font-display text-3xl font-black text-foreground mb-4">
              {form.title}
            </h1>
            {form.description && (
              <p className="text-foreground-secondary text-lg">
                {form.description}
              </p>
            )}
            {form.require_authentication && user && (
              <p className="mt-4 text-sm text-foreground-tertiary">
                Submitting as:{" "}
                <span className="font-semibold">{user.email}</span>
              </p>
            )}
          </div>

          {/* Questions Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {questions.map((question, index) => (
              <div
                key={question._id}
                className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6"
              >
                <label className="block mb-4">
                  <span className="text-lg font-semibold text-foreground">
                    {index + 1}. {question.label}
                    {question.is_required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </span>
                </label>
                {renderQuestionInput(question)}
              </div>
            ))}

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => (user ? router.back() : router.push("/"))}
                className="text-foreground-secondary hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={
                  form.custom_header_color
                    ? { backgroundColor: form.custom_header_color }
                    : undefined
                }
              >
                {isSubmitting ? "Submitting..." : "Submit Form"}
              </Button>
            </div>
          </form>

          {/* Powered by footer for branded forms */}
          {(form.custom_logo || form.company_name) && (
            <div className="mt-8 text-center">
              <p className="text-xs text-foreground-tertiary">
                Powered by{" "}
                <a
                  href="/"
                  className="text-primary-500 hover:text-primary-600 font-medium"
                >
                  Binectics
                </a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
