import { describe, expect, it } from "vitest";
import {
  addDaysTo,
  bandGeometry,
  barPercent,
  clampTo,
  dayDiffBetween,
  dayInitial,
  dayKeyOf,
  dayLabel,
  fastAverage,
  fastDays,
  lastDays,
  latestWeighIns,
  railPosition,
  roundHalf,
  waterStats,
  windowOf,
} from "@/lib/solo/glance";
import type { SeriesPoint } from "@/lib/api/memberSeries";
import { weekOfDay, weekTotalsLine } from "@/app/dashboard/member/_components/solo/FastHistory";

const pt = (start_day: string, value: number, n = 1): SeriesPoint => ({ start_day, value, min: value, max: value, n });

describe("local days", () => {
  it("add days across a month end and a daylight saving change", () => {
    expect(addDaysTo("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDaysTo("2026-03-01", -1)).toBe("2026-02-28");
    expect(addDaysTo("2026-03-28", 2)).toBe("2026-03-30");
    expect(dayDiffBetween("2026-03-28", "2026-03-30")).toBe(2);
    expect(dayKeyOf(new Date(2026, 10, 17, 23, 59))).toBe("2026-11-17");
  });
  it("labels", () => {
    expect(dayLabel("2026-11-20")).toBe("Fri 20 Nov");
    expect(dayInitial("2026-11-16")).toBe("M");
  });
  it("the last n days end today, oldest first, and the window names both ends", () => {
    expect(lastDays("2026-11-17", 3)).toEqual(["2026-11-15", "2026-11-16", "2026-11-17"]);
    expect(windowOf("2026-11-17", 7)).toEqual({ from: "2026-11-11", to: "2026-11-17" });
  });
  it("the history week runs Monday to Sunday around any day", () => {
    const w = weekOfDay("2026-11-17");
    expect(w.from).toBe("2026-11-16");
    expect(w.to).toBe("2026-11-22");
    expect(w.days).toHaveLength(7);
    expect(weekOfDay("2026-11-22").from).toBe("2026-11-16");
    expect(weekOfDay("2026-11-16").from).toBe("2026-11-16");
  });
  it("words the week's totals", () => {
    expect(weekTotalsLine({ completed: 4, hours: 61.2 })).toBe("4 fasts completed, 61 h fasted in total");
    expect(weekTotalsLine({ completed: 1, hours: 16 })).toBe("1 fast completed, 16 h fasted in total");
    expect(weekTotalsLine({ completed: 0, hours: 0 })).toBe("0 fasts completed, 0 h fasted in total");
  });
});

describe("fasting strip: a day with no fast is a gap, never a zero", () => {
  const today = "2026-11-17";
  const points = [pt("2026-11-16", 16.1), pt("2026-11-14", 13.3, 2), pt("2026-11-13", 0)];
  it("one cell per day, gaps stay null, a zero point is a gap too", () => {
    const cells = fastDays(points, today, 7);
    expect(cells.map((c) => c.day)).toEqual(lastDays(today, 7));
    expect(cells.find((c) => c.day === "2026-11-16")).toMatchObject({ hours: 16.1, count: 1 });
    expect(cells.find((c) => c.day === "2026-11-14")).toMatchObject({ hours: 13.3, count: 2 });
    expect(cells.find((c) => c.day === "2026-11-15")).toMatchObject({ hours: null, count: 0 });
    expect(cells.find((c) => c.day === "2026-11-13")).toMatchObject({ hours: null });
  });
  it("the average only counts days that have a fast", () => {
    const { average, days } = fastAverage(fastDays(points, today, 7));
    expect(days).toBe(2);
    expect(average).toBeCloseTo((16.1 + 13.3) / 2, 6);
    expect(fastAverage(fastDays([], today, 7))).toEqual({ average: null, days: 0 });
  });
  it("30 days of cells, points outside the window ignored", () => {
    const cells = fastDays([pt("2026-09-01", 16)], today, 30);
    expect(cells).toHaveLength(30);
    expect(cells.every((c) => c.hours === null)).toBe(true);
  });
  it("bars and the own-window band share one 0 to 24 hour scale", () => {
    expect(barPercent(12, 24)).toBe(50);
    expect(barPercent(30, 24)).toBe(100);
    expect(barPercent(0.1, 24)).toBe(2);
    const band = bandGeometry(16, 20, 24);
    expect(band.bottom).toBeCloseTo((16 / 24) * 100, 6);
    expect(band.height).toBeCloseTo((4 / 24) * 100, 6);
    expect(bandGeometry(16, 16, 24).height).toBe(2);
    expect(bandGeometry(10, 30, 24).bottom).toBeCloseTo((10 / 24) * 100, 6);
  });
});

describe("water: the usual day counts only days with a count", () => {
  const today = "2026-11-17";
  const points = [pt("2026-11-16", 6), pt("2026-11-15", 7), pt("2026-11-10", 5), pt("2026-11-09", 8), pt("2026-11-01", 4)];
  it("this week against the week before, with today's live number", () => {
    const s = waterStats(points, today, "week", 3);
    expect(s.days).toBe(3);
    expect(s.average).toBeCloseTo((6 + 7 + 3) / 3, 6);
    expect(s.previous).toBeCloseTo((5 + 8) / 2, 6);
  });
  it("today's live zero removes today, and null leaves the server's number", () => {
    expect(waterStats([...points, pt(today, 9)], today, "week", 0).days).toBe(2);
    expect(waterStats([...points, pt(today, 9)], today, "week", null).days).toBe(3);
  });
  it("four weeks has no 'before' and an empty range is null, not zero", () => {
    const s = waterStats(points, today, "weeks4", null);
    expect(s.previous).toBeNull();
    expect(s.days).toBe(5); // 21 Oct to today: the 1 Nov day is inside the 28 days
    expect(waterStats([], today, "week", null)).toEqual({ average: null, days: 0, previous: null });
  });
  it("the rail position is a clamped picture, never printed", () => {
    expect(railPosition(5, 8)).toBe(62.5);
    expect(railPosition(12, 8)).toBe(100);
    expect(railPosition(-1, 8)).toBe(0);
    expect(railPosition(3, 0)).toBe(0);
  });
});

describe("weights and steppers", () => {
  it("the newest n days with a weigh-in, newest first", () => {
    const rows = latestWeighIns([pt("2026-11-01", 71), pt("2026-11-16", 70.4), pt("2026-11-14", 69.6)], 2);
    expect(rows.map((r) => r.day)).toEqual(["2026-11-16", "2026-11-14"]);
    expect(rows[0]).toMatchObject({ kg: 70.4, label: "Mon 16 Nov" });
  });
  it("rounds to halves and clamps", () => {
    expect(roundHalf(68.3)).toBe(68.5);
    expect(roundHalf(68.2)).toBe(68);
    expect(roundHalf(68.75)).toBe(69);
    expect(clampTo(5, 30, 250)).toBe(30);
    expect(clampTo(300, 30, 250)).toBe(250);
  });
});
