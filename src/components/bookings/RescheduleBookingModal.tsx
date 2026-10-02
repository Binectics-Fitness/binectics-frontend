"use client";

import { useCallback, useEffect, useState } from "react";
import { ActionModal } from "@/components/ds/ActionModal";
import { AsyncSpinner } from "@/components/ds";
import {
  consultationsService,
  type ConsultationBooking,
  type ConsultationSlot,
} from "@/lib/api/consultations";
import type { ApiResponse } from "@/lib/types";
import { isSlotRefusal, localDayKey, localTimeKey } from "@/lib/bookings/slots";

/**
 * Moves a booking to another of the provider's open times. The API only
 * accepts a start the slots endpoint offers for the booking's session type
 * (400 CONSULTATION_SLOT_UNAVAILABLE otherwise, 409 when just taken), so the
 * choice is a slot, never a free date-time.
 */
export function RescheduleBookingModal({
  open,
  booking,
  onClose,
  onConfirm,
}: {
  open: boolean;
  booking: ConsultationBooking;
  onClose: () => void;
  /** Sends the reschedule. The modal shows the API's message on failure. */
  onConfirm: (
    startsAt: string,
    reason?: string,
  ) => Promise<Pick<ApiResponse<unknown>, "success" | "message" | "code" | "status">>;
}) {
  const today = localDayKey(new Date());
  const [date, setDate] = useState(() => {
    const current = localDayKey(new Date(booking.startsAt));
    return current > today ? current : today;
  });
  const [slots, setSlots] = useState<ConsultationSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const res = await consultationsService.getProviderSlots(booking.providerId, {
        consultationTypeId: booking.consultationTypeId,
        dateFrom: date,
        dateTo: date,
      });
      if (!res.success) {
        setSlots([]);
        setSlotsError(res.message ?? "Couldn't load open times. Try again.");
        return;
      }
      setSlots(
        (res.data ?? []).filter(
          (s) => s.isAvailable && s.startsAt !== booking.startsAt,
        ),
      );
    } catch {
      setSlots([]);
      setSlotsError("Couldn't load open times. Try again.");
    } finally {
      setSlotsLoading(false);
    }
  }, [booking.providerId, booking.consultationTypeId, booking.startsAt, date]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadSlots();
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loadSlots]);

  const confirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const res = await onConfirm(selected, reason.trim() || undefined);
      if (res.success) return;
      setError(res.message ?? "Couldn't reschedule. Try again.");
      if (isSlotRefusal(res)) {
        // The time is gone or was never offered; show what is open now.
        setSelected(null);
        await loadSlots();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reschedule. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ActionModal
      open={open}
      onClose={onClose}
      title="Reschedule booking"
      description="Pick one of your provider's open times. We'll let them know."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-ghost-v2" disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void confirm()}
            disabled={saving || !selected}
            className="btn-primary-v2 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Confirm reschedule"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reschedule-date"
            className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3"
          >
            Day
          </label>
          <input
            id="reschedule-date"
            type="date"
            value={date}
            min={today}
            onChange={(e) => {
              if (!e.target.value) return;
              setDate(e.target.value);
              setSelected(null);
              setError(null);
            }}
            className="h-9 w-full rounded-(--r-2) border border-border bg-bg px-3 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
            Open times
          </p>
          {slotsLoading ? (
            <div className="flex justify-center py-6">
              <AsyncSpinner label="Loading open times" />
            </div>
          ) : slotsError ? (
            <p className="text-[13px] text-danger">{slotsError}</p>
          ) : slots.length === 0 ? (
            <p className="text-[13px] text-fg-3" data-testid="reschedule-no-slots">
              No open times on this day. Try another day.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2" role="listbox" aria-label="Open times">
              {slots.map((s) => {
                const on = selected === s.startsAt;
                return (
                  <button
                    key={s.startsAt}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => {
                      setSelected(s.startsAt);
                      setError(null);
                    }}
                    className={`rounded-(--r-2) border px-2 py-2.5 text-center font-mono text-[13px] font-medium tabular-nums ${
                      on ? "border-ink bg-ink text-bg" : "border-border bg-bg text-ink hover:bg-bg-2"
                    }`}
                  >
                    {localTimeKey(s.startsAt)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <label
            htmlFor="reschedule-reason"
            className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-fg-3"
          >
            Reason (optional)
          </label>
          <textarea
            id="reschedule-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full rounded-(--r-2) border border-border bg-bg px-3 py-2 text-[13.5px] text-ink focus:border-border-2 focus:outline-none"
            placeholder="Anything your provider should know?"
          />
        </div>
        {error && (
          <p role="alert" className="rounded-(--r-2) bg-danger-soft p-3 text-[13px] text-danger">
            {error}
          </p>
        )}
      </div>
    </ActionModal>
  );
}
