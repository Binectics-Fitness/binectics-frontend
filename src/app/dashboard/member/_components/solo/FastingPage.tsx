"use client";

import Link from "next/link";
import { useState } from "react";
import { DSCard, PageHeader } from "@/components/ds";
import { useOnline, OFFLINE_WRITE_MESSAGE } from "@/hooks/useOnline";
import { useNowMs } from "@/hooks/useNowMs";
import {
  SCREENING_VERSION,
  type FastSession,
  type FastingFeelingValue,
  type ScreeningOutcome,
} from "@/lib/api/fasting";
import {
  useAddFeeling,
  useCurrentFast,
  useEditFast,
  useEndFast,
  useFastingSettings,
  useScreening,
  useStartFast,
  useUndoEnd,
} from "@/lib/queries/fasting";
import { NO_FAST_BODY, NO_FAST_TITLE } from "@/lib/solo/fastingCopy";
import { localStatus, presetTitle, toMs } from "@/lib/solo/fastingRules";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { FastCheck, FastCheckOutcome } from "./FastCheck";
import { FastClosePast, FastDone } from "./FastDone";
import { FastEditDrawer } from "./FastEditDrawer";
import { FastStart } from "./FastStart";
import { FastingHero } from "./FastingHero";
import { CardSkeleton } from "./parts";

/** The one fasting page: safety check, start, the running fast, close-past and done. */
export function FastingContent() {
  const online = useOnline();
  const settings = useFastingSettings();
  const current = useCurrentFast();
  const fast = current.data ?? null;
  const nowMs = useNowMs(fast ? toMs(fast.started_at) : null);

  const screening = useScreening();
  const start = useStartFast();
  const end = useEndFast();
  const undo = useUndoEnd();
  const feeling = useAddFeeling();
  const edit = useEditFast();

  const [outcome, setOutcome] = useState<ScreeningOutcome | "stored_block" | null>(null);
  const [retaking, setRetaking] = useState(false);
  // The member passed the check in this visit: do not wait for the settings re-read to say so.
  const [passedHere, setPassedHere] = useState(false);
  const [justEnded, setJustEnded] = useState<FastSession | null>(null);
  const [editing, setEditing] = useState<FastSession | null>(null);
  const [savedFeeling, setSavedFeeling] = useState<FastingFeelingValue | null>(null);
  const [message, setMessage] = useState<{ scope: string; text: string } | null>(null);

  const say = (scope: string, text: string) => setMessage({ scope, text });
  const msgFor = (scope: string) => (message?.scope === scope ? message.text : null);

  if (settings.isLoading || current.isLoading || nowMs === null) {
    return (
      <div role="status" aria-label="Loading your fast">
        <CardSkeleton height={420} />
      </div>
    );
  }
  if (!settings.data && settings.isError) return <LoadFailed onRetry={() => void settings.refetch()} />;
  if (current.isError && !current.data) return <LoadFailed onRetry={() => void current.refetch()} />;

  const needOnline = (scope: string): boolean => {
    if (online) return false;
    say(scope, OFFLINE_WRITE_MESSAGE);
    return true;
  };

  const heading = (
    <PageHeader
      eyebrow={fast ? `Fasting · ${presetTitle(fast.preset, fast.target_hours)}` : "Fasting"}
      title={fast ? "Your fast" : justEnded ? "Fast ended" : "Start a fast"}
    />
  );

  // ── The running fast (or one past its limit) ──
  if (fast) {
    const expired = fast.status === "expired_unclosed" || localStatus(fast, nowMs) === "expired_unclosed";
    return (
      <>
        {heading}
        {!online && (
          <div role="status" className="mb-3.5 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
            You are offline. Your time keeps counting. Ending or changing the fast waits until you are back online.
          </div>
        )}
        {expired ? (
          <FastClosePast
            fast={fast}
            nowMs={nowMs}
            pending={end.isPending}
            error={msgFor("end")}
            onClose={(iso) => {
              if (needOnline("end")) return;
              setMessage(null);
              end.mutate(
                { id: fast.id, endedAt: iso },
                { onSuccess: (f) => setJustEnded(f), onError: (e) => say("end", e.message) },
              );
            }}
          />
        ) : (
          <FastingHero
            fast={fast}
            nowMs={nowMs}
            ending={end.isPending}
            endError={msgFor("end")}
            feelingError={msgFor("feeling")}
            savedFeeling={savedFeeling}
            onEditStart={() => setEditing(fast)}
            onFeeling={(value) => {
              if (needOnline("feeling")) return;
              setMessage(null);
              feeling.mutate(
                { id: fast.id, value },
                { onSuccess: () => setSavedFeeling(value), onError: (e) => say("feeling", e.message) },
              );
            }}
            onEnd={() => {
              if (needOnline("end")) return;
              setMessage(null);
              end.mutate({ id: fast.id }, { onSuccess: (f) => setJustEnded(f), onError: (e) => say("end", e.message) });
            }}
          />
        )}
        <FastEditDrawer
          fast={editing}
          nowMs={nowMs}
          saving={edit.isPending}
          deleting={false}
          error={msgFor("edit")}
          onClose={() => {
            setEditing(null);
            setMessage(null);
          }}
          onSave={(id, input) => {
            if (needOnline("edit")) return;
            setMessage(null);
            edit.mutate({ id, input }, { onSuccess: () => setEditing(null), onError: (e) => say("edit", e.message) });
          }}
        />
      </>
    );
  }

  // ── A fast the member just ended ──
  if (justEnded) {
    return (
      <>
        {heading}
        <FastDone
          fast={justEnded}
          nowMs={nowMs}
          undoing={undo.isPending}
          error={msgFor("undo")}
          onEdit={() => setEditing(justEnded)}
          onUndo={() => {
            if (needOnline("undo")) return;
            const f = justEnded;
            setMessage(null);
            setJustEnded(null);
            undo.mutate(f, {
              onError: (e) => {
                // Put the "ended" view back and say why it could not be reopened.
                setJustEnded(f);
                say("undo", e.message);
              },
            });
          }}
        />
        <FastEditDrawer
          fast={editing}
          nowMs={nowMs}
          saving={edit.isPending}
          deleting={false}
          error={msgFor("edit")}
          onClose={() => {
            setEditing(null);
            setMessage(null);
          }}
          onSave={(id, input) => {
            if (needOnline("edit")) return;
            setMessage(null);
            edit.mutate(
              { id, input },
              { onSuccess: (f) => { setJustEnded(f); setEditing(null); }, onError: (e) => say("edit", e.message) },
            );
          }}
        />
        <p className="mt-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
          <button type="button" className="underline underline-offset-2" style={{ minHeight: 44 }} onClick={() => setJustEnded(null)}>
            Start another fast
          </button>
        </p>
      </>
    );
  }

  // ── No fast: the safety check, then the start page ──
  const stored = settings.data?.fasting_screening ?? null;
  const screenedThisVersion = !!stored && stored.version === SCREENING_VERSION;
  const passed = passedHere || (screenedThisVersion && stored.passed);

  let body: React.ReactNode;
  const outcomeNeedsRead =
    outcome !== null && (outcome === "stored_block" || !outcome.passed || outcome.advice === "talk_to_doctor");
  if (outcome !== null && outcomeNeedsRead) {
    body = (
      <FastCheckOutcome
        outcome={outcome}
        onRetake={() => {
          setOutcome(null);
          setRetaking(true);
          setPassedHere(false);
          setMessage(null);
        }}
        onContinue={() => setOutcome(null)}
      />
    );
  } else if (!passedHere && screenedThisVersion && !stored.passed && !retaking) {
    body = <FastCheckOutcome outcome="stored_block" onRetake={() => { setRetaking(true); setPassedHere(false); }} onContinue={() => undefined} />;
  } else if (!passed || retaking) {
    body = (
      <FastCheck
        pending={screening.isPending}
        error={msgFor("screen")}
        onSubmit={(answers) => {
          if (needOnline("screen")) return;
          setMessage(null);
          screening.mutate(answers, {
            onSuccess: (o) => {
              setOutcome(o);
              setRetaking(false);
              setPassedHere(o.passed);
              // Drop the answers (the call's variables) from the mutation cache now.
              screening.reset();
            },
            onError: (e) => {
              say("screen", e.message);
              screening.reset();
            },
          });
        }}
      />
    );
  } else {
    body = (
      <FastStart
        nowMs={nowMs}
        pending={start.isPending}
        error={msgFor("start")}
        onStart={(input) => {
          if (needOnline("start")) return;
          setMessage(null);
          start.mutate(input, {
            onError: (e) => {
              say("start", e.message);
              if (e.code === "FASTING_SCREENING_REQUIRED") void settings.refetch();
              if (e.code === "FASTING_ALREADY_RUNNING" || e.code === "FASTING_EXPIRED_UNCLOSED") void current.refetch();
            },
          });
        }}
      />
    );
  }

  return (
    <>
      {heading}
      {!online && (
        <div role="status" className="mb-3.5 rounded-(--r-2) p-3 text-[13px]" style={{ background: "var(--bg-3)", color: "var(--fg-2)" }}>
          You are offline. {OFFLINE_WRITE_MESSAGE}
        </div>
      )}
      {body}
      <p className="mt-4 text-[13px]" style={{ color: "var(--fg-3)" }}>
        <Link href={SOLO_HREFS.fastingHistory} className="inline-flex items-center underline underline-offset-2" style={{ minHeight: 44 }}>
          Your fasting history
        </Link>
      </p>
    </>
  );
}

function LoadFailed({ onRetry }: { onRetry: () => void }) {
  return (
    <DSCard className="p-6">
      <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>
        We could not load your fast
      </h2>
      <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
        Nothing you logged is lost. Check your connection and try again.
      </p>
      <button type="button" className="btn-primary-v2 mt-3" style={{ height: 44 }} onClick={onRetry}>
        Try again
      </button>
    </DSCard>
  );
}

/** Used by tests and the empty state of other pages. */
export function NoFastNote() {
  return (
    <DSCard className="p-6">
      <h2 className="text-[20px] font-medium">{NO_FAST_TITLE}</h2>
      <p className="mt-1 text-[14px]" style={{ color: "var(--fg-3)" }}>
        {NO_FAST_BODY}
      </p>
    </DSCard>
  );
}
