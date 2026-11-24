"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGuidedPrefs, type GuidedPrefs } from "@/lib/guided/prefs";
import { GuidedSettingsDialog } from "./GuidedSettingsDialog";

/** "Voice coach on · 5 sec get-ready": what Start will do, in one glance. */
export function guidedSettingsLine(p: GuidedPrefs): string {
  const voice = p.voiceOn ? "Voice coach on" : p.soundsOn ? "Beeps only" : "Silent";
  const prep = p.prepSeconds > 0 ? `${p.prepSeconds} sec get-ready` : "No get-ready";
  return `${voice} · ${prep}`;
}

/**
 * The one way into a guided session, wherever a workout is shown: a single
 * Start that begins the get-ready countdown, a line saying what it does, and
 * the optional voice and timing choices behind "Change". Nothing in between.
 *
 * Mirrors binectics-mobile src/components/guided/GuidedStartBlock.tsx.
 */
export function GuidedStartBlock({
  onStart,
  disabled,
  className = "",
}: {
  /** Runs inside the click, so audio and speech can be unlocked there (browser autoplay rules). */
  onStart: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const prefs = useGuidedPrefs((s) => s.prefs);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (userId) void useGuidedPrefs.getState().hydrate(userId);
  }, [userId]);

  return (
    <section className={className} data-testid="guided-start-block" aria-label="Guided session">
      <button
        type="button"
        className="btn-primary-v2 lg min-h-11 w-full sm:w-auto"
        onClick={onStart}
        disabled={disabled}
      >
        Start guided session
      </button>
      <p className="mt-2 text-[14px] leading-snug" style={{ color: "var(--fg-2)" }}>
        Your coach counts you in, times each exercise and rest, and says what is next. Keep this tab open and
        follow along.
      </p>
      <div className="mt-1 flex min-h-11 flex-wrap items-center gap-x-2">
        <span className="font-mono text-[13px]" style={{ color: "var(--fg-3)" }} data-testid="guided-settings-line">
          {guidedSettingsLine(prefs)}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Change voice and timing"
          className="min-h-11 cursor-pointer px-1 text-[14px] font-medium underline underline-offset-2"
          style={{ color: "var(--ink)" }}
          data-testid="guided-settings-open"
        >
          Change
        </button>
      </div>
      <GuidedSettingsDialog open={open} onClose={() => setOpen(false)} />
    </section>
  );
}
