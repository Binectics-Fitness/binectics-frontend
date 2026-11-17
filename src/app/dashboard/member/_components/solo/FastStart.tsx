"use client";

import { useMemo, useState } from "react";
import { DSCard } from "@/components/ds";
import { DEFAULT_PRESET, PRESET_OPTIONS, HOUR_MS, START_MAX_PAST_MS, fromLocalInput, parseCustomHours, presetHint, relativeDay, startProblem, timeOfDay, toLocalInput } from "@/lib/solo/fastingRules";
import type { FastingPresetKey, StartFastInput } from "@/lib/api/fasting";
import { CUSTOM_LABEL, EARLIER_LABEL, START_BUTTON, START_CAP_NOTE, START_EARLIER, START_FOOT, START_NOW, START_STEP, START_TITLE } from "@/lib/solo/fastingCopy";
import { WriteError } from "./parts";
import styles from "./fasting.module.css";

/** What the start form would send, or why it cannot yet. Pure so the rules are tested without a browser. */
export function buildStart(opts: {
  preset: FastingPresetKey;
  customText: string;
  earlierText: string | null;
  nowMs: number;
}): { ok: true; input: StartFastInput; hours: number; startMs: number } | { ok: false; hoursMessage: string | null; startMessage: string | null } {
  const preset = PRESET_OPTIONS.find((p) => p.key === opts.preset) ?? PRESET_OPTIONS[2];
  let hoursMessage: string | null = null;
  let hours = preset.hours;
  if (preset.key === "custom") {
    const c = parseCustomHours(opts.customText);
    if (c.ok) hours = c.hours;
    else {
      hours = null;
      hoursMessage = c.message;
    }
  }
  let startMs = opts.nowMs;
  let startMessage: string | null = null;
  if (opts.earlierText !== null) {
    const parsed = fromLocalInput(opts.earlierText);
    startMessage = startProblem(parsed, opts.nowMs);
    if (parsed !== null) startMs = parsed;
  }
  if (hours === null || startMessage) return { ok: false, hoursMessage, startMessage };
  return {
    ok: true,
    hours,
    startMs,
    input: { started_at: new Date(startMs).toISOString(), target_hours: hours, preset: preset.key },
  };
}

/** The start page, step 2 of 2 (design 04): a length, optionally an earlier start, then Start fast. */
export function FastStart({
  nowMs,
  onStart,
  pending,
  error,
}: {
  nowMs: number;
  onStart: (input: StartFastInput) => void;
  pending: boolean;
  error: string | null;
}) {
  const [preset, setPreset] = useState<FastingPresetKey>(DEFAULT_PRESET);
  const [customText, setCustomText] = useState("18");
  const [earlier, setEarlier] = useState<string | null>(null);

  const built = useMemo(() => buildStart({ preset, customText, earlierText: earlier, nowMs }), [preset, customText, earlier, nowMs]);
  const hours = built.ok ? built.hours : null;
  const startMs = built.ok ? built.startMs : earlier !== null ? fromLocalInput(earlier) ?? nowMs : nowMs;
  const hoursMessage = built.ok ? null : built.hoursMessage;
  const startMessage = built.ok ? null : built.startMessage;

  const step = (delta: number) => {
    const n = Number(customText.replace(",", "."));
    const base = Number.isFinite(n) ? n : 18;
    const next = Math.min(25, Math.max(1, Math.round((base + delta) * 2) / 2));
    setCustomText(String(next));
  };

  return (
    <DSCard className="mx-auto w-full max-w-[680px] p-6">
      <p className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
        {START_STEP}
      </p>
      <h2 className="mt-1 text-[20px] font-medium" style={{ color: "var(--ink)" }}>
        {START_TITLE}
      </h2>

      <div className={`${styles.chips} mt-3`} role="group" aria-label="Fast length">
        {PRESET_OPTIONS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={styles.pill}
            aria-pressed={preset === p.key}
            aria-label={p.key === "one_meal" ? "One meal a day" : p.key === "custom" ? "Custom length" : `${p.hours} hours`}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="custom-hours" className={styles.label}>
              {CUSTOM_LABEL}
            </label>
            <div className="flex items-center gap-2">
              <button type="button" className="btn-ghost-v2" style={{ height: 44, width: 44, padding: 0 }} onClick={() => step(-1)} aria-label="One hour fewer">
                &minus;
              </button>
              <input
                id="custom-hours"
                className={styles.field}
                style={{ width: 96, textAlign: "center" }}
                inputMode="decimal"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                aria-invalid={hoursMessage ? true : undefined}
                aria-describedby={hoursMessage ? "custom-hours-msg" : undefined}
              />
              <button type="button" className="btn-ghost-v2" style={{ height: 44, width: 44, padding: 0 }} onClick={() => step(1)} aria-label="One hour more">
                +
              </button>
            </div>
          </div>
        </div>
      )}
      {hoursMessage && (
        <p id="custom-hours-msg" role="alert" className={`${styles.error} mt-2`}>
          {hoursMessage}
        </p>
      )}

      <p className="mt-3 text-[14px]" style={{ color: "var(--fg-2)" }}>
        {hours !== null ? `${presetHint(hours)} ` : ""}
        {START_CAP_NOTE}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Starts
          </dt>
          <dd className="text-[15px] font-medium" data-testid="start-label">
            {relativeDay(startMs, nowMs)} · {timeOfDay(startMs)}
          </dd>
        </div>
        <div>
          <dt className="font-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
            Ends
          </dt>
          <dd className="text-[15px] font-medium" data-testid="end-label">
            {hours !== null ? `${relativeDay(startMs + hours * HOUR_MS, nowMs)} · ${timeOfDay(startMs + hours * HOUR_MS)}` : "Pick a length"}
          </dd>
        </div>
      </dl>

      <div className="mt-3">
        {earlier === null ? (
          <button
            type="button"
            className="text-[14px] underline underline-offset-2"
            style={{ color: "var(--fg-2)", minHeight: 44 }}
            onClick={() => setEarlier(toLocalInput(nowMs))}
          >
            {START_EARLIER}
          </button>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label htmlFor="earlier-start" className={styles.label}>
                {EARLIER_LABEL}
              </label>
              <input
                id="earlier-start"
                type="datetime-local"
                className={styles.field}
                value={earlier}
                min={toLocalInput(nowMs - START_MAX_PAST_MS)}
                max={toLocalInput(nowMs)}
                onChange={(e) => setEarlier(e.target.value)}
                aria-invalid={startMessage ? true : undefined}
                aria-describedby={startMessage ? "earlier-msg" : undefined}
              />
            </div>
            <button type="button" className="text-[14px] underline underline-offset-2" style={{ color: "var(--fg-2)", minHeight: 44 }} onClick={() => setEarlier(null)}>
              {START_NOW}
            </button>
          </div>
        )}
        {startMessage && (
          <p id="earlier-msg" role="alert" className={`${styles.error} mt-1`}>
            {startMessage}
          </p>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <WriteError message={error} />
        </div>
      )}
      <button
        type="button"
        className="btn-primary-v2 mt-4"
        style={{ height: 44 }}
        disabled={!built.ok || pending}
        onClick={() => {
          // Re-read the clock at the tap: the tick that drew this page can be up to 30 seconds old.
          const fresh = buildStart({ preset, customText, earlierText: earlier, nowMs: Date.now() });
          if (fresh.ok) onStart(fresh.input);
        }}
      >
        {START_BUTTON}
      </button>
      <p className="mt-3 text-[13px]" style={{ color: "var(--fg-3)" }}>
        {START_FOOT}
      </p>
    </DSCard>
  );
}
