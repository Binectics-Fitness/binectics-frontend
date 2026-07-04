"use client";

import { useEffect, useState } from "react";
import { formsService, type Form, type FormTemplate } from "@/lib/api/forms";

const CATEGORY_LABEL: Record<FormTemplate["category"], string> = {
  gym: "Gym",
  trainer: "Trainer",
  dietitian: "Dietitian",
};

interface TemplateGalleryProps {
  /** Called with the created draft so the caller can list it and open the builder. */
  onCreated: (form: Form) => void;
  onError: (message: string) => void;
}

export function TemplateGallery({ onCreated, onError }: TemplateGalleryProps) {
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewKey, setPreviewKey] = useState<string | null>(null);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const run = async () => {
      try {
        const res = await formsService.getTemplates();
        if (active && res.success && Array.isArray(res.data)) {
          setTemplates(res.data);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    const kick = window.setTimeout(() => void run(), 0);
    return () => {
      active = false;
      window.clearTimeout(kick);
    };
  }, []);

  async function instantiateTemplate(template: FormTemplate) {
    if (creatingKey) return;
    setCreatingKey(template.key);
    try {
      const res = await formsService.createFromTemplate(template.key);
      if (res.success && res.data) {
        onCreated(res.data as Form);
      } else {
        onError("Couldn't create the form from this template.");
      }
    } catch {
      onError("Couldn't create the form from this template.");
    } finally {
      setCreatingKey(null);
    }
  }

  // Hide the section entirely when templates can't be loaded — the blank
  // "New form" path still works, so this degrades quietly.
  if (!loading && templates.length === 0) return null;

  const preview = templates.find((t) => t.key === previewKey) ?? null;

  return (
    <section
      className="rounded-(--r-3) p-4"
      style={{ border: "1px solid var(--border)", background: "var(--bg)" }}
    >
      <h2 className="text-[18px] font-medium" style={{ color: "var(--ink)" }}>
        Start from a template
      </h2>
      <p className="text-sm mt-1" style={{ color: "var(--fg-3)" }}>
        Ready-made forms for common scenarios. Pick one, tweak anything, publish.
      </p>

      {loading ? (
        <p className="text-sm mt-4" style={{ color: "var(--fg-3)" }}>
          Loading templates...
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {templates.map((t) => (
            <div
              key={t.key}
              className="rounded-(--r-2) p-3.5 flex flex-col gap-2"
              style={{
                border: `1px solid ${previewKey === t.key ? "var(--ink)" : "var(--border)"}`,
                background: "var(--bg-2)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-mono text-[10px] uppercase tracking-wider rounded-(--r-2) px-1.5 py-0.5"
                  style={{ background: "var(--bg)", color: "var(--fg-3)", border: "1px solid var(--border)" }}
                >
                  {CATEGORY_LABEL[t.category] ?? t.category}
                </span>
                <span className="font-mono text-xs tabular-nums" style={{ color: "var(--fg-4)" }}>
                  {t.questions.length} questions
                </span>
              </div>
              <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
                {t.title}
              </div>
              <div className="text-xs leading-relaxed" style={{ color: "var(--fg-3)" }}>
                {t.description}
              </div>
              <div className="flex gap-2 mt-auto pt-1">
                <button
                  type="button"
                  onClick={() => setPreviewKey(previewKey === t.key ? null : t.key)}
                  className="rounded-(--r-2) border px-3 py-1.5 text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--fg-2)", background: "transparent", cursor: "pointer" }}
                >
                  {previewKey === t.key ? "Hide preview" : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={() => void instantiateTemplate(t)}
                  disabled={creatingKey !== null}
                  className="rounded-(--r-2) px-3 py-1.5 text-xs font-medium"
                  style={{
                    background: "var(--ink)",
                    color: "var(--bg)",
                    cursor: creatingKey ? "not-allowed" : "pointer",
                    opacity: creatingKey && creatingKey !== t.key ? 0.5 : 1,
                  }}
                >
                  {creatingKey === t.key ? "Creating..." : "Use template"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {preview && (
        <div
          className="rounded-(--r-2) p-4 mt-3"
          style={{ border: "1px solid var(--border)", background: "var(--bg-2)" }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--ink)" }}>
            {preview.title} — questions
          </div>
          <ol className="mt-2 flex flex-col gap-1.5">
            {preview.questions.map((q, i) => (
              <li key={`${preview.key}-${i}`} className="text-sm flex items-baseline gap-2">
                <span className="font-mono text-xs" style={{ color: "var(--fg-4)" }}>
                  {i + 1}.
                </span>
                <span style={{ color: "var(--fg-2)" }}>
                  {q.label}
                  {q.is_required && (
                    <span className="text-xs ml-1.5" style={{ color: "var(--danger)" }}>
                      required
                    </span>
                  )}
                  <span className="font-mono text-[10px] uppercase tracking-wider ml-2" style={{ color: "var(--fg-4)" }}>
                    {q.type}
                    {q.options && q.options.length > 0 ? ` · ${q.options.length} options` : ""}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
