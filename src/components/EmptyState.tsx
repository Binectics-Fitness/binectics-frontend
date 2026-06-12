import React from "react";

/**
 * EmptyState — a sentence and one action, no illustrations.
 * Don't decorate. Don't use emoji. Plain, useful, slightly dry.
 */

export interface EmptyStateProps {
  message?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  compact?: boolean;
  /** @deprecated Ignored — design system uses ink/bg only */
  accent?: string;
}

export function EmptyState({
  message,
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  compact = false,
}: EmptyStateProps) {
  if (!title && !description && message) {
    return (
      <p className="text-[13.5px] text-center py-4" style={{ color: "var(--fg-3)" }}>
        {message}
      </p>
    );
  }

  return (
    <div
      className={`flex flex-col items-center text-center ${
        compact ? "py-8 px-4" : "py-14 px-6"
      }`}
    >
      {icon && (
        <div
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-[var(--r-3)]"
          style={{ background: "var(--bg-2)", color: "var(--fg-3)" }}
        >
          {icon}
        </div>
      )}
      {title && (
        <h3
          className={`font-medium ${compact ? "text-[14px]" : "text-[16px]"}`}
          style={{ color: "var(--ink)", letterSpacing: "-0.01em" }}
        >
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-1.5 max-w-sm text-[13.5px]" style={{ color: "var(--fg-3)" }}>
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className="mt-5 inline-flex items-center gap-1.5 h-[34px] px-[14px] rounded-[var(--r-2)] text-[13.5px] font-medium"
          style={{
            background: "var(--ink)",
            color: "var(--bg)",
            letterSpacing: "-0.005em",
            transition: "background var(--motion-fast) var(--ease)",
          }}
        >
          {actionLabel}
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      )}
    </div>
  );
}
