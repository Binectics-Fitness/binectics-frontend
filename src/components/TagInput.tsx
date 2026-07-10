"use client";

import { useState, useRef, useEffect } from "react";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions: string[];
  placeholder?: string;
  name?: string;
}

export default function TagInput({
  value,
  onChange,
  suggestions,
  placeholder,
  name,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = inputValue.trim()
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(s),
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node))
        setShowSuggestions(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addTag(tag: string) {
    // Accept comma-separated input — typed or pasted ("a, b, c" is three
    // tags, not one) — de-duplicating against existing tags.
    const parts = tag
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const fresh = parts.filter(
      (t, i) => !value.includes(t) && parts.indexOf(t) === i,
    );
    if (fresh.length > 0) {
      onChange([...value, ...fresh]);
    }
    setInputValue("");
    setShowSuggestions(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        addTag(filtered[highlightIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className="flex flex-wrap items-center gap-1.5 rounded-(--r-2) border border-border px-3 py-2 focus-within:ring-2 focus-within:ring-signal"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-signal-soft px-2.5 py-0.5 text-xs font-medium text-signal-ink"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-signal hover:text-signal-ink"
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          name={name}
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowSuggestions(true);
            setHighlightIndex(-1);
          }}
          onFocus={() => inputValue.trim() && setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : "Type to add more…"}
          className="min-w-[120px] flex-1 border-none bg-transparent py-1 text-sm outline-none placeholder:text-fg-4"
        />
      </div>

      {showSuggestions && filtered.length > 0 && (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-(--r-2) border border-border bg-bg py-1"
          style={{ boxShadow: "var(--shadow-2)" }}
        >
          {filtered.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => addTag(s)}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === highlightIndex
                  ? "bg-signal-soft text-signal-ink"
                  : "text-fg hover:bg-bg-2"
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
