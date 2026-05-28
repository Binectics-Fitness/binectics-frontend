"use client";

import { useRef, useEffect } from "react";

interface DSCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  indeterminate?: boolean;
  className?: string;
}

export function DSCheckbox({ checked, onChange, indeterminate, className = "" }: DSCheckboxProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = !!indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={`h-3.5 w-3.5 cursor-pointer appearance-none rounded-[3px] border-2 border-border-2 bg-bg transition-colors checked:border-ink checked:bg-ink indeterminate:border-ink indeterminate:bg-ink ${className}`}
      style={{
        backgroundImage: checked
          ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 4.5L5.5 10L3 7.5' stroke='%23faf8f5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")"
          : indeterminate
            ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 14 14' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M3.5 7h7' stroke='%23faf8f5' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E\")"
            : undefined,
        backgroundSize: "100%",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        transitionDuration: "var(--motion-fast)",
      }}
    />
  );
}
