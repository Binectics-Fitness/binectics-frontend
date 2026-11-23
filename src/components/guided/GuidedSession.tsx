"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { AsyncSpinner, EmptySlate } from "@/components/ds";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useAuth } from "@/contexts/AuthContext";
import { starterService } from "@/lib/api/starter";
import { useActiveStarter } from "@/lib/queries/starter";
import { queryKeys } from "@/lib/queries/keys";
import { starterErrorMessage } from "@/lib/starter/errors";
import { FROZEN_RENEW_HREF, FROZEN_RENEW_LABEL, isFrozenResponse } from "@/lib/frozenContent";
import { StarterTaskStatus, type StarterTask } from "@/lib/starter/types";
import { buildPlan, initialState, reduce, summarize, type SessionState } from "@/lib/guided/engine";
import { useGuidedPrefs } from "@/lib/guided/prefs";
import { speech, useSpeechUnavailable } from "@/lib/guided/speech";
import { clearActive, loadActive, restoreAsPaused, samePlan, saveActive } from "@/lib/guided/persistence";
import { useGuidedSession } from "@/lib/guided/useGuidedSession";
import { useSpeechDriver } from "@/lib/guided/useSpeechDriver";
import { useWakeLock } from "@/lib/guided/useWakeLock";
import { useCoachVoice } from "@/lib/guided/coach/useCoachVoice";
import { planOpening } from "@/lib/guided/coach/opening";
import { isComeback, lastCompletedAt, loadLastDone, markSessionDone, toComebackTask } from "@/lib/guided/coach/comeback";
import { GuidedActive } from "./GuidedActive";
import { STARTER_PROGRAM_HREF, sessionHref, unlockGuidedAudio } from "./links";
import { GuidedSummary } from "./GuidedSummary";

const PROGRAM = STARTER_PROGRAM_HREF;

const isActivePhase = (s: SessionState) => s.phase === "countdown" || s.phase === "exercise" || s.phase === "rest";

/**
 * The guided session for one starter occurrence. Loads the task and any saved
 * in-progress run (which comes back PAUSED), then starts the get-ready
 * countdown at once: Start was already pressed on the session page.
 * Nothing here records anything: only the summary's "Mark session done" does.
 *
 * Web version of binectics-mobile src/screens/starter/GuidedSessionScreen.tsx.
 */
export function GuidedSession({ occurrenceId }: { occurrenceId: string }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const { data, isLoading, isError, error, refetch, dataUpdatedAt } = useActiveStarter();
  const hydrated = useGuidedPrefs((s) => s.hydrated && s.userId === userId);
  const [saved, setSaved] = useState<{ done: boolean; state: SessionState | null }>({ done: false, state: null });

  useEffect(() => {
    if (userId) void useGuidedPrefs.getState().hydrate(userId);
  }, [userId]);

  const task = data?.tasks.find((t) => t.id === occurrenceId) ?? null;
  useEffect(() => {
    if (isLoading) return;
    let cancelled = false;
    (async () => {
      let state: SessionState | null = null;
      try {
        const s = task && userId && task.status === StarterTaskStatus.Pending ? await loadActive(userId, occurrenceId) : null;
        const keys = buildPlan(task?.exercises ?? [], 0).map((p) => p.key);
        state = s && samePlan(s.state, keys) ? restoreAsPaused(s) : null;
        // A saved run for this session that can no longer be resumed (the plan changed, or the session is
        // done or gone) is dropped; another session's saved run is never touched.
        if (userId && (!task || task.status !== StarterTaskStatus.Pending || (s && !state))) void clearActive(userId, occurrenceId);
      } catch {
        state = null;
      }
      if (!cancelled) setSaved({ done: true, state });
    })();
    return () => {
      cancelled = true;
    };
    // Only the first load decides what to restore; a refetch never swaps the run under the member.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, userId, occurrenceId, !!task]);

  const back = (
    <Link
      href={sessionHref(occurrenceId)}
      className="mb-3 inline-flex min-h-11 items-center text-[14px] underline underline-offset-2"
      style={{ color: "var(--fg-2)" }}
    >
      Back to the session
    </Link>
  );
  const frame = (body: React.ReactNode) => (
    <div className="min-h-dvh" style={{ background: "var(--bg-2)" }}>
      <div className="mx-auto max-w-xl px-4 py-6 sm:px-6">
        {back}
        {body}
      </div>
    </div>
  );

  if (isLoading || (userId && !hydrated) || !saved.done) {
    return frame(<AsyncSpinner size="page" label="Loading your session" />);
  }
  if (isError) {
    return frame(
      <div role="alert" className="rounded-(--r-3) p-4 text-[14px]" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}>
        <p>{error instanceof Error ? error.message : "Could not load this session. Try again."}</p>
        <button type="button" className="btn-ghost-v2 md mt-3 min-h-11" onClick={() => void refetch()}>
          Try again
        </button>
      </div>,
    );
  }
  if (!task || task.exercises.length === 0) {
    return frame(
      <EmptySlate
        message="This session is not available."
        hint={
          task
            ? "No exercises are listed for this session."
            : "It may be finished, or its catch-up time has passed. Your program shows what is next."
        }
      />,
    );
  }
  return (
    <GuidedBody
      task={task}
      userId={userId}
      restored={saved.state}
      tasks={data?.tasks ?? []}
      savedAt={dataUpdatedAt || null}
      catchUpDays={data?.program.catchUpDays ?? 1}
    />
  );
}

function GuidedBody({
  task,
  userId,
  restored,
  tasks,
  savedAt,
  catchUpDays,
}: {
  task: StarterTask;
  userId: string | null;
  restored: SessionState | null;
  tasks: StarterTask[];
  savedAt: number | null;
  catchUpDays: number;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const prefs = useGuidedPrefs((s) => s.prefs);
  const setPrefs = useGuidedPrefs((s) => s.set);
  const exercises = task.exercises;

  const plan = useMemo(() => buildPlan(exercises, prefs.defaultRestSeconds), [exercises, prefs.defaultRestSeconds]);
  const { state, send, replace } = useGuidedSession(
    () => restored ?? initialState(plan, prefs.prepSeconds),
    { userId, occurrenceId: task.id },
  );
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // One seed per run (visit + restart), so the welcome line and the rest of the session share one
  // no-repeat memory and count as one session.
  const [openedAt] = useState(() => Date.now());
  const [run, setRun] = useState(0);
  const coach = useCoachVoice(userId, `${task.id}|${openedAt}|${run}`, prefs);
  useSpeechDriver(state, prefs, coach);

  // Welcome back: the last finished session is known from the loaded program plus a local marker, no request.
  const comebackTasks = useMemo(() => tasks.map(toComebackTask), [tasks]);
  const [lastDoneMarker, setLastDoneMarker] = useState<number | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    void loadLastDone(userId).then((v) => {
      if (!cancelled) setLastDoneMarker(v);
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);
  const returning =
    lastDoneMarker !== undefined && isComeback(lastCompletedAt(comebackTasks, lastDoneMarker, savedAt, catchUpDays), openedAt);

  useWakeLock(isActivePhase(state));

  const voiceDown = useSpeechUnavailable();

  // Leaving mid-run (another page, closing or reloading the tab) pauses and saves it; reopening resumes it PAUSED.
  useEffect(() => {
    const saveNow = () => {
      const s = stateRef.current;
      if (!userId || !isActivePhase(s)) return;
      const now = Date.now();
      void saveActive(userId, task.id, s.pausedAt === null ? reduce(s, { type: "pause", now }) : s, now);
    };
    window.addEventListener("pagehide", saveNow);
    window.addEventListener("beforeunload", saveNow);
    return () => {
      window.removeEventListener("pagehide", saveNow);
      window.removeEventListener("beforeunload", saveNow);
      saveNow();
    };
  }, [userId, task.id]);

  const start = useCallback(() => {
    // The plan is built from the saved voice and timing choices (changed beside the Start button), then started.
    const built = buildPlan(exercises, prefs.defaultRestSeconds);
    replace(initialState(built, prefs.prepSeconds));
    // The opening line (welcome, or welcome-back) is only TAKEN, which counts the session and uses up a
    // once-line, if it will actually be heard: the same fit rule the speech driver applies decides, and the
    // first get-ready countdown is lengthened just enough to make room for it.
    let opening: { comeback?: boolean; comebackText?: string; openingText?: string; openingMs?: number } = {};
    if (prefs.voiceOn && prefs.coachLines && coach.ready && !speech.isUnavailable()) {
      const comebackLine = returning ? (coach.peek("comeback")?.text ?? null) : null;
      const comeback = !!comebackLine;
      const moment = comeback ? "comeback" : "sessionStart";
      const peeked = comeback ? comebackLine : (coach.peek("sessionStart")?.text ?? null);
      const fit = planOpening({
        text: peeked,
        plan: built,
        prepSeconds: prefs.prepSeconds,
        rate: prefs.rate,
        countdownCalls: prefs.countdownCalls,
        formCues: prefs.formCues,
        comeback,
      });
      if (fit.speak) {
        const text = coach.line(moment)?.text ?? peeked ?? undefined;
        opening = comeback
          ? { comeback: true, comebackText: text, openingMs: fit.openingMs }
          : { openingText: text, openingMs: fit.openingMs };
      }
    }
    send("start", opening);
  }, [exercises, prefs, returning, coach, replace, send]);

  // Start was already pressed on the session page: no second confirmation. The get-ready countdown begins as
  // soon as the saved coach memory and last-session marker are read (local, a few ms), once per run.
  const canStart = state.phase === "ready" && coach.ready && lastDoneMarker !== undefined;
  const startedRun = useRef<number | null>(null);
  useEffect(() => {
    if (!canStart || startedRun.current === run) return;
    startedRun.current = run;
    start();
  }, [canStart, run, start]);

  const [confirmEnd, setConfirmEnd] = useState(false);
  const askEnd = useCallback(() => {
    if (stateRef.current.pausedAt === null) send("pause");
    setConfirmEnd(true);
  }, [send]);

  // Summary: "Mark session done" is the only thing that records anything.
  const [saving, setSaving] = useState(false);
  const [savedDone, setSavedDone] = useState(false);
  const [saveError, setSaveError] = useState<{ message: string; frozen: boolean } | null>(null);
  const markDone = async () => {
    setSaving(true);
    setSaveError(null);
    const res = await starterService.completeTask(task.id);
    setSaving(false);
    if (!res.success) {
      setSaveError({ message: starterErrorMessage(res, "Could not save your session. Try again."), frozen: isFrozenResponse(res) });
      return;
    }
    setSavedDone(true);
    if (userId) void clearActive(userId, task.id);
    void markSessionDone(userId);
    // Marked stale, not refetched here: the program page reloads it, and this summary stays put.
    void qc.invalidateQueries({ queryKey: queryKeys.starter.all, refetchType: "none" });
  };

  if (state.phase === "ready") {
    return (
      <div className="flex min-h-dvh items-center justify-center" style={{ background: "var(--warn-soft)" }}>
        <AsyncSpinner size="page" label="Starting your session" />
      </div>
    );
  }

  if (state.phase === "completed") {
    const pending = task.status === StarterTaskStatus.Pending;
    return (
      <GuidedSummary
        title={task.title || "Workout"}
        summary={summarize(state, state.endedAt ?? state.startedAt ?? 0)}
        saved={savedDone || !pending}
        saving={saving}
        canSave={pending && !savedDone}
        error={
          saveError && (
            <>
              {saveError.message}
              {saveError.frozen && (
                <>
                  {" "}
                  <Link href={FROZEN_RENEW_HREF} className="underline">{FROZEN_RENEW_LABEL}</Link>
                </>
              )}
            </>
          )
        }
        onSave={() => void markDone()}
        onBack={() => router.push(savedDone || !pending ? PROGRAM : sessionHref(task.id))}
        onRestart={() => {
          unlockGuidedAudio();
          replace(initialState(buildPlan(exercises, prefs.defaultRestSeconds), prefs.prepSeconds));
          setRun((r) => r + 1);
          // They just finished a session: this is not a comeback.
          setLastDoneMarker(Date.now());
        }}
      />
    );
  }

  return (
    <>
      <GuidedActive
        state={state}
        title={task.title}
        voiceOn={prefs.voiceOn}
        soundsOn={prefs.soundsOn}
        voiceUnavailable={voiceDown}
        onToggleSounds={() => {
          unlockGuidedAudio();
          setPrefs({ soundsOn: !prefs.soundsOn });
        }}
        onToggleVoice={() => {
          unlockGuidedAudio();
          setPrefs({ voiceOn: !prefs.voiceOn });
        }}
        onPause={() => send("pause")}
        onResume={() => {
          unlockGuidedAudio();
          send("resume");
        }}
        onDoneSet={() => send("doneSet")}
        onSkipExercise={() => send("skipExercise")}
        onSkipRest={() => send("skipRest")}
        onRepeat={() => send("repeat")}
        onEnd={askEnd}
        onEaseOff={() => send("easeOff")}
      />
      <ConfirmationModal
        isOpen={confirmEnd}
        title="End this workout?"
        description="You will see what you did so far. The session is not marked done unless you choose to."
        confirmLabel="End workout"
        cancelLabel="Keep going"
        onConfirm={() => {
          setConfirmEnd(false);
          send("end");
        }}
        onCancel={() => setConfirmEnd(false)}
      />
    </>
  );
}
