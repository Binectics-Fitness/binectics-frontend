import { describe, expect, it } from "vitest";
import {
  buildIcs,
  classBookingEvent,
  escapeText,
  foldLine,
  icsFileName,
  sessionBookingEvent,
  zonedWallClockToUtc,
  type CalendarEvent,
} from "@/lib/bookings/calendar";
import type { ClassBooking } from "@/lib/api/classBookings";
import { ConsultationBookingStatus, type ConsultationBooking } from "@/lib/api/consultations";

/** Web "Add to calendar" (parity with mobile #182): the .ics content. */

const NOW = new Date("2026-11-23T10:00:00.000Z");

const cls = (over: Partial<ClassBooking> = {}): ClassBooking => ({
  _id: "b1",
  class_id: { _id: "c1", name: "Spin", start_time: "18:30", duration_minutes: 45, instructor_name: "Tolu", day_of_week: 3 },
  organization_id: "o1",
  member_user_id: "u1",
  booking_date: "2026-10-28",
  status: "confirmed",
  cancelled_at: null,
  cancellation_fee_applied: false,
  created_at: "",
  updated_at: "",
  ...over,
});

const lines = (ics: string) => ics.split("\r\n");
const field = (ics: string, name: string) => lines(ics).find((l) => l.startsWith(`${name}:`))?.slice(name.length + 1);

describe("zonedWallClockToUtc", () => {
  it("Lagos (WAT, UTC+1, no DST): the same offset in January and July", () => {
    expect(zonedWallClockToUtc("2026-01-15", "18:30", "Africa/Lagos")?.toISOString()).toBe("2026-01-15T17:30:00.000Z");
    expect(zonedWallClockToUtc("2026-07-15", "18:30", "Africa/Lagos")?.toISOString()).toBe("2026-07-15T17:30:00.000Z");
  });

  it("London: GMT in winter, BST in summer, either side of the switch", () => {
    // Clocks go forward 29 Mar 2026 and back 25 Oct 2026.
    expect(zonedWallClockToUtc("2026-03-28", "09:00", "Europe/London")?.toISOString()).toBe("2026-03-28T09:00:00.000Z");
    expect(zonedWallClockToUtc("2026-03-30", "09:00", "Europe/London")?.toISOString()).toBe("2026-03-30T08:00:00.000Z");
    expect(zonedWallClockToUtc("2026-10-24", "09:00", "Europe/London")?.toISOString()).toBe("2026-10-24T08:00:00.000Z");
    expect(zonedWallClockToUtc("2026-10-26", "09:00", "Europe/London")?.toISOString()).toBe("2026-10-26T09:00:00.000Z");
  });

  it("New York on the day DST starts: before and after 2am", () => {
    // 8 Mar 2026: 02:00 EST becomes 03:00 EDT.
    expect(zonedWallClockToUtc("2026-03-08", "01:30", "America/New_York")?.toISOString()).toBe("2026-03-08T06:30:00.000Z");
    expect(zonedWallClockToUtc("2026-03-08", "06:00", "America/New_York")?.toISOString()).toBe("2026-03-08T10:00:00.000Z");
  });

  it("a time in the skipped hour lands on a real instant, not an error", () => {
    const t = zonedWallClockToUtc("2026-03-29", "01:30", "Europe/London");
    expect(t).not.toBeNull();
    expect(["2026-03-29T00:30:00.000Z", "2026-03-29T01:30:00.000Z"]).toContain(t!.toISOString());
  });

  it("refuses what it cannot read", () => {
    expect(zonedWallClockToUtc("28/10/2026", "18:30", "Africa/Lagos")).toBeNull();
    expect(zonedWallClockToUtc("2026-10-28", "6pm", "Africa/Lagos")).toBeNull();
    expect(zonedWallClockToUtc("2026-10-28", "18:30", "Not/AZone")).toBeNull();
  });
});

describe("buildIcs", () => {
  const event: CalendarEvent = {
    uid: "class-b1",
    title: "Spin",
    description: "With Tolu. At Ikoyi Strength",
    location: "Ikoyi Strength",
    startIso: "2026-10-28T17:30:00.000Z",
    endIso: "2026-10-28T18:15:00.000Z",
  };

  it("writes UTC instants with Z, CRLF line ends and one VEVENT", () => {
    const ics = buildIcs(event, NOW)!;
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics).not.toMatch(/[^\r]\n/);
    expect(field(ics, "DTSTART")).toBe("20261028T173000Z");
    expect(field(ics, "DTEND")).toBe("20261028T181500Z");
    expect(field(ics, "DTSTAMP")).toBe("20261123T100000Z");
    expect(field(ics, "UID")).toBe("class-b1@binectics.com");
    expect(field(ics, "SUMMARY")).toBe("Spin");
    expect(field(ics, "LOCATION")).toBe("Ikoyi Strength");
    expect(field(ics, "DESCRIPTION")).toBe("With Tolu. At Ikoyi Strength");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(1);
    expect(ics).toContain("TRIGGER:-PT1H");
    // No floating times and no TZID without a VTIMEZONE.
    expect(ics).not.toMatch(/DTSTART:\d{8}T\d{6}\r/);
    expect(ics).not.toContain("TZID");
  });

  it("leaves out location and description when there are none", () => {
    const ics = buildIcs({ ...event, location: undefined, description: undefined }, NOW)!;
    expect(field(ics, "LOCATION")).toBeUndefined();
    expect(lines(ics).filter((l) => l.startsWith("DESCRIPTION:"))).toEqual(["DESCRIPTION:Spin"]); // the alarm's
  });

  it("refuses unreadable or backwards times", () => {
    expect(buildIcs({ ...event, startIso: "nope" }, NOW)).toBeNull();
    expect(buildIcs({ ...event, endIso: event.startIso }, NOW)).toBeNull();
  });

  it("escapes text and folds long lines at 75 octets", () => {
    expect(escapeText("a, b; c\\d\ne")).toBe("a\\, b\\; c\\\\d\\ne");
    const long = `SUMMARY:${"Ọ̀".repeat(60)}`;
    const folded = foldLine(long);
    for (const part of folded.split("\r\n")) expect(new TextEncoder().encode(part).length).toBeLessThanOrEqual(75);
    expect(folded.split("\r\n").slice(1).every((p) => p.startsWith(" "))).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(long);
  });
});

describe("classBookingEvent", () => {
  it("reads the class's clock time in the gym's zone: Lagos 18:30 is 17:30Z", () => {
    const e = classBookingEvent(cls(), { timeZone: "Africa/Lagos", gymName: "Ikoyi Strength" })!;
    expect(e.startIso).toBe("2026-10-28T17:30:00.000Z");
    expect(e.endIso).toBe("2026-10-28T18:15:00.000Z");
    expect(e.title).toBe("Spin");
    expect(e.location).toBe("Ikoyi Strength");
    expect(e.description).toBe("With Tolu. At Ikoyi Strength");
  });

  it("uses the booking's own zone when the API sends one, DST included", () => {
    const e = classBookingEvent(cls({ time_zone: "Europe/London", booking_date: "2026-07-01" }))!;
    expect(e.startIso).toBe("2026-07-01T17:30:00.000Z");
  });

  it("assumes an hour when the class has no duration, and has nothing to add without a start", () => {
    const noDur = cls({ class_id: { _id: "c1", name: "Yoga", start_time: "07:00", duration_minutes: 0, instructor_name: null, day_of_week: 1 } });
    const e = classBookingEvent(noDur, { timeZone: "Africa/Lagos" })!;
    expect(new Date(e.endIso).getTime() - new Date(e.startIso).getTime()).toBe(60 * 60000);
    expect(e.description).toBeUndefined();
    expect(classBookingEvent(cls({ class_id: "c1" }))).toBeNull();
  });

  it("carries nothing about the member", () => {
    const ics = buildIcs(classBookingEvent(cls(), { timeZone: "Africa/Lagos" })!, NOW)!;
    expect(ics).not.toContain("u1");
    expect(ics).not.toMatch(/@(?!binectics\.com)/);
  });
});

describe("sessionBookingEvent", () => {
  const session = {
    id: "s9",
    clientUserId: "u1",
    clientFirstName: "Ada",
    clientLastName: "Obi",
    providerId: "p1",
    providerFirstName: "Kemi",
    providerLastName: "Bello",
    consultationTypeId: "t1",
    consultationTypeName: "Nutrition check-in",
    startsAt: "2026-11-30T09:00:00.000Z",
    endsAt: "2026-11-30T09:45:00.000Z",
    providerTimezone: "Africa/Lagos",
    clientTimezone: "Europe/London",
    status: ConsultationBookingStatus.CONFIRMED,
    notes: "Private intake note",
  } as ConsultationBooking;

  it("keeps the session's exact instants and names the provider, not the member", () => {
    const e = sessionBookingEvent(session);
    const ics = buildIcs(e, NOW)!;
    expect(field(ics, "DTSTART")).toBe("20261130T090000Z");
    expect(field(ics, "DTEND")).toBe("20261130T094500Z");
    expect(field(ics, "SUMMARY")).toBe("Nutrition check-in");
    expect(field(ics, "DESCRIPTION")).toBe("With Kemi Bello");
    expect(ics).not.toContain("Ada");
    expect(ics).not.toContain("Private intake note");
    expect(icsFileName(e)).toBe("binectics-session-s9.ics");
  });
});
