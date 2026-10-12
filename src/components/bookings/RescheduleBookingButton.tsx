"use client";

import { useState } from "react";
import { RescheduleBookingModal } from "@/components/bookings/RescheduleBookingModal";
import { toast } from "@/components/Toast";
import { consultationsService, type ConsultationBooking } from "@/lib/api/consultations";
import { isActionable } from "@/lib/consultations/bookingActions";

/**
 * "Move session" for someone other than the member: the provider, or their
 * gym's staff. Opens the slot picker and sends the move; the API holds
 * everyone to the provider's working hours (days off and custom hours
 * included), so the picker only offers those times and any refusal is shown
 * in the modal as the API worded it. Renders nothing once a session can no
 * longer move (completed, cancelled, no-show).
 */
export function RescheduleBookingButton({
  booking,
  audience = "provider",
  onRescheduled,
  className = "btn-ghost-v2 sm",
}: {
  booking: ConsultationBooking;
  audience?: "provider" | "staff";
  /** Called after the API confirmed the move, to refetch. */
  onRescheduled: (moved: ConsultationBooking) => void | Promise<void>;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!isActionable(booking.status)) return null;

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        Move session
      </button>
      {open && (
        <RescheduleBookingModal
          open
          booking={booking}
          audience={audience}
          onClose={() => setOpen(false)}
          onConfirm={async (startsAt, reason) => {
            const res = await consultationsService.rescheduleBooking(booking.id, {
              startsAt,
              reason,
            });
            if (res.success) {
              toast.success(
                audience === "staff"
                  ? "Session moved. The client and the provider have been told."
                  : "Session moved. Your client has been told.",
              );
              setOpen(false);
              await onRescheduled(res.data ?? { ...booking, startsAt });
            }
            return res;
          }}
        />
      )}
    </>
  );
}
