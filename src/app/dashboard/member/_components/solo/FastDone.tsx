"use client";

import Link from "next/link";
import { useState } from "react";
import { DSCard } from "@/components/ds";
import type { FastSession } from "@/lib/api/fasting";
import {
  DONE_EYEBROW,
  DONE_NEXT_TITLE,
  DONE_UNDO_NOTE,
  EXPIRED_BODY,
  EXPIRED_BUTTON,
  EXPIRED_LABEL,
  EXPIRED_TITLE,
  SEE_HISTORY,
  UNDO,
  doneTitle,
  goalLine,
} from "@/lib/solo/fastingCopy";
import {
  HOUR_MS,
  MAX_ELAPSED_MS,
  canUndo,
  durationText,
  fromLocalInput,
  shortBy,
  toLocalInput,
  toMs,
} from "@/lib/solo/fastingRules";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { WriteError } from "./parts";
import styles from "./fasting.module.css";

/** Fast ended (design 05): saved, with Undo while the API still allows it. */
export function FastDone({
  fast,
  nowMs,
  onUndo,
  undoing,
  error,
  onEdit,
}: {
  fast: FastSession;
  nowMs: number;
  onUndo: () => void;
  undoing: boolean;
  error: string | null;
  onEdit: () => void;
}) {
  const duration = fast.ended_at ? toMs(fast.ended_at) - toMs(fast.started_at) : 0;
  const offerUndo = canUndo(fast, nowMs);
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[1.4fr_1fr]" data-testid="fast-done">
      <DSCard className="p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          {DONE_EYEBROW}
        </p>
        <h2 className="mt-2 text-[28px] font-medium" style={{ color: "var(--ink)" }} role="status">
          {doneTitle(durationText(duration))}
        </h2>
        <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
          {goalLine(fast.target_hours, shortBy(fast))}
        </p>
        {offerUndo && (
          <p className="mt-3 text-[14px]" style={{ color: "var(--fg-2)" }}>
            {DONE_UNDO_NOTE}
          </p>
        )}
        {error && (
          <div className="mt-3">
            <WriteError message={error} />
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {offerUndo && (
            <button type="button" className="btn-primary-v2" style={{ height: 44 }} onClick={onUndo} disabled={undoing}>
              {UNDO}
            </button>
          )}
          <Link href={SOLO_HREFS.fastingHistory} className="btn-ghost-v2" style={{ height: 44 }}>
            {SEE_HISTORY}
          </Link>
          <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={onEdit}>
            Edit times or add a note
          </button>
        </div>
      </DSCard>
      <DSCard className="p-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Next
        </p>
        <h3 className="mt-1 text-[16px] font-medium" style={{ color: "var(--ink)" }}>
          {DONE_NEXT_TITLE}
        </h3>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--fg-3)" }}>
          Nothing is due. Start when you like.
        </p>
      </DSCard>
    </div>
  );
}

/**
 * A fast past 24 hours (design 05, "Past 24 hours"): never extended, never
 * deleted. The member says when they really stopped and it is saved to history.
 */
export function FastClosePast({
  fast,
  nowMs,
  onClose,
  pending,
  error,
}: {
  fast: FastSession;
  nowMs: number;
  onClose: (endedAtIso: string) => void;
  pending: boolean;
  error: string | null;
}) {
  const startMs = toMs(fast.started_at);
  const latest = Math.min(nowMs, startMs + MAX_ELAPSED_MS);
  const [value, setValue] = useState(() => toLocalInput(Math.min(startMs + fast.target_hours * HOUR_MS, latest)));
  const ms = fromLocalInput(value);
  const problem =
    ms === null
      ? "Enter the date and time you stopped."
      : ms <= startMs
        ? "The end must be after the start."
        : ms > latest
          ? ms > nowMs
            ? "A fast cannot end in the future."
            : "A fast can last at most 24 hours."
          : null;
  return (
    <DSCard className="mx-auto w-full max-w-[680px] p-8" >
      <div data-testid="fast-expired">
        <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
          Past 24 hours
        </p>
        <h2 className="mt-2 text-[24px] font-medium" style={{ color: "var(--ink)" }}>
          {EXPIRED_TITLE}
        </h2>
        <p className="mt-2 text-[14.5px]" style={{ color: "var(--fg-2)" }}>
          {EXPIRED_BODY}
        </p>
      </div>
      <div className="mt-4 flex flex-col gap-1">
        <label htmlFor="expired-end" className={styles.label}>
          {EXPIRED_LABEL}
        </label>
        <input
          id="expired-end"
          type="datetime-local"
          className={styles.field}
          style={{ maxWidth: 260 }}
          value={value}
          min={toLocalInput(startMs)}
          max={toLocalInput(latest)}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={problem ? true : undefined}
          aria-describedby={problem ? "expired-msg" : undefined}
        />
        {problem && (
          <p id="expired-msg" role="alert" className={styles.error}>
            {problem}
          </p>
        )}
      </div>
      {error && (
        <div className="mt-3">
          <WriteError message={error} />
        </div>
      )}
      <button
        type="button"
        className="btn-primary-v2 mt-4"
        style={{ height: 44 }}
        disabled={!!problem || pending}
        onClick={() => ms !== null && onClose(new Date(ms).toISOString())}
      >
        {EXPIRED_BUTTON}
      </button>
    </DSCard>
  );
}
