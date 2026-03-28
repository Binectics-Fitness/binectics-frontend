import React from "react";

type AccentColor = "green" | "blue" | "yellow" | "purple";

export interface EmptyStateProps {
  message?: string;
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: React.ReactNode;
  accent?: AccentColor;
  compact?: boolean;
}

const iconBgMap: Record<AccentColor, string> = {
  green: "icon-glow-green",
  blue: "icon-glow-blue",
  yellow: "icon-glow-yellow",
  purple: "icon-glow-purple",
};

const ctaBgMap: Record<AccentColor, string> = {
  green: "bg-primary-500 hover:bg-primary-600",
  blue: "bg-accent-blue-500 hover:bg-accent-blue-600",
  yellow: "bg-accent-yellow-500 hover:bg-accent-yellow-600",
  purple: "bg-accent-purple-500 hover:bg-accent-purple-600",
};

const defaultIcon = (
  <svg
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
    />
  </svg>
);

export function EmptyState({
  message,
  title,
  description,
  actionLabel,
  actionHref,
  icon,
  accent = "green",
  compact = false,
}: EmptyStateProps) {
  if (!title && !description && message) {
    return (
      <p className="text-sm text-foreground-tertiary text-center py-4">
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
      <div
        className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${iconBgMap[accent]}`}
      >
        {icon || defaultIcon}
      </div>
      {title && (
        <h3
          className={`font-semibold text-foreground ${
            compact ? "text-base" : "text-lg"
          }`}
        >
          {title}
        </h3>
      )}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-foreground-secondary">
          {description}
        </p>
      )}
      {actionLabel && actionHref && (
        <a
          href={actionHref}
          className={`mt-5 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-foreground transition-colors ${ctaBgMap[accent]}`}
        >
          {actionLabel}
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
        </a>
      )}
    </div>
  );
}
