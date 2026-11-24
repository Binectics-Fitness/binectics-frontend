"use client";

import Modal from "@/components/Modal";
import { Toggle } from "@/components/ds/Toggle";
import { ChoiceGroup } from "@/components/starter/ChoiceGroup";
import { useSpeechUnavailable } from "@/lib/guided/speech";
import {
  PREP_CHOICES,
  RATE_CHOICES,
  REST_CHOICES,
  VOLUME_CHOICES,
  useGuidedPrefs,
  type GuidedPrefs,
} from "@/lib/guided/prefs";

type BoolKey = { [K in keyof GuidedPrefs]: GuidedPrefs[K] extends boolean ? K : never }[keyof GuidedPrefs];
type NumKey = { [K in keyof GuidedPrefs]: GuidedPrefs[K] extends number ? K : never }[keyof GuidedPrefs];

const secs = (n: number) => ({ label: n === 0 ? "None" : `${n} sec`, value: n });

/**
 * Voice and timing for guided sessions. Optional: the defaults work, so this
 * lives behind "Change" next to the Start button instead of on the way in.
 * Changes save as they are made and apply to the next session started.
 *
 * The same choices as binectics-mobile src/components/guided/GuidedSettingsSheet.tsx.
 */
export function GuidedSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const prefs = useGuidedPrefs((s) => s.prefs);
  const setPrefs = useGuidedPrefs((s) => s.set);
  const voiceDown = useSpeechUnavailable();

  const row = (label: string, key: BoolKey) => (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <span className="text-[15px]" style={{ color: "var(--ink)" }}>{label}</span>
      <Toggle on={prefs[key]} label={label} onChange={(v) => setPrefs({ [key]: v })} />
    </div>
  );
  const chips = (label: string, options: readonly { label: string; value: number }[], key: NumKey) => {
    const match = options.find((o) => Math.abs(prefs[key] - o.value) < 0.01)?.value ?? null;
    return (
      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-medium" style={{ color: "var(--fg-2)" }}>{label}</span>
        <ChoiceGroup label={label} options={options} value={match} onChange={(v) => setPrefs({ [key]: v })} />
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Voice and timing"
      disableCloseGuard
      footer={
        <button type="button" className="btn-primary-v2 lg min-h-11" onClick={onClose}>
          Done
        </button>
      }
    >
      {/* The shared Modal does not cap its body when there is a footer: scroll here so Done stays on screen. */}
      <div className="-mx-1 max-h-[calc(100dvh-210px)] overflow-y-auto px-1">
      <div
        className="flex flex-col gap-4 rounded-(--r-3) p-4"
        style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
        data-testid="guided-settings"
      >
        {row("Voice coaching", "voiceOn")}
        {row("Sounds (short beeps)", "soundsOn")}
        {prefs.voiceOn && (
          <>
            {row("Countdown calls", "countdownCalls")}
            {row("Spoken form tips", "formCues")}
            {row("Coach lines", "coachLines")}
            {prefs.coachLines && row("Local flavour", "localWords")}
            {chips("Speaking speed", RATE_CHOICES, "rate")}
            {chips("Voice volume", VOLUME_CHOICES, "volume")}
          </>
        )}
        {chips("Get-ready countdown", PREP_CHOICES.map(secs), "prepSeconds")}
        {chips("Rest when the plan has none", REST_CHOICES.map(secs), "defaultRestSeconds")}
      </div>
      {voiceDown && prefs.voiceOn && (
        <p role="alert" className="mt-3 text-[14px]" style={{ color: "var(--warn-ink)" }}>
          Voice is not available in this browser right now. The timer works the same without it.
        </p>
      )}
      <p className="mt-3 text-[13px] leading-snug" style={{ color: "var(--fg-3)" }}>
        Voice uses your browser&apos;s own text to speech. Keep this tab open: away for more than two minutes, and the
        session comes back paused where you left it. The exercise figures are illustrated demos. This is general
        guidance, not medical advice: stop if something hurts.
      </p>
      </div>
    </Modal>
  );
}
