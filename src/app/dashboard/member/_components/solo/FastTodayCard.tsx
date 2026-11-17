"use client";

import Link from "next/link";
import { useState } from "react";
import { DSCard } from "@/components/ds";
import { useNowMs } from "@/hooks/useNowMs";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import type { FastSession } from "@/lib/api/fasting";
import { useEndFast, useUndoEnd } from "@/lib/queries/fasting";
import { DONE_UNDO_NOTE, UNDO, doneTitle } from "@/lib/solo/fastingCopy";
import {
  HOUR_MS,
  canUndo,
  clockText,
  durationText,
  elapsedMs,
  fastProgress,
  localStatus,
  presetTitle,
  remainingMs,
  spokenDuration,
  timeOfDay,
  toMs,
} from "@/lib/solo/fastingRules";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { WriteError } from "./parts";

/**
 * The fast on Today (design 03): a plain ink card, NOT the gradient (the dawn
 * gradient lives on the fasting page's hero only). Running: the numerals, time
 * to go, a thin bar that is a picture of the sentence, Open fast and End fast.
 * Ended from here: a short "saved" note with Undo for as long as the API
 * allows. None: the quiet "Start a fast" card. A fast past its limit says so
 * and sends the member to close it. Nothing is invented.
 */
export function FastTodayCard({ fast }: { fast: FastSession | null }) {
  const nowMs = useNowMs(fast ? toMs(fast.started_at) : null);
  const online = useOnline();
  const end = useEndFast();
  const undo = useUndoEnd();
  const [justEnded, setJustEnded] = useState<FastSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (justEnded && !fast) {
    const duration = justEnded.ended_at ? toMs(justEnded.ended_at) - toMs(justEnded.started_at) : 0;
    const offerUndo = nowMs !== null && canUndo(justEnded, nowMs);
    return (
      <DSCard className="flex flex-col gap-1.5 p-5.5">
        <div data-testid="fast-today-ended" className="flex flex-col gap-1.5">
          <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Fast ended
          </p>
          <h2 className="text-[17px] font-medium" style={{ color: "var(--ink)" }} role="status">
            {doneTitle(durationText(duration))}
          </h2>
          {offerUndo && (
            <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
              {DONE_UNDO_NOTE}
            </p>
          )}
          {error && <WriteError message={error} />}
          <div className="mt-2 flex flex-wrap gap-2">
            {offerUndo && (
              <button
                type="button"
                className="btn-primary-v2"
                style={{ height: 44 }}
                disabled={undo.isPending}
                onClick={() => {
                  const f = justEnded;
                  setError(null);
                  setJustEnded(null);
                  undo.mutate(f, {
                    onError: (e) => {
                      setJustEnded(f);
                      setError(e.message);
                    },
                  });
                }}
              >
                {UNDO}
              </button>
            )}
            <Link href={SOLO_HREFS.fastingHistory} className="btn-ghost-v2" style={{ height: 44 }}>
              See history
            </Link>
          </div>
        </div>
      </DSCard>
    );
  }

  if (!fast) {
    return (
      <DSCard className="flex flex-col gap-1.5 p-5.5">
        <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
          Start a fast
        </h2>
        <p className="text-[13.5px]" style={{ color: "var(--fg-3)" }}>
          Pick a length, and the time is kept for you. You choose when to stop.
        </p>
        <Link href={SOLO_HREFS.fasting} className="btn-ghost-v2 mt-2 self-start" style={{ height: 44 }}>
          Start a fast
        </Link>
      </DSCard>
    );
  }
  if (nowMs === null) return <div aria-hidden="true" style={{ height: 200, borderRadius: "var(--r-3)", background: "var(--bg-3)" }} />;

  const expired = fast.status === "expired_unclosed" || localStatus(fast, nowMs) === "expired_unclosed";
  const startMs = toMs(fast.started_at);
  const endAt = startMs + fast.target_hours * HOUR_MS;
  const elapsed = elapsedMs(startMs, nowMs);
  const progress = fastProgress(elapsed, fast.target_hours);
  const remaining = remainingMs(elapsed, fast.target_hours);

  return (
    <section
      className="flex flex-col gap-2 rounded-(--r-3) p-5.5 sm:p-7"
      style={{ background: "var(--ink)", color: "var(--bg)" }}
      aria-label="Your fast"
      data-testid="fast-today-card"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.06em]">Fasting · {presetTitle(fast.preset, fast.target_hours)}</span>
        {!expired && (
          <span className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--on-ink-2)" }}>
            Ends {timeOfDay(endAt)}
          </span>
        )}
      </div>
      {expired ? (
        <>
          <p className="text-[22px] font-medium">This fast ran past 24 hours</p>
          <p className="text-[14px]" style={{ color: "var(--on-ink-2)" }}>
            Tell us when you really stopped and it is saved to your history.
          </p>
        </>
      ) : (
        <>
          <p
            className="font-mono text-[56px] font-medium leading-none sm:text-[88px]"
            style={{ letterSpacing: "-0.045em" }}
            role="timer"
            aria-label={`${spokenDuration(elapsed)} fasted`}
          >
            {clockText(elapsed)}
          </p>
          <p className="text-[16px]">{remaining > 0 ? `${durationText(remaining)} to go` : "Length reached"}</p>
          <div aria-hidden="true" className="mt-2 h-2 overflow-hidden rounded-full" style={{ background: "var(--ink-2)" }}>
            <i className="block h-full" style={{ width: `${Math.round(progress * 100)}%`, background: "var(--bg)" }} />
          </div>
        </>
      )}
      {error && <WriteError message={error} />}
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Link
          href={SOLO_HREFS.fasting}
          className="inline-flex items-center justify-center rounded-(--r-2) px-4.5 text-[14px] font-medium"
          style={{ minHeight: 44, background: "var(--bg)", color: "var(--ink)" }}
        >
          {expired ? "Close this fast" : "Open fast"}
        </Link>
        {!expired && (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-(--r-2) px-4.5 text-[14px] font-medium"
            style={{ minHeight: 44, border: "1px solid var(--fg-3)", color: "var(--bg)", background: "transparent" }}
            disabled={end.isPending}
            onClick={() => {
              if (!online) {
                setError(OFFLINE_WRITE_MESSAGE);
                return;
              }
              setError(null);
              end.mutate({ id: fast.id }, { onSuccess: (f) => setJustEnded(f), onError: (e) => setError(e.message) });
            }}
          >
            End fast
          </button>
        )}
      </div>
    </section>
  );
}
