"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SearchableSelect from "@/components/SearchableSelect";
import { MemberDashboardShell } from "@/components/ds/MemberDashboardShell";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import {
  formsService,
  QuestionType,
  type Form,
  type FormQuestion,
  type CreateFormRequest,
  type CreateQuestionRequest,
} from "@/lib/api/forms";

function formatDate(value: string | null | undefined): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const QUESTION_TYPE_OPTIONS = [
  { label: "Short text", value: QuestionType.TEXT },
  { label: "Long text", value: QuestionType.TEXTAREA },
  { label: "Multiple choice", value: QuestionType.MULTIPLE_CHOICE },
  { label: "Checkboxes", value: QuestionType.CHECKBOX },
  { label: "Dropdown", value: QuestionType.SELECT },
  { label: "Date", value: QuestionType.DATE },
  { label: "Number", value: QuestionType.NUMBER },
  { label: "Email", value: QuestionType.EMAIL },
  { label: "Phone", value: QuestionType.PHONE },
  { label: "Rating (1-5)", value: QuestionType.RATING },
];

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [activeForm, setActiveForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");
  const [view, setView] = useState<"list" | "builder">("list");

  // Create form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingForm, setCreatingForm] = useState(false);

  // Add question state
  const [qLabel, setQLabel] = useState("");
  const [qType, setQType] = useState<QuestionType>(QuestionType.TEXT);
  const [qRequired, setQRequired] = useState(false);
  const [qHelpText, setQHelpText] = useState("");
  const [qOptions, setQOptions] = useState("");
  const [addingQuestion, setAddingQuestion] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [formsRes, countsRes] = await Promise.all([
          formsService.getMyForms(false),
          formsService.getFormResponseCounts(),
        ]);
        if (formsRes.success && Array.isArray(formsRes.data)) {
          setForms(formsRes.data);
        }
        if (countsRes.success && countsRes.data) {
          setResponseCounts(countsRes.data);
        }
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, []);

  async function loadFormQuestions(formId: string) {
    setIsLoadingQuestions(true);
    try {
      const res = await formsService.getFormQuestions(formId);
      if (res.success && Array.isArray(res.data)) {
        setQuestions(res.data);
      }
    } finally {
      setIsLoadingQuestions(false);
    }
  }

  function showMessage(text: string, type: "success" | "error" = "success") {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 4000);
  }

  async function handleCreateForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newTitle.trim()) return;

    setCreatingForm(true);
    const payload: CreateFormRequest = {
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
    };

    const res = await formsService.createForm(payload);
    if (res.success && res.data) {
      setForms((prev) => [...prev, res.data as Form]);
      setNewTitle("");
      setNewDescription("");
      setShowCreateForm(false);
      showMessage("Form created. Add questions to get started.");
    } else {
      showMessage("Failed to create form.", "error");
    }
    setCreatingForm(false);
  }

  async function handleTogglePublish(form: Form) {
    const res = form.is_published
      ? await formsService.unpublishForm(form._id)
      : await formsService.publishForm(form._id);

    if (res.success && res.data) {
      setForms((prev) =>
        prev.map((f) => (f._id === form._id ? (res.data as Form) : f)),
      );
      if (activeForm?._id === form._id) setActiveForm(res.data as Form);
      showMessage(
        form.is_published ? "Form unpublished." : "Form published.",
      );
    } else {
      showMessage("Failed to update form status.", "error");
    }
  }

  async function handleDeleteForm(formId: string) {
    if (!confirm("Delete this form? All responses will be lost.")) return;

    const res = await formsService.deleteForm(formId);
    if (res.success) {
      setForms((prev) => prev.filter((f) => f._id !== formId));
      if (activeForm?._id === formId) {
        setActiveForm(null);
        setView("list");
      }
      showMessage("Form deleted.");
    } else {
      showMessage("Failed to delete form.", "error");
    }
  }

  async function openBuilder(form: Form) {
    setActiveForm(form);
    setView("builder");
    await loadFormQuestions(form._id);
  }

  async function handleAddQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!activeForm || !qLabel.trim()) return;

    const hasOptions = [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.CHECKBOX,
      QuestionType.SELECT,
    ].includes(qType);

    const parsedOptions = hasOptions
      ? qOptions
          .split("\n")
          .map((line) => line.trim())
          .filter((line) => line)
          .map((line) => ({ value: line, label: line }))
      : undefined;

    if (hasOptions && (!parsedOptions || parsedOptions.length < 2)) {
      showMessage("Add at least 2 options (one per line).", "error");
      return;
    }

    setAddingQuestion(true);
    const payload: CreateQuestionRequest = {
      type: qType,
      label: qLabel.trim(),
      help_text: qHelpText.trim() || undefined,
      is_required: qRequired,
      options: parsedOptions,
      order_index: questions.length,
    };

    const res = await formsService.addQuestion(activeForm._id, payload);
    if (res.success && res.data) {
      setQuestions((prev) => [...prev, res.data as FormQuestion]);
      setQLabel("");
      setQHelpText("");
      setQRequired(false);
      setQOptions("");
      showMessage("Question added.");
    } else {
      showMessage("Failed to add question.", "error");
    }
    setAddingQuestion(false);
  }

  async function handleDeleteQuestion(questionId: string) {
    const res = await formsService.deleteQuestion(questionId);
    if (res.success) {
      setQuestions((prev) => prev.filter((q) => q._id !== questionId));
      showMessage("Question deleted.");
    } else {
      showMessage("Failed to delete question.", "error");
    }
  }

  const hasOptions = [
    QuestionType.MULTIPLE_CHOICE,
    QuestionType.CHECKBOX,
    QuestionType.SELECT,
  ].includes(qType);

  return (
    <MemberDashboardShell activeLabel="Home">
      <div className="flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div
              className="font-mono text-[11px] uppercase tracking-[0.06em]"
              style={{ color: "var(--fg-3)" }}
            >
              Workspace
            </div>
            <h1
              className="text-[30px] font-medium mt-1"
              style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}
            >
              {view === "builder" && activeForm
                ? activeForm.title
                : "Forms builder"}
            </h1>
            {view === "builder" && (
              <button
                type="button"
                onClick={() => setView("list")}
                className="text-sm mt-1"
                style={{ color: "var(--fg-3)", cursor: "pointer" }}
              >
                &larr; Back to forms
              </button>
            )}
          </div>

          {view === "list" && (
            <button
              type="button"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
              style={{ background: "var(--ink)", color: "var(--bg)", cursor: "pointer" }}
            >
              New form
            </button>
          )}
          {view === "builder" && activeForm && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTogglePublish(activeForm)}
                className="rounded-(--r-2) border px-4 py-2 text-sm font-medium"
                style={{
                  borderColor: activeForm.is_published ? "var(--danger)" : "var(--signal)",
                  color: activeForm.is_published ? "var(--danger)" : "var(--signal)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                {activeForm.is_published ? "Unpublish" : "Publish"}
              </button>
              <Link
                href={`/dashboard/forms/${activeForm._id}/responses`}
                className="rounded-(--r-2) border px-4 py-2 text-sm font-medium"
                style={{ borderColor: "var(--border)", color: "var(--fg-2)", textDecoration: "none" }}
              >
                View responses
              </Link>
            </div>
          )}
        </div>

        {message && (
          <div
            className="rounded-(--r-3) p-3 text-sm"
            style={{
              border: `1px solid ${messageType === "success" ? "var(--signal)" : "var(--danger)"}`,
              background: messageType === "success" ? "var(--signal-soft)" : "var(--danger-soft)",
              color: messageType === "success" ? "var(--signal)" : "var(--danger)",
            }}
          >
            {message}
          </div>
        )}

        {view === "list" && (
          <>
            {showCreateForm && (
              <section
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                  Create new form
                </h2>
                <form className="mt-4 flex flex-col gap-3" onSubmit={handleCreateForm}>
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Membership intake form"
                      className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                    />
                  </div>
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Description
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Optional description"
                      rows={2}
                      className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={creatingForm}
                      className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                      style={{ background: "var(--ink)", color: "var(--bg)", cursor: creatingForm ? "not-allowed" : "pointer", opacity: creatingForm ? 0.7 : 1 }}
                    >
                      {creatingForm ? "Creating..." : "Create form"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="rounded-(--r-2) border px-4 py-2 text-sm"
                      style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </section>
            )}

            <section
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                Your forms
              </h2>

              {isLoading ? (
                <AsyncSpinner label="Loading forms" />
              ) : forms.length === 0 ? (
                <EmptySlate message="No forms yet. Create one to start collecting responses." />
              ) : (
                <div className="overflow-x-auto mt-4">
                  <table className="w-full min-w-[700px] border-collapse text-sm">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Title
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Status
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Responses
                        </th>
                        <th className="text-left py-2 pr-4" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Created
                        </th>
                        <th className="text-left py-2" style={{ color: "var(--fg-3)", fontWeight: 500 }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {forms.map((form) => (
                        <tr key={form._id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td className="py-3 pr-4">
                            <button
                              type="button"
                              onClick={() => openBuilder(form)}
                              className="text-sm font-medium hover:underline"
                              style={{ color: "var(--ink)", cursor: "pointer", background: "none", border: "none", padding: 0 }}
                            >
                              {form.title}
                            </button>
                            {form.description && (
                              <div className="text-xs" style={{ color: "var(--fg-3)" }}>
                                {form.description.substring(0, 60)}
                              </div>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className="font-mono text-xs uppercase tracking-wider rounded-(--r-2) px-2 py-1"
                              style={{
                                background: form.is_published ? "var(--signal-soft)" : "var(--bg-2)",
                                color: form.is_published ? "var(--signal)" : "var(--fg-3)",
                              }}
                            >
                              {form.is_published ? "published" : "draft"}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-mono tabular-nums" style={{ color: "var(--fg-2)" }}>
                            {responseCounts[form._id] ?? 0}
                          </td>
                          <td className="py-3 pr-4" style={{ color: "var(--fg-2)" }}>
                            {formatDate(form.created_at)}
                          </td>
                          <td className="py-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => openBuilder(form)}
                              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
                              style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePublish(form)}
                              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
                              style={{
                                borderColor: form.is_published ? "var(--warn)" : "var(--signal)",
                                color: form.is_published ? "var(--warn)" : "var(--signal)",
                                background: "transparent",
                                cursor: "pointer",
                              }}
                            >
                              {form.is_published ? "Unpublish" : "Publish"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteForm(form._id)}
                              className="rounded-(--r-2) border px-3 py-1.5 text-xs"
                              style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "transparent", cursor: "pointer" }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {view === "builder" && activeForm && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Questions</div>
                <div className="text-[30px] font-medium mt-1 tabular-nums" style={{ color: "var(--ink)" }}>
                  {questions.length}
                </div>
              </div>
              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Responses</div>
                <div className="text-[30px] font-medium mt-1 tabular-nums" style={{ color: "var(--ink)" }}>
                  {responseCounts[activeForm._id] ?? 0}
                </div>
              </div>
              <div
                className="rounded-(--r-3) p-4"
                style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
              >
                <div className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>Status</div>
                <div className="mt-1">
                  <span
                    className="font-mono text-sm uppercase tracking-wider rounded-(--r-2) px-2 py-1"
                    style={{
                      background: activeForm.is_published ? "var(--signal-soft)" : "var(--bg-2)",
                      color: activeForm.is_published ? "var(--signal)" : "var(--fg-3)",
                    }}
                  >
                    {activeForm.is_published ? "Published" : "Draft"}
                  </span>
                </div>
              </div>
            </div>

            <section
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                Questions ({questions.length})
              </h2>

              {isLoadingQuestions ? (
                <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                  Loading questions...
                </p>
              ) : questions.length === 0 ? (
                <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
                  No questions yet. Add the first one below.
                </p>
              ) : (
                <ol className="mt-4 flex flex-col gap-2">
                  {questions
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((q, index) => (
                      <li
                        key={q._id}
                        className="rounded-(--r-2) p-3 flex items-start justify-between gap-3"
                        style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs" style={{ color: "var(--fg-3)" }}>
                              {index + 1}.
                            </span>
                            <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                              {q.label}
                            </span>
                            {q.is_required && (
                              <span className="text-xs" style={{ color: "var(--danger)" }}>
                                required
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-3">
                            <span
                              className="font-mono text-xs uppercase tracking-wider"
                              style={{ color: "var(--fg-4)" }}
                            >
                              {q.type}
                            </span>
                            {q.help_text && (
                              <span className="text-xs" style={{ color: "var(--fg-3)" }}>
                                {q.help_text}
                              </span>
                            )}
                            {q.options && q.options.length > 0 && (
                              <span className="text-xs" style={{ color: "var(--fg-3)" }}>
                                {q.options.length} options
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q._id)}
                          className="rounded-(--r-2) border px-2 py-1 text-xs"
                          style={{ borderColor: "var(--danger)", color: "var(--danger)", background: "transparent", cursor: "pointer" }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                </ol>
              )}
            </section>

            <section
              className="rounded-(--r-3) p-4"
              style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
            >
              <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
                Add question
              </h2>

              <form className="mt-4 flex flex-col gap-4" onSubmit={handleAddQuestion}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Question type
                    </label>
                    <div className="mt-1.5">
                      <SearchableSelect
                        value={qType}
                        onChange={(v) => setQType(v as QuestionType)}
                        options={QUESTION_TYPE_OPTIONS}
                        placeholder="Select type"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Question label *
                    </label>
                    <input
                      type="text"
                      required
                      value={qLabel}
                      onChange={(e) => setQLabel(e.target.value)}
                      placeholder="e.g., What are your fitness goals?"
                      className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                    style={{ color: "var(--fg-3)" }}
                  >
                    Help text (optional)
                  </label>
                  <input
                    type="text"
                    value={qHelpText}
                    onChange={(e) => setQHelpText(e.target.value)}
                    placeholder="Shown below the question"
                    className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                  />
                </div>

                {hasOptions && (
                  <div>
                    <label
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em]"
                      style={{ color: "var(--fg-3)" }}
                    >
                      Options (one per line, min 2)
                    </label>
                    <textarea
                      value={qOptions}
                      onChange={(e) => setQOptions(e.target.value)}
                      placeholder={"Option A\nOption B\nOption C"}
                      rows={4}
                      className="w-full mt-1.5 rounded-(--r-2) border px-3 py-2 text-sm"
                      style={{ borderColor: "var(--border)", background: "var(--bg-2)", color: "var(--ink)" }}
                    />
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qRequired}
                      onChange={(e) => setQRequired(e.target.checked)}
                    />
                    <span className="text-sm" style={{ color: "var(--fg-2)" }}>
                      Required
                    </span>
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addingQuestion}
                    className="rounded-(--r-2) px-4 py-2 text-sm font-medium"
                    style={{ background: "var(--ink)", color: "var(--bg)", cursor: addingQuestion ? "not-allowed" : "pointer", opacity: addingQuestion ? 0.7 : 1 }}
                  >
                    {addingQuestion ? "Adding..." : "Add question"}
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
      </div>
    </MemberDashboardShell>
  );
}
