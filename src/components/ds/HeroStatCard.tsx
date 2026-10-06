/**
 * HeroStatCard — the dark headline number (streak, "Day N of M").
 *
 * Flat --ink card (no gradient), --r-3 corners like every product card.
 * `surface="raised"` draws it on --ink-2 for use inside a dark takeover.
 * Eyebrow --on-ink-3, value --bg, sub line --on-ink-2, optional signal
 * ProgressBar and a mono footnote under it.
 *
 * Every number on it must be real; omit `progress` rather than invent a target.
 * `align="center"` centres every line (used inside SuccessTakeover).
 */
import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { ProgressBar } from "./ProgressBar";

export interface HeroProgress {
  value: number;
  max: number;
  /** Accessible name of the bar. */
  label: string;
  valueText?: string;
}

interface HeroStatCardProps {
  eyebrow: string;
  value: ReactNode;
  /** e.g. "days". */
  unit?: string;
  /** Line under the value. */
  sub?: ReactNode;
  progress?: HeroProgress;
  /** Mono line under the bar, e.g. "18 days to the 50-day milestone". */
  footnote?: ReactNode;
  surface?: "ink" | "raised";
  align?: "start" | "center";
  className?: string;
}

export function HeroStatCard({
  eyebrow,
  value,
  unit,
  sub,
  progress,
  footnote,
  surface = "ink",
  align = "start",
  className = "",
}: HeroStatCardProps) {
  const centred = align === "center";
  return (
    <section
      data-surface={surface}
      data-align={align}
      className={`rounded-[var(--r-3)] px-5.5 py-5 ${centred ? "text-center" : ""} ${className}`}
      style={{ background: surface === "raised" ? "var(--ink-2)" : "var(--ink)", color: "var(--bg)" }}
    >
      <Eyebrow tone="onInk">{eyebrow}</Eyebrow>
      <div data-hero-row className={`flex items-baseline gap-1.5 mt-1.5 ${centred ? "justify-center" : ""}`}>
        <span
          data-hero-value
          className="text-[44px] font-medium leading-none"
          style={{ letterSpacing: "-0.026em", fontVariantNumeric: "tabular-nums" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[14px]" style={{ color: "var(--on-ink-3)" }}>
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <p className="text-[13.5px] mt-2" style={{ color: "var(--on-ink-2)" }}>
          {sub}
        </p>
      )}
      {progress && (
        <ProgressBar
          surface={surface}
          value={progress.value}
          max={progress.max}
          label={progress.label}
          valueText={progress.valueText}
          className="mt-4"
        />
      )}
      {footnote && (
        <Eyebrow tone="onInk" className="mt-2">
          {footnote}
        </Eyebrow>
      )}
    </section>
  );
}
