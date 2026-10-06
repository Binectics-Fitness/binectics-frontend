"use client";

/**
 * SuccessTakeover — the dark full-screen check-in success.
 *
 * Owner ruling (Oct 2026): check-in success is a DARK takeover, like the
 * homepage mosaic, not the light checkin.html. It is the one surface allowed
 * celebratory motion; the timeline (ring 50ms, tick 350ms, text rising from
 * ~950ms) and the reduced-motion rule (one 200ms fade) come from
 * checkin.html and live in globals.css under `.takeover*`.
 *
 * Layout: --ink ground; 80px --signal circle with an ink tick; mono status
 * line in --signal; title with one serif-italic word; optional sub line;
 * `children` (e.g. <HeroStatCard surface="raised">); a full-width --bg
 * primary action pinned to the bottom.
 *
 * Accessibility: role="dialog" + aria-modal, labelled by the title and
 * described by the status line. Focus moves to the primary action on open,
 * Tab is kept inside, Escape calls `onDismiss` when given, and focus returns
 * to where it was on close. Page scroll is locked while open.
 */
import Link from "next/link";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { TitleWithEmphasis, type TitleParts } from "./TitleWithEmphasis";

export type TakeoverAction =
  | { label: string; onClick: () => void; href?: never }
  | { label: string; href: string; onClick?: never };

interface SuccessTakeoverProps {
  /** Mono status line, e.g. "Checked in · 14:42". */
  status: string;
  title: TitleParts;
  subtitle?: ReactNode;
  children?: ReactNode;
  primaryAction: TakeoverAction;
  /** Called on Escape. Omit to make Escape do nothing. */
  onDismiss?: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const ACTION_CLASS =
  "flex h-12 w-full items-center justify-center rounded-[var(--r-3)] text-[15px] font-medium focus-visible:outline-2 focus-visible:outline-offset-2";

export function SuccessTakeover({
  status,
  title,
  subtitle,
  children,
  primaryAction,
  onDismiss,
}: SuccessTakeoverProps) {
  const titleId = useId();
  const statusId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const actionRef = useRef<HTMLElement | null>(null);
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    actionRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        dismissRef.current?.();
        return;
      }
      if (e.key !== "Tab" || !rootRef.current) return;
      const focusable = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !rootRef.current.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !rootRef.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous && document.contains(previous)) previous.focus();
    };
  }, []);

  const actionStyle = { background: "var(--bg)", color: "var(--ink)" };

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={statusId}
      className="takeover fixed inset-0 z-[100] flex flex-col overflow-y-auto"
      style={{ background: "var(--ink)", color: "var(--bg)" }}
    >
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <div
          aria-hidden="true"
          className="takeover-ring mb-5.5 flex h-20 w-20 items-center justify-center rounded-full"
          style={{ background: "var(--signal)" }}
        >
          <svg
            className="takeover-tick"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--ink)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        <p
          id={statusId}
          className="takeover-rise font-mono text-[11px] uppercase tracking-[0.06em]"
          style={{ color: "var(--signal)", animationDelay: "950ms" }}
        >
          <span aria-hidden="true">● </span>
          {status}
        </p>

        <TitleWithEmphasis
          {...title}
          as="h2"
          id={titleId}
          className="takeover-rise mt-2.5 text-[32px]"
          style={{ color: "var(--bg)", animationDelay: "1040ms" }}
        />

        {subtitle && (
          <p
            className="takeover-rise mt-2 max-w-[32ch] text-[14px] leading-normal"
            style={{ color: "var(--on-ink-2)", animationDelay: "1180ms" }}
          >
            {subtitle}
          </p>
        )}

        {children && (
          <div className="takeover-rise mt-8 w-full" style={{ animationDelay: "1300ms" }}>
            {children}
          </div>
        )}
      </div>

      <div className="mx-auto w-full max-w-md px-5 pb-7 pt-3">
        {primaryAction.href ? (
          <Link
            ref={(el) => {
              actionRef.current = el;
            }}
            href={primaryAction.href}
            className={ACTION_CLASS}
            style={actionStyle}
          >
            {primaryAction.label}
          </Link>
        ) : (
          <button
            ref={(el) => {
              actionRef.current = el;
            }}
            type="button"
            onClick={primaryAction.onClick}
            className={ACTION_CLASS}
            style={actionStyle}
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
