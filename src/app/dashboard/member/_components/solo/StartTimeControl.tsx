"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Chip } from "@/components/ds";
import {
  ENDS_LABEL,
  START_CHOICES,
  START_DAY_LABEL,
  START_FUTURE,
  START_LABEL,
  START_PICK,
  START_PICK_A11Y,
  START_QUESTION,
  START_TIME_LABEL,
  START_TODAY,
  START_TOO_EARLY,
  START_YESTERDAY,
  lastFastEnded,
  startBeforeLastEnd,
  startButtonA11y,
  startChoiceUnavailable,
  startNowValue,
  startedAgo,
} from "@/lib/solo/fastingCopy";
import { dayDiff, relativeDay, timeOfDay } from "@/lib/solo/fastingRules";
import { parseTimeInput, startLimit, startTimeProblem, timeInputValue, timeOnDay } from "@/lib/solo/fastStartTime";
import styles from "./fasting.module.css";

type Choice = (typeof START_CHOICES)[number]["key"] | "pick";

/** The sentence for a start that cannot be used, or null. Shared with the page so Start agrees. */
export function startTimeMessage(startMs: number | null, nowMs: number, lastEndMs: number | null): string | null {
  const limit = startLimit(lastEndMs, nowMs);
  const problem = startTimeProblem(startMs, nowMs, limit);
  if (problem === "future") return START_FUTURE;
  if (problem === "too_early") return START_TOO_EARLY;
  if (problem === "before_last_end" && limit !== null) return startBeforeLastEnd(timeOfDay(limit), dayDiff(limit, nowMs) === -1);
  return null;
}

/**
 * The start page's Starts / Ends card, where the Starts half is the control
 * (mobile StartTimeControl, #261). Pressing it shows, under the card: Now,
 * 30 min ago, 1 h ago, 2 h ago and "Pick a time…". The quick choices count
 * back from the moment of the press. "Pick a time…" shows Today / Yesterday
 * and one time field.
 *
 * The parent owns the start (`startMs`, null = now) and works out Ends. A
 * start in the future, over 36 hours back, or before the last fast ended
 * (`lastEndMs`; the API's FASTING_OVERLAP) is said in words here and the
 * parent disables Start for it. Quick choices before the last end are
 * disabled. `openSignal` changing opens the choices (the parent does that
 * when the server refused a start).
 */
export function StartTimeControl({
  nowMs,
  startMs,
  onChange,
  endText,
  lastEndMs = null,
  openSignal = 0,
  clock = Date.now,
}: {
  nowMs: number;
  startMs: number | null;
  onChange: (ms: number | null) => void;
  endText: string;
  lastEndMs?: number | null;
  openSignal?: number;
  /** The clock, read at the moment of a press. */
  clock?: () => number;
}) {
  const [open, setOpen] = useState(false);
  const [seenSignal, setSeenSignal] = useState(openSignal);
  if (openSignal !== seenSignal) {
    setSeenSignal(openSignal);
    if (openSignal > 0) setOpen(true);
  }
  const [choice, setChoice] = useState<Choice>(startMs === null ? "now" : "pick");
  const [daysBack, setDaysBack] = useState(startMs !== null && dayDiff(startMs, nowMs) === -1 ? 1 : 0);
  const timeField = useRef<HTMLInputElement>(null);
  // "Pick a time…" moves focus to the time field once it is on screen.
  const focusTime = useRef(false);
  const ids = useId();
  const choicesId = `${ids}-choices`;
  const questionId = `${ids}-question`;
  const errorId = `${ids}-error`;

  useEffect(() => {
    if (choice !== "pick" || !focusTime.current) return;
    focusTime.current = false;
    timeField.current?.focus();
  }, [choice]);

  const startAt = startMs ?? nowMs;
  const time = timeOfDay(startAt);
  const value = startMs === null ? startNowValue(timeOfDay(nowMs)) : `${relativeDay(startMs, nowMs)} · ${time}`;
  const when = startMs === null ? `now, ${timeOfDay(nowMs)}` : `${relativeDay(startMs, nowMs)}, ${time}`;
  const limit = startLimit(lastEndMs, nowMs);
  const limitYesterday = limit !== null && dayDiff(limit, nowMs) === -1;
  const error = startTimeMessage(startMs, nowMs, lastEndMs);
  const beforeLimit = (minutes: number) => limit !== null && minutes > 0 && nowMs - minutes * 60_000 < limit;

  const quick = (c: (typeof START_CHOICES)[number]) => {
    setChoice(c.key);
    // Counted back from the moment of the press, not the last tick.
    onChange(c.minutes === 0 ? null : clock() - c.minutes * 60_000);
  };

  const pick = () => {
    const back = dayDiff(startAt, clock()) === -1 ? 1 : 0;
    setChoice("pick");
    setDaysBack(back);
    focusTime.current = true;
  };

  const setDay = (back: number) => {
    setDaysBack(back);
    const d = new Date(startAt);
    onChange(timeOnDay(clock(), back, d.getHours(), d.getMinutes()));
  };

  const setTime = (raw: string) => {
    const t = parseTimeInput(raw);
    if (!t) return;
    onChange(timeOnDay(clock(), daysBack, t.hours, t.minutes));
  };

  const minutesAgo = Math.max(0, Math.round((nowMs - startAt) / 60_000));
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <div className="mt-4">
      <div className={styles.timeCard}>
        <button
          type="button"
          className={styles.startsBtn}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={choicesId}
          aria-label={startButtonA11y(when)}
          aria-describedby={error ? errorId : undefined}
          data-testid="fast-starts-button"
        >
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={styles.small}>{START_LABEL}</span>
            <span className={styles.big} data-testid="start-label">
              {value}
            </span>
          </span>
          <Chevron size={20} strokeWidth={1.75} aria-hidden="true" style={{ color: "var(--fg-2)", flex: "none" }} />
        </button>
        <div className={styles.endsCol}>
          <span className={styles.small}>{ENDS_LABEL}</span>
          <span className={styles.big} data-testid="end-label">
            {endText}
          </span>
        </div>
      </div>

      {open && (
        <div id={choicesId} className="mt-3 flex flex-col gap-2" data-testid="fast-start-choices">
          <p id={questionId} className={styles.label}>
            {START_QUESTION}
          </p>
          <div role="group" aria-labelledby={questionId} className="flex flex-wrap gap-2">
            {START_CHOICES.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                category="fast"
                selected={choice === c.key}
                disabled={beforeLimit(c.minutes)}
                ariaLabel={beforeLimit(c.minutes) ? startChoiceUnavailable(c.a11y) : c.a11y}
                onClick={() => quick(c)}
              />
            ))}
            <Chip label={START_PICK} category="fast" selected={choice === "pick"} ariaLabel={START_PICK_A11Y} onClick={pick} />
          </div>

          {choice === "pick" && (
            <div className="flex flex-wrap items-end gap-3" data-testid="fast-start-pick">
              <div role="group" aria-label={START_DAY_LABEL} className="flex gap-2">
                <Chip label={START_TODAY} category="fast" selected={daysBack === 0} onClick={() => setDay(0)} />
                <Chip
                  label={START_YESTERDAY}
                  category="fast"
                  selected={daysBack === 1}
                  disabled={limit !== null && !limitYesterday}
                  onClick={() => setDay(1)}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor={`${ids}-time`} className={styles.label}>
                  {START_TIME_LABEL}
                </label>
                <input
                  ref={timeField}
                  id={`${ids}-time`}
                  type="time"
                  className={styles.field}
                  value={timeInputValue(startAt)}
                  onChange={(e) => setTime(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? errorId : undefined}
                  data-testid="fast-start-time"
                />
              </div>
            </div>
          )}

          {limit !== null && (
            <p className={styles.hint} data-testid="fast-start-last-end">
              {lastFastEnded(timeOfDay(limit), limitYesterday)}
            </p>
          )}
          {!error && startMs !== null && (
            <p className={styles.hint} data-testid="fast-start-hint">
              {startedAgo(minutesAgo, time, dayDiff(startAt, nowMs) === -1)}
            </p>
          )}
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className={`${styles.error} mt-2`} data-testid="fast-start-error">
          {error}
        </p>
      )}
    </div>
  );
}
