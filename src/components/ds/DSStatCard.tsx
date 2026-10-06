/**
 * DSStatCard — KPI stat card. Label above value (the mosaic layout).
 *
 * Card: --bg, 1px --border, --r-3 (the product card, not the mockup's
 * borderless white phone cards).
 * Value sizes: sm 24px (stat pair), md 28px (KPI, default), lg 32px (desktop KPI).
 *
 * Delta colour is meaning-neutral by default. A change is only "positive" or
 * "negative" when the caller knows which way is good — weight down is not
 * good for everyone — so pass deltaTone explicitly when it is.
 *
 * The card is a size container: below 16rem wide (a 2-up grid on a phone)
 * the sparkline drops under the value so the delta keeps its one line.
 */
import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { Sparkline } from "./Sparkline";
import { StatusDot } from "./StatusDot";

export type StatCardSize = "sm" | "md" | "lg";
export type DeltaTone = "neutral" | "positive" | "negative";

const VALUE_SIZE: Record<StatCardSize, number> = { sm: 24, md: 28, lg: 32 };

const DELTA_COLOR: Record<DeltaTone, string> = {
  neutral: "var(--fg-3)",
  positive: "var(--signal-ink)",
  negative: "var(--danger-ink)",
};

interface DSStatCardProps {
  label: string;
  value: ReactNode;
  /** Unit after the value, e.g. "kg", "days", "/ 32 slots". */
  unit?: string;
  /** Context line under the value, e.g. "↓ 1.8 · 30d" or "Last: 2 Oct". */
  delta?: ReactNode;
  deltaTone?: DeltaTone;
  size?: StatCardSize;
  dot?: "signal" | "warn" | "danger" | "muted";
  /** Real data points for a trailing sparkline; needs ≥2 to draw. */
  spark?: readonly number[];
  /** Accessible description of the sparkline; defaults to the label. */
  sparkLabel?: string;
  className?: string;
}

export function DSStatCard({
  label,
  value,
  unit,
  delta,
  deltaTone = "neutral",
  size = "md",
  dot,
  spark,
  sparkLabel,
  className = "",
}: DSStatCardProps) {
  return (
    <div
      data-size={size}
      className={`@container rounded-[var(--r-3)] px-4.5 py-4 ${className}`}
      style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2 mb-2">
        {dot && <StatusDot variant={dot} size={6} />}
        <Eyebrow as="span">{label}</Eyebrow>
      </div>
      <div className="flex flex-col gap-2.5 @[16rem]:flex-row @[16rem]:items-end @[16rem]:justify-between @[16rem]:gap-3">
        <div className="min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span
              data-stat-value
              className="font-medium leading-none"
              style={{
                fontSize: VALUE_SIZE[size],
                color: "var(--ink)",
                letterSpacing: "-0.024em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </span>
            {unit && (
              <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                {unit}
              </span>
            )}
          </div>
          {delta && (
            <div
              data-delta={deltaTone}
              className="font-mono text-[12px] mt-1.5 truncate whitespace-nowrap"
              style={{ color: DELTA_COLOR[deltaTone], fontVariantNumeric: "tabular-nums" }}
            >
              {delta}
            </div>
          )}
        </div>
        {spark && <Sparkline values={spark} label={sparkLabel ?? label} />}
      </div>
    </div>
  );
}
