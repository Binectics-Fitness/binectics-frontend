/**
 * Pure schedule maths for the coach Today pages (trainer and dietitian).
 * Everything here is derived from the provider's own bookings; nothing is
 * estimated or padded.
 */
import { ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";
import { formatInTz } from "@/utils/format";

/** Below this, the time between two sessions isn't worth a gap row. */
export const MIN_GAP_MINUTES = 30;

const startMs = (b: ConsultationBooking) => new Date(b.startsAt).getTime();
const endMs = (b: ConsultationBooking) => new Date(b.endsAt).getTime();
const byStart = (a: ConsultationBooking, b: ConsultationBooking) => startMs(a) - startMs(b);

/**
 * The calendar day of an instant in the org's time zone, e.g. "2026-10-06".
 * Times on the page are shown in the org's zone (useOrgFormat), so "today"
 * is the org's today too: a coach in Lagos looked at from New York at 20:00
 * is already on tomorrow.
 */
export function dayKeyInTz(at: string | number | Date, timeZone: string): string {
  return formatInTz(new Date(at), "yyyy-MM-dd", timeZone);
}

/**
 * A payment hold whose deadline has passed. The API's sweep cancels it
 * eventually; until then it is still PENDING but will not happen.
 */
export function isExpiredHold(b: ConsultationBooking, nowMs: number): boolean {
  return (
    b.status === ConsultationBookingStatus.PENDING &&
    Boolean(b.payment?.expiresAt) &&
    new Date(b.payment!.expiresAt!).getTime() <= nowMs
  );
}

/**
 * A booking that still happens (or happened): not cancelled, not a no-show,
 * not an expired hold. Without `nowMs` holds are not checked (gap maths on
 * rows already classified).
 */
export function isLiveBooking(b: ConsultationBooking, nowMs?: number): boolean {
  if (b.status === ConsultationBookingStatus.CANCELLED || b.status === ConsultationBookingStatus.NO_SHOW) return false;
  return nowMs == null || !isExpiredHold(b, nowMs);
}

/** Confirmed, or pending and not an expired hold: what a provider still has to show up for. */
export function isOpenBooking(b: ConsultationBooking, nowMs: number): boolean {
  if (b.status === ConsultationBookingStatus.CONFIRMED) return true;
  return b.status === ConsultationBookingStatus.PENDING && !isExpiredHold(b, nowMs);
}

export function durationMinutes(b: ConsultationBooking): number {
  return Math.max(0, Math.round((endMs(b) - startMs(b)) / 60000));
}

export interface CoachSchedule {
  /** The org-zone day key of `nowMs`. */
  todayKey: string;
  /** The org-zone day key of the next day. */
  tomorrowKey: string;
  /** Every booking that starts on the org's today, any status, by start time. */
  today: ConsultationBooking[];
  /** Today's bookings that still happen (or happened). */
  liveToday: number;
  /** Open bookings today that haven't started by `nowMs`. */
  stillToCome: number;
  /** Open bookings from `nowMs` on, today included, by start time. */
  upcoming: ConsultationBooking[];
  /** Open bookings after today, by start time. */
  later: ConsultationBooking[];
}

/**
 * @param nowMs the moment the bookings were read
 * @param timeZone the org's IANA zone (useOrgFormat().prefs.timeZone)
 */
export function coachSchedule(bookings: readonly ConsultationBooking[], nowMs: number, timeZone: string): CoachSchedule {
  const todayKey = dayKeyInTz(nowMs, timeZone);
  // Calendar arithmetic on the key, not +24h on the instant: a 23h or 25h
  // DST day would otherwise skip or repeat a day.
  const [y, m, d] = todayKey.split("-").map(Number);
  const tomorrowKey = new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10);
  const todays = bookings.filter((b) => dayKeyInTz(b.startsAt, timeZone) === todayKey).sort(byStart);
  const upcoming = bookings.filter((b) => isOpenBooking(b, nowMs) && startMs(b) >= nowMs).sort(byStart);
  return {
    todayKey,
    tomorrowKey,
    today: todays,
    liveToday: todays.filter((b) => isLiveBooking(b, nowMs)).length,
    stillToCome: todays.filter((b) => isOpenBooking(b, nowMs) && startMs(b) >= nowMs).length,
    upcoming,
    later: upcoming.filter((b) => dayKeyInTz(b.startsAt, timeZone) > todayKey),
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
 * bookings (and expired holds) don't occupy time, so they neither open nor close a gap; a gap
 * shorter than MIN_GAP_MINUTES isn't reported, nor is an overlap.
 */
export function scheduleGaps(rows: readonly ConsultationBooking[], nowMs?: number): Map<string, ScheduleGapInfo> {
  const gaps = new Map<string, ScheduleGapInfo>();
  const live = rows.filter((b) => isLiveBooking(b, nowMs));
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
export function gapAnchors(rows: readonly ConsultationBooking[], nowMs?: number): Map<string, ScheduleGapInfo> {
  const anchors = new Map<string, ScheduleGapInfo>();
  for (const gap of scheduleGaps(rows, nowMs).values()) {
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
