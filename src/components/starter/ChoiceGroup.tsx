"use client";

import { useRef } from "react";

interface ChoiceGroupProps<T extends string | number> {
  /** Accessible name of the group. */
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | null;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * A single-choice radio group drawn as chips. Real radio semantics: one tab
 * stop (the selected chip, else the first), arrow keys move and select, the
 * selected chip is ink. 44px tall so it works with a thumb at 390px.
 */
export function ChoiceGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
  className = "",
}: ChoiceGroupProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);
  const tabStop = selectedIndex >= 0 ? selectedIndex : 0;

  const move = (from: number, step: number) => {
    const next = (from + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div role="radiogroup" aria-label={label} className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={String(o.value)}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className="min-h-11 rounded-full px-4 text-[14px] font-medium cursor-pointer"
            style={{
              background: on ? "var(--ink)" : "var(--bg)",
              color: on ? "var(--bg)" : "var(--ink)",
              border: `1px solid ${on ? "var(--ink)" : "var(--border-2)"}`,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
