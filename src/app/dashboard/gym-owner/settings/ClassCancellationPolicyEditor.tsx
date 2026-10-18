"use client";

import { DSCard, Eyebrow } from "@/components/ds";
import { ClassCancellationPolicyNotice } from "@/components/classes/ClassCancellationPolicyNotice";
import { CANCELLATION_NOTE_MAX, policyFromRules } from "@/lib/classes/cancellationPolicy";
import type { BookingRules } from "@/lib/api/teams";

/** A window longer than this reads as a typo (30 days). */
export const MAX_WINDOW_HOURS = 720;

type PolicyFields = Pick<BookingRules, "cancellation_fee_percent" | "cancellation_window_hours" | "cancellation_policy_note">;

const INPUT_STYLE = {
  border: "1px solid var(--border-2)",
  color: "var(--ink)",
  background: "var(--bg)",
  fontFamily: "inherit",
} as const;
const INPUT_CLASS = "rounded-(--r-2) px-3.5 py-2.75 text-[14px]";

function clampInt(raw: string, max: number): number {
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(max, n);
}

/**
 * The gym's class late-cancellation policy (Settings → Booking rules): the
 * window, the fee percent and a note, with a live preview of what members
 * see before booking and when they cancel.
 *
 * A policy, not a charge (owner ruling, Oct 18 2026): Binectics records a
 * late cancellation on the booking and never takes the fee. Part of the
 * settings form, so it saves with the page's Save button.
 */
export function ClassCancellationPolicyEditor({
  rules,
  providerName,
  onChange,
  canManage,
  disabled,
}: {
  rules: PolicyFields | null;
  providerName: string;
  onChange: (patch: Partial<PolicyFields>) => void;
  /** holds(viewer, MANAGE_ORGANIZATION): the API refuses the save otherwise. */
  canManage: boolean;
  disabled?: boolean;
}) {
  const locked = disabled || !canManage || !rules;
  const fee = rules?.cancellation_fee_percent ?? 0;
  const hours = rules?.cancellation_window_hours ?? 0;
  const note = rules?.cancellation_policy_note ?? "";
  const preview = policyFromRules(providerName, rules);
  const halfSet = (fee > 0) !== (hours > 0);
  const isEmpty = fee === 0 && hours === 0 && note.trim() === "";

  return (
    <section data-testid="class-cancellation-policy-editor" aria-label="Class cancellation policy">
      <DSCard className="flex flex-col gap-4 p-5.5">
        <div>
          <h3 className="text-[14px] font-medium" style={{ color: "var(--ink)" }}>Class cancellation policy</h3>
          <p className="text-[12.5px] mt-0.75 max-w-[60ch] leading-relaxed" style={{ color: "var(--fg-3)" }}>
            What members are told before they book a class and when they cancel. Binectics never charges this fee: a late
            cancellation is marked on the booking so you can follow it up yourself.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="cancel-window-hours">Window (hours before class)</Eyebrow>
            <input
              id="cancel-window-hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_WINDOW_HOURS}
              value={String(hours)}
              disabled={locked}
              onChange={(e) => onChange({ cancellation_window_hours: clampInt(e.target.value, MAX_WINDOW_HOURS) })}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Eyebrow as="label" htmlFor="cancel-fee-percent">Late-cancellation fee (%)</Eyebrow>
            <input
              id="cancel-fee-percent"
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={String(fee)}
              disabled={locked}
              onChange={(e) => onChange({ cancellation_fee_percent: clampInt(e.target.value, 100) })}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        </div>
        {halfSet && (
          <p role="status" className="text-[12px] -mt-2" style={{ color: "var(--fg-2)" }}>
            Set both a window and a fee for members to see a fee. With either at 0 there is none.
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <Eyebrow as="label" htmlFor="cancel-policy-note">Policy note (optional)</Eyebrow>
          <textarea
            id="cancel-policy-note"
            rows={3}
            maxLength={CANCELLATION_NOTE_MAX}
            value={note}
            disabled={locked}
            placeholder="For example: tell the front desk if you can't make it, and we'll waive the fee for emergencies."
            onChange={(e) => onChange({ cancellation_policy_note: e.target.value.slice(0, CANCELLATION_NOTE_MAX) })}
            className={`${INPUT_CLASS} resize-y`}
            style={INPUT_STYLE}
          />
          <span className="text-[11px] self-end font-mono" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
            {note.length}/{CANCELLATION_NOTE_MAX}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <Eyebrow>What members see</Eyebrow>
          {preview ? (
            <ClassCancellationPolicyNotice policy={preview} />
          ) : (
            <p className="text-[12.5px]" style={{ color: "var(--fg-3)" }} data-testid="class-cancellation-policy-none">
              No cancellation policy. Members see no fee wording when they book or cancel.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {canManage ? (
            <button
              type="button"
              className="btn-ghost-v2 sm"
              disabled={locked || isEmpty}
              onClick={() => onChange({ cancellation_fee_percent: 0, cancellation_window_hours: 0, cancellation_policy_note: "" })}
            >
              Clear policy
            </button>
          ) : (
            <p className="text-[12px]" style={{ color: "var(--fg-3)" }}>
              Only someone who can manage the organization can change this.
            </p>
          )}
        </div>
      </DSCard>
    </section>
  );
}
