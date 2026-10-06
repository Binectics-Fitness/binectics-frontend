/**
 * Pure schedule maths for the coach Today pages (trainer and dietitian).
 * Everything here is derived from the provider's own bookings; nothing is
 * estimated or padded.
 */
import { isSameDay } from "date-fns";
import { ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";

/** Below this, the time between two sessions isn't worth a gap row. */
export const MIN_GAP_MINUTES = 30;

const startMs = (b: ConsultationBooking) => new Date(b.startsAt).getTime();
const endMs = (b: ConsultationBooking) => new Date(b.endsAt).getTime();
const byStart = (a: ConsultationBooking, b: ConsultationBooking) => startMs(a) - startMs(b);

/** A booking that still happens (or happened): not cancelled, not a no-show. */
export function isLiveBooking(b: ConsultationBooking): boolean {
  return b.status !== ConsultationBookingStatus.CANCELLED && b.status !== ConsultationBookingStatus.NO_SHOW;
}

/** Confirmed or pending: the bookings a provider still has to show up for. */
export function isOpenBooking(b: ConsultationBooking): boolean {
  return b.status === ConsultationBookingStatus.CONFIRMED || b.status === ConsultationBookingStatus.PENDING;
}

export function durationMinutes(b: ConsultationBooking): number {
  return Math.max(0, Math.round((endMs(b) - startMs(b)) / 60000));
}

export interface CoachSchedule {
  /** Every booking that starts on `today`'s date, any status, by start time. */
  today: ConsultationBooking[];
  /** Today's bookings that aren't cancelled or no-shows. */
  liveToday: number;
  /** Open bookings today that haven't started by `nowMs`. */
  stillToCome: number;
  /** Open bookings from `nowMs` on, today included, by start time. */
  upcoming: ConsultationBooking[];
  /** Open bookings after today, by start time. */
  later: ConsultationBooking[];
}

/**
 * @param today the viewer's current day (useClientNow)
 * @param nowMs the moment the bookings were read, for "has it started yet"
 */
export function coachSchedule(bookings: readonly ConsultationBooking[], today: Date, nowMs: number): CoachSchedule {
  const todays = bookings.filter((b) => isSameDay(new Date(b.startsAt), today)).sort(byStart);
  const upcoming = bookings.filter((b) => isOpenBooking(b) && startMs(b) >= nowMs).sort(byStart);
  const endOfToday = new Date(today);
  endOfToday.setHours(24, 0, 0, 0);
  return {
    today: todays,
    liveToday: todays.filter(isLiveBooking).length,
    stillToCome: todays.filter((b) => isOpenBooking(b) && startMs(b) >= nowMs).length,
    upcoming,
    later: upcoming.filter((b) => startMs(b) >= endOfToday.getTime()),
  };
}

export interface ScheduleGapInfo {
  from: string;
  to: string;
  minutes: number;
}

/**
 * The free time after each of `rows` (sorted by start) before the next live
 * session, keyed by the booking id it follows. Cancelled and no-show
 * bookings don't occupy time, so they neither open nor close a gap; a gap
 * shorter than MIN_GAP_MINUTES isn't reported, nor is an overlap.
 */
export function scheduleGaps(rows: readonly ConsultationBooking[]): Map<string, ScheduleGapInfo> {
  const gaps = new Map<string, ScheduleGapInfo>();
  const live = rows.filter(isLiveBooking);
  let busyUntil: ConsultationBooking | null = null;
  for (const b of live) {
    if (busyUntil) {
      const minutes = Math.round((startMs(b) - endMs(busyUntil)) / 60000);
      if (minutes >= MIN_GAP_MINUTES) gaps.set(busyUntil.id, { from: busyUntil.endsAt, to: b.startsAt, minutes });
    }
    // Overlapping sessions: the gap starts after whichever ends last.
    if (!busyUntil || endMs(b) >= endMs(busyUntil)) busyUntil = b;
  }
  return gaps;
}

/**
 * Where a gap row goes: after the last row (live or not) that starts
 * before the gap ends, so a cancelled session inside a gap sits above it.
 */
export function gapAnchors(rows: readonly ConsultationBooking[]): Map<string, ScheduleGapInfo> {
  const anchors = new Map<string, ScheduleGapInfo>();
  for (const gap of scheduleGaps(rows).values()) {
    const end = new Date(gap.to).getTime();
    const before = rows.filter((b) => startMs(b) < end);
    const anchor = before[before.length - 1];
    if (anchor) anchors.set(anchor.id, gap);
  }
  return anchors;
}

export function bookingClientName(b: ConsultationBooking): string {
  return [b.clientFirstName, b.clientLastName].filter(Boolean).join(" ") || "Client";
}

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}
