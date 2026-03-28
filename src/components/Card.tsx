import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "bordered" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  accent?: "green" | "blue" | "yellow" | "purple" | "none";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = "default",
      padding = "md",
      interactive = false,
      accent = "none",
      className = "",
      ...props
    },
    ref,
  ) => {
    const variants = {
      default: "bg-background-secondary",
      elevated: "bg-white shadow-[var(--shadow-card)]",
      bordered: "bg-white border border-neutral-200",
      glass:
        "bg-white/80 backdrop-blur-sm border border-neutral-200/60 shadow-[var(--shadow-card)]",
    };

    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    };

    const accentMap = {
      none: "",
      green: "card-accent-green",
      blue: "card-accent-blue",
      yellow: "card-accent-yellow",
      purple: "card-accent-purple",
    };

    const interactiveStyles = interactive
      ? "cursor-pointer hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
      : "transition-shadow duration-300";

    return (
      <div
        ref={ref}
        className={`rounded-xl ${variants[variant]} ${paddings[padding]} ${accentMap[accent]} ${interactiveStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <h3
      className={`text-xl font-semibold text-foreground ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className = "", ...props }) => {
  return (
    <p className={`text-sm text-foreground-secondary ${className}`} {...props}>
      {children}
    </p>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};
