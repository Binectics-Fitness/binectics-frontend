"use client";

import { ActionModal } from "@/components/ds";
import styles from "./records.module.css";

/** A "Delete this X?" confirm: Keep it (default focus is the safe one) or Delete. */
export function ConfirmDelete({
  open,
  title,
  body,
  busy,
  onKeep,
  onDelete,
}: {
  open: boolean;
  title: string;
  body: string;
  busy?: boolean;
  onKeep: () => void;
  onDelete: () => void;
}) {
  return (
    <ActionModal
      open={open}
      onClose={onKeep}
      title={title}
      size="sm"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={onKeep} disabled={busy}>
            Keep it
          </button>
          <button type="button" className={`btn-ghost-v2 ${styles.dangerBtn}`} onClick={onDelete} disabled={busy} aria-busy={busy}>
            {busy ? "Deleting" : "Delete"}
          </button>
        </div>
      }
    >
      <p className={styles.sub}>{body}</p>
    </ActionModal>
  );
}

/** Loading rows: plain blocks, no numbers. */
export function SkeletonRows({ count, height, label }: { count: number; height: number; label: string }) {
  return (
    <div role="status" aria-label={label} className={styles.stack}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} aria-hidden="true" className={styles.skeleton} style={{ height }} />
      ))}
    </div>
  );
}

/** A read that failed: says so and offers the retry. */
export function LoadError({ title, onRetry, testId }: { title: string; onRetry: () => void; testId: string }) {
  return (
    <div data-testid={testId} className={`${styles.stack} rounded-(--r-3) border border-border bg-bg p-4`}>
      <p className={styles.label} role="alert">
        {title}
      </p>
      <p className={styles.sub}>Try again when you have a connection.</p>
      <div>
        <button type="button" className={`btn-ghost-v2 ${styles.btn}`} onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}
