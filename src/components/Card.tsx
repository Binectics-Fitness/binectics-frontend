import React from "react";

/**
 * Card — 10px radius, 1px border, no shadows.
 *
 * card:      white bg + border (default)
 * card-flat: bg-2 + border (sections, sidebars)
 *
 * No hover lift. No accent borders. No gradients.
 */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
}

const variantStyles = {
  default: "bg-bg border border-border rounded-(--r-3)",
  flat: "bg-bg-2 border border-border rounded-(--r-3)",
};

const paddingStyles = {
  none: "",
  sm: "p-3.5",
  md: "p-4.5",
  lg: "p-7",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "none",
      interactive = false,
      className = "",
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${paddingStyles[padding]} overflow-hidden ${
          interactive ? "cursor-pointer hover:border-ink" : ""
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export function CardHead({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between px-4.5 py-3.5 border-b border-border ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeadTitle({
  children,
  sub,
  className = "",
}: {
  children: React.ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h3 className="text-[14px] font-medium text-ink" style={{ letterSpacing: "-0.005em" }}>
        {children}
      </h3>
      {sub && <div className="text-[12px] text-fg-3">{sub}</div>}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-4.5 ${className}`} {...props}>
      {children}
    </div>
  );
}
