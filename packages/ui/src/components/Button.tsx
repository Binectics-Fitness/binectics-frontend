import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary:
        'bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 focus:ring-primary-500',
      secondary:
        'bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700 focus:ring-secondary-500',
      outline:
        'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 active:bg-primary-100 focus:ring-primary-500',
      ghost:
        'text-foreground hover:bg-background-secondary active:bg-background-tertiary focus:ring-primary-500',
      danger:
        'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500',
    };

    const sizes = {
      sm: 'h-9 px-3 text-sm rounded-lg gap-1.5',
      md: 'h-11 px-5 text-base rounded-xl gap-2',
      lg: 'h-14 px-7 text-lg rounded-xl gap-2.5',
    };

    const widthClass = fullWidth ? 'w-full' : '';

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
  }
);

Button.displayName = 'Button';
