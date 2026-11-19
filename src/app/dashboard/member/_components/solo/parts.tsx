"use client";

import type { ReactNode } from "react";
import { Toggle } from "@/components/ds/Toggle";
import styles from "./solo.module.css";

const CHECK = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12l5 5 9-10" />
  </svg>
);

/** A tick the member presses (custom lines). */
export function TickButton({
  done,
  label,
  onToggle,
  disabled,
}: {
  done: boolean;
  label: string;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className={styles.tick} aria-pressed={done} aria-label={label} onClick={onToggle} disabled={disabled}>
      <span className={`${styles.circle} ${done ? styles.circleOn : ""}`}>{CHECK}</span>
    </button>
  );
}

/** A tick that ticks itself from data (tool lines): not a control. */
export function AutoTick({ done, label }: { done: boolean; label: string }) {
  return (
    <span className={`${styles.tick} ${styles.tickStatic}`} role="img" aria-label={`${label}, ${done ? "done" : "not done"}`}>
      <span className={`${styles.circle} ${done ? styles.circleOn : ""}`}>{CHECK}</span>
    </span>
  );
}

/** The solo pages' on/off switch: the design system's Toggle. */
export function Switch(props: { on: boolean; label: string; onChange: (next: boolean) => void; disabled?: boolean }) {
  return <Toggle {...props} />;
}

export function Rail({ fill, aimAt, label }: { fill: number; aimAt: number | null; label: string }) {
  return (
    <div className={styles.rail} role="img" aria-label={label}>
      <i className={styles.railFill} style={{ width: `${fill}%` }} />
      {aimAt !== null && <b className={styles.railAim} style={{ left: `${Math.min(99, aimAt)}%` }} />}
    </div>
  );
}

/** A write the page could not save: says so, and offers the retry. */
export function WriteError({ message, onRetry, onDismiss }: { message: string; onRetry?: () => void; onDismiss?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-(--r-2) p-3 text-[13px]"
      style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}
    >
      <p>{message}</p>
      {(onRetry || onDismiss) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onRetry && (
            <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={onRetry}>
              Try again
            </button>
          )}
          {onDismiss && (
            <button type="button" className={styles.link} onClick={onDismiss}>
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function CardSkeleton({ height = 140 }: { height?: number }) {
  return <div aria-hidden="true" className={styles.skeleton} style={{ height }} />;
}

export function Row({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}
