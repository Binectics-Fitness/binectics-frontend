"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { toast } from "@/components/Toast";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MembershipSubscriptionStatus,
  type ApiResponse,
  type MembershipSubscription,
} from "@/lib/types";
import { endIfResumedAt, pausedLine, renewsByCard } from "@/lib/billing/membershipHolds";

/** Longest reason the API accepts (SuspendSubscriptionDto). */
export const SUSPEND_REASON_MAX = 500;

function memberNameOf(sub: MembershipSubscription): string {
  if (typeof sub.member_user_id === "object" && sub.member_user_id !== null) {
    const name = `${sub.member_user_id.first_name} ${sub.member_user_id.last_name}`.trim();
    if (name) return name;
  }
  return "This member";
}

/** A refused hold change, in words the operator can act on. */
export function holdErrorCopy(res: ApiResponse<unknown>, fallback: string): string {
  if (res.status === 403) return "You don't have permission to manage members for this gym.";
  if (res.status === 404) return "This membership no longer exists. Refresh the page.";
  // 400: the state changed under us (already suspended, cancelled, paused).
  if (res.status === 400) {
    return `${res.message ?? "This membership's status has changed."} Refresh the page to see where it stands.`;
  }
  return res.message ?? fallback;
}

/**
 * The fields a hold change rewrites. The API answers with an unpopulated row,
 * so the caller merges these onto the populated one it already shows.
 */
const HOLD_FIELDS = [
  "status",
  "paused_at",
  "paused_by",
  "end_date",
  "suspended_at",
  "suspension_reason",
  "auto_renew",
  "collection_method",
  "payment_method_id",
  "next_charge_at",
  "grace_expires_at",
] as const;

export function mergeHoldChange(
  current: MembershipSubscription,
  updated: MembershipSubscription,
): MembershipSubscription {
  const next = { ...current } as Record<string, unknown>;
  for (const key of HOLD_FIELDS) {
    if (key in updated) next[key] = (updated as unknown as Record<string, unknown>)[key];
  }
  if (updated.status !== MembershipSubscriptionStatus.SUSPENDED) {
    next.suspended_at = null;
    next.suspension_reason = null;
  }
  if (updated.status !== MembershipSubscriptionStatus.PAUSED) {
    next.paused_at = null;
    next.paused_by = null;
  }
  return next as unknown as MembershipSubscription;
}

/**
 * Suspend: access stops now, the days aren't given back, the seat is kept,
 * and the member is told (with the reason, if one is given). The reason is
 * optional because the API takes none as well.
 */
export function SuspendMemberModal({
  open,
  sub,
  orgId,
  fmtDate,
  onClose,
  onDone,
}: {
  open: boolean;
  sub: MembershipSubscription;
  orgId: string;
  fmtDate: (d: string | Date) => string;
  onClose: () => void;
  onDone: (updated: MembershipSubscription) => void;
}) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = memberNameOf(sub);
  const card = sub.collection_method === "card_auto" || !!sub.payment_method_id;

  const close = () => {
    if (saving) return;
    setReason("");
    setError(null);
    onClose();
  };

  const onConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await marketplaceService.suspendOrgSubscription(orgId, sub._id, reason);
    setSaving(false);
    if (res.success && res.data) {
      toast.success(`${name} is suspended`);
      setReason("");
      onDone(mergeHoldChange(sub, res.data));
      onClose();
    } else {
      setError(holdErrorCopy(res, "We couldn't suspend this membership. Please try again."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Suspend ${name}?`}
      size="sm"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2 md" disabled={saving} onClick={close}>
            Keep active
          </button>
          <button
            type="button"
            className="btn-primary-v2 md"
            // Blocks a paying member: the danger ink, page colour for text
            // (inline, because button text classes don't apply here).
            style={{ background: "var(--danger-ink)", borderColor: "var(--danger-ink)", color: "var(--bg)" }}
            disabled={saving}
            onClick={() => void onConfirm()}
          >
            {saving ? "Suspending…" : "Suspend membership"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-[13.5px] text-fg-2" data-testid="suspend-copy">
        <p>They lose access now: no check-ins and no class bookings until you lift the suspension.</p>
        <p>
          The days they&apos;re suspended aren&apos;t given back.{" "}
          {sub.end_date
            ? `Their membership still ends on ${fmtDate(sub.end_date)}.`
            : "Their membership keeps running."}
        </p>
        <p>They keep their seat, so it still counts towards your plan.</p>
        {card && (
          <p>Card auto-renew is switched off. They&apos;d turn it back on themselves after you lift the suspension.</p>
        )}
        <p>We&apos;ll notify them, with your reason if you give one.</p>
        <div className="flex flex-col gap-1.5">
          <label htmlFor={`suspend-reason-${sub._id}`} className="text-[12.5px] font-medium text-ink">
            Reason (optional, the member sees this)
          </label>
          <textarea
            id={`suspend-reason-${sub._id}`}
            rows={3}
            maxLength={SUSPEND_REASON_MAX}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Outstanding balance from March"
            className="rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink"
          />
          <p className="text-[12px] text-fg-3">
            {reason.length}/{SUSPEND_REASON_MAX}
          </p>
        </div>
        {error && (
          <p role="alert" className="text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

/** The paid term ran out (a suspension can outlive it). */
function termHasEnded(sub: MembershipSubscription, now: Date = new Date()): boolean {
  return !!sub.end_date && new Date(sub.end_date).getTime() < now.getTime();
}

/** Lift a suspension: access returns now, the end date stays where it is. */
export function LiftSuspensionModal({
  open,
  sub,
  orgId,
  fmtDate,
  onClose,
  onDone,
}: {
  open: boolean;
  sub: MembershipSubscription;
  orgId: string;
  fmtDate: (d: string | Date) => string;
  onClose: () => void;
  onDone: (updated: MembershipSubscription) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = memberNameOf(sub);
  const ended = termHasEnded(sub);

  const close = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  const onConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await marketplaceService.unsuspendOrgSubscription(orgId, sub._id);
    setSaving(false);
    if (res.success && res.data) {
      toast.success(`Suspension lifted for ${name}`);
      onDone(mergeHoldChange(sub, res.data));
      onClose();
    } else {
      setError(holdErrorCopy(res, "We couldn't lift the suspension. Please try again."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Lift ${name}'s suspension?`}
      size="sm"
      disableCloseGuard
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2 md" disabled={saving} onClick={close}>
            Keep suspended
          </button>
          <button type="button" className="btn-primary-v2 md" disabled={saving} onClick={() => void onConfirm()}>
            {saving ? "Lifting…" : "Lift suspension"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-[13.5px] text-fg-2" data-testid="lift-copy">
        {ended ? (
          <p>
            Their term ended on {fmtDate(sub.end_date!)} while they were suspended, so they still won&apos;t get in
            until it&apos;s renewed.
          </p>
        ) : (
          <p>
            They can check in and book again straight away.
            {sub.end_date ? ` Their membership still ends on ${fmtDate(sub.end_date)}: the suspended days aren't added back.` : ""}
          </p>
        )}
        <p>We&apos;ll let them know.</p>
        {error && (
          <p role="alert" className="text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

/** What the gym pausing does, for the confirm step, in order (mobile #142's words). */
export function gymPauseEffectLines(
  sub: MembershipSubscription,
  fmtDate: (d: string | Date) => string,
): string[] {
  const lines = [
    "They can't check in or book classes while it's paused.",
    sub.end_date
      ? `The days it's paused are given back: it's due to end on ${fmtDate(sub.end_date)}, and that moves later by every day it stays paused.`
      : "The days it's paused are given back when it resumes.",
  ];
  if (renewsByCard(sub)) {
    lines.push("Their card isn't charged while it's paused. Auto-renew carries on for the new end date.");
  }
  lines.push("You or they can resume it any time. We'll let them know it's paused.");
  return lines;
}

/** What the gym resuming does, for the confirm step. */
export function gymResumeCopy(
  sub: MembershipSubscription,
  fmtDate: (d: string | Date) => string,
  now: Date = new Date(),
): string {
  const end = endIfResumedAt(sub, now);
  return end
    ? `They can check in and book again straight away. The paused days are added back, so it now runs to ${fmtDate(end)}. We'll let them know.`
    : "They can check in and book again straight away. We'll let them know.";
}

/**
 * The gym pauses a membership for the member (api #282): access stops, the
 * seat is kept, and every paused day is added back to the end date when it
 * resumes, whoever resumes it. Nothing is taken from the member, so there is
 * no reason to give and card auto-renew stays on.
 */
export function PauseMemberModal({
  open,
  sub,
  orgId,
  fmtDate,
  onClose,
  onDone,
}: {
  open: boolean;
  sub: MembershipSubscription;
  orgId: string;
  fmtDate: (d: string | Date) => string;
  onClose: () => void;
  onDone: (updated: MembershipSubscription) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = memberNameOf(sub);

  const close = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  const onConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await marketplaceService.pauseOrgSubscription(orgId, sub._id);
    setSaving(false);
    if (res.success && res.data) {
      toast.success(`${name}'s membership is paused`);
      onDone(mergeHoldChange(sub, res.data));
      onClose();
    } else if (res.code === "RENEWAL_CHARGE_IN_PROGRESS") {
      setError("A card renewal for this membership is being processed. Try again in a few minutes.");
    } else {
      setError(holdErrorCopy(res, "We couldn't pause this membership. Please try again."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Pause ${name}'s membership?`}
      size="sm"
      disableCloseGuard
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2 md" disabled={saving} onClick={close}>
            Keep active
          </button>
          <button type="button" className="btn-primary-v2 md" disabled={saving} onClick={() => void onConfirm()}>
            {saving ? "Pausing…" : "Pause membership"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-[13.5px] text-fg-2" data-testid="pause-copy">
        {gymPauseEffectLines(sub, fmtDate).map((line) => (
          <p key={line}>{line}</p>
        ))}
        {error && (
          <p role="alert" className="text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

/** The gym resumes a pause, its own or the member's: the paused days are added back. */
export function ResumeMemberModal({
  open,
  sub,
  orgId,
  fmtDate,
  onClose,
  onDone,
}: {
  open: boolean;
  sub: MembershipSubscription;
  orgId: string;
  fmtDate: (d: string | Date) => string;
  onClose: () => void;
  onDone: (updated: MembershipSubscription) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = memberNameOf(sub);

  const close = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  const onConfirm = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    const res = await marketplaceService.resumeOrgSubscription(orgId, sub._id);
    setSaving(false);
    if (res.success && res.data) {
      toast.success(`${name}'s membership is running again`);
      onDone(mergeHoldChange(sub, res.data));
      onClose();
    } else {
      setError(holdErrorCopy(res, "We couldn't resume this membership. Please try again."));
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={`Resume ${name}'s membership?`}
      size="sm"
      disableCloseGuard
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost-v2 md" disabled={saving} onClick={close}>
            Keep paused
          </button>
          <button type="button" className="btn-primary-v2 md" disabled={saving} onClick={() => void onConfirm()}>
            {saving ? "Resuming…" : "Resume membership"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 text-[13.5px] text-fg-2" data-testid="resume-copy">
        <p>{gymResumeCopy(sub, fmtDate)}</p>
        {error && (
          <p role="alert" className="text-danger-ink">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}

/**
 * The detail under a Paused or Suspended pill, for the gym: who paused it and
 * since when, the end date if it resumed today, and the suspension reason.
 */
export function holdDetailLine(
  sub: MembershipSubscription,
  fmtDate: (d: string | Date) => string,
  now: Date = new Date(),
): string | null {
  if (sub.status === MembershipSubscriptionStatus.PAUSED) {
    return pausedLine(sub, fmtDate, now, "gym");
  }
  if (sub.status === MembershipSubscriptionStatus.SUSPENDED) {
    const since = sub.suspended_at ? `Suspended since ${fmtDate(sub.suspended_at)}` : "Suspended";
    const reason = sub.suspension_reason?.trim();
    return reason ? `${since}: “${reason}”` : `${since}.`;
  }
  return null;
}
