"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { StatusPill } from "@/components/ds/StatusPill";
import { bookingStatusTone } from "@/lib/ui/statusTones";
import {
  classBookingsService,
  keepsWaitlistPlace,
  type ClassBooking,
} from "@/lib/api/classBookings";

type Notice = { text: string; tone: "ok" | "info" | "error" };
const NOTICE_COLOR: Record<Notice["tone"], string> = {
  ok: "var(--signal-ink)",
  info: "var(--fg-2)",
  error: "var(--danger)",
};

function classOf(b: ClassBooking) {
  return typeof b.class_id === "object" ? b.class_id : null;
}

function occurrenceLabel(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * The member's upcoming gym-class bookings with cancel. Renders nothing
 * when the member has none (keeps the consultations page uncluttered).
 *
 * A waitlisted booking whose class has a free spot (`spot_open`) offers
 * "Take the spot": booking again, which the API fills in waitlist order.
 * If someone ahead of them gets it, they are told so plainly and keep
 * their place.
 */
export function MyClassBookingsCard() {
  const queryClient = useQueryClient();
  const { data: bookings = [] } = useQuery<ClassBooking[]>({
    queryKey: ["myClassBookings"],
    queryFn: async () => {
      const res = await classBookingsService.getMyClassBookings();
      return res.success && res.data ? res.data : [];
    },
  });

  const cancel = useMutation({
    mutationFn: (bookingId: string) =>
      classBookingsService.cancelClassBooking(bookingId),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] }),
  });

  const [notices, setNotices] = useState<Record<string, Notice>>({});
  const take = useMutation({
    mutationFn: (b: ClassBooking) =>
      classBookingsService.bookClass(b.listing_id as string, classOf(b)?._id as string, b.booking_date),
    onSuccess: (res, b) => {
      let notice: Notice;
      if (res.success && res.data?.status === "confirmed") {
        notice = { text: `You're in for ${occurrenceLabel(b.booking_date)}.`, tone: "ok" };
      } else if (keepsWaitlistPlace(res)) {
        notice = { text: res.message || "Someone ahead of you took the spot. You keep your place.", tone: "info" };
      } else {
        notice = { text: res.message || "Couldn't take the spot. Try again.", tone: "error" };
      }
      setNotices((n) => ({ ...n, [b._id]: notice }));
      void queryClient.invalidateQueries({ queryKey: ["myClassBookings"] });
    },
  });

  if (bookings.length === 0) return null;

  return (
    <div className="rounded-(--r-3) overflow-hidden mb-6" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <div className="px-4.5 py-3.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h2 className="text-[15px] font-medium" style={{ color: "var(--ink)" }}>Gym classes</h2>
        <p className="text-[12px] mt-0.5" style={{ color: "var(--fg-3)" }}>
          Your upcoming class bookings. Late cancellations may incur the gym&rsquo;s fee.
        </p>
      </div>
      {bookings.map((b, i) => {
        const c = classOf(b);
        const canTake = b.status === "waitlisted" && b.spot_open === true && !!b.listing_id && !!c;
        const notice = notices[b._id];
        return (
          <div key={b._id} className="px-4.5 py-3" style={{ borderBottom: i < bookings.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{c?.name ?? "Class"}</span>
                  {b.status === "waitlisted" && (
                    <StatusPill tone={bookingStatusTone(b.status)} label="Waitlist" />
                  )}
                </div>
                <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                  {occurrenceLabel(b.booking_date)}
                  {c ? ` · ${c.start_time} · ${c.duration_minutes}m` : ""}
                  {c?.instructor_name ? ` · ${c.instructor_name}` : ""}
                </div>
                {canTake && (
                  <div className="text-[12px] mt-1" style={{ color: "var(--signal-ink)" }}>
                    A spot is open.
                  </div>
                )}
              </div>
              {canTake && (
                <button
                  type="button"
                  className="btn-primary-v2 sm shrink-0"
                  disabled={take.isPending}
                  aria-label={`Take the spot in ${c?.name ?? "this class"} on ${occurrenceLabel(b.booking_date)}`}
                  onClick={() => take.mutate(b)}
                >
                  {take.isPending && take.variables?._id === b._id ? "Taking…" : "Take the spot"}
                </button>
              )}
              <button
                className="btn-ghost-v2 sm shrink-0"
                disabled={cancel.isPending}
                onClick={() => {
                  if (window.confirm("Cancel this class booking? Cancelling close to the class may incur the gym's fee.")) {
                    cancel.mutate(b._id);
                  }
                }}
              >
                Cancel
              </button>
            </div>
            {notice && (
              <p role="status" className="text-[12px] mt-2" style={{ color: NOTICE_COLOR[notice.tone] }}>
                {notice.text}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
