"use client";

import { useState } from "react";
import { EmptySlate } from "@/components/ds";
import { toast } from "@/components/Toast";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import {
  consultationsService,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import {
  ACTION_SUCCESS_MESSAGE,
  CANCEL_DISABLED_REASON,
  NO_SHOW_DISABLED_REASON,
  bookingStatusLabel,
  canCancel,
  canMarkNoShow,
  isActionable,
  needsEarlyCompleteConfirm,
  type BookingActionKind,
} from "@/lib/consultations/bookingActions";

/**
 * Provider actions on a consultation booking — Complete, Mark no-show,
 * Cancel — shared by the dietitian consultations drawer and the trainer
 * sessions drawer.
 *
 * Rules:
 *  - only PENDING/CONFIRMED bookings are actionable — API-enforced;
 *  - no-show stays disabled until the start time has passed — API-enforced;
 *  - cancel is only offered before the session starts — UI POLICY ONLY. The
 *    API lets a provider cancel any non-terminal booking; only clients face
 *    a cutoff. Do not assume the server will reject a late cancel.
 *  - nothing is announced as done until the API confirms it, and every
 *    action refetches through `onActionComplete`.
 *
 * There is deliberately no "Confirm" button: bookings are created CONFIRMED,
 * so PENDING is unreachable and the control would be dead UI.
 *
 * Mount with `key={booking.id}` so a cancel reason typed for one booking
 * can't leak into another.
 */
export interface BookingActionsPanelProps {
  booking: ConsultationBooking;
  /** Wall-clock snapshot (ms) taken on load / row click, not during render. */
  now: number;
  /** Refetch the list. Awaited before the panel re-enables itself. */
  onActionComplete: () => void | Promise<void>;
}

export function BookingActionsPanel({ booking, now, onActionComplete }: BookingActionsPanelProps) {
  const [acting, setActing] = useState<BookingActionKind | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  if (!isActionable(booking.status)) {
    return (
      <EmptySlate
        message={`No actions available for ${bookingStatusLabel(booking.status).toLowerCase()} sessions.`}
        mt="mt-0"
      />
    );
  }

  const noShowAllowed = canMarkNoShow(booking, now);
  const cancelAllowed = canCancel(booking, now);

  const runAction = async (kind: BookingActionKind) => {
    setActing(kind);
    let succeeded = false;
    try {
      const res =
        kind === "complete"
          ? await consultationsService.completeBooking(booking.id)
          : kind === "no-show"
            ? await consultationsService.markNoShow(booking.id)
            : await consultationsService.cancelBooking(
                booking.id,
                cancelReason.trim() ? { reason: cancelReason.trim() } : {},
              );
      if (res.success) {
        succeeded = true;
        toast.success(ACTION_SUCCESS_MESSAGE[kind]);
        setCancelReason("");
      } else {
        toast.error(res.message ?? "That didn't work, try again.");
      }
    } catch {
      toast.error("That didn't work, try again.");
    }

    // Refetch outside the try: the action already succeeded, so a failing
    // refresh must not follow the success toast with a contradicting error
    // one. The list being stale is a display problem, not a failed action.
    if (succeeded) {
      try {
        await onActionComplete();
      } catch {
        toast.error("Saved, but the list didn't refresh, reload to see it.");
      }
    }
    setActing(null);
  };

  // Completing before the start time is allowed but unusual, so it asks first.
  const onComplete = () => {
    if (!needsEarlyCompleteConfirm(booking, now)) {
      void runAction("complete");
      return;
    }
    requestConfirmation({
      title: "Complete a session that hasn't started?",
      description:
        "Its start time hasn't come yet. Completing it now tells your client the session is done and lets them review you. This can't be undone.",
      confirmLabel: "Mark completed",
      cancelLabel: "Not yet",
      confirmVariant: "primary",
      onConfirm: () => runAction("complete"),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2 flex-wrap">
        <button
          className="btn-primary-v2 sm"
          disabled={acting !== null}
          onClick={onComplete}
        >
          {acting === "complete" ? "Completing…" : "Complete"}
        </button>
        <button
          className="btn-ghost-v2 sm"
          disabled={acting !== null || !noShowAllowed}
          onClick={() => void runAction("no-show")}
        >
          {acting === "no-show" ? "Marking…" : "Mark no-show"}
        </button>
      </div>
      {!noShowAllowed && (
        <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
          {NO_SHOW_DISABLED_REASON}
        </div>
      )}

      {cancelAllowed ? (
        <div className="flex flex-col gap-2 mt-1">
          <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            Cancel this session
          </div>
          <textarea
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            maxLength={500}
            placeholder="Reason (optional, shared with the client)"
            className="rounded-(--r-2) px-3 py-2.5 text-[13px] resize-y"
            style={{ border: "1px solid var(--border-2)", color: "var(--ink)", background: "var(--bg)", fontFamily: "inherit", minHeight: 60 }}
          />
          <button
            className="btn-ghost-v2 sm self-start"
            disabled={acting !== null}
            style={{ color: "var(--danger)" }}
            onClick={() => void runAction("cancel")}
          >
            {acting === "cancel" ? "Cancelling…" : "Cancel session"}
          </button>
        </div>
      ) : (
        <div className="font-mono text-[11px]" style={{ color: "var(--fg-3)" }}>
          {CANCEL_DISABLED_REASON}
        </div>
      )}
      {confirmationModal}
    </div>
  );
}
