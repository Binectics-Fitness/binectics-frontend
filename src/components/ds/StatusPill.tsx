/**
 * StatusPill — semantic dot + label, 4 palettes.
 *
 * From my-bookings.html, client.html, booking-detail.html:
 *   mono 11px, uppercase, 999px radius, 3px 9px padding.
 *   5px dot, currentColor.
 *
 * Variants:
 *   confirmed — signal green
 *   pending   — warm amber
 *   done      — muted neutral
 *   cancelled — danger red
 */

const VARIANT_STYLES = {
  confirmed: {
    color: "var(--signal-ink)",
    background: "var(--signal-soft)",
    border: "1px solid oklch(0.88 0.05 148)",
  },
  pending: {
    color: "oklch(0.45 0.16 65)",
    background: "oklch(0.96 0.06 75)",
    border: "1px solid oklch(0.88 0.07 75)",
  },
  done: {
    color: "var(--fg-3)",
    background: "var(--bg-2)",
    border: "1px solid var(--border)",
  },
  cancelled: {
    color: "var(--danger)",
    background: "var(--danger-soft)",
    border: "1px solid oklch(0.92 0.05 25)",
  },
} as const;

interface StatusPillProps {
  variant: keyof typeof VARIANT_STYLES;
  label: string;
  className?: string;
}

export function StatusPill({ variant, label, className = "" }: StatusPillProps) {
  const s = VARIANT_STYLES[variant];
  return (
    <span
      className={`inline-flex items-center gap-[5px] font-mono text-[11px] uppercase tracking-[0.05em] rounded-full ${className}`}
      style={{ padding: "3px 9px", color: s.color, background: s.background, border: s.border }}
    >
      <span className="w-[5px] h-[5px] rounded-full bg-current" />
      {label}
    </span>
  );
}
