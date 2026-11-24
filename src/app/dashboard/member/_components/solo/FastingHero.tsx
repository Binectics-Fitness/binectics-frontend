"use client";

import Link from "next/link";
import { useState } from "react";
import type { FastSession, FastingFeelingValue } from "@/lib/api/fasting";
import {
  FASTING_STAGES,
  EDIT_START_LINK,
  FEELING_NOTE,
  FEELING_OPTIONS,
  FEELING_SAVED,
  FEELING_TITLE,
  REMINDERS_NOTE,
  REMINDERS_TITLE,
  UNWELL_BODY,
  UNWELL_END,
  UNWELL_TITLE,
  daypart,
  goalReachedEyebrow,
  progressPhrase,
  reachedAt,
} from "@/lib/solo/fastingCopy";
import {
  HOUR_MS,
  clockText,
  dawnGradient,
  dawnPalette,
  durationText,
  elapsedMs,
  fastProgress,
  formatHours,
  mix,
  remainingMs,
  spokenDuration,
  stageIndexAt,
  timeOfDay,
  toMs,
} from "@/lib/solo/fastingRules";
import { SOLO_HREFS } from "@/lib/solo/nav";
import { FastArc } from "./FastArc";
import { FastEndAction, useGoalReached } from "./FastEndAction";
import { WriteError } from "./parts";
import styles from "./fasting.module.css";

/**
 * The running fast in the "Dawn" desktop hero (design 05). The gradient is the
 * one approved exception to the plain palette and lives on THIS component only.
 * Everything on it is computed from the fast's absolute start and the `nowMs`
 * passed in, so it is the same after a sleeping tab or a changed clock.
 */
export function FastingHero({
  fast,
  nowMs,
  onEnd,
  onFeeling,
  onEditStart,
  ending,
  feelingError,
  endError,
  savedFeeling,
}: {
  fast: FastSession;
  nowMs: number;
  onEnd: () => void;
  onFeeling: (value: FastingFeelingValue) => void;
  onEditStart: () => void;
  ending: boolean;
  feelingError: string | null;
  endError: string | null;
  /** The feeling just saved (for the "Saved." note), or null. */
  savedFeeling: FastingFeelingValue | null;
}) {
  const startMs = toMs(fast.started_at);
  const endAt = startMs + fast.target_hours * HOUR_MS;
  const elapsed = elapsedMs(startMs, nowMs);
  const progress = fastProgress(elapsed, fast.target_hours);
  const remaining = remainingMs(elapsed, fast.target_hours);
  const stageIdx = stageIndexAt(elapsed);
  const stage = FASTING_STAGES[stageIdx];
  const pal = dawnPalette(progress);
  const light = pal.tone === "light";
  const numerals = clockText(elapsed);

  // The goal, the eyebrow, the line under the time and the end action always agree.
  const { reached, crossedOpen } = useGoalReached(endAt, nowMs);
  const hoursText = formatHours(fast.target_hours);
  const eyebrow = reached ? goalReachedEyebrow(hoursText) : `${daypart(new Date(nowMs).getHours())} · ${progressPhrase(progress)}`;
  const sub = reached ? reachedAt(timeOfDay(endAt)) : `${durationText(remaining)} to go · ends ${timeOfDay(endAt)}`;
  const arcLabel =
    `Fast progress from ${timeOfDay(startMs)} to ${timeOfDay(endAt)}. ` +
    `${spokenDuration(elapsed)} fasted, ${reached ? "goal reached" : `${spokenDuration(remaining)} to go`}.`;

  const [feeling, setFeeling] = useState<FastingFeelingValue | null>(null);
  const unwell = feeling === "unwell";

  const pick = (v: FastingFeelingValue) => {
    setFeeling(v);
    onFeeling(v);
  };

  // Buttons on the gradient: paper on night, ink on morning.
  const primaryBtn = light
    ? { background: "var(--bg)", color: "var(--ink)", borderColor: "var(--bg)" }
    : { background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" };
  const outlineBtn = { borderColor: "currentColor", color: pal.text, background: "transparent" };

  return (
    <section
      className={`${styles.hero} ${styles.onHero}`}
      style={{ background: dawnGradient(pal), color: pal.text, ["--hero-fg" as string]: pal.text }}
      aria-label="Your fast"
      data-testid="fasting-hero"
      data-tone={pal.tone}
    >
      <div className={styles.heroLeft}>
        <span className="font-mono text-[11px] uppercase tracking-[0.06em]" data-testid="fast-eyebrow">
          {eyebrow}
        </span>
        <span className={styles.numerals} data-testid="fast-numerals" role="timer" aria-label={`${spokenDuration(elapsed)} fasted`}>
          {numerals}
        </span>
        <span className="text-[16px]" data-testid="fast-sub">
          {sub}
        </span>
        <div className={styles.arcWrap}>
          <FastArc progress={progress} color={pal.text} track={mix(pal.text, pal.bottom, 0.8)} label={arcLabel} />
          <span className={styles.arcLabel} style={{ left: 20 }} aria-hidden="true">
            {timeOfDay(startMs)}
          </span>
          <span className={styles.arcLabel} style={{ right: 20 }} aria-hidden="true">
            {timeOfDay(endAt)}
          </span>
        </div>
      </div>

      <div className={styles.heroRight}>
        <Link href={SOLO_HREFS.fastingStages} className={`${styles.card} ${styles.cardLink}`} data-testid="fast-stage-card">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] flex-1" style={{ color: "var(--fg-3)" }}>
              Now · {stage.range}
            </span>
            <span className="text-[13px]" style={{ color: "var(--fg-3)" }}>
              All stages
            </span>
          </div>
          <p className="text-[17px] font-medium" data-testid="fast-stage-title">
            {stage.title}
          </p>
          <p className="text-[13.5px]" style={{ color: "var(--fg-2)" }}>
            {stage.short}
            {stage.next ? ` ${stage.next}` : ""}
          </p>
          <div className={styles.segs} aria-hidden="true">
            {FASTING_STAGES.map((s, i) => (
              <span key={s.id} className={`${styles.seg} ${i < stageIdx ? styles.segDone : i === stageIdx ? styles.segNow : ""}`} />
            ))}
          </div>
        </Link>

        <div className={styles.card} role="group" aria-labelledby="feel-title">
          <span id="feel-title" className="text-[16px] font-medium">
            {FEELING_TITLE}
          </span>
          <div className={styles.chips}>
            {FEELING_OPTIONS.map((o) => (
              <button key={o.value} type="button" className={styles.pill} aria-pressed={feeling === o.value} onClick={() => pick(o.value)}>
                {o.label}
              </button>
            ))}
          </div>
          <p className="text-[13px]" style={{ color: "var(--fg-3)" }} role="status">
            {savedFeeling && !unwell ? FEELING_SAVED : FEELING_NOTE}
          </p>
          {feelingError && <WriteError message={feelingError} />}
          {unwell && (
            <div
              role="alert"
              className="rounded-(--r-2) p-3"
              style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)", color: "var(--danger-ink)" }}
              data-testid="unwell-guidance"
            >
              <p className="text-[15px] font-medium">{UNWELL_TITLE}</p>
              <p className="mt-1 text-[13.5px]">{UNWELL_BODY}</p>
              <button type="button" className="btn-ghost-v2 mt-2" style={{ height: 44 }} onClick={onEnd} disabled={ending}>
                {UNWELL_END}
              </button>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <p className="text-[14px] font-medium">{REMINDERS_TITLE}</p>
          <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
            {REMINDERS_NOTE(timeOfDay(endAt))}
          </p>
        </div>

        {endError && <WriteError message={endError} />}
        <div className="flex flex-wrap gap-2.5">
          <FastEndAction
            reached={reached}
            crossedOpen={crossedOpen}
            onEnd={onEnd}
            disabled={ending}
            elapsedText={durationText(elapsed)}
            hoursText={hoursText}
            filled={primaryBtn}
            outline={outlineBtn}
          />
          <button type="button" className={styles.btnOnHero} style={outlineBtn} onClick={onEditStart}>
            {EDIT_START_LINK}
          </button>
        </div>
      </div>
    </section>
  );
}
