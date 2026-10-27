"use client";

import { useState, useRef, useEffect } from "react";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  loading?: boolean;
  name?: string;
  disabled?: boolean;
  /** id for the trigger button, so a `<label htmlFor>` associates with it (button is a labelable element). */
  id?: string;
}

export default function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
  loading = false,
  name,
  disabled = false,
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Where the open list sits, in viewport coordinates. Fixed positioning lets
  // it escape a card or modal body that clips overflow (the list used to be
  // cut off at the card edge or the modal footer).
  const [panel, setPanel] = useState<React.CSSProperties | null>(null);

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  // A value the options don't (yet) contain still shows as itself, so a
  // saved selection never reads as "nothing chosen" while options load.
  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = wrapperRef.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom;
      const above = r.top;
      // The list is ~ 300px tall at most (search box + 15rem of options).
      const flip = below < 300 && above > below;
      setPanel({
        position: "fixed",
        left: r.left,
        width: r.width,
        ...(flip ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
        maxHeight: Math.max(160, (flip ? above : below) - 12),
      });
    };
    place();
    const onScroll = (e: Event) => {
      // Scrolling the options themselves must not close the list.
      if (panelRef.current?.contains(e.target as Node)) return;
      place();
    };
    window.addEventListener("resize", place);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as HTMLElement;
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightIndex]);

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setSearch("");
    setHighlightIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((p) => Math.min(p + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((p) => Math.max(p - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        select(filtered[highlightIndex].value);
      }
    } else if (e.key === "Escape") {
      // Escape closes only the list, not a dialog the picker sits in:
      // preventDefault marks it handled for document-level dialog handlers
      // that honour defaultPrevented, stopPropagation for bubbling ones.
      // Focus goes back to the trigger, since the search field unmounts.
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
      setSearch("");
      triggerRef.current?.focus();
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      {name && <input type="hidden" name={name} value={value} />}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center justify-between rounded-(--r-2) border border-border bg-bg px-4 py-3 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-signal disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? "text-ink" : "text-fg-4"}>
          {loading ? "Loading…" : selectedLabel || placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-fg-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={panelRef}
          className="z-50 flex flex-col overflow-hidden rounded-(--r-2) border border-border bg-bg"
          style={{ boxShadow: "var(--shadow-2)", ...(panel ?? { position: "absolute", width: "100%", marginTop: 4 }) }}
        >
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search…"
              className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-signal"
            />
          </div>
          <ul ref={listRef} className="max-h-60 min-h-0 overflow-auto py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-fg-4">
                {loading ? "Loading…" : "No results found"}
              </li>
            )}
            {filtered.map((o, i) => (
              <li
                key={o.value}
                onMouseDown={() => select(o.value)}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  o.value === value
                    ? "bg-signal-soft font-medium text-signal-ink"
                    : i === highlightIndex
                      ? "bg-bg-2 text-ink"
                      : "text-fg hover:bg-bg-2"
                }`}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
