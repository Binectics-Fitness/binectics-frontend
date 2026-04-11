import React from "react";
import Link from "next/link";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "accent-blue"
    | "accent-yellow"
    | "accent-purple"
    | "outline-neutral";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const baseStyles =
  "inline-flex items-center justify-center font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2";

const variants = {
  primary:
    "bg-primary-500 text-foreground hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500 shadow-button",
  secondary:
    "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 focus:ring-secondary-500",
  outline:
    "border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500",
  "outline-neutral":
    "border-2 border-neutral-200 text-foreground-secondary hover:bg-neutral-50 active:bg-neutral-100 focus:ring-neutral-300",
  ghost:
    "text-foreground hover:bg-background-secondary active:bg-background-tertiary focus:ring-primary-500",
  danger:
    "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500",
  "accent-blue":
    "bg-accent-blue-500 text-white hover:bg-accent-blue-600 active:bg-accent-blue-700 focus:ring-accent-blue-500 shadow-button",
  "accent-yellow":
    "bg-accent-yellow-500 text-foreground hover:bg-accent-yellow-600 active:bg-accent-yellow-700 focus:ring-accent-yellow-500 shadow-button",
  "accent-purple":
    "bg-accent-purple-500 text-white hover:bg-accent-purple-600 active:bg-accent-purple-700 focus:ring-accent-purple-500 shadow-button",
};

const sizes = {
  sm: "h-9 px-3 text-sm rounded-lg gap-1.5",
  md: "h-11 px-5 text-sm rounded-lg gap-2",
  lg: "h-14 px-7 text-base rounded-lg gap-2.5",
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
      ...props
    },
    ref,
  ) => {
    const widthClass = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
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

export interface LinkButtonProps extends Omit<
  React.AnchorHTMLAttributes<HTMLAnchorElement>,
  "href"
> {
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
  ...props
}: LinkButtonProps) {
  const widthClass = fullWidth ? "w-full" : "";

  return (
    <Link
      href={href}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {leftIcon && <span className="inline-flex">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="inline-flex">{rightIcon}</span>}
    </Link>
  );
}
