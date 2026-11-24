import { describe, expect, it } from "vitest";
import {
  dayHoursText,
  emptyWeek,
  hoursProblems,
  hoursStatus,
  hoursStatusLabel,
  todayIn,
  upcomingClosedDates,
  weeklyHoursOf,
  type WeeklyHours,
} from "@/lib/marketplace/openingHours";

/**
 * "Open now" is computed in the LOCATION's zone from the instant, never the
 * viewer's: every case pins the instant in UTC and names the gym's zone.
 * The suite also runs under several process zones (TZ=... vitest).
 */
const week = (partial: Partial<WeeklyHours>): WeeklyHours => ({ ...emptyWeek(), ...partial });
const label = (hours: WeeklyHours, tz: string, iso: string, closed: { date: string; note?: string }[] = []) =>
  hoursStatusLabel(hoursStatus(hours, closed, tz, new Date(iso)));

const lekki = week({
  mon: [{ open: "05:30", close: "22:00" }],
  tue: [{ open: "05:30", close: "22:00" }],
  wed: [{ open: "05:30", close: "22:00" }],
  thu: [{ open: "05:30", close: "22:00" }],
  fri: [{ open: "05:30", close: "22:00" }],
  sat: [{ open: "07:00", close: "20:00" }],
  sun: [{ open: "08:00", close: "14:00" }],
});

describe("opening hours: open now (Lagos, UTC+1)", () => {
  it("is open on a Monday evening and says when it closes", () => {
    // Mon 23 Nov 2026 21:00 in Lagos.
    expect(label(lekki, "Africa/Lagos", "2026-11-23T20:00:00Z")).toBe("Open now · closes 22:00");
  });
  it("is closed after closing and opens tomorrow morning", () => {
    expect(label(lekki, "Africa/Lagos", "2026-11-23T21:30:00Z")).toBe("Closed · opens 05:30 tomorrow");
  });
  it("is closed before opening and opens later today", () => {
    // Mon 05:00 Lagos.
    expect(label(lekki, "Africa/Lagos", "2026-11-23T04:00:00Z")).toBe("Closed · opens 05:30");
  });
  it("uses the weekend hours", () => {
    // Sat 28 Nov 21:00 Lagos: Sunday opens 08:00.
    expect(label(lekki, "Africa/Lagos", "2026-11-28T20:00:00Z")).toBe("Closed · opens 08:00 tomorrow");
    // Sun 29 Nov 15:00 Lagos: Monday 05:30.
    expect(label(lekki, "Africa/Lagos", "2026-11-29T14:00:00Z")).toBe("Closed · opens 05:30 tomorrow");
  });
  it("names the weekday when the next opening is days away", () => {
    const monOnly = week({ mon: [{ open: "06:00", close: "10:00" }] });
    // Wed 25 Nov 12:00 Lagos.
    expect(label(monOnly, "Africa/Lagos", "2026-11-25T11:00:00Z")).toBe("Closed · opens Mon 06:00");
  });
  it("is just Closed when no day has hours", () => {
    expect(label(emptyWeek(), "Africa/Lagos", "2026-11-25T11:00:00Z")).toBe("Closed");
  });
});

describe("opening hours: London either side of the clock change", () => {
  const sundays = week({
    sat: [{ open: "07:00", close: "20:00" }],
    sun: [{ open: "08:00", close: "14:00" }],
  });
  it("spring forward: Sat 23:30 GMT, then Sun 08:30 BST", () => {
    // Clocks go forward 29 Mar 2026 01:00 UTC.
    expect(label(sundays, "Europe/London", "2026-03-28T23:30:00Z")).toBe("Closed · opens 08:00 tomorrow");
    // 07:30 UTC = 08:30 BST: open (in UTC terms it would still read closed).
    expect(label(sundays, "Europe/London", "2026-03-29T07:30:00Z")).toBe("Open now · closes 14:00");
    // 13:30 UTC = 14:30 BST: closed.
    expect(label(sundays, "Europe/London", "2026-03-29T13:30:00Z")).toBe("Closed · opens Sat 07:00");
  });
  it("fall back: Sun 07:30 GMT is before opening, Sat 08:30 BST is open", () => {
    // Clocks go back 25 Oct 2026 01:00 UTC.
    expect(label(sundays, "Europe/London", "2026-10-24T07:30:00Z")).toBe("Open now · closes 20:00");
    expect(label(sundays, "Europe/London", "2026-10-25T07:30:00Z")).toBe("Closed · opens 08:00");
    expect(label(sundays, "Europe/London", "2026-10-25T08:30:00Z")).toBe("Open now · closes 14:00");
  });
});

describe("opening hours: Auckland, a calendar day ahead of UTC", () => {
  it("reads the gym's Tuesday while UTC is still Monday", () => {
    const tueOnly = week({ tue: [{ open: "06:00", close: "12:00" }] });
    // Mon 23 Nov 20:00 UTC = Tue 24 Nov 09:00 NZDT.
    expect(label(tueOnly, "Pacific/Auckland", "2026-11-23T20:00:00Z")).toBe("Open now · closes 12:00");
    expect(todayIn("Pacific/Auckland", new Date("2026-11-23T20:00:00Z"))).toBe("tue");
    expect(todayIn("Africa/Lagos", new Date("2026-11-23T20:00:00Z"))).toBe("mon");
  });
});

describe("opening hours: past midnight, split shifts, closures", () => {
  const late = week({
    fri: [{ open: "18:00", close: "02:00" }],
    sat: [{ open: "10:00", close: "14:00" }],
  });
  it("a range past midnight is still open early the next morning", () => {
    // Sat 28 Nov 01:00 Lagos.
    expect(label(late, "Africa/Lagos", "2026-11-28T00:00:00Z")).toBe("Open now · closes 02:00");
    // Fri 23:00 Lagos: closes 02:00 (tonight's close, not "Sat").
    expect(label(late, "Africa/Lagos", "2026-11-27T22:00:00Z")).toBe("Open now · closes 02:00");
    // Sat 03:00 Lagos.
    expect(label(late, "Africa/Lagos", "2026-11-28T02:00:00Z")).toBe("Closed · opens 10:00");
  });
  it("split shifts: closed over the gap, open in each shift", () => {
    const split = week({
      mon: [
        { open: "06:00", close: "12:00" },
        { open: "16:00", close: "22:00" },
      ],
    });
    expect(label(split, "Africa/Lagos", "2026-11-23T09:00:00Z")).toBe("Open now · closes 12:00");
    expect(label(split, "Africa/Lagos", "2026-11-23T12:00:00Z")).toBe("Closed · opens 16:00");
    expect(label(split, "Africa/Lagos", "2026-11-23T16:00:00Z")).toBe("Open now · closes 22:00");
  });
  it("ranges that meet at midnight close at the later end; every day 24h is Open 24 hours", () => {
    const joined = week({ fri: [{ open: "18:00", close: "24:00" }], sat: [{ open: "00:00", close: "02:00" }] });
    expect(label(joined, "Africa/Lagos", "2026-11-27T20:00:00Z")).toBe("Open now · closes 02:00");
    const allDay = week(
      Object.fromEntries(["mon", "tue", "wed", "thu", "fri", "sat", "sun"].map((d) => [d, [{ open: "00:00", close: "24:00" }]])),
    );
    expect(label(allDay, "Africa/Lagos", "2026-11-27T20:00:00Z")).toBe("Open 24 hours");
    expect(dayHoursText(allDay.mon)).toBe("Open 24 hours");
  });
  it("a closed date shuts the day and says why", () => {
    // Fri 25 Dec 2026 10:00 Lagos.
    expect(label(lekki, "Africa/Lagos", "2026-12-25T09:00:00Z", [{ date: "2026-12-25", note: "Christmas" }])).toBe(
      "Closed today · Christmas · opens 07:00 tomorrow",
    );
    // Closed the next day too: the next opening skips it.
    expect(label(lekki, "Africa/Lagos", "2026-12-25T09:00:00Z", [{ date: "2026-12-25" }, { date: "2026-12-26" }])).toBe(
      "Closed today · opens Sun 08:00",
    );
  });
  it("a closed date is the date in the gym's zone", () => {
    // 24 Dec 23:30 UTC is already 25 Dec in Lagos.
    expect(label(lekki, "Africa/Lagos", "2026-12-24T23:30:00Z", [{ date: "2026-12-25" }]).startsWith("Closed today")).toBe(true);
  });
  it("lists only upcoming closed dates, soonest first", () => {
    expect(
      upcomingClosedDates(
        [{ date: "2027-01-01" }, { date: "2026-01-01" }, { date: "2026-12-25" }],
        "Africa/Lagos",
        new Date("2026-11-23T12:00:00Z"),
      ).map((c) => c.date),
    ).toEqual(["2026-12-25", "2027-01-01"]);
  });
});

describe("opening hours: editor validation and parsing", () => {
  it("accepts split shifts and a past-midnight close", () => {
    expect(
      hoursProblems(
        week({
          mon: [
            { open: "06:00", close: "12:00" },
            { open: "16:00", close: "22:00" },
          ],
          fri: [{ open: "06:00", close: "01:00" }],
        }),
      ),
    ).toEqual({});
  });
  it("flags overlaps, overflow into the next day, Sunday into Monday, and too many ranges", () => {
    expect(
      hoursProblems(
        week({
          mon: [
            { open: "06:00", close: "12:00" },
            { open: "11:00", close: "13:00" },
          ],
        }),
      ),
    ).toEqual({
      mon: "Time ranges overlap",
    });
    expect(hoursProblems(week({ fri: [{ open: "18:00", close: "03:00" }], sat: [{ open: "02:00", close: "10:00" }] }))).toEqual({
      fri: "Runs into Sat's hours",
    });
    expect(hoursProblems(week({ sun: [{ open: "20:00", close: "06:00" }], mon: [{ open: "05:00", close: "09:00" }] }))).toEqual({
      sun: "Runs into Mon's hours",
    });
    expect(
      hoursProblems(
        week({
          tue: [
            { open: "01:00", close: "02:00" },
            { open: "03:00", close: "04:00" },
            { open: "05:00", close: "06:00" },
            { open: "07:00", close: "08:00" },
          ],
        }),
      ),
    ).toEqual({ tue: "At most 3 time ranges" });
    expect(hoursProblems(week({ wed: [{ open: "09:00", close: "09:00" }] }))).toEqual({
      wed: "Opening and closing time are the same",
    });
  });
  it("reads API hours defensively", () => {
    expect(weeklyHoursOf(null)).toBeNull();
    expect(
      weeklyHoursOf({
        mon: [
          { open: "6am", close: "22:00" },
          { open: "06:00", close: "22:00" },
        ],
      })?.mon,
    ).toEqual([{ open: "06:00", close: "22:00" }]);
    expect(weeklyHoursOf({})?.sun).toEqual([]);
    expect(dayHoursText([])).toBe("Closed");
  });
});
