"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { formsService, type Form } from "@/lib/api/forms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";

export default function FormsListPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [forms, setForms] = useState<Form[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedFormId, setHighlightedFormId] = useState<string | null>(
    null,
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const loadForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await formsService.getMyForms();

    if (response.success && response.data) {
      setForms(response.data);

      // Load response counts for each form
      const counts: Record<string, number> = {};
      await Promise.all(
        response.data.map(async (form) => {
          const responsesResponse = await formsService.getFormResponses(
            form._id,
          );
          if (responsesResponse.success && responsesResponse.data) {
            counts[form._id] = responsesResponse.data.length;
          } else {
            counts[form._id] = 0;
          }
        }),
      );
      setResponseCounts(counts);
    } else {
      setError(response.message || "Failed to load forms");
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      // eslint-disable-next-line react-compiler/react-compiler
      void loadForms();
    }
  }, [user, authLoading, router, loadForms]);

  // Check for highlighted form from query params
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (highlight) {
      // eslint-disable-next-line react-compiler/react-compiler
      setHighlightedFormId(highlight);
      // Remove highlight after 5 seconds
      setTimeout(() => setHighlightedFormId(null), 5000);
      // Scroll to the highlighted form
      setTimeout(() => {
        const element = document.getElementById(`form-${highlight}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    }
  }, [searchParams]);

  const handleDelete = async (formId: string, formTitle: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${formTitle}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    const response = await formsService.deleteForm(formId);

    if (response.success) {
      // Remove from list
      setForms(forms.filter((f) => f._id !== formId));
    } else {
      alert(response.message || "Failed to delete form");
    }
  };

  if (authLoading || (isLoading && forms.length === 0)) {
    return <DashboardLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">
              My Forms
            </h1>
            <p className="text-foreground-secondary">
              Create and manage your custom forms
            </p>
          </div>
          <Link href="/forms/create">
            <Button>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Form
            </Button>
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Forms List */}
        {forms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-card p-12 text-center">
            <svg
              className="w-16 h-16 mx-auto text-foreground-tertiary mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              No forms yet
            </h3>
            <p className="text-foreground-secondary mb-6">
              Create your first form to start collecting responses
            </p>
            <Link href="/forms/create">
              <Button>Create Your First Form</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => {
              const isHighlighted = highlightedFormId === form._id;
              return (
                <div
                  key={form._id}
                  id={`form-${form._id}`}
                  className={`bg-white rounded-xl shadow-card p-6 hover:shadow-lg transition-all ${
                    isHighlighted
                      ? "ring-4 ring-primary-500 ring-opacity-50 shadow-2xl"
                      : ""
                  }`}
                >
                  {isHighlighted && (
                    <div className="bg-primary-500 text-white px-3 py-1 rounded text-xs font-semibold mb-4 inline-block">
                      ✨ Just Published!
                    </div>
                  )}
                  {/* Form Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-display text-lg font-bold text-foreground line-clamp-2">
                        {form.title}
                      </h3>
                      <span
                        className={`shrink-0 ml-2 px-2 py-1 text-xs font-semibold rounded ${
                          form.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {form.is_published ? "Published" : "Draft"}
                      </span>
                    </div>
                    {form.description && (
                      <p className="text-sm text-foreground-secondary line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>

                  {/* Form Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4 py-3 border-t border-b border-neutral-100">
                    <div>
                      <p className="text-xs text-foreground-tertiary">
                        Responses
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {responseCounts[form._id] ?? 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-foreground-tertiary">
                        Created
                      </p>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDate(form.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href={`/forms/${form._id}/edit`}
                      className="text-center px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-foreground text-sm font-medium rounded transition-colors"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/forms/${form._id}/responses`}
                      className="text-center px-3 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded transition-colors"
                    >
                      Responses
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Link
                      href={`/forms/${form._id}/analytics`}
                      className="text-center px-3 py-2 bg-accent-blue-100 hover:bg-accent-blue-200 text-accent-blue-700 text-sm font-medium rounded transition-colors"
                    >
                      Analytics
                    </Link>
                    <button
                      onClick={() => handleDelete(form._id, form.title)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
