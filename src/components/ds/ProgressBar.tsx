/**
 * ProgressBar — 6px signal bar (progress toward a real target).
 *
 * `surface` is what the bar sits ON; the track is one step away from it:
 *   light  (default) on --bg / --bg-2   track --bg-3
 *   ink    on --ink  (HeroStatCard)     track --ink-2
 *   raised on --ink-2 (card in a takeover) track --ink
 * Fill: --signal. Against the light track --signal is only 2.30:1 (non-text
 * needs 3:1), so there the fill gets a 1px --signal-ink inner outline; on
 * the dark tracks it is 5.05:1 (--ink-2) and 7.37:1 (--ink) and draws plain.
 * Accessible as role="progressbar" with aria-valuenow/min/max and a label.
 */
export type ProgressSurface = "light" | "ink" | "raised";

const TRACK: Record<ProgressSurface, string> = {
  light: "var(--bg-3)",
  ink: "var(--ink-2)",
  raised: "var(--ink)",
};

interface ProgressBarProps {
  value: number;
  /** Defaults to 100. */
  max?: number;
  /** Accessible name, e.g. "Progress to the 50-day milestone". */
  label: string;
  /** Spoken value when a number alone is unclear, e.g. "32 of 50 days". */
  valueText?: string;
  surface?: ProgressSurface;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  label,
  valueText,
  surface = "light",
  className = "",
}: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const now = Math.min(Math.max(Number.isFinite(value) ? value : 0, 0), safeMax);
  const pct = (now / safeMax) * 100;
  const outlined = surface === "light" && pct > 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-valuenow={now}
      aria-valuetext={valueText}
      data-surface={surface}
      className={`h-1.5 w-full overflow-hidden rounded-[var(--r-1)] ${className}`}
      style={{ background: TRACK[surface] }}
    >
      <div
        data-fill
        className="h-full rounded-[var(--r-1)]"
        style={{
          width: `${pct}%`,
          background: "var(--signal)",
          ...(outlined ? { outline: "1px solid var(--signal-ink)", outlineOffset: -1 } : null),
        }}
      />
    </div>
  );
}
