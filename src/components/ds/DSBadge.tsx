/**
 * DSBadge — 22px tall badge with dot indicator
 * Variants: signal, gym, trainer, dietitian, danger, warn, muted
 * Radius: r-1 (3px). Never use as button substitute.
 */
const VARIANTS = {
  signal:    { background: "var(--signal-soft)", color: "var(--signal-ink)", dot: "var(--signal)" },
  gym:       { background: "var(--gym-soft)",    color: "var(--gym)",        dot: "var(--gym)" },
  trainer:   { background: "var(--trainer-soft)", color: "var(--trainer)",   dot: "var(--trainer)" },
  dietitian: { background: "var(--diet-soft)",   color: "var(--diet)",       dot: "var(--diet)" },
  danger:    { background: "var(--danger-soft)", color: "var(--danger)",     dot: "var(--danger)" },
  warn:      { background: "oklch(0.96 0.05 75)", color: "var(--warn)",     dot: "var(--warn)" },
  muted:     { background: "var(--bg-3)",        color: "var(--fg-2)",       dot: "var(--fg-3)" },
} as const;

interface DSBadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  dot?: boolean;
  className?: string;
}

export function DSBadge({ children, variant = "muted", dot = true, className = "" }: DSBadgeProps) {
  const v = VARIANTS[variant];
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-[22px] px-[7px] rounded-[var(--r-1)] text-[11.5px] font-medium whitespace-nowrap ${className}`}
      style={{ background: v.background, color: v.color }}
    >
      {dot && (
        <span
          className="w-[5px] h-[5px] rounded-full shrink-0"
          style={{ background: v.dot }}
        />
      )}
      {children}
    </span>
  );
}
