/**
 * Eyebrow — mono uppercase label above a title, value or section.
 *
 * One spec everywhere (matches the `.eyebrow` class and the mosaic):
 * Geist Mono 11px, uppercase, letter-spacing .06em.
 * Tone: default --fg-3, muted --fg-4, onInk --on-ink-3 (on dark surfaces).
 */
import type { ElementType, ReactNode } from "react";

export type EyebrowTone = "default" | "muted" | "onInk";

const TONE_COLOR: Record<EyebrowTone, string> = {
  default: "var(--fg-3)",
  muted: "var(--fg-4)",
  onInk: "var(--on-ink-3)",
};

interface EyebrowProps {
  children: ReactNode;
  tone?: EyebrowTone;
  /** @deprecated use tone="muted" */
  muted?: boolean;
  /** Element to render; a div by default. */
  as?: ElementType;
  id?: string;
  /** With as="label": the control this labels. */
  htmlFor?: string;
  className?: string;
}

export function Eyebrow({ children, tone, muted, as: Tag = "div", id, htmlFor, className = "" }: EyebrowProps) {
  const resolved: EyebrowTone = tone ?? (muted ? "muted" : "default");
  return (
    <Tag
      id={id}
      htmlFor={htmlFor}
      data-tone={resolved}
      className={`font-mono text-[11px] uppercase tracking-[0.06em] ${className}`}
      style={{ color: TONE_COLOR[resolved] }}
    >
      {children}
    </Tag>
  );
}
