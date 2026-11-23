"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { ActionModal } from "@/components/ds/ActionModal";
import {
  END_BUTTON,
  END_EARLY,
  END_EARLY_TITLE,
  FINISH_FAST,
  GOAL_REACHED_ANNOUNCE,
  KEEP_GOING,
  endEarlyBody,
} from "@/lib/solo/fastingCopy";
import styles from "./fasting.module.css";

/** A goal flip caught later than this after the goal was not watched happening (a tab that slept). */
const WATCHED_WINDOW_MS = 2_000;

/**
 * Has the fast reached its goal? Worked out from the start and the goal, and
 * exact to the moment: the page's clock only ticks every minute, so a timer
 * lands on the goal itself. `crossedOpen` is true only when the goal passed
 * while this page watched; opening the page after the goal, a tab that slept
 * through it, or an edit that puts the goal in the past gives the reached
 * state with no motion and no announcement. A port of mobile
 * `useGoalReached` (#263).
 */
export function useGoalReached(
  endAtMs: number,
  nowMs: number,
): { reached: boolean; crossedOpen: boolean } {
  const [fired, setFired] = useState<{ endAtMs: number; at: number } | null>(
    null,
  );
  useEffect(() => {
    const wait = endAtMs - Date.now();
    if (wait <= 0) return undefined;
    const timer = setTimeout(
      () => setFired({ endAtMs, at: Date.now() }),
      wait + 5,
    );
    return () => clearTimeout(timer);
  }, [endAtMs]);
  const timer = fired?.endAtMs === endAtMs ? fired : null;
  const reached = nowMs >= endAtMs || timer !== null;

  // What the page showed last for this same goal, and whether it saw the goal
  // pass. Latched: once crossed it stays crossed. A new goal time (an edit)
  // starts over with nothing seen, so the edit itself never animates.
  const [latch, setLatch] = useState<{
    endAtMs: number;
    last: boolean;
    crossed: boolean;
  }>(() => ({
    endAtMs,
    last: reached,
    crossed: false,
  }));
  let next =
    latch.endAtMs === endAtMs
      ? latch
      : { endAtMs, last: reached, crossed: false };
  if (next.last !== reached) {
    const seenAt = timer ? timer.at : nowMs;
    const watched = seenAt - endAtMs < WATCHED_WINDOW_MS;
    next = {
      ...next,
      last: reached,
      crossed: next.crossed || (reached && watched),
    };
  }
  if (next !== latch) setLatch(next);
  return { reached, crossedOpen: next.crossed };
}

/**
 * The running fast's end action (owner decision B, 19 Nov 2026; mobile
 * FastEndAction, #263).
 *
 * Before the goal: an outline "End fast early" that asks once. At the goal:
 * a filled "Finish fast" that ends with no question (Undo follows). When the
 * goal passes with the page open the button changes in place (no size or
 * position change, colour eased over 220ms, none with reduced motion) and a
 * screen reader hears it once. The word "early" is never on screen after the
 * goal. The surface decides the colours: `filled` and `outline` are the two
 * looks on that surface.
 */
export function FastEndAction({
  reached,
  crossedOpen,
  onEnd,
  disabled,
  elapsedText,
  hoursText,
  filled,
  outline,
  className = "",
}: {
  reached: boolean;
  crossedOpen: boolean;
  onEnd: () => void;
  disabled?: boolean;
  /** "15 h 56 min", for the confirm. */
  elapsedText: string;
  /** "16", for the confirm. */
  hoursText: string;
  filled: CSSProperties;
  outline: CSSProperties;
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  const body = endEarlyBody(elapsedText, hoursText);
  const label = reached ? FINISH_FAST : END_EARLY;

  return (
    <>
      <button
        type="button"
        className={`${styles.endAction} ${crossedOpen ? styles.endActionSwap : ""} ${className}`}
        style={reached ? filled : outline}
        onClick={() => (reached ? onEnd() : setAsking(true))}
        disabled={disabled}
        aria-haspopup={reached ? undefined : "dialog"}
        data-testid="end-fast"
        data-reached={reached}
      >
        {label}
      </button>
      {/* Said once, only when the goal passes with the page open. */}
      <span
        role="status"
        aria-live="polite"
        className="sr-only"
        data-testid="goal-announce"
      >
        {crossedOpen ? GOAL_REACHED_ANNOUNCE : ""}
      </span>
      {/* Portalled to the body: on the hero or the ink card it would inherit their light text. */}
      {asking &&
        !reached &&
        typeof document !== "undefined" &&
        createPortal(
          <ActionModal
            // "End early?" no longer makes sense once the goal is reached.
            open={asking && !reached}
            onClose={() => setAsking(false)}
            title={END_EARLY_TITLE}
            size="sm"
            footer={
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  className="btn-ghost-v2"
                  style={{ minHeight: 44 }}
                  onClick={() => {
                    setAsking(false);
                    onEnd();
                  }}
                >
                  {END_BUTTON}
                </button>
                <button
                  type="button"
                  className="btn-primary-v2"
                  style={{ minHeight: 44 }}
                  onClick={() => setAsking(false)}
                  autoFocus
                >
                  {KEEP_GOING}
                </button>
              </div>
            }
          >
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: "var(--fg-2)" }}
              data-testid="end-early-body"
            >
              {body.before}
              <strong className="font-medium" style={{ color: "var(--ink)" }}>
                {body.strong}
              </strong>
              {body.after}
            </p>
          </ActionModal>,
          document.body,
        )}
    </>
  );
}
