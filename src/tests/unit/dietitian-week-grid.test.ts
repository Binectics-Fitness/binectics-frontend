import { describe, it, expect } from "vitest";
import {
  startOfWeek,
  addDays,
  localIsoDate,
  buildWeekBuckets,
  hoursSinceMidnight,
} from "@/app/dashboard/dietitian/calendar/weekGrid";
import {
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";

/** Minimal booking factory — only the fields the grid math reads matter. */
function booking(startsAt: string, endsAt: string, id = startsAt): ConsultationBooking {
  return {
    id,
    clientUserId: "u1",
    providerId: "p1",
    consultationTypeId: "t1",
    startsAt,
    endsAt,
    providerTimezone: "UTC",
    clientTimezone: "UTC",
    status: ConsultationBookingStatus.CONFIRMED,
    createdAt: startsAt,
    updatedAt: startsAt,
  };
}

/** Local-time ISO string so tests behave the same in any TZ. */
function local(y: number, m: number, d: number, h = 0, min = 0): string {
  return new Date(y, m - 1, d, h, min).toISOString();
}

describe("startOfWeek", () => {
  // Wed 22 Jul 2026 (local)
  const wed = new Date(2026, 6, 22, 15, 30);

  it("snaps back to Monday when the week starts on Monday", () => {
    const start = startOfWeek(wed, 1);
    expect(start.getDay()).toBe(1);
    expect(localIsoDate(start)).toBe("2026-07-20");
    expect(start.getHours()).toBe(0);
  });

  it("snaps back to Sunday when the week starts on Sunday", () => {
    const start = startOfWeek(wed, 0);
    expect(start.getDay()).toBe(0);
    expect(localIsoDate(start)).toBe("2026-07-19");
  });

  it("snaps back to Saturday when the week starts on Saturday", () => {
    const start = startOfWeek(wed, 6);
    expect(start.getDay()).toBe(6);
    expect(localIsoDate(start)).toBe("2026-07-18");
  });

  it("is idempotent on the week-start day itself", () => {
    const monday = new Date(2026, 6, 20, 0, 0);
    expect(localIsoDate(startOfWeek(monday, 1))).toBe("2026-07-20");
  });

  it("does not mutate the anchor date", () => {
    const before = wed.getTime();
    startOfWeek(wed, 1);
    expect(wed.getTime()).toBe(before);
  });
});

describe("buildWeekBuckets", () => {
  const anchor = new Date(2026, 6, 22); // Wed 22 Jul 2026

  it("returns exactly 7 consecutive day buckets from the week start", () => {
    const buckets = buildWeekBuckets([], anchor, 1);
    expect(buckets).toHaveLength(7);
    expect(buckets[0].iso).toBe("2026-07-20");
    expect(buckets[6].iso).toBe("2026-07-26");
    for (let i = 1; i < 7; i++) {
      expect(localIsoDate(addDays(buckets[0].date, i))).toBe(buckets[i].iso);
    }
  });

  it("places bookings in the right day bucket", () => {
    const monday = booking(local(2026, 7, 20, 9), local(2026, 7, 20, 10), "mon");
    const friday = booking(local(2026, 7, 24, 14), local(2026, 7, 24, 15), "fri");
    const buckets = buildWeekBuckets([monday, friday], anchor, 1);
    expect(buckets[0].bookings.map((b) => b.id)).toEqual(["mon"]);
    expect(buckets[4].bookings.map((b) => b.id)).toEqual(["fri"]);
    expect(buckets[1].bookings).toHaveLength(0);
  });

  it("drops bookings outside the visible week", () => {
    const lastWeek = booking(local(2026, 7, 13, 9), local(2026, 7, 13, 10), "past");
    const nextWeek = booking(local(2026, 7, 27, 9), local(2026, 7, 27, 10), "future");
    const buckets = buildWeekBuckets([lastWeek, nextWeek], anchor, 1);
    expect(buckets.flatMap((b) => b.bookings)).toHaveLength(0);
  });

  it("sorts each day's bookings by start time", () => {
    const late = booking(local(2026, 7, 21, 16), local(2026, 7, 21, 17), "late");
    const early = booking(local(2026, 7, 21, 8), local(2026, 7, 21, 9), "early");
    const midday = booking(local(2026, 7, 21, 12), local(2026, 7, 21, 13), "midday");
    const buckets = buildWeekBuckets([late, early, midday], anchor, 1);
    expect(buckets[1].bookings.map((b) => b.id)).toEqual(["early", "midday", "late"]);
  });

  it("respects a Sunday week start", () => {
    const sunday = booking(local(2026, 7, 19, 10), local(2026, 7, 19, 11), "sun");
    const buckets = buildWeekBuckets([sunday], anchor, 0);
    expect(buckets[0].iso).toBe("2026-07-19");
    expect(buckets[0].bookings.map((b) => b.id)).toEqual(["sun"]);
  });
});

describe("hoursSinceMidnight", () => {
  it("returns fractional local hours", () => {
    expect(hoursSinceMidnight(local(2026, 7, 22, 6, 0))).toBe(6);
    expect(hoursSinceMidnight(local(2026, 7, 22, 14, 45))).toBe(14.75);
  });
});
