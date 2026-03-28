import React from "react";

type AccentColor = "green" | "blue" | "yellow" | "purple";

interface PageHeaderProps {
  title: string;
  description?: string;
  accent?: AccentColor;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  className?: string;
}

const accentLineMap: Record<AccentColor, string> = {
  green: "from-primary-500 to-primary-600",
  blue: "from-accent-blue-500 to-accent-blue-700",
  yellow: "from-accent-yellow-500 to-accent-yellow-700",
  purple: "from-accent-purple-500 to-accent-purple-700",
};

export function PageHeader({
  title,
  description,
  accent = "green",
  actions,
  breadcrumb,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      {breadcrumb && <div className="mb-3">{breadcrumb}</div>}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`hidden h-8 w-1 rounded-full bg-gradient-to-b sm:block ${accentLineMap[accent]}`}
            />
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-1.5 text-sm text-foreground-secondary sm:ml-4 sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-3">{actions}</div>
        )}
      </div>
    </div>
  );
}
