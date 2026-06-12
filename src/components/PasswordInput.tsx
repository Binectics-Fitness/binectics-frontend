"use client";

import { useState, forwardRef } from "react";
import { Eye, EyeOff } from "lucide-react";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, error, helperText, className = "", ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            className="font-mono text-[10.5px] uppercase tracking-[0.05em]"
            style={{ color: "var(--fg-3)" }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={visible ? "text" : "password"}
            className={`w-full h-[34px] px-3 text-[13.5px] rounded-[var(--r-2)] outline-none ${className}`}
            style={{
              border: `1px solid ${error ? "var(--danger)" : "var(--border-2)"}`,
              background: "var(--bg)",
              color: "var(--ink)",
              transition: "border-color var(--motion-fast) var(--ease)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--ink)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? "var(--danger)" : "var(--border-2)";
            }}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-[var(--r-1)]"
            style={{ color: "var(--fg-3)", transition: "color var(--motion-fast) var(--ease)" }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--fg-3)"; }}
            tabIndex={-1}
          >
            {visible ? <EyeOff size={15} strokeWidth={1.5} /> : <Eye size={15} strokeWidth={1.5} />}
          </button>
        </div>
        {error && (
          <span className="text-[12px]" style={{ color: "var(--danger)" }}>{error}</span>
        )}
        {helperText && !error && (
          <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>{helperText}</span>
        )}
      </div>
    );
  }
);

PasswordInput.displayName = "PasswordInput";
