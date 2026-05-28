"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface MultiSelectOption {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  searchable = true,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
      setOpen(false);
      setQuery("");
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, handleClickOutside]);

  useEffect(() => {
    if (open && searchable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, searchable]);

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  };

  const remove = (optionValue: string) => {
    onChange(value.filter((v) => v !== optionValue));
  };

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const selectedLabels = value
    .map((v) => options.find((o) => o.value === v))
    .filter(Boolean) as MultiSelectOption[];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-(--r-2) border border-border bg-bg px-2.5 py-1.5 text-left text-[13px] hover:border-border-2"
        style={{ transition: "border-color var(--motion-fast)" }}
      >
        {selectedLabels.length > 0 ? (
          selectedLabels.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 rounded-(--r-full) bg-bg-2 px-2 py-0.5 text-[12px] font-medium text-ink"
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  remove(opt.value);
                }}
                className="text-fg-3 hover:text-ink"
                aria-label={`Remove ${opt.label}`}
              >
                &times;
              </button>
            </span>
          ))
        ) : (
          <span className="text-fg-4">{placeholder}</span>
        )}
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-full rounded-(--r-3) border border-border bg-bg"
          style={{ boxShadow: "var(--shadow-2)", maxHeight: 240 }}
        >
          {searchable && (
            <div className="border-b border-border p-2">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-7 w-full rounded-(--r-2) bg-bg-2 px-2.5 text-[13px] text-ink placeholder:text-fg-4 focus:outline-none"
              />
            </div>
          )}
          <div className="overflow-y-auto p-1" style={{ maxHeight: searchable ? 192 : 232 }}>
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[13px] text-fg-3">No results</div>
            ) : (
              filtered.map((opt) => {
                const selected = value.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={`flex w-full items-center gap-2.5 rounded-(--r-2) px-3 py-2 text-left text-[13px] transition-colors ${
                      selected ? "bg-bg-2 font-medium text-ink" : "text-fg hover:bg-bg-2 hover:text-ink"
                    }`}
                    style={{ transitionDuration: "var(--motion-fast)" }}
                  >
                    <span
                      className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border-2 ${
                        selected ? "border-ink bg-ink" : "border-border-2 bg-bg"
                      }`}
                    >
                      {selected && (
                        <svg className="h-2.5 w-2.5 text-bg" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </span>
                    {opt.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
