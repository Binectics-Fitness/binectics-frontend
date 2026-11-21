"use client";

import Link from "next/link";
import { useState } from "react";
import { DSCard } from "@/components/ds";
import type { ScreeningAnswers, ScreeningOutcome } from "@/lib/api/fasting";
import { SOLO_HREFS } from "@/lib/solo/nav";
import {
  CHECK_BACK_TODAY,
  CHECK_BLOCKED,
  CHECK_BLOCKED_STORED,
  CHECK_CONTINUE,
  CHECK_DISCLAIMER,
  CHECK_DOCTOR,
  CHECK_INTRO,
  CHECK_NONE,
  CHECK_OPTIONS,
  CHECK_RETAKE,
  CHECK_RETAKE_LATER,
  CHECK_STEP,
  CHECK_TITLE,
} from "@/lib/solo/fastingCopy";
import { WriteError } from "./parts";
import styles from "./fasting.module.css";

type Key = (typeof CHECK_OPTIONS)[number]["key"];
const NONE: Record<Key, boolean> = {
  under_18: false,
  pregnant_or_breastfeeding: false,
  diabetes_or_medication: false,
  eating_disorder_history: false,
};

/** The answers to the API's four booleans. Pure, so every outcome path is testable. */
export function answersFrom(ticked: Record<Key, boolean>): ScreeningAnswers {
  return {
    under_18: ticked.under_18,
    eating_disorder_history: ticked.eating_disorder_history,
    pregnant_or_breastfeeding: ticked.pregnant_or_breastfeeding,
    diabetes_or_medication: ticked.diabetes_or_medication,
  };
}

/**
 * The one-time safety check (design 04, step 1). The ticks live in this
 * component's state only: they are sent once, never put in a query cache, a
 * store, storage or a log, and are gone when the member leaves the step.
 */
export function FastCheck({
  onSubmit,
  pending,
  error,
}: {
  onSubmit: (answers: ScreeningAnswers) => void;
  pending: boolean;
  error: string | null;
}) {
  const [ticked, setTicked] = useState<Record<Key, boolean>>(NONE);
  const [none, setNone] = useState(false);
  const any = Object.values(ticked).some(Boolean);
  const ready = any || none;

  return (
    <DSCard className="mx-auto w-full max-w-[680px] p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
        {CHECK_STEP}
      </p>
      <h2 className="mt-1 text-[20px] font-medium" style={{ color: "var(--ink)" }}>
        {CHECK_TITLE}
      </h2>
      <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
        {CHECK_INTRO}
      </p>
      <form
        className="mt-4 flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (ready && !pending) onSubmit(answersFrom(ticked));
        }}
      >
        <fieldset className="flex flex-col gap-2 border-0 p-0">
          <legend className="sr-only">Does any of this apply to you?</legend>
          {CHECK_OPTIONS.map((o) => (
            <label key={o.key} className={styles.checkRow}>
              <input
                type="checkbox"
                checked={ticked[o.key]}
                onChange={(e) => {
                  setTicked((t) => ({ ...t, [o.key]: e.target.checked }));
                  if (e.target.checked) setNone(false);
                }}
              />
              <span className="text-[14.5px]">{o.label}</span>
            </label>
          ))}
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={none}
              onChange={(e) => {
                setNone(e.target.checked);
                if (e.target.checked) setTicked(NONE);
              }}
            />
            <span className="text-[14.5px]">{CHECK_NONE}</span>
          </label>
        </fieldset>
        <p className="mt-2 text-[13px]" style={{ color: "var(--fg-3)" }}>
          {CHECK_DISCLAIMER}
        </p>
        {error && <WriteError message={error} />}
        <button type="submit" className="btn-primary-v2 mt-2 self-start" style={{ height: 44 }} disabled={!ready || pending}>
          {CHECK_CONTINUE}
        </button>
      </form>
    </DSCard>
  );
}

/** What the member reads straight after the check, when they may not (or should talk to a doctor first). */
export function FastCheckOutcome({
  outcome,
  onRetake,
  onContinue,
}: {
  outcome: ScreeningOutcome | "stored_block";
  onRetake: () => void;
  onContinue: () => void;
}) {
  if (outcome === "stored_block" || !outcome.passed) {
    const copy = outcome === "stored_block" ? CHECK_BLOCKED_STORED : CHECK_BLOCKED[outcome.reason];
    return (
      <DSCard className="mx-auto w-full max-w-[680px] p-6" >
        <div role="status" data-testid="check-blocked">
          <h2 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>
            {copy.title}
          </h2>
          <p className="mt-2 text-[14.5px]" style={{ color: "var(--fg-2)" }}>
            {copy.body}
          </p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href={SOLO_HREFS.today} className="btn-primary-v2" style={{ height: 44 }}>
            {CHECK_BACK_TODAY}
          </Link>
          <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={onRetake}>
            {outcome === "stored_block" ? CHECK_RETAKE_LATER : CHECK_RETAKE}
          </button>
        </div>
      </DSCard>
    );
  }
  return (
    <DSCard className="mx-auto w-full max-w-[680px] p-6">
      <div role="status" data-testid="check-doctor">
        <h2 className="text-[20px] font-medium" style={{ color: "var(--ink)" }}>
          {CHECK_DOCTOR.title}
        </h2>
        <p className="mt-2 text-[14.5px]" style={{ color: "var(--fg-2)" }}>
          {CHECK_DOCTOR.body}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="btn-primary-v2" style={{ height: 44 }} onClick={onContinue}>
          {CHECK_DOCTOR.action}
        </button>
        <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={onRetake}>
          {CHECK_RETAKE}
        </button>
      </div>
    </DSCard>
  );
}
