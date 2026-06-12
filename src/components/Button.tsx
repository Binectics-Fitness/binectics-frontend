import React from "react";
import Link from "next/link";

/**
 * Button — three intents only.
 *
 * primary: ink background, paper text — most actions
 * signal:  green — ONE per page, the single most important action
 * ghost:   transparent + border — everything else
 *
 * No animations. Only hover/active color transitions at 120ms.
 */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "signal" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-[6px] whitespace-nowrap font-medium disabled:opacity-50 disabled:cursor-not-allowed";

const variantStyles = {
  primary:
    "bg-ink hover:bg-[oklch(0.08_0.008_80)]",
  signal:
    "bg-signal hover:bg-[oklch(0.62_0.17_148)]",
  ghost:
    "bg-transparent border border-border hover:bg-bg-2 hover:border-border-2",
  danger:
    "bg-danger hover:bg-[oklch(0.52_0.18_25)]",
};

const variantColors: Record<string, string> = {
  primary: "var(--bg)",
  signal: "var(--signal-ink)",
  ghost: "var(--fg-2)",
  danger: "#ffffff",
};

const sizeStyles = {
  sm: "h-[28px] px-[10px] text-[12.5px] rounded-[var(--r-2)]",
  md: "h-[34px] px-[14px] text-[13.5px] rounded-[var(--r-2)]",
  lg: "h-[42px] px-[18px] text-[14px] rounded-[var(--r-2)]",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
        style={{ letterSpacing: "-0.005em", color: variantColors[variant], ...style }}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";

/* ------------------------------------------------------------------ */
/*  LinkButton – renders a Next.js <Link> with Button styling         */
/* ------------------------------------------------------------------ */

export interface LinkButtonProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function LinkButton({
  children,
  href,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = "",
  style,
  ...props
}: LinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      style={{ letterSpacing: "-0.005em", color: variantColors[variant], ...style }}
      {...props}
    >
      {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </Link>
  );
}
