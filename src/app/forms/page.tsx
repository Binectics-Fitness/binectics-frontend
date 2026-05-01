"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search as SearchIcon,
  Pencil,
  BarChart3,
  Link2,
  ExternalLink,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Check,
  Loader2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useForms } from "@/hooks/useForms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";
import { formatDate } from "@/utils/format";

type StatusFilter = "all" | "published" | "draft";
type SortOption = "newest" | "responses";

function FormsListContent() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    forms,
    responseCounts,
    isLoading,
    error,
    loadForms,
    deleteForm,
    deleteForms,
    setFormPublished,
    duplicateForm,
  } = useForms();
  const [highlightedFormId, setHighlightedFormId] = useState<string | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [copiedFormId, setCopiedFormId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [pendingFormId, setPendingFormId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<
    "publish" | "duplicate" | "bulk-delete" | null
  >(null);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      void loadForms();
    }
  }, [user, authLoading, router, loadForms]);

  // Check for highlighted form from query params
  useEffect(() => {
    const highlight = searchParams.get("highlight");
    if (!highlight) return;

    setHighlightedFormId(highlight);

    const clearTimer = setTimeout(() => setHighlightedFormId(null), 5000);
    const scrollTimer = setTimeout(() => {
      const element = document.getElementById(`form-${highlight}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);

    return () => {
      clearTimeout(clearTimer);
      clearTimeout(scrollTimer);
    };
  }, [searchParams]);

  const visibleForms = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = forms.filter((form) => {
      if (statusFilter === "published" && !form.is_published) return false;
      if (statusFilter === "draft" && form.is_published) return false;
      if (!query) return true;
      const haystack = `${form.title} ${form.description ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });

    const sorted = [...filtered];
    if (sortBy === "responses") {
      sorted.sort(
        (a, b) =>
          (responseCounts[b._id] ?? 0) - (responseCounts[a._id] ?? 0),
      );
    } else {
      sorted.sort((a, b) => {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      });
    }
    return sorted;
  }, [forms, search, statusFilter, sortBy, responseCounts]);

  const counts = useMemo(() => {
    const published = forms.filter((f) => f.is_published).length;
    return {
      all: forms.length,
      published,
      draft: forms.length - published,
    };
  }, [forms]);

  const handleCopyShareLink = async (formId: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/forms/${formId}/submit`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedFormId(formId);
      setTimeout(() => {
        setCopiedFormId((current) => (current === formId ? null : current));
      }, 2000);
    } catch {
      await showAlert("Failed to copy link to clipboard");
    }
  };

  const toggleSelected = (formId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(formId)) next.delete(formId);
      else next.add(formId);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleTogglePublished = async (formId: string, publish: boolean) => {
    setPendingFormId(formId);
    setPendingAction("publish");
    const success = await setFormPublished(formId, publish);
    setPendingFormId(null);
    setPendingAction(null);
    if (!success) {
      await showAlert(
        publish ? "Failed to publish form" : "Failed to unpublish form",
      );
    }
  };

  const handleDuplicate = async (formId: string, formTitle: string) => {
    requestConfirmation({
      title: "Duplicate form?",
      description: `Create a copy of \"${formTitle}\" as a draft? You can edit it before publishing.`,
      confirmLabel: "Duplicate",
      onConfirm: async () => {
        setPendingFormId(formId);
        setPendingAction("duplicate");
        const created = await duplicateForm(formId);
        setPendingFormId(null);
        setPendingAction(null);
        if (!created) {
          await showAlert("Failed to duplicate form");
        }
      },
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    requestConfirmation({
      title: `Delete ${ids.length} form${ids.length === 1 ? "" : "s"}?`,
      description:
        "This permanently deletes the selected forms and all their responses. This action cannot be undone.",
      confirmLabel: "Delete forms",
      onConfirm: async () => {
        setPendingAction("bulk-delete");
        const result = await deleteForms(ids);
        setPendingAction(null);
        clearSelection();
        if (result.failed > 0) {
          await showAlert(
            `${result.failed} form${result.failed === 1 ? "" : "s"} could not be deleted.`,
          );
        }
      },
    });
  };

  const handleDelete = async (formId: string, formTitle: string) => {
    requestConfirmation({
      title: "Delete form?",
      description: `Delete \"${formTitle}\" permanently? This action cannot be undone.`,
      confirmLabel: "Delete Form",
      onConfirm: async () => {
        const success = await deleteForm(formId);

        if (!success) {
          await showAlert("Failed to delete form");
        }
      },
    });
  };

  if (authLoading || (isLoading && forms.length === 0)) {
    return <DashboardLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
          ]}
        />

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">
              My Forms
            </h1>
            <p className="text-foreground-secondary">
              Create and manage your custom forms
            </p>
          </div>
          <Link href="/forms/create" className="sm:shrink-0">
            <Button leftIcon={<Plus className="h-5 w-5" />}>
              Create New Form
            </Button>
          </Link>
        </div>

        {/* Toolbar: Search + Filter + Sort */}
        {forms.length > 0 && (
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-1 items-stretch gap-2">
              <div className="relative flex-1 max-w-md">
                <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search forms…"
                  className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-foreground-tertiary focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                />
              </div>
              <div className="flex rounded-lg border border-neutral-200 bg-white p-1 text-sm">
                {(
                  [
                    ["all", "All", counts.all],
                    ["published", "Published", counts.published],
                    ["draft", "Draft", counts.draft],
                  ] as const
                ).map(([value, label, count]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                      statusFilter === value
                        ? "bg-primary-500 text-foreground"
                        : "text-foreground-secondary hover:bg-neutral-100"
                    }`}
                  >
                    {label}
                    <span className="ml-1.5 text-xs opacity-70">{count}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <label
                htmlFor="forms-sort"
                className="text-foreground-secondary"
              >
                Sort
              </label>
              <select
                id="forms-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-foreground focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="newest">Newest first</option>
                <option value="responses">Most responses</option>
              </select>
            </div>
          </div>
        )}

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="sticky top-2 z-20 mb-4 flex flex-col gap-2 rounded-xl border border-primary-200 bg-primary-50 p-3 shadow-[var(--shadow-card)] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-foreground">
              {selectedIds.size} form{selectedIds.size === 1 ? "" : "s"} selected
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-neutral"
                size="sm"
                onClick={clearSelection}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleBulkDelete}
                isLoading={pendingAction === "bulk-delete"}
              >
                Delete selected
              </Button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Forms List */}
        {forms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-foreground-tertiary">
              <MessageSquare className="h-8 w-8" />
            </div>
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
        ) : visibleForms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-12 text-center">
            <h3 className="font-display text-xl font-bold text-foreground mb-2">
              No forms match your filters
            </h3>
            <p className="text-foreground-secondary mb-6">
              Try a different search term or status filter.
            </p>
            <Button
              variant="outline-neutral"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visibleForms.map((form) => {
              const isHighlighted = highlightedFormId === form._id;
              const responseCount = responseCounts[form._id] ?? 0;
              const isCopied = copiedFormId === form._id;
              const isSelected = selectedIds.has(form._id);
              const isPublishPending =
                pendingFormId === form._id && pendingAction === "publish";
              const isDuplicatePending =
                pendingFormId === form._id && pendingAction === "duplicate";
              return (
                <div
                  key={form._id}
                  id={`form-${form._id}`}
                  className={`relative flex flex-col bg-white rounded-xl shadow-[var(--shadow-card)] p-6 hover:shadow-[var(--shadow-card-hover)] transition-all ${
                    isHighlighted
                      ? "ring-4 ring-primary-500/50 shadow-2xl"
                      : isSelected
                        ? "ring-2 ring-primary-500"
                        : ""
                  }`}
                >
                  {/* Bulk-select checkbox */}
                  <label className="absolute right-4 top-4 z-10 flex h-6 w-6 cursor-pointer items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelected(form._id)}
                      aria-label={`Select ${form.title}`}
                      className="h-5 w-5 cursor-pointer rounded border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500/30"
                    />
                  </label>
                  {isHighlighted && (
                    <div className="bg-primary-500 text-foreground px-3 py-1 rounded text-sm font-semibold mb-4 inline-flex items-center gap-1.5 self-start">
                      <Sparkles className="h-4 w-4" />
                      Just Published!
                    </div>
                  )}
                  {/* Form Header */}
                  <div className="mb-3 pr-8">
                    <h3 className="font-display text-lg font-bold text-foreground line-clamp-2 mb-2">
                      {form.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-semibold rounded-full ${
                          form.is_published
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-neutral-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            form.is_published
                              ? "bg-green-500"
                              : "bg-neutral-400"
                          }`}
                        />
                        {form.is_published ? "Published" : "Draft"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-sm font-semibold rounded-full bg-accent-blue-50 text-accent-blue-700">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {responseCount} response
                        {responseCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-sm text-foreground-secondary line-clamp-2 min-h-[2.5rem]">
                      {form.description || "No description"}
                    </p>
                  </div>

                  {/* Subtle metadata */}
                  <p className="mb-4 text-sm text-foreground-tertiary">
                    Created {form.created_at ? formatDate(form.created_at) : "—"}
                  </p>

                  {/* Spacer to push actions to bottom for equal-height cards */}
                  <div className="flex-1" />

                  {/* Primary action */}
                  <Link
                    href={`/forms/${form._id}/edit`}
                    className="mb-3 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit form
                  </Link>

                  {/* Icon action row */}
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/forms/${form._id}/responses`}
                        title={`View ${responseCount} response${responseCount === 1 ? "" : "s"}`}
                        aria-label="View responses"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-neutral-100"
                      >
                        <MessageSquare className="h-5 w-5" />
                      </Link>
                      <Link
                        href={`/forms/${form._id}/analytics`}
                        title="View analytics"
                        aria-label="View analytics"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-neutral-100"
                      >
                        <BarChart3 className="h-5 w-5" />
                      </Link>
                      {form.is_published && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleCopyShareLink(form._id)}
                            title={isCopied ? "Copied!" : "Copy share link"}
                            aria-label="Copy share link"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-neutral-100"
                          >
                            {isCopied ? (
                              <Check className="h-5 w-5 text-primary-600" />
                            ) : (
                              <Link2 className="h-5 w-5" />
                            )}
                          </button>
                          <Link
                            href={`/forms/${form._id}/submit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open form"
                            aria-label="Open form in new tab"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-neutral-100"
                          >
                            <ExternalLink className="h-5 w-5" />
                          </Link>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePublished(form._id, !form.is_published)
                        }
                        disabled={isPublishPending}
                        title={
                          form.is_published ? "Unpublish form" : "Publish form"
                        }
                        aria-label={
                          form.is_published ? "Unpublish form" : "Publish form"
                        }
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:bg-neutral-100 disabled:opacity-50 ${
                          form.is_published
                            ? "text-amber-600"
                            : "text-primary-600"
                        }`}
                      >
                        {isPublishPending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : form.is_published ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(form._id, form.title)}
                        disabled={isDuplicatePending}
                        title="Duplicate form"
                        aria-label="Duplicate form"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground-secondary transition-colors hover:bg-neutral-100 disabled:opacity-50"
                      >
                        {isDuplicatePending ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(form._id, form.title)}
                      title="Delete form"
                      aria-label="Delete form"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {confirmationModal}
    </div>
  );
}

export default function FormsListPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <FormsListContent />
    </Suspense>
  );
}
