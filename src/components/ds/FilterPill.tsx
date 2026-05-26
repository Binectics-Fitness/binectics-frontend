/**
 * FilterPill — toggle chip for filter bars
 * Active: ink bg, paper text. Inactive: transparent, border, fg-2 text.
 * Height: 28px, radius: r-2, font: 12.5px
 */
"use client";

interface FilterPillProps {
  label: string;
  count?: string | number;
  active?: boolean;
  onClick?: () => void;
}

export function FilterPill({ label, count, active, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-7 px-2.5 rounded-[var(--r-2)] text-[12.5px] font-medium whitespace-nowrap shrink-0 flex items-center gap-1.5"
      style={{
        background: active ? "var(--ink)" : "transparent",
        color: active ? "var(--bg)" : "var(--fg-2)",
        border: active ? "1px solid var(--ink)" : "1px solid var(--border)",
        transition: "all var(--motion-fast) var(--ease)",
      }}
    >
      {label}
      {count != null && (
        <span
          className="font-mono text-[10.5px]"
          style={{ opacity: active ? 0.7 : 0.5 }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
