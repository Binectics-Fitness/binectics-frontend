/**
 * PageHeader — eyebrow + page H1 + optional subtitle and actions.
 *
 * `title` is either plain text or TitleParts (one serif-italic word, see
 * TitleWithEmphasis). It deliberately does not take arbitrary markup, so the
 * one-serif-word rule can't be bypassed with a hand-written <em>.
 */
import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";
import { TitleWithEmphasis, type TitleParts } from "./TitleWithEmphasis";

interface PageHeaderProps {
  title: string | TitleParts;
  /** Mono line above the title, e.g. "Tuesday · 6 Oct". */
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  /** Buttons or links aligned to the title's right on wide screens. */
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, eyebrow, subtitle, actions, className = "" }: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6 ${className}`}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-2">{eyebrow}</Eyebrow>}
        {typeof title === "string" ? (
          <h1
            className="text-[30px] font-medium leading-[1.1]"
            style={{ color: "var(--ink)", letterSpacing: "-0.024em" }}
          >
            {title}
          </h1>
        ) : (
          <TitleWithEmphasis {...title} />
        )}
        {subtitle && (
          <p className="text-[14px] mt-1.5" style={{ color: "var(--fg-3)" }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
}
