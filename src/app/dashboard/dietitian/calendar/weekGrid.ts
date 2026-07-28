import type { ConsultationBooking } from "@/lib/api/consultations";

/**
 * Pure week-grid helpers for the dietitian calendar. Kept free of React so
 * the bucketing logic is unit-testable (src/tests/unit/dietitian-week-grid.test.ts).
 * All day math is done in the browser's local time zone — the same zone the
 * grid renders in.
 */

export interface WeekDayBucket {
  date: Date;
  /** Local-time YYYY-MM-DD for the bucket's day. */
  iso: string;
  bookings: ConsultationBooking[];
}

/** Local-time YYYY-MM-DD (never use toISOString here — that's UTC). */
export function localIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Midnight at the start of the anchor's week. */
export function startOfWeek(anchor: Date, weekStartsOn: 0 | 1 | 6 = 1): Date {
  const d = new Date(anchor);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() - weekStartsOn + 7) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Bucket bookings into the 7 days of the anchor's week. Bookings outside the
 * week are dropped; each day's bookings are sorted by start time.
 */
export function buildWeekBuckets(
  bookings: ConsultationBooking[],
  anchor: Date,
  weekStartsOn: 0 | 1 | 6 = 1,
): WeekDayBucket[] {
  const start = startOfWeek(anchor, weekStartsOn);
  const buckets: WeekDayBucket[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { date, iso: localIsoDate(date), bookings: [] };
  });
  const byIso = new Map(buckets.map((b) => [b.iso, b]));
  for (const booking of bookings) {
    byIso.get(localIsoDate(new Date(booking.startsAt)))?.bookings.push(booking);
  }
  for (const bucket of buckets) {
    bucket.bookings.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }
  return buckets;
}

/** Fractional hours since local midnight — vertical placement in the grid. */
export function hoursSinceMidnight(iso: string): number {
  const d = new Date(iso);
  return d.getHours() + d.getMinutes() / 60;
}
