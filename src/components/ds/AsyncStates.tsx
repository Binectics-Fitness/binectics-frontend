/**
 * AsyncStates — two lightweight primitives for consistent async UI across dashboards.
 *
 *  <AsyncSpinner />          — inline 20px loader, used inside list/section containers
 *  <AsyncSpinner size="page" />  — centred 40px loader, used as full-area fallback
 *
 *  The loader is the Binectics mark tracing (BrandLoader, as on mobile #243),
 *  not a generic ring.
 *
 *  <EmptySlate message="…" />   — muted empty-state paragraph
 *  <EmptySlate message="…" hint="…" />  — with secondary help text
 *  <EmptySlate message="…" action={<Link …>…</Link>} />  — with the one next step (K15)
 *
 * Both are unstyled wrt background — they inherit the parent container's bg.
 */

import type { ReactNode } from "react";
import { BrandLoader } from "@/components/brand/BrandLoader";

export interface AsyncSpinnerProps {
  /** "inline" (default): 20px loader in a flex row. "page": 40px centred full area. */
  size?: "inline" | "page";
  /** Accessible label. Defaults to "Loading". */
  label?: string;
}

export function AsyncSpinner({ size = "inline", label = "Loading" }: AsyncSpinnerProps) {
  if (size === "page") {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: 240, color: "var(--fg-3)" }}
        role="status"
        aria-label={label}
      >
        <BrandLoader size={40} className="text-ink" />
        <p className="mt-3 text-sm" style={{ color: "var(--fg-3)" }}>{label}…</p>
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2.5 py-4 text-sm"
      style={{ color: "var(--fg-3)" }}
      role="status"
      aria-label={label}
    >
      <BrandLoader size={20} className="shrink-0 text-ink" />
      {label}…
    </div>
  );
}

export interface EmptySlateProps {
  /** Primary message, e.g. "No members found." */
  message: string;
  /** Optional secondary hint shown smaller below the message (may hold a link). */
  hint?: ReactNode;
  /** Extra top margin class. Defaults to "mt-4". */
  mt?: string;
  /**
   * The one thing to do next (design-system K15: one sentence, one action),
   * e.g. a small link or button. Leave it out where silence is earned.
   */
  action?: ReactNode;
}

export function EmptySlate({ message, hint, mt = "mt-4", action }: EmptySlateProps) {
  return (
    <div className={mt}>
      <p className="text-sm" style={{ color: "var(--fg-3)" }}>{message}</p>
      {hint && (
        <p className="text-[13px] mt-1" style={{ color: "var(--fg-4)" }}>{hint}</p>
      )}
      {action != null && action !== false && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}
