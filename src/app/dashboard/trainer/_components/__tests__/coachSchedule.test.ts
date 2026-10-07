import { describe, expect, it } from "vitest";
import { ConsultationBookingStatus as S, type ConsultationBooking } from "@/lib/api/consultations";
import { coachSchedule, gapAnchors, isExpiredHold, scheduleGaps } from "../coachSchedule";

const LAGOS = "Africa/Lagos"; // UTC+1, no DST
// Lagos wall-clock h:m on 2026-10-(day), as a UTC instant.
const lagos = (day: number, h: number, m = 0) => Date.UTC(2026, 9, day, h - 1, m);

function booking(id: string, day: number, h: number, mins: number, status = S.CONFIRMED, m = 0, extra: Partial<ConsultationBooking> = {}): ConsultationBooking {
  const start = lagos(day, h, m);
  return {
    id,
    clientUserId: "c",
    providerId: "p",
    consultationTypeId: "t",
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(start + mins * 60000).toISOString(),
    providerTimezone: LAGOS,
    clientTimezone: LAGOS,
    status,
    ...extra,
  } as ConsultationBooking;
}

describe("coachSchedule", () => {
  const rows = [
    booking("later", 8, 9, 60),
    booking("pm", 6, 15, 60),
    booking("cancelled", 6, 13, 60, S.CANCELLED),
    booking("done", 6, 7, 60, S.COMPLETED),
    booking("am", 6, 10, 60, S.PENDING),
    booking("yesterday", 5, 10, 60),
  ];

  it("lists every booking on the org's today in start order, cancelled included", () => {
    const s = coachSchedule(rows, lagos(6, 12), LAGOS);
    expect(s.todayKey).toBe("2026-10-06");
    expect(s.tomorrowKey).toBe("2026-10-07");
    expect(s.today.map((b) => b.id)).toEqual(["done", "am", "cancelled", "pm"]);
    expect(s.liveToday).toBe(3);
  });

  it("counts only open sessions that haven't started as still to come", () => {
    const s = coachSchedule(rows, lagos(6, 12), LAGOS);
    expect(s.stillToCome).toBe(1); // pm; am already started, done is completed
    expect(s.upcoming.map((b) => b.id)).toEqual(["pm", "later"]);
    expect(s.later.map((b) => b.id)).toEqual(["later"]);
  });

  it("buckets by the org's day, not the viewer's", () => {
    // 23:30 UTC on the 6th: 19:30 on the 6th in New York, 00:30 on the 7th in Lagos.
    const now = Date.UTC(2026, 9, 6, 23, 30);
    const early = booking("early", 7, 8, 60); // 08:00 Lagos on the 7th
    const lagosView = coachSchedule([early], now, LAGOS);
    expect(lagosView.todayKey).toBe("2026-10-07");
    expect(lagosView.today.map((b) => b.id)).toEqual(["early"]);
    expect(lagosView.stillToCome).toBe(1);
    // The same instant bucketed in New York's zone would be the 6th and miss it.
    const nyView = coachSchedule([early], now, "America/New_York");
    expect(nyView.todayKey).toBe("2026-10-06");
    expect(nyView.today).toEqual([]);
  });

  it("does not count an expired payment hold as today, still to come or upcoming", () => {
    const hold = booking("hold", 6, 15, 60, S.PENDING, 0, {
      payment: { reference: "r", expiresAt: new Date(lagos(6, 11)).toISOString() },
    });
    const now = lagos(6, 12);
    expect(isExpiredHold(hold, now)).toBe(true);
    const s = coachSchedule([hold], now, LAGOS);
    expect(s.today.map((b) => b.id)).toEqual(["hold"]); // still listed, as expired
    expect(s.liveToday).toBe(0);
    expect(s.stillToCome).toBe(0);
    expect(s.upcoming).toEqual([]);
    // A live hold still counts.
    expect(coachSchedule([hold], lagos(6, 10), LAGOS).stillToCome).toBe(1);
  });
});

describe("scheduleGaps", () => {
  it("reports free time between live sessions, skipping cancelled ones and short gaps", () => {
    const day = [
      booking("a", 6, 9, 60), // 09:00–10:00
      booking("b", 6, 10, 60, S.CONFIRMED, 15), // 10:15–11:15: 15 min gap, too short
      booking("x", 6, 12, 60, S.CANCELLED), // doesn't occupy time
      booking("c", 6, 14, 30), // 14:00: gap 11:15–14:00
    ];
    const gaps = scheduleGaps(day);
    expect([...gaps.keys()]).toEqual(["b"]);
    expect(gaps.get("b")).toEqual({ from: day[1].endsAt, to: day[3].startsAt, minutes: 165 });
  });

  it("measures from whichever overlapping session ends last", () => {
    const day = [booking("long", 6, 9, 180), booking("short", 6, 10, 30), booking("next", 6, 13, 30)];
    const gaps = scheduleGaps(day);
    expect(gaps.get("long")?.minutes).toBe(60);
    expect(gaps.has("short")).toBe(false);
  });

  it("places the gap row after a cancelled session that sits inside it", () => {
    const day = [booking("a", 6, 9, 60), booking("x", 6, 11, 60, S.CANCELLED), booking("c", 6, 14, 30)];
    expect([...gapAnchors(day).keys()]).toEqual(["x"]);
  });
});
