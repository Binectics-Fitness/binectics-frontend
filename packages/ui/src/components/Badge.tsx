import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, variant = 'primary', size = 'md', className = '', ...props }, ref) => {
    const variants = {
      primary: 'bg-primary-100 text-primary-700 border-primary-200',
      secondary: 'bg-secondary-100 text-secondary-700 border-secondary-200',
      success: 'bg-green-100 text-green-700 border-green-200',
      warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      error: 'bg-red-100 text-red-700 border-red-200',
      neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    };

    const sizes = {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-2.5 py-1',
    };

    return (
      <span
        ref={ref}
        className={`inline-flex items-center justify-center rounded-full border font-medium ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
