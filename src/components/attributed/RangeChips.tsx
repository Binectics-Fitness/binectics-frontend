"use client";

import { RANGE_OPTIONS, type RangeKey } from "@/lib/attributedRevenue/helpers";

export function RangeChips({ value, onChange }: { value: RangeKey; onChange: (key: RangeKey) => void }) {
  return (
    <div role="radiogroup" aria-label="Date range" className="flex flex-wrap gap-2">
      {RANGE_OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={o.key === value}
          onClick={() => onChange(o.key)}
          className="px-3 py-1.5 rounded-full text-[13px]"
          style={{
            border: "1px solid var(--border-2)",
            background: o.key === value ? "var(--ink)" : "transparent",
            color: o.key === value ? "var(--bg)" : "var(--fg-2)",
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
