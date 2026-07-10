"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  classBookingsService,
  type ClassBooking,
} from "@/lib/api/classBookings";

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
        return (
          <div key={b._id} className="flex flex-col sm:flex-row sm:items-center gap-2.5 px-4.5 py-3" style={{ borderBottom: i < bookings.length - 1 ? "1px solid var(--border)" : "none" }}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13.5px] font-medium" style={{ color: "var(--ink)" }}>{c?.name ?? "Class"}</span>
                {b.status === "waitlisted" && (
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded-full uppercase tracking-[0.04em]" style={{ background: "oklch(0.96 0.06 75)", color: "oklch(0.45 0.16 75)" }}>Waitlist</span>
                )}
              </div>
              <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--fg-3)", fontVariantNumeric: "tabular-nums" }}>
                {occurrenceLabel(b.booking_date)}
                {c ? ` · ${c.start_time} · ${c.duration_minutes}m` : ""}
                {c?.instructor_name ? ` · ${c.instructor_name}` : ""}
              </div>
            </div>
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
        );
      })}
    </div>
  );
}
