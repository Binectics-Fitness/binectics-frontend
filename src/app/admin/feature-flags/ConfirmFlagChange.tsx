"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { Eyebrow } from "@/components/ds";
import { confirmationSatisfied } from "@/lib/featureFlags/helpers";

export const flagInputClass = "h-9 w-full rounded-(--r-2) px-3 text-[13.5px]";
export const flagInputStyle = {
  background: "var(--bg)",
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
} as const;

/**
 * Confirms one flag change before it is sent. Every change can carry a
 * reason for the history; a risky flag also needs its key typed.
 */
export function ConfirmFlagChange({
  flagKey,
  risky,
  title,
  consequence,
  confirmLabel,
  danger,
  onCancel,
  onConfirm,
}: {
  flagKey: string;
  risky: boolean;
  title: string;
  /** What happens, in one or two sentences. */
  consequence: string;
  confirmLabel: string;
  /** Turning something off: the confirm button reads as destructive. */
  danger?: boolean;
  onCancel: () => void;
  /** Resolves to an error message, or null when it worked. */
  onConfirm: (reason: string) => Promise<string | null>;
}) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = confirmationSatisfied(risky, flagKey, typed);

  const submit = async () => {
    if (!ready || saving) return;
    setSaving(true);
    setError(null);
    const failure = await onConfirm(reason);
    setSaving(false);
    if (failure) setError(failure);
  };

  return (
    <Modal
      open
      onClose={onCancel}
      title={title}
      size="md"
      footer={
        <>
          <button type="button" className="btn-ghost-v2 sm" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            className={danger ? "btn-ghost-v2 sm" : "btn-primary-v2 sm"}
            style={danger ? { color: "var(--danger)", borderColor: "var(--danger)" } : undefined}
            onClick={() => void submit()}
            disabled={!ready || saving}
          >
            {saving ? "Saving..." : confirmLabel}
          </button>
        </>
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--fg-2)" }}>
          {consequence}
        </p>
        <label className="flex flex-col gap-1.5">
          <Eyebrow as="span">Reason (kept in the history)</Eyebrow>
          <input
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. pilot with Iron Lab, incident 12"
            className={flagInputClass}
            style={flagInputStyle}
          />
        </label>
        {risky && (
          <label className="flex flex-col gap-1.5">
            <Eyebrow as="span">Type {flagKey} to confirm</Eyebrow>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-label={`Type ${flagKey} to confirm`}
              className={`${flagInputClass} font-mono`}
              style={flagInputStyle}
            />
            <span className="text-[12px]" style={{ color: "var(--fg-3)" }}>
              This flag is marked risky: a wrong change can stop payments or lock people out.
            </span>
          </label>
        )}
        {error && (
          <p role="alert" className="text-[13px]" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}
      </form>
    </Modal>
  );
}

/** The message to show for a failed write. */
export function flagWriteError(res: { status?: number; message?: string }, fallback: string): string {
  if (res.status === 403) return "You need the platform:write admin permission to change flags.";
  return res.message || fallback;
}
