/**
 * Sparkline — a small inline SVG trend.
 *
 * Draws only the points it is given: non-finite values are dropped, nothing
 * is interpolated or padded, and fewer than two real points draws nothing
 * (a single point is not a trend).
 *
 * bars (default): the desktop KPI mock — muted bars from zero, the latest in ink.
 * line: a 1.5px ink line scaled to the data's own range, dot on the latest point.
 */
import type { ReactNode } from "react";

interface SparklineProps {
  values: readonly number[];
  /** Accessible description, e.g. "Revenue, last 12 weeks". */
  label: string;
  variant?: "bars" | "line";
  width?: number;
  height?: number;
  className?: string;
}

const BAR_GAP = 2;
/** Line inset so the stroke and end dot aren't clipped. */
const LINE_PAD = 2;

export function Sparkline({
  values,
  label,
  variant = "bars",
  width = 96,
  height = 28,
  className = "",
}: SparklineProps) {
  const points = values.filter((v) => Number.isFinite(v));
  if (points.length < 2) return null;

  const last = points.length - 1;
  let body: ReactNode;

  if (variant === "bars") {
    // Bars read as quantities, so they start at zero (or the lowest negative).
    const min = Math.min(0, ...points);
    const span = Math.max(...points) - min || 1;
    const barW = Math.max(1, (width - BAR_GAP * last) / points.length);
    body = points.map((v, i) => {
      const h = Math.max(1, ((v - min) / span) * height);
      return (
        <rect
          key={i}
          data-bar
          x={i * (barW + BAR_GAP)}
          y={height - h}
          width={barW}
          height={h}
          rx={1}
          fill={i === last ? "var(--ink)" : "var(--border-2)"}
        />
      );
    });
  } else {
    const min = Math.min(...points);
    const span = Math.max(...points) - min || 1;
    const x = (i: number) => LINE_PAD + (i * (width - LINE_PAD * 2)) / last;
    const y = (v: number) => LINE_PAD + (1 - (v - min) / span) * (height - LINE_PAD * 2);
    const d = points.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
    body = (
      <>
        <path d={d} fill="none" stroke="var(--ink)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={x(last)} cy={y(points[last])} r={2} fill="var(--ink)" />
      </>
    );
  }

  return (
    <svg
      role="img"
      aria-label={label}
      data-variant={variant}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`block shrink-0 ${className}`}
    >
      {body}
    </svg>
  );
}
