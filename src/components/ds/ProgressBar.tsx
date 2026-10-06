/**
 * ProgressBar — 6px signal bar (progress toward a real target).
 *
 * Track: --bg-3 on light surfaces, --ink-2 on ink (`onInk`). Fill: --signal.
 * On light surfaces --signal is only 2.30:1 against the track (non-text
 * needs 3:1), so the fill gets a 1px --signal-ink inner outline there; on
 * ink the fill is already 5.05:1 and draws plain.
 * Accessible as role="progressbar" with aria-valuenow/min/max and a label.
 */
interface ProgressBarProps {
  value: number;
  /** Defaults to 100. */
  max?: number;
  /** Accessible name, e.g. "Progress to the 50-day milestone". */
  label: string;
  /** Spoken value when a number alone is unclear, e.g. "32 of 50 days". */
  valueText?: string;
  onInk?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, label, valueText, onInk, className = "" }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const now = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), safeMax);
  const pct = (now / safeMax) * 100;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={now}
      aria-valuetext={valueText}
      className={`h-1.5 w-full overflow-hidden rounded-[var(--r-1)] ${className}`}
      style={{ background: onInk ? "var(--ink-2)" : "var(--bg-3)" }}
    >
      <div
        data-fill
        className="h-full rounded-[var(--r-1)]"
        style={{
          width: `${pct}%`,
          background: "var(--signal)",
          ...(onInk || pct === 0 ? null : { outline: "1px solid var(--signal-ink)", outlineOffset: -1 }),
        }}
      />
    </div>
  );
}
