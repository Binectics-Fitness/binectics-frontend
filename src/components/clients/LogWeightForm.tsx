"use client";

import { useId, useState } from "react";
import { toast } from "@/components/Toast";
import { progressService, type WeightLog } from "@/lib/api/progress";

/**
 * The coach logs a client's weight ("the scale is in the gym", mobile
 * CoachWeightScreen). Logged for today, in kg. Shared by the trainer and
 * dietitian client pages.
 */

export const LOG_WEIGHT_COPY = {
  open: "Log weight",
  label: "Weight (kg)",
  placeholder: "82.5",
  invalid: "Enter a weight between 20 and 400 kg",
  help: (name: string) => `Logged for today. ${name} sees it in their progress.`,
  save: "Save weight",
  saving: "Saving…",
  cancel: "Cancel",
  saved: (name: string) => `Weight saved for ${name}`,
  failed: "Couldn't save the weight. Try again.",
} as const;

const C = LOG_WEIGHT_COPY;

/** A weight as typed ("81,5" or "81.5"), to one decimal; null if not sane (20-400 kg). */
export function parseWeightKg(raw: string): number | null {
  const text = raw.trim().replace(",", ".");
  if (!text) return null;
  const n = Number(text);
  if (!Number.isFinite(n) || n < 20 || n > 400) return null;
  return Math.round(n * 10) / 10;
}

export function LogWeightForm({
  clientProfileId,
  clientName,
  onSaved,
  onCancel,
}: {
  clientProfileId: string;
  /** First name, as the form addresses the client. */
  clientName: string;
  onSaved: (log: WeightLog) => void;
  onCancel: () => void;
}) {
  const ids = useId();
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kg = parseWeightKg(value);
  const invalid = value.trim() !== "" && kg == null;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (kg == null || busy) return;
    setBusy(true);
    setError(null);
    const res = await progressService.createWeightLog(clientProfileId, { weight_kg: kg, recorded_at: new Date().toISOString() });
    setBusy(false);
    if (res.success && res.data) {
      toast.success(C.saved(clientName));
      onSaved(res.data);
    } else {
      setError(res.message || C.failed);
    }
  };

  return (
    <form onSubmit={(e) => void save(e)} className="flex flex-col gap-2" noValidate>
      <label htmlFor={`${ids}-kg`} className="text-[13px] font-medium" style={{ color: "var(--fg-2)" }}>
        {C.label}
      </label>
      <div className="flex flex-wrap items-start gap-2">
        <input
          id={`${ids}-kg`}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          autoFocus
          value={value}
          placeholder={C.placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
          aria-invalid={invalid || undefined}
          aria-describedby={`${ids}-help${invalid ? ` ${ids}-err` : ""}`}
          className="rounded-(--r-2) px-3 text-[15px]"
          style={{
            height: 44,
            width: 140,
            background: "var(--bg)",
            border: `1px solid ${invalid ? "var(--danger)" : "var(--border-2)"}`,
            // The number itself is never colour-judged.
            color: "var(--ink)",
            fontVariantNumeric: "tabular-nums",
          }}
        />
        <button type="submit" className="btn-primary-v2 disabled:opacity-50" style={{ height: 44 }} disabled={kg == null || busy}>
          {busy ? C.saving : C.save}
        </button>
        <button type="button" className="btn-ghost-v2" style={{ height: 44 }} onClick={onCancel} disabled={busy}>
          {C.cancel}
        </button>
      </div>
      {invalid && (
        <span id={`${ids}-err`} className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
          {C.invalid}
        </span>
      )}
      <span id={`${ids}-help`} className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>
        {C.help(clientName)}
      </span>
      {error && (
        <span role="alert" className="text-[13px]" style={{ color: "var(--danger-ink)" }}>
          {error}
        </span>
      )}
    </form>
  );
}
