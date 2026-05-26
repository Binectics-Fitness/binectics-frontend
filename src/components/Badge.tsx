import React from "react";

/**
 * Badge — status, type, and category indicators.
 * 22px tall. Never as a button substitute.
 *
 * Variants: default, signal, gym, trainer, dietitian, danger
 */

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "signal" | "gym" | "trainer" | "dietitian" | "danger";
  dot?: boolean;
  dotColor?: string;
}

const variantStyles = {
  default:
    "bg-bg-3 text-fg-2 border-border",
  signal:
    "bg-signal-soft text-signal-ink border-[oklch(0.88_0.05_148)]",
  gym:
    "bg-gym-soft text-gym border-[oklch(0.88_0.04_248)]",
  trainer:
    "bg-trainer-soft text-[oklch(0.45_0.12_75)] border-[oklch(0.88_0.05_75)]",
  dietitian:
    "bg-dietitian-soft text-dietitian border-[oklch(0.88_0.04_300)]",
  danger:
    "bg-danger-soft text-danger border-[oklch(0.88_0.05_25)]",
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { children, variant = "default", dot = false, dotColor, className = "", ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.25 h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium border ${variantStyles[variant]} ${className}`}
        style={{ letterSpacing: "-0.005em" }}
        {...props}
      >
        {dot && (
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ backgroundColor: dotColor || "currentColor" }}
          />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
