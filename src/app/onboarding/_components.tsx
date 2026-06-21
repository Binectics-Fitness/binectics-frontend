"use client";

import { useId, useState, useRef } from "react";
import SearchableSelect from "@/components/SearchableSelect";
import { apiClient } from "@/lib/api/client";

export interface StepProps {
  data: Record<string, unknown>;
  setField: (key: string, value: unknown) => void;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}

/* ── Field wrapper ────────────────────────────────────────── */

export function Field({
  label,
  hint,
  full,
  htmlFor,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: full ? "1 / -1" : undefined }}>
      <label htmlFor={htmlFor} style={{ fontFamily: "var(--font-mono)", fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--fg-3)" }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: 12, color: "var(--fg-3)" }}>{hint}</span>}
    </div>
  );
}

/* ── Text input ───────────────────────────────────────────── */

export function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  id?: string;
}) {
  const autoId = useId();
  return (
    <input
      id={id || autoId}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-2)",
        padding: "12px 14px",
        fontSize: 14,
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        width: "100%",
      }}
    />
  );
}

/* ── Select (SearchableSelect wrapper) ────────────────────── */

export function SelectField({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <SearchableSelect
      options={options.map((o) => ({ label: o, value: o }))}
      value={value}
      onChange={onChange}
    />
  );
}

/* ── Textarea ─────────────────────────────────────────────── */

export function TextArea({
  value,
  onChange,
  placeholder,
  minHeight = 88,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
  id?: string;
}) {
  const autoId = useId();
  return (
    <textarea
      id={id || autoId}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: "var(--bg)",
        border: "1px solid var(--border-2)",
        borderRadius: "var(--r-2)",
        padding: "12px 14px",
        fontSize: 14,
        color: "var(--ink)",
        fontFamily: "var(--font-sans)",
        resize: "none",
        minHeight,
        width: "100%",
      }}
    />
  );
}

/* ── Chip grid ────────────────────────────────────────────── */

export function ChipGrid({
  label,
  options,
  selected,
  onToggle,
}: {
  label?: string;
  options: string[];
  selected: string[];
  onToggle: (chip: string) => void;
}) {
  return (
    <div role="group" aria-label={label || "Select options"} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((chip) => {
        const on = selected.includes(chip);
        return (
          <button
            key={chip}
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => onToggle(chip)}
            style={{
              padding: "12px 16px",
              minHeight: 44,
              border: on ? "1px solid var(--ink)" : "1px solid var(--border-2)",
              borderRadius: "var(--r-full)",
              fontSize: 13,
              color: on ? "var(--bg)" : "var(--fg-2)",
              background: on ? "var(--ink)" : "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "border-color 120ms, background 120ms, color 120ms",
            }}
          >
            {on && <span style={{ fontSize: 11 }}>&#10003;</span>}
            {chip}
          </button>
        );
      })}
    </div>
  );
}

/* ── Upload zone ──────────────────────────────────────────── */

export function UploadZone({
  title,
  hint,
  done,
  folder,
  onUpload,
  value,
  onUploadStart,
  onUploadEnd,
}: {
  title: string;
  hint: string;
  done?: boolean;
  folder?: string;
  onUpload?: (result: { url: string; publicId: string }) => void;
  value?: string;
  onUploadStart?: () => void;
  onUploadEnd?: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDone = done || !!value;

  const handleClick = () => {
    if (folder && onUpload) inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !folder || !onUpload) return;
    setUploading(true);
    setError(null);
    onUploadStart?.();
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      const res = await apiClient.postFormData<{ url?: string; secure_url?: string; publicId?: string }>(
        "/upload/document",
        formData,
      );
      if (!res.success) throw new Error(res.message ?? "Upload failed");
      const url = res.data?.url ?? res.data?.secure_url ?? "";
      const publicId = res.data?.publicId ?? "";
      onUpload({ url, publicId });
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setUploading(false);
      onUploadEnd?.();
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {folder && onUpload && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          style={{ display: "none" }}
          onChange={handleFile}
        />
      )}
      <button
        type="button"
        role="button"
        aria-label={isDone ? `${title} — uploaded` : `Upload ${title}`}
        disabled={uploading}
        onClick={handleClick}
        style={{
          border: isDone ? "1.5px solid var(--signal)" : "1.5px dashed var(--border-2)",
          borderRadius: "var(--r-3)",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          cursor: folder && onUpload ? "pointer" : "default",
          background: isDone ? "var(--signal-soft)" : uploading ? "var(--bg-2)" : "transparent",
          transition: "border-color 120ms, background 120ms",
          width: "100%",
          minHeight: 44,
          fontFamily: "inherit",
          opacity: uploading ? 0.7 : 1,
        }}
      >
        <div style={{ width: 36, height: 36, color: isDone ? "var(--signal-ink)" : "var(--fg-3)" }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" width="100%" height="100%">
            {isDone ? (
              <path d="M20 6L9 17l-5-5" />
            ) : (
              <>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </>
            )}
          </svg>
        </div>
        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 500 }}>
          {uploading ? "Uploading…" : isDone ? `${title} ✓` : title}
        </div>
        <div style={{ fontSize: "12.5px", color: "var(--fg-3)" }}>{hint}</div>
      </button>
      {error && <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>}
    </div>
  );
}

/* ── Radio option cards ───────────────────────────────────── */

export function RadioCards({
  label,
  options,
  selected,
  onSelect,
}: {
  label?: string;
  options: { id: string; title: string; desc: string }[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label || "Select an option"} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {options.map((opt) => {
        const on = selected === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onSelect(opt.id)}
            style={{
              padding: "14px 16px",
              minHeight: 44,
              border: on ? "1px solid var(--ink)" : "1px solid var(--border)",
              borderRadius: "var(--r-3)",
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              cursor: "pointer",
              background: on ? "var(--bg-2)" : "var(--bg)",
              textAlign: "left",
              transition: "border-color 120ms, background 120ms",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                border: on ? "1px solid var(--ink)" : "1px solid var(--border-2)",
                flexShrink: 0,
                marginTop: 3,
                background: on ? "radial-gradient(var(--ink) 40%, transparent 50%)" : "var(--bg)",
              }}
            />
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: 500, color: "var(--ink)" }}>{opt.title}</div>
              <div style={{ fontSize: "12.5px", color: "var(--fg-3)", marginTop: 2, lineHeight: 1.5 }}>{opt.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

/* ── Preview card ─────────────────────────────────────────── */

export function PreviewCard({
  name,
  meta,
}: {
  name: string;
  meta: string;
}) {
  return (
    <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: "var(--r-3)", overflow: "hidden" }}>
      <div style={{ aspectRatio: "16/10", background: "linear-gradient(120deg, var(--bg-3), var(--bg-2))" }} />
      <div style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 48, height: 48, borderRadius: "50%", background: "linear-gradient(135deg, var(--bg-3), var(--bg-2))", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>{name}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--fg-3)", marginTop: 4 }}>{meta}</div>
          </div>
        </div>
        <button type="button" className="btn-ghost-v2 sm" style={{ marginTop: 14, width: "100%", justifyContent: "center" }}>Preview</button>
      </div>
    </div>
  );
}

/* ── Form grid ────────────────────────────────────────────── */

export function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="ob-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 18px", maxWidth: 600 }}>
      {children}
    </div>
  );
}

/* ── Stage head ───────────────────────────────────────────── */

export function StageHead({
  crumb,
  title,
  desc,
}: {
  crumb: string;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", color: "var(--fg-3)", letterSpacing: "0.05em" }}>{crumb}</div>
      <h1 style={{ fontSize: 36, letterSpacing: "-0.025em", fontWeight: 500, marginTop: 10, color: "var(--ink)" }}>{title}</h1>
      <p style={{ fontSize: "15.5px", color: "var(--fg-3)", marginTop: 12, lineHeight: 1.55, maxWidth: 580 }}>{desc}</p>
    </div>
  );
}
