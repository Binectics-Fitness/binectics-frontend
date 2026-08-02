import { ConsultationBookingStatus } from "@/lib/api/consultations";
import { bookingStatusLabel } from "@/lib/consultations/bookingActions";

/**
 * Status badge for a consultation/session booking — one palette shared by
 * every provider surface that lists bookings, so a no-show reads the same
 * on the dietitian and trainer dashboards.
 */
const STATUS_STYLE: Record<ConsultationBookingStatus, { bg: string; color: string }> = {
  [ConsultationBookingStatus.PENDING]: { bg: "var(--trainer-soft)", color: "oklch(0.42 0.13 75)" },
  [ConsultationBookingStatus.CONFIRMED]: { bg: "var(--signal-soft)", color: "var(--signal-ink)" },
  [ConsultationBookingStatus.COMPLETED]: { bg: "var(--bg-3)", color: "var(--fg-2)" },
  [ConsultationBookingStatus.CANCELLED]: { bg: "var(--danger-soft)", color: "var(--danger)" },
  [ConsultationBookingStatus.NO_SHOW]: { bg: "var(--danger-soft)", color: "var(--danger)" },
};

export function BookingStatusBadge({ status }: { status: ConsultationBookingStatus }) {
  const s = STATUS_STYLE[status] ?? { bg: "var(--bg-3)", color: "var(--fg-2)" };
  return (
    <span
      className="font-mono text-[10.5px] px-[7px] py-[2px] rounded-full uppercase tracking-[0.04em] inline-flex items-center gap-[5px]"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="w-[5px] h-[5px] rounded-full" style={{ background: "currentColor" }} />
      {bookingStatusLabel(status)}
    </span>
  );
}
