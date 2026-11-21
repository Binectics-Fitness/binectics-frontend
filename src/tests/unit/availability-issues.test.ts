import { describe, it, expect } from "vitest";
import { apiRangeIssues, blockIssues, inclusiveDays, weekIssues, type DayDraft } from "@/lib/availability/issues";
import { AVAILABILITY_ISSUE_COPY as COPY } from "@/lib/constants/availabilityCopy";

const week = (days: Partial<Record<number, DayDraft>>): Record<number, DayDraft> =>
  Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((d) => [d, days[d] ?? { enabled: false, ranges: [] }]));
const r = (id: string, startTime: string, endTime: string) => ({ id, startTime, endTime });

describe("weekIssues", () => {
  it("skips a closed day, whatever its times", () => {
    expect(weekIssues(week({ 1: { enabled: false, ranges: [r("a", "17:00", "09:00")] } })).size).toBe(0);
  });

  it("flags an overlap on the later range only, naming the earlier one", () => {
    const issues = weekIssues(week({ 2: { enabled: true, ranges: [r("a", "09:00", "13:00"), r("b", "12:00", "15:00")] } }));
    expect(issues.has("a")).toBe(false);
    expect(issues.get("b")).toEqual({ message: COPY.overlap("09:00", "13:00"), start: true, end: true });
  });

  it("does not compare against a range that is itself wrong", () => {
    const issues = weekIssues(week({ 2: { enabled: true, ranges: [r("a", "15:00", "09:00"), r("b", "10:00", "11:00")] } }));
    expect(issues.get("a")?.message).toBe(COPY.endBeforeStart);
    expect(issues.has("b")).toBe(false);
  });
});

describe("apiRangeIssues", () => {
  it("maps rules.N paths to the range sent at N and ignores messages without one", () => {
    const issues = apiRangeIssues(
      ["rules.1.endTime must match /x/", "startTime must be earlier than endTime"],
      ["a", "b"],
    );
    expect([...issues.keys()]).toEqual(["b"]);
    expect(issues.get("b")).toEqual({ message: COPY.badTime, start: false, end: true });
    expect(apiRangeIssues("startTime must be earlier than endTime", ["a"]).size).toBe(0);
  });
});

describe("blockIssues", () => {
  const base = { mode: "single" as const, date: "2026-12-01", endDate: "", custom: false, startTime: "09:00", endTime: "17:00" };
  it("accepts a full day", () => expect(blockIssues(base)).toEqual({}));
  it("accepts exactly 31 days and refuses 32", () => {
    expect(inclusiveDays("2026-12-01", "2026-12-31")).toBe(31);
    expect(blockIssues({ ...base, mode: "range", endDate: "2026-12-31" })).toEqual({});
    expect(blockIssues({ ...base, mode: "range", endDate: "2027-01-01" })).toEqual({ endDate: COPY.rangeTooLong });
  });
  it("asks for an end date in range mode", () =>
    expect(blockIssues({ ...base, mode: "range" })).toEqual({ endDate: COPY.chooseEndDate }));
});
