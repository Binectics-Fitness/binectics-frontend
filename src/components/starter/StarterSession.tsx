"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { AsyncSpinner, DSCard, EmptySlate, Eyebrow, PageHeader } from "@/components/ds";
import { toast } from "@/components/Toast";
import { starterService } from "@/lib/api/starter";
import { ActivityType, progressService } from "@/lib/api/progress";
import { useActiveStarter } from "@/lib/queries/starter";
import { queryKeys } from "@/lib/queries/keys";
import { STARTER_ART_NOTE, STARTER_STOP_NOTE } from "@/lib/starter/copy";
import { starterErrorMessage } from "@/lib/starter/errors";
import { FROZEN_RENEW_HREF, FROZEN_RENEW_LABEL, isFrozenResponse } from "@/lib/frozenContent";
import {
  blankSets,
  exerciseCountLabel,
  formatTaskDay,
  localToday,
  minutesLabel,
  numbersNotes,
  parseMinutes,
  starterProgressLine,
  taskDay,
  type ExerciseEntries,
  type SetEntry,
} from "@/lib/starter/model";
import { StarterTaskStatus } from "@/lib/starter/types";
import { ExerciseCard } from "./ExerciseCard";

const BACK = "/dashboard/member/starter";

/**
 * One starter session: the exercises in order with their pictures, ticks that
 * stay on this page, optional numbers the member chooses to log, then Finish
 * or Skip. Finish never needs numbers; logging them is a separate write to
 * the member's own activity log that can never block the completion.
 */
export function StarterSession({ occurrenceId }: { occurrenceId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useActiveStarter();

  const [ticked, setTicked] = useState<Record<number, boolean>>({});
  const [numbersOpen, setNumbersOpen] = useState(false);
  const [entries, setEntries] = useState<ExerciseEntries>({});
  const [minutesEdit, setMinutesEdit] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [actionError, setActionError] = useState("");
  const [frozen, setFrozen] = useState(false);
  const [result, setResult] = useState<"done" | "skipped" | null>(null);

  const task = data?.tasks.find((t) => t.id === occurrenceId) ?? null;

  // The template's session length until the member types their own.
  const minutesText = minutesEdit ?? (task?.sessionMinutes ? String(task.sessionMinutes) : "");

  const header = (
    <Link
      href={BACK}
      className="mb-3 inline-flex min-h-11 items-center text-[14px] underline underline-offset-2"
      style={{ color: "var(--fg-2)" }}
    >
      Back to your program
    </Link>
  );

  if (isLoading) return <div>{header}<AsyncSpinner size="page" label="Loading your session" /></div>;
  if (isError) {
    return (
      <div>
        {header}
        <ErrorBox
          message={error instanceof Error ? error.message : "Could not load this session. Try again."}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }
  if (!task || !data) {
    return (
      <div>
        {header}
        <EmptySlate
          message="This session is not available."
          hint="It may be finished, or its catch-up time has passed. Your program shows what is next."
        />
      </div>
    );
  }

  const { program } = data;
  const exercises = task.exercises;
  const status = result === "done" ? StarterTaskStatus.Done : result === "skipped" ? StarterTaskStatus.Skipped : task.status;
  const settled = status !== StarterTaskStatus.Pending;
  const fromEarlier = taskDay(task.scheduledFor) < localToday();
  const facts = [minutesLabel(task.sessionMinutes), exerciseCountLabel(exercises.length)]
    .filter(Boolean)
    .join(" · ");
  const progress = starterProgressLine(program);

  const notes = numbersOpen ? numbersNotes(exercises, entries) : null;
  const minutes = parseMinutes(minutesText);
  const needsMinutes = !!notes && minutes === null;

  const refresh = () => qc.invalidateQueries({ queryKey: queryKeys.starter.all });

  const finish = async () => {
    setBusy(true);
    setActionError("");
    setFrozen(false);
    const res = await starterService.completeTask(task.id);
    if (!res.success) {
      setBusy(false);
      setFrozen(isFrozenResponse(res));
      setActionError(starterErrorMessage(res, "Could not save your session. Try again."));
      return;
    }
    setResult("done");
    setBusy(false);
    void refresh();
    if (notes && minutes !== null) {
      // Best effort: the session is already saved whatever happens here.
      const profile = await progressService.getOrCreateMyProfile();
      const profileId = profile.success ? (profile.data as { _id?: string } | undefined)?._id : undefined;
      const logged = profileId
        ? await progressService.createActivityReport(profileId, {
            activity_type: ActivityType.STRENGTH,
            title: task.title,
            duration_minutes: minutes,
            performed_at: new Date().toISOString(),
            notes,
          })
        : { success: false };
      if (logged.success) toast("Your numbers are saved", "success");
      else toast("Session finished, but your numbers were not saved.", "error");
    }
  };

  const skip = async () => {
    setBusy(true);
    setActionError("");
    setFrozen(false);
    const res = await starterService.skipTask(task.id);
    setBusy(false);
    setConfirmSkip(false);
    if (!res.success) {
      setFrozen(isFrozenResponse(res));
      setActionError(starterErrorMessage(res, "Could not skip this session. Try again."));
      return;
    }
    setResult("skipped");
    void refresh();
  };

  const setCell = (ei: number, si: number, key: keyof SetEntry, value: string) =>
    setEntries((prev) => {
      const rows = [...(prev[ei] ?? blankSets(exercises[ei]))];
      rows[si] = { ...rows[si], [key]: value.replace(/[^0-9.,]/g, "").slice(0, 6) };
      return { ...prev, [ei]: rows };
    });

  return (
    <div>
      {header}
      <PageHeader
        eyebrow={fromEarlier ? `From ${formatTaskDay(task.scheduledFor)}` : "Session"}
        title={task.title}
        subtitle={[facts, progress].filter(Boolean).join(" · ") || undefined}
      />
      {task.detail && (
        <p className="mb-4 text-[15px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {task.detail}
        </p>
      )}

      <Eyebrow as="h2" className="mb-2">Exercises</Eyebrow>
      {exercises.length === 0 ? (
        <p className="text-[15px]" style={{ color: "var(--fg-2)" }}>No exercises are listed for this session.</p>
      ) : (
        <ul className="flex flex-col gap-3" aria-label="Exercises">
          {exercises.map((e, i) => (
            <ExerciseCard
              key={`${e.name}-${i}`}
              exercise={e}
              index={i}
              ticked={!!ticked[i]}
              onTick={(v) => setTicked((t) => ({ ...t, [i]: v }))}
              locked={settled}
              numbers={numbersOpen && !settled ? (entries[i] ?? blankSets(e)) : null}
              onNumber={(si, key, v) => setCell(i, si, key, v)}
            />
          ))}
        </ul>
      )}

      {!settled && exercises.length > 0 && (
        <div className="mt-4">
          {numbersOpen ? (
            <div className="flex flex-col gap-2">
              <label htmlFor="starter-minutes" className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>
                Minutes the session took
              </label>
              <input
                id="starter-minutes"
                inputMode="numeric"
                value={minutesText}
                onChange={(ev) => setMinutesEdit(ev.target.value.replace(/[^0-9]/g, "").slice(0, 3))}
                placeholder="How long"
                className="w-32 rounded-(--r-2) px-3 py-2 text-[14px]"
                style={{ border: "1px solid var(--border-2)", background: "var(--bg)", color: "var(--ink)" }}
              />
              {needsMinutes && (
                <p className="text-[13px]" style={{ color: "var(--fg-2)" }}>
                  Add the minutes to save your numbers. You can also finish without them.
                </p>
              )}
              <button type="button" className="btn-ghost-v2 md self-start" onClick={() => setNumbersOpen(false)}>
                Hide numbers
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn-ghost-v2 md min-h-11"
              onClick={() => setNumbersOpen(true)}
              aria-label="Add numbers: weight and reps for each set"
            >
              Add numbers
            </button>
          )}
        </div>
      )}

      <p className="mt-5 text-[14px] leading-snug" style={{ color: "var(--fg-2)" }}>{STARTER_STOP_NOTE}</p>
      {exercises.some((e) => e.mediaId) && (
        <p className="mt-2 text-[13px] leading-snug" style={{ color: "var(--fg-3)" }}>{STARTER_ART_NOTE}</p>
      )}

      <div aria-live="polite" className="mt-5">
        {actionError && (
          <p role="alert" className="mb-3 text-[14px]" style={{ color: "var(--danger)" }}>
            {actionError}
            {frozen && (
              <>
                {" "}
                <Link href={FROZEN_RENEW_HREF} className="underline">{FROZEN_RENEW_LABEL}</Link>
              </>
            )}
          </p>
        )}
        {settled ? (
          <DSCard className="p-4">
            <p className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
              {status === StarterTaskStatus.Done
                ? "Session finished."
                : status === StarterTaskStatus.Skipped
                  ? "Session skipped."
                  : "Not done."}
            </p>
            <Link href={BACK} className="btn-primary-v2 md mt-3 min-h-11">Back to your program</Link>
          </DSCard>
        ) : confirmSkip ? (
          <DSCard className="p-4">
            <p className="text-[15px]" style={{ color: "var(--ink)" }}>Skip this session?</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary-v2 md min-h-11" disabled={busy} onClick={() => void skip()}>
                Yes, skip it
              </button>
              <button type="button" className="btn-ghost-v2 md min-h-11" disabled={busy} onClick={() => setConfirmSkip(false)}>
                Keep it
              </button>
            </div>
          </DSCard>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary-v2 lg min-h-11" disabled={busy} onClick={() => void finish()}>
              {busy ? "Saving…" : "Finish session"}
            </button>
            <button type="button" className="btn-ghost-v2 lg min-h-11" disabled={busy} onClick={() => setConfirmSkip(true)}>
              Skip session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="rounded-(--r-3) p-4 text-[14px]"
      style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger)" }}
    >
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-ghost-v2 md mt-3 min-h-11" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
