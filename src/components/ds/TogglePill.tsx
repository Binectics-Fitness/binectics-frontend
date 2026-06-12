"use client";

interface TogglePillProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function TogglePill<T extends string>({ options, value, onChange, label }: TogglePillProps<T>) {
  return (
    <div className="flex items-center gap-3">
      {label && (
        <span className="font-mono text-[11px] uppercase tracking-[0.05em]" style={{ color: "var(--fg-3)" }}>{label}</span>
      )}
      <div className="inline-flex rounded-full" style={{ padding: "4px", background: "var(--bg-2)", border: "1px solid var(--border)" }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="px-4.5 py-2.5 min-h-11 rounded-full text-[13px] font-medium cursor-pointer"
            style={{
              background: value === o.value ? "var(--bg)" : "transparent",
              color: value === o.value ? "var(--ink)" : "var(--fg-3)",
              boxShadow: value === o.value ? "0 1px 2px oklch(0 0 0 / 0.06)" : "none",
              transition: "background var(--motion-fast), color var(--motion-fast)",
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
