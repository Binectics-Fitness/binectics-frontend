import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const widthClass = fullWidth ? 'w-full' : '';

    return (
      <div className={`flex flex-col gap-1.5 ${widthClass}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-tertiary">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              h-11 w-full rounded-xl border-2 bg-background px-4 text-base text-foreground
              transition-colors duration-200
              placeholder:text-foreground-tertiary
              hover:border-foreground-secondary
              focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
              disabled:cursor-not-allowed disabled:opacity-50
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-neutral-300'}
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-tertiary">
              {rightIcon}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={`text-sm ${error ? 'text-red-500' : 'text-foreground-tertiary'}`}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
