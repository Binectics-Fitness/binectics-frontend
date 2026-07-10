"use client";

import { useState } from "react";

const LABEL_CLASS = "font-mono text-[10.5px] uppercase tracking-[0.06em]";

/**
 * Free-form tag editor: type + Enter (or Add) to append, click a chip to
 * remove. Duplicates are ignored. Shared by the provider profile editor and
 * the membership-plan form.
 */
export function ChipEditor({
  label,
  values,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const v = draft.trim();
    if (!v || values.includes(v)) return;
    onChange([...values, v]);
    setDraft("");
  };
  return (
    <div className="flex flex-col gap-1.5">
      <label className={LABEL_CLASS} style={{ color: "var(--fg-3)" }}>{label}</label>
      <div className="flex flex-wrap items-center gap-1.5">
        {values.map((v) => (
          <button key={v} type="button" disabled={disabled} onClick={() => onChange(values.filter((x) => x !== v))}
            className="px-3 py-1.5 rounded-full text-[12.5px] cursor-pointer"
            style={{ border: "1px solid var(--ink)", color: "var(--ink)", background: "var(--bg-2)" }}
            title="Remove">
            {v} ×
          </button>
        ))}
        <input value={draft} placeholder={placeholder} disabled={disabled}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className="h-8 rounded-full px-3 text-[12.5px]"
          style={{ border: "1px dashed var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", width: 200 }} />
        <button type="button" className="btn-ghost-v2 sm" disabled={disabled || !draft.trim()} onClick={add}>+ Add</button>
      </div>
    </div>
  );
}
