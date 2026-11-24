"use client";

import { memo, useEffect, useRef, useState, type ReactNode } from "react";
import { BellOff, BellRing, Pause, Play, RotateCcw, SkipForward, Volume2, VolumeX, Wind, X } from "lucide-react";
import ExerciseIllustration, { hasExerciseIllustration } from "@/components/ExerciseIllustration";
import { clock } from "@/lib/guided/format";
import { elapsedMs, exerciseStatus, isPaused, remainingMs, type SessionState } from "@/lib/guided/engine";

/**
 * The running guided session: get ready, exercise and rest. Web version of
 * binectics-mobile src/screens/starter/guided/GuidedActive.tsx with the same
 * controls and phase looks; the layout is a centred column that works from a
 * phone to a desktop. Nothing here keeps time: the clock is the engine's
 * timestamps, polled for display.
 *
 * Keyboard: Space pauses or resumes, Enter or D marks a rep set done, S skips,
 * R repeats, B is "Need a break", Escape asks to end.
 */

/** Phase look: prep is amber, work is dark, rest is light. Colour is never the only signal (the label says it too). */
const LOOK = {
  countdown: { bg: "var(--warn-soft)", fg: "var(--warn-ink)", sub: "var(--warn-ink)", label: "GET READY" },
  exercise: { bg: "var(--ink)", fg: "var(--bg)", sub: "var(--on-ink-3)", label: "EXERCISE" },
  rest: { bg: "var(--bg-3)", fg: "var(--ink)", sub: "var(--fg-2)", label: "REST" },
} as const;

/** Spoken-time announcements for screen readers: every second of the get-ready, then only these. */
const ANNOUNCE_AT = new Set([30, 10, 5, 3, 2, 1]);

/** Re-renders on its own 250 ms poll; the time shown comes from timestamps only. */
const BigTimer = memo(function BigTimer({ state, color, subColor }: { state: SessionState; color: string; subColor: string }) {
  const [now, setNow] = useState(() => Date.now());
  const paused = isPaused(state);
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [paused, state.phaseId]);

  // `now` can lag a render behind a phase change by up to one poll; never read it as before the phase began.
  const at = Math.max(now, state.phaseStartedAt ?? 0);
  const rem = remainingMs(state, at);
  const secs = rem === null ? null : Math.ceil(rem / 1000);
  const countdown = state.phase === "countdown";
  const spoken =
    secs === null
      ? ""
      : paused
        ? `Paused, ${secs} seconds ${countdown ? "to start" : "left"}`
        : countdown || ANNOUNCE_AT.has(secs)
          ? `${secs} ${secs === 1 ? "second" : "seconds"}${countdown ? "" : " left"}`
          : null;
  // Empty between thresholds: a live region speaks when its text is set, so each call is heard once.

  if (rem === null) {
    const p = state.plan[state.exIndex];
    return (
      <div className="my-2 flex flex-col items-center">
        <p className="font-mono text-[56px] leading-none font-medium sm:text-[72px]" style={{ color }} data-testid="guided-reps">
          {p.reps !== undefined ? `${p.reps} reps` : "Your pace"}
        </p>
        <p className="mt-2 font-mono text-[17px]" style={{ color: subColor }}>
          {clock(elapsedMs(state, at))} elapsed
        </p>
      </div>
    );
  }
  return (
    <div className="my-2 flex flex-col items-center">
      <p
        role="timer"
        aria-hidden="true"
        className="font-mono leading-none tabular-nums text-[88px] sm:text-[120px]"
        style={{ color, opacity: paused ? 0.5 : 1 }}
        data-testid="guided-timer"
      >
        {countdown ? String(Math.max(1, secs ?? 1)) : clock(rem)}
      </p>
      <p className="sr-only" aria-live="polite" aria-atomic="true" data-testid="guided-timer-live">
        {spoken ?? ""}
      </p>
    </div>
  );
});

function Control({
  label,
  icon,
  onClick,
  color,
  big,
  fill,
  disabled,
  testId,
  shortcut,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  color: string;
  big?: boolean;
  fill?: string;
  disabled?: boolean;
  testId?: string;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-keyshortcuts={shortcut}
      data-testid={testId}
      className={`flex flex-col items-center justify-center gap-1 rounded-(--r-3) px-2 text-[14px] font-medium cursor-pointer disabled:cursor-not-allowed disabled:opacity-35 ${
        big ? "min-h-[88px] flex-[1.4]" : "min-h-[76px] flex-1"
      }`}
      style={fill ? { background: fill, color: "var(--ink)" } : { border: `1px solid ${color}`, color }}
    >
      {icon}
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}

interface Props {
  state: SessionState;
  title: string;
  voiceOn: boolean;
  soundsOn: boolean;
  voiceUnavailable?: boolean;
  onToggleSounds: () => void;
  onToggleVoice: () => void;
  onPause: () => void;
  onResume: () => void;
  onDoneSet: () => void;
  onSkipExercise: () => void;
  onSkipRest: () => void;
  onRepeat: () => void;
  onEnd: () => void;
  /** "Need a break": pauses and says something calming. */
  onEaseOff: () => void;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));

export function GuidedActive({
  state,
  title,
  voiceOn,
  soundsOn,
  voiceUnavailable,
  onToggleSounds,
  onToggleVoice,
  onPause,
  onResume,
  onDoneSet,
  onSkipExercise,
  onSkipRest,
  onRepeat,
  onEnd,
  onEaseOff,
}: Props) {
  const phase = state.phase as "countdown" | "exercise" | "rest";
  const look = LOOK[phase];
  const paused = isPaused(state);
  const p = state.plan[state.exIndex];
  const total = state.plan.length;
  const resting = phase === "rest";
  const repsSet = phase === "exercise" && p.kind === "reps";
  const cue = !resting ? p.cues[0] : null;
  const tone = look.fg;
  const showArt = hasExerciseIllustration(p.mediaId);
  const where = `Exercise ${state.exIndex + 1} of ${total}` + (p.sets > 1 ? ` · Set ${state.setIndex + 1} of ${p.sets}` : "");
  const label = paused ? "PAUSED" : look.label;
  const heading = resting ? `Next: ${p.name}` : p.name;
  const restLine = resting ? (state.restKind === "set" ? `Set ${state.setIndex + 1} of ${p.sets}` : "New exercise") : null;

  // Keyboard shortcuts, read through a ref so the listener is attached once.
  const keys = useRef({ paused, repsSet, resting, onPause, onResume, onDoneSet, onSkipExercise, onSkipRest, onRepeat, onEnd, onEaseOff });
  useEffect(() => {
    keys.current = { paused, repsSet, resting, onPause, onResume, onDoneSet, onSkipExercise, onSkipRest, onRepeat, onEnd, onEaseOff };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      // A dialog (the End confirmation) owns the keyboard while it is open.
      if (document.querySelector('[role="dialog"]')) return;
      const k = keys.current;
      const onButton = e.target instanceof HTMLElement && e.target.closest("button, a");
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (key === " " && !onButton) {
        e.preventDefault();
        if (k.paused) k.onResume();
        else k.onPause();
      } else if ((key === "Enter" && !onButton) || key === "d") {
        if (k.repsSet && !k.paused) {
          e.preventDefault();
          k.onDoneSet();
        }
      } else if (key === "s" && !k.paused) {
        if (k.resting) k.onSkipRest();
        else k.onSkipExercise();
      } else if (key === "r" && !k.paused) {
        k.onRepeat();
      } else if (key === "b" && !k.paused) {
        k.onEaseOff();
      } else if (key === "Escape") {
        k.onEnd();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      className="flex min-h-dvh flex-col motion-safe:transition-colors motion-safe:duration-300"
      style={{ background: look.bg, color: tone }}
      data-testid={`guided-${phase}`}
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 pb-4 pt-2 sm:px-6">
        <header className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onEnd}
            aria-label="End workout"
            aria-keyshortcuts="Escape"
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
            style={{ color: tone }}
            data-testid="guided-end"
          >
            <X size={24} strokeWidth={1.75} aria-hidden="true" />
          </button>
          <p className="flex-1 truncate text-center font-mono text-[13px]" style={{ color: look.sub }} data-testid="guided-where">
            {where}
          </p>
          <div className="flex">
            <button
              type="button"
              role="switch"
              aria-checked={soundsOn}
              aria-label="Sounds"
              onClick={onToggleSounds}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
              style={{ color: tone }}
            >
              {soundsOn ? <BellRing size={22} strokeWidth={1.75} aria-hidden="true" /> : <BellOff size={22} strokeWidth={1.75} aria-hidden="true" />}
            </button>
            <button
              type="button"
              role="switch"
              aria-checked={voiceOn}
              aria-label="Voice coaching"
              onClick={onToggleVoice}
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full"
              style={{ color: tone }}
            >
              {voiceOn ? <Volume2 size={24} strokeWidth={1.75} aria-hidden="true" /> : <VolumeX size={24} strokeWidth={1.75} aria-hidden="true" />}
            </button>
          </div>
        </header>

        <div className="mt-1 flex gap-1 px-2" role="img" aria-label={`Workout progress, exercise ${state.exIndex + 1} of ${total}`}>
          {state.plan.map((item, i) => {
            const st = exerciseStatus(state, i);
            const filled = st === "done" || st === "skipped" || i < state.exIndex;
            const current = i === state.exIndex;
            return (
              <span
                key={item.key}
                className="h-1 flex-1 rounded-full"
                style={{ background: filled ? tone : look.sub, opacity: filled ? 1 : current ? 0.7 : 0.3 }}
              />
            );
          })}
        </div>

        <main className="flex flex-1 flex-col items-center justify-center py-4 text-center">
          <p className="sr-only">{title}</p>
          {/* One polite region for what changed: phase, exercise, where and the cue. The timer has its own. */}
          <div aria-live="polite" aria-atomic="true" className="flex flex-col items-center">
            <p className="font-mono text-[13px] tracking-[0.12em]" style={{ color: look.sub }} data-testid="guided-phase">
              {label}
            </p>
            <h1 className="mt-1 text-[26px] font-medium leading-tight sm:text-[32px]" style={{ color: tone, letterSpacing: "-0.015em" }}>
              {heading}
            </h1>
            {restLine && (
              <p className="mt-1 font-mono text-[15px]" style={{ color: look.sub }}>
                {restLine}
              </p>
            )}
            <span className="sr-only">{where}</span>
          </div>

          <BigTimer state={state} color={tone} subColor={look.sub} />

          {showArt && (
            <div
              className="mt-1 w-full max-w-[240px] overflow-hidden rounded-(--r-3) p-2 sm:max-w-[280px]"
              style={{ background: "var(--bg)" }}
            >
              <ExerciseIllustration mediaId={p.mediaId} className="block aspect-square h-auto w-full object-contain" />
            </div>
          )}
          {!!cue && (
            <p className="mt-3 max-w-md text-[17px] leading-snug" style={{ color: tone }} aria-live="polite" data-testid="guided-cue">
              {cue}
            </p>
          )}
          {voiceOn && voiceUnavailable && (
            <p className="mt-3 text-[13px]" style={{ color: look.sub }} role="status">
              Voice is not available in this browser. The timer works the same without it.
            </p>
          )}
        </main>

        <div className="flex flex-col gap-3">
          {repsSet && !paused && (
            <button
              type="button"
              onClick={onDoneSet}
              aria-keyshortcuts="Enter D"
              className="min-h-[72px] cursor-pointer rounded-(--r-3) text-[22px] font-medium"
              style={{ background: "var(--signal)", color: "var(--ink)" }}
              data-testid="guided-done-set"
            >
              Set done
            </button>
          )}
          <div className="flex items-stretch gap-3">
            <Control
              label={resting ? "Back a set" : phase === "countdown" ? "Restart" : "Repeat set"}
              icon={<RotateCcw size={24} strokeWidth={1.75} aria-hidden="true" />}
              onClick={onRepeat}
              color={tone}
              disabled={paused}
              testId="guided-repeat"
              shortcut="R"
            />
            {paused ? (
              <Control
                label="Resume"
                icon={<Play size={30} strokeWidth={1.75} aria-hidden="true" />}
                onClick={onResume}
                color={tone}
                big
                fill="var(--signal)"
                testId="guided-resume"
                shortcut="Space"
              />
            ) : (
              <Control
                label="Pause"
                icon={<Pause size={30} strokeWidth={1.75} aria-hidden="true" />}
                onClick={onPause}
                color={tone}
                big
                fill="var(--bg)"
                testId="guided-pause"
                shortcut="Space"
              />
            )}
            <Control
              label={resting ? "Skip rest" : "Skip exercise"}
              icon={<SkipForward size={24} strokeWidth={1.75} aria-hidden="true" />}
              onClick={resting ? onSkipRest : onSkipExercise}
              color={tone}
              disabled={paused}
              testId="guided-skip"
              shortcut="S"
            />
          </div>
          {!paused && (
            <button
              type="button"
              onClick={onEaseOff}
              aria-keyshortcuts="B"
              title="Pauses the workout and gives you a moment. Resume when you are ready."
              className="mx-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-4 text-[15px] font-medium"
              style={{ border: `1px solid ${look.sub}`, color: tone }}
              data-testid="guided-ease-off"
            >
              <Wind size={18} strokeWidth={1.75} aria-hidden="true" />
              Need a break
            </button>
          )}
          <p className="hidden text-center font-mono text-[12px] sm:block" style={{ color: look.sub }}>
            Space pause · {repsSet ? "Enter set done · " : ""}S skip · R repeat · Esc end
          </p>
        </div>
      </div>
    </div>
  );
}
