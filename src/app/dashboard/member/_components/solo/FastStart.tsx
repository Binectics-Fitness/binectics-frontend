"use client";

import { useMemo, useState } from "react";
import { ChipGroup, DSCard } from "@/components/ds";
import { DEFAULT_PRESET, PRESET_OPTIONS, HOUR_MS, parseCustomHours, presetHint, relativeDay, timeOfDay } from "@/lib/solo/fastingRules";
import { startLimit, startTimeProblem } from "@/lib/solo/fastStartTime";
import type { FastingPresetKey, StartFastInput } from "@/lib/api/fasting";
import { CUSTOM_LABEL, ENDS_PICK_LENGTH, START_BUTTON, START_CAP_NOTE, START_FOOT, START_STEP, START_TITLE } from "@/lib/solo/fastingCopy";
import { FastCoachNote } from "./FastCoachNote";
import { StartTimeControl } from "./StartTimeControl";
import { WriteError } from "./parts";
import styles from "./fasting.module.css";

/** What the start form would send, or why it cannot yet. Pure so the rules are tested without a browser. */
export function buildStart(opts: {
  preset: FastingPresetKey;
  customText: string;
  /** The chosen start, or null for now. */
  startMs: number | null;
  nowMs: number;
  /** When the last fast ended: a new one cannot start before it. */
  lastEndMs?: number | null;
}): { ok: true; input: StartFastInput; hours: number; startMs: number } | { ok: false; hoursMessage: string | null; startBlocked: boolean } {
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
  const startMs = opts.startMs ?? opts.nowMs;
  const startBlocked = startTimeProblem(opts.startMs, opts.nowMs, startLimit(opts.lastEndMs ?? null, opts.nowMs)) !== null;
  if (hours === null || startBlocked) return { ok: false, hoursMessage, startBlocked };
  return {
    ok: true,
    hours,
    startMs,
    input: { started_at: new Date(startMs).toISOString(), target_hours: hours, preset: preset.key },
  };
}

/**
 * The start page, step 2 of 2 (design 04): a length, the Starts / Ends card
 * (Starts is the control), the coach note for a coached member, then Start.
 */
export function FastStart({
  nowMs,
  onStart,
  pending,
  error,
  lastEndMs = null,
  openStartSignal = 0,
}: {
  nowMs: number;
  onStart: (input: StartFastInput) => void;
  pending: boolean;
  error: string | null;
  /** When the member's last fast ended (epoch ms), or null when none is known. */
  lastEndMs?: number | null;
  /** Changing it opens the start-time choices (after the server refused a start). */
  openStartSignal?: number;
}) {
  const [preset, setPreset] = useState<FastingPresetKey>(DEFAULT_PRESET);
  const [customText, setCustomText] = useState("18");
  const [startMs, setStartMs] = useState<number | null>(null);

  const built = useMemo(() => buildStart({ preset, customText, startMs, nowMs, lastEndMs }), [preset, customText, startMs, nowMs, lastEndMs]);
  const option = PRESET_OPTIONS.find((p) => p.key === preset) ?? PRESET_OPTIONS[2];
  const customParsed = preset === "custom" ? parseCustomHours(customText) : null;
  const hours = customParsed ? (customParsed.ok ? customParsed.hours : null) : option.hours;
  const startAt = startMs ?? nowMs;
  const hoursMessage = built.ok ? null : built.hoursMessage;
  const startOk = built.ok || !built.startBlocked;
  const endText = hours !== null ? `${relativeDay(startAt + hours * HOUR_MS, nowMs)} · ${timeOfDay(startAt + hours * HOUR_MS)}` : ENDS_PICK_LENGTH;

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

      <ChipGroup
        className="mt-3"
        label="Fast length"
        options={PRESET_OPTIONS.map((p) => ({
          value: p.key,
          label: p.label,
          ariaLabel: p.key === "one_meal" ? "One meal a day" : p.key === "custom" ? "Custom length" : `${p.hours} hours`,
        }))}
        value={preset}
        onChange={setPreset}
      />

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

      <StartTimeControl nowMs={nowMs} startMs={startMs} onChange={setStartMs} endText={endText} lastEndMs={lastEndMs} openSignal={openStartSignal} />

      <FastCoachNote nowMs={nowMs} startAt={startAt} hours={hours} canTell={startOk} />

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
          const fresh = buildStart({ preset, customText, startMs, nowMs: Date.now(), lastEndMs });
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
