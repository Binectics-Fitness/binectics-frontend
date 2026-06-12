/**
 * StatusDot — 6px circle with 4px ring shadow
 * Variants: signal (green), warn (amber), danger (red), muted (gray)
 */
const VARIANTS = {
  signal: { background: "var(--signal)", boxShadow: "0 0 0 4px var(--signal-soft)" },
  warn:   { background: "var(--warn)",   boxShadow: "0 0 0 4px oklch(0.96 0.05 75)" },
  danger: { background: "var(--danger)", boxShadow: "0 0 0 4px var(--danger-soft)" },
  muted:  { background: "var(--fg-3)",   boxShadow: "0 0 0 4px var(--bg-3)" },
} as const;

interface StatusDotProps {
  variant?: keyof typeof VARIANTS;
  size?: number;
  className?: string;
}

export function StatusDot({ variant = "signal", size = 6, className = "" }: StatusDotProps) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, ...VARIANTS[variant] }}
    />
  );
}
