import React from "react";

/**
 * Input — 34px height, r-2 radius, border-2 border.
 *
 * States:
 *   default:  border-2 border, bg background
 *   hover:    border-2 darkens slightly
 *   focus:    ink border (no ring, no shadow)
 *   error:    danger border, danger helper text
 *   disabled: opacity 50, not-allowed cursor, no hover
 *   required: red asterisk after label
 *
 * Label is mono uppercase eyebrow style.
 */

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      required,
      className = "",
      id,
      ...props
    },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg-3"
          >
            {label}
            {required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-3">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={`
              h-8.5 w-full rounded-(--r-2) border bg-bg px-3 text-[13.5px] text-ink
              placeholder:text-fg-4
              hover:border-border-2
              focus:outline-none focus:border-ink
              disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border-2
              ${error ? "border-danger hover:border-danger focus:border-danger" : "border-border-2"}
              ${leftIcon ? "pl-9" : ""}
              ${rightIcon ? "pr-9" : ""}
              ${className}
            `}
            style={{ fontFamily: "inherit" }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-3">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-[12px] text-danger flex items-center gap-1" role="alert">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-[12px] text-fg-3">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

/**
 * Textarea variant — same styling language, same states.
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helperText, fullWidth = false, required, className = "", id, ...props },
    ref,
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : ""}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-fg-3"
          >
            {label}
            {required && (
              <span className="text-danger ml-0.5" aria-hidden="true">*</span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={error ? "true" : undefined}
          className={`
            w-full rounded-(--r-2) border bg-bg px-3 py-3 text-[14px] text-ink resize-none
            placeholder:text-fg-4
            hover:border-border-2
            focus:outline-none focus:border-ink
            disabled:cursor-not-allowed disabled:opacity-50
            ${error ? "border-danger hover:border-danger focus:border-danger" : "border-border-2"}
            ${className}
          `}
          style={{ fontFamily: "inherit", minHeight: "88px" }}
          {...props}
        />
        {error && (
          <p className="text-[12px] text-danger flex items-center gap-1" role="alert">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
            </svg>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="text-[12px] text-fg-3">{helperText}</p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
