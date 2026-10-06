import { describe, expect, it } from "vitest";
import { ConsultationBookingStatus as S, type ConsultationBooking } from "@/lib/api/consultations";
import { coachSchedule, gapAnchors, scheduleGaps } from "../coachSchedule";

// Local wall-clock times on one day, so the tests hold in any TZ.
const at = (day: number, h: number, m = 0) => new Date(2026, 9, day, h, m).toISOString();

function booking(id: string, day: number, h: number, mins: number, status = S.CONFIRMED, m = 0): ConsultationBooking {
  const start = new Date(2026, 9, day, h, m);
  return {
    id,
    clientUserId: "c",
    providerId: "p",
    consultationTypeId: "t",
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + mins * 60000).toISOString(),
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Africa/Lagos",
    status,
  } as ConsultationBooking;
}

const today = new Date(2026, 9, 6, 8);

describe("coachSchedule", () => {
  const rows = [
    booking("later", 8, 9, 60),
    booking("pm", 6, 15, 60),
    booking("cancelled", 6, 13, 60, S.CANCELLED),
    booking("done", 6, 7, 60, S.COMPLETED),
    booking("am", 6, 10, 60, S.PENDING),
    booking("yesterday", 5, 10, 60),
  ];

  it("lists every booking on today's date in start order, cancelled included", () => {
    const s = coachSchedule(rows, today, new Date(at(6, 12)).getTime());
    expect(s.today.map((b) => b.id)).toEqual(["done", "am", "cancelled", "pm"]);
    expect(s.liveToday).toBe(3);
  });

  it("counts only open sessions that haven't started as still to come", () => {
    const s = coachSchedule(rows, today, new Date(at(6, 12)).getTime());
    expect(s.stillToCome).toBe(1); // pm; am already started, done is completed
    expect(s.upcoming.map((b) => b.id)).toEqual(["pm", "later"]);
    expect(s.later.map((b) => b.id)).toEqual(["later"]);
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
