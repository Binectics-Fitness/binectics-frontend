import React from "react";

type AccentColor = "green" | "blue" | "yellow" | "purple";

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: AccentColor;
  change?: { value: string; positive?: boolean };
  className?: string;
}

const iconGlowMap: Record<AccentColor, string> = {
  green: "icon-glow-green",
  blue: "icon-glow-blue",
  yellow: "icon-glow-yellow",
  purple: "icon-glow-purple",
};

const accentBorderMap: Record<AccentColor, string> = {
  green: "card-accent-green",
  blue: "card-accent-blue",
  yellow: "card-accent-yellow",
  purple: "card-accent-purple",
};

export function StatCard({
  label,
  value,
  icon,
  accent = "green",
  change,
  className = "",
}: StatCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-xl bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 ${accentBorderMap[accent]} ${className}`}
      style={{
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 gradient-section-green" />

      <div className="relative flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground-secondary">{label}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {change && (
            <p
              className={`mt-1.5 text-sm font-medium ${
                change.positive ? "text-green-600" : "text-red-500"
              }`}
            >
              {change.positive ? "↑" : "↓"} {change.value}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${iconGlowMap[accent]}`}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
