import { ConsultationBookingStatus } from "@/lib/api/consultations";
import { bookingStatusLabel } from "@/lib/consultations/bookingActions";
import { bookingStatusTone } from "@/lib/ui/statusTones";
import { StatusPill } from "./StatusPill";

/**
 * Status badge for a consultation/session booking, shared by every provider
 * surface that lists bookings, so a no-show reads the same on the dietitian
 * and trainer dashboards. Confirmed/completed are success, a no-show is warn
 * (missed, nothing failed), pending and cancelled are neutral.
 */
export function BookingStatusBadge({
  status,
  awaitingPayment,
}: {
  status: ConsultationBookingStatus;
  /** A PENDING hold that is waiting on the client's payment. */
  awaitingPayment?: boolean;
}) {
  return (
    <StatusPill
      tone={bookingStatusTone(status, { awaitingPayment })}
      label={awaitingPayment ? "Awaiting payment" : bookingStatusLabel(status)}
    />
  );
}
