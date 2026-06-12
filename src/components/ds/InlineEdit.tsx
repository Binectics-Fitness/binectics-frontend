"use client";

import { useState, useRef, useEffect } from "react";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
}

export function InlineEdit({ value, onSave, placeholder = "Click to edit" }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft.trim() !== value) {
      onSave(draft.trim());
    }
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === "Enter") save();
          if (e.key === "Escape") cancel();
        }}
        className="h-7 rounded-(--r-1) border border-border-2 bg-bg px-2 text-[13.5px] text-ink focus:outline-none"
        style={{ minWidth: 120 }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="rounded-(--r-1) px-1 py-0.5 text-[13.5px] text-ink hover:bg-bg-2"
      style={{ transition: "background var(--motion-fast)" }}
    >
      {value || <span className="text-fg-4">{placeholder}</span>}
    </button>
  );
}
