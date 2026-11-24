"use client";

import type { ReactNode } from "react";
import { Check, Minus, SkipForward } from "lucide-react";
import { Eyebrow } from "@/components/ds";
import { duration } from "@/lib/guided/format";
import type { SessionSummary } from "@/lib/guided/engine";

const STATUS_LABEL = { done: "Done", partial: "Partly done", skipped: "Skipped", pending: "Not started" } as const;

interface Props {
  title: string;
  summary: SessionSummary;
  /** The session is marked done (here, or it already was). */
  saved: boolean;
  saving: boolean;
  /** Only when the session is still pending in the plan. */
  canSave: boolean;
  error?: ReactNode;
  onSave: () => void;
  onBack: () => void;
  onRestart: () => void;
}

/**
 * The end of a guided session. Showing this records nothing: the session is
 * marked done only by the explicit button, the same completion the session
 * page's Finish uses. Web version of binectics-mobile
 * src/screens/starter/guided/GuidedSummary.tsx (no Undo: the web Finish has none).
 */
export function GuidedSummary({ title, summary, saved, saving, canSave, error, onSave, onBack, onRestart }: Props) {
  const early = summary.outcome === "ended_early";
  const nothingDone = summary.setsDone === 0;
  const allDone = summary.exercisesDone === summary.exercisesTotal;
  const headline = early ? "You ended early" : nothingDone ? "Nothing was done" : allDone ? "Workout complete" : "Workout finished";
  const stats: [string, string][] = [
    ["Exercises", `${summary.exercisesDone} of ${summary.exercisesTotal} done`],
    ...(summary.exercisesSkipped > 0 ? ([["Skipped", String(summary.exercisesSkipped)]] as [string, string][]) : []),
    ["Sets", `${summary.setsDone} of ${summary.setsPlanned}`],
    ["Active time", duration(summary.activeMs)],
    ["Exercise time", duration(summary.exerciseMs)],
    ["Rest time", duration(summary.restMs)],
    ...(summary.pausedMs > 1000 ? ([["Paused", duration(summary.pausedMs)]] as [string, string][]) : []),
  ];
  return (
    <div className="min-h-dvh" style={{ background: "var(--bg-2)" }} data-testid="guided-summary">
      <div className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6">
        <Eyebrow>{title}</Eyebrow>
        <h1 className="mt-1 text-[26px] font-medium leading-tight" style={{ color: "var(--ink)", letterSpacing: "-0.015em" }}>
          {headline}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }} aria-live="polite">
          {saved
            ? "Session finished."
            : early || nothingDone
              ? "This session has not been marked done."
              : "Mark it done to add it to your plan. Nothing is saved until you do."}
        </p>

        <dl
          className="mt-4 flex flex-col gap-2 rounded-(--r-3) p-4"
          style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        >
          {stats.map(([k, v]) => (
            <div key={k} className="flex items-baseline justify-between gap-3">
              <dt className="text-[14px]" style={{ color: "var(--fg-3)" }}>{k}</dt>
              <dd className="font-mono text-[15px]" style={{ color: "var(--ink)" }}>{v}</dd>
            </div>
          ))}
        </dl>

        <Eyebrow as="h2" className="mb-2 mt-6">Exercises</Eyebrow>
        <ul>
          {summary.rows.map((r, i) => (
            <li
              key={`${r.name}-${i}`}
              className="flex items-center gap-3 py-2"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              {r.status === "done" ? (
                <Check size={18} strokeWidth={2} style={{ color: "var(--signal-ink)" }} aria-hidden="true" />
              ) : r.status === "skipped" ? (
                <SkipForward size={18} strokeWidth={1.75} style={{ color: "var(--fg-3)" }} aria-hidden="true" />
              ) : (
                <Minus size={18} strokeWidth={1.75} style={{ color: "var(--fg-3)" }} aria-hidden="true" />
              )}
              <span className="flex-1 text-[15px]" style={{ color: "var(--ink)" }}>{r.name}</span>
              <span className="font-mono text-[13px]" style={{ color: "var(--fg-2)" }}>
                {STATUS_LABEL[r.status]}
                {r.status === "partial" || (r.status === "done" && r.sets > 1) ? ` · ${r.setsDone}/${r.sets} sets` : ""}
              </span>
            </li>
          ))}
        </ul>

        {error && (
          <div role="alert" className="mt-4 text-[14px]" style={{ color: "var(--danger-ink)" }}>
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {saved ? (
            <button type="button" className="btn-primary-v2 lg min-h-11" onClick={onBack}>
              Back to your program
            </button>
          ) : (
            <>
              {canSave && !nothingDone && (
                <button
                  type="button"
                  className={`${early ? "btn-ghost-v2" : "btn-signal-v2"} lg min-h-11`}
                  onClick={onSave}
                  disabled={saving}
                  aria-label={early ? "Mark session done anyway" : "Mark session done"}
                >
                  {saving ? "Saving…" : early ? "Mark done anyway" : "Mark session done"}
                </button>
              )}
              <button type="button" className="btn-ghost-v2 lg min-h-11" onClick={onRestart} disabled={saving}>
                Start over
              </button>
              <button type="button" className="btn-ghost-v2 lg min-h-11" onClick={onBack} disabled={saving}>
                {canSave ? "Leave without marking done" : "Back"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
