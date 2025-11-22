interface InputProps {
  label: string;
  type?: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  helperText?: string;
}

export default function Input({
  label,
  type = 'text',
  name,
  placeholder,
  required = false,
  value,
  onChange,
  error,
  helperText,
}: InputProps) {
  return (
    <div className="w-full">
      <label htmlFor={name} className="block text-sm font-semibold text-foreground mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full h-12 rounded-lg border-2 ${
          error
            ? 'border-red-500 focus:border-red-500'
            : 'border-neutral-300 focus:border-accent-blue-500'
        } bg-background px-4 text-base text-foreground placeholder:text-foreground-tertiary transition-colors duration-200 focus:outline-none`}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-foreground-tertiary">{helperText}</p>
      )}
    </div>
  );
}
