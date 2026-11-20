"use client";

/**
 * Small controls of the program builder page, drawn as the approved
 * walkthrough draws them (create-program-ux-review/walkthrough.html):
 * segmented controls instead of searchable dropdowns for short lists, chips,
 * a week stepper, and the task-type tile. Every control is at least 36px
 * tall, most 40px or more, for the owner's tablet.
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { TASK_TONE_COLORS, type TaskKind, type TaskTone } from "./model";

export const fieldLabel = "text-[13px] font-medium";
export const fieldLabelStyle = { color: "var(--fg-2)" } as const;
export const metaText = "text-[13px]";
export const metaStyle = { color: "var(--fg-3)" } as const;
export const errText = "text-[13px]";
export const errStyle = { color: "var(--danger-ink)" } as const;

export function inputStyle(error = false): React.CSSProperties {
  return {
    minHeight: 44,
    border: `1px solid ${error ? "var(--danger)" : "var(--border-2)"}`,
    borderRadius: 6,
    background: "var(--bg)",
    padding: "0 12px",
    fontSize: 15,
    color: "var(--ink)",
    width: "100%",
  };
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "ink" | "ghost";
  size?: "md" | "sm" | "full";
  /** Looks disabled but stays focusable and clickable (it says why on click). */
  softDisabled?: boolean;
};

/** The walkthrough's .p-btn: ink primary, paper ghost. */
export function Btn({ variant = "ink", size = "md", softDisabled, style, className = "", ...rest }: BtnProps) {
  const ink = variant === "ink";
  const off = softDisabled || rest.disabled;
  return (
    <button
      type="button"
      aria-disabled={softDisabled || undefined}
      className={`inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap ${className}`}
      style={{
        minHeight: size === "sm" ? 36 : size === "full" ? 48 : 44,
        width: size === "full" ? "100%" : undefined,
        padding: size === "sm" ? "0 14px" : "0 18px",
        borderRadius: 6,
        fontSize: size === "sm" ? 13.5 : 15,
        background: off && ink ? "var(--bg-3)" : ink ? "var(--ink)" : "var(--bg)",
        color: off && ink ? "var(--fg-3)" : ink ? "var(--bg)" : "var(--ink)",
        border: ink ? "none" : "1px solid var(--border-2)",
        cursor: rest.disabled ? "default" : "pointer",
        ...style,
      }}
      {...rest}
    />
  );
}

/** Underlined text button (.linkb). */
export function LinkBtn({ danger, style, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { danger?: boolean }) {
  return (
    <button
      type="button"
      className={`text-[14px] underline underline-offset-[3px] ${className}`}
      style={{ color: danger ? "var(--danger-ink)" : "var(--ink)", textDecorationColor: "var(--border-2)", ...style }}
      {...rest}
    />
  );
}

/** Segmented control (.segc): one pressed option, ink when pressed. */
export function Seg<V extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: ReadonlyArray<readonly [V, string]>;
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex flex-wrap self-start max-w-full"
      style={{ background: "var(--bg-3)", borderRadius: 999, padding: 3, gap: 2 }}
    >
      {options.map(([v, l]) => {
        const on = v === value;
        return (
          <button
            key={String(v)}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(v)}
            className="text-[14px]"
            style={{
              minHeight: 38,
              padding: "0 14px",
              borderRadius: 999,
              background: on ? "var(--ink)" : "transparent",
              color: on ? "var(--bg)" : "var(--fg-2)",
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

/** Chip (.chip): ink when pressed. */
export function Chip({ pressed, children, style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className="inline-flex items-center gap-1.5 text-[14px]"
      style={{
        minHeight: 40,
        padding: "0 14px",
        borderRadius: 999,
        border: `1px solid ${pressed ? "var(--ink)" : "var(--border-2)"}`,
        background: pressed ? "var(--ink)" : "var(--bg)",
        color: pressed ? "var(--bg)" : "var(--ink)",
        ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/** − value + stepper (.stepper). */
export function Stepper({
  value,
  text,
  min,
  max,
  lessLabel,
  moreLabel,
  onChange,
}: {
  value: number;
  text: string;
  min: number;
  max: number;
  lessLabel: string;
  moreLabel: string;
  onChange: (v: number) => void;
}) {
  const btn = (d: -1 | 1, label: string, disabled: boolean) => (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(value + d)}
      className="text-[18px]"
      style={{ width: 40, height: 40, color: disabled ? "var(--fg-4)" : "var(--ink)", cursor: disabled ? "default" : "pointer" }}
    >
      {d < 0 ? "−" : "+"}
    </button>
  );
  return (
    <div className="inline-flex items-center self-start" style={{ border: "1px solid var(--border-2)", borderRadius: 6, background: "var(--bg)" }}>
      {btn(-1, lessLabel, value <= min)}
      <span className="text-center font-medium" style={{ minWidth: 84, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }} aria-live="polite">
        {text}
      </span>
      {btn(1, moreLabel, value >= max)}
    </div>
  );
}

// ── Task-type tile ───────────────────────────────────────────────────

const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

/** The walkthrough's task icons (24px grid). */
export function TaskIcon({ kind, water }: { kind: TaskKind; water?: boolean }) {
  if (water) return <svg viewBox="0 0 24 24" {...P}><path d="M12 3.5s6 6.4 6 10.5a6 6 0 0 1-12 0c0-4.1 6-10.5 6-10.5z" /></svg>;
  switch (kind) {
    case "workout":
      return <svg viewBox="0 0 24 24" {...P}><path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11" /></svg>;
    case "habit":
      return <svg viewBox="0 0 24 24" {...P}><path d="M4 12.5l5 5L20 6.5" /></svg>;
    case "checkin":
      return <svg viewBox="0 0 24 24" {...P}><rect x="5" y="3.5" width="14" height="17" rx="2" /><path d="M9 9h6M9 13h6M9 17h3" /></svg>;
    case "measure":
      return <svg viewBox="0 0 24 24" {...P}><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M12 8v3l2-1.5" /></svg>;
    case "meal":
      return <svg viewBox="0 0 24 24" {...P}><path d="M7 3.5v17M4.5 3.5v5a2.5 2.5 0 0 0 5 0v-5M16.5 20.5V3.5c-2 1-3 3.5-3 6.5h3" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" {...P}><path d="M5 5h14M5 10h14M5 15h9" /></svg>;
  }
}

/** 36px round tile in the task type's colour (decorative). */
export function TaskTile({ kind, tone, water }: { kind: TaskKind; tone: TaskTone; water?: boolean }) {
  const c = TASK_TONE_COLORS[tone];
  return (
    <span
      aria-hidden="true"
      data-tone={tone}
      className="flex items-center justify-center shrink-0 [&>svg]:w-[18px] [&>svg]:h-[18px]"
      style={{ width: 36, height: 36, borderRadius: 999, background: c.soft, color: c.ink }}
    >
      <TaskIcon kind={kind} water={water} />
    </span>
  );
}
