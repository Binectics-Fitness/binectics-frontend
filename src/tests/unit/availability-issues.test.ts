import { describe, it, expect } from "vitest";
import { apiRangeIssues, blockIssues, inclusiveDays, mergeExceptions, weekIssues, type DayDraft } from "@/lib/availability/issues";
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
  const sent = [r("a", "09:00", "13:00"), r("b", "12:00", "15:00"), r("c", "16:00", "15:00")];

  it("maps rules.N paths to the range sent at N and ignores messages without one", () => {
    const issues = apiRangeIssues(
      { message: ["rules.1.endTime must match /x/", "startTime must be earlier than endTime"] },
      sent,
    );
    expect([...issues.keys()]).toEqual(["b"]);
    expect(issues.get("b")).toEqual({ message: COPY.badTime, start: false, end: true });
    expect(apiRangeIssues({ message: "startTime must be earlier than endTime" }, sent).size).toBe(0);
  });

  it("puts AVAILABILITY_END_BEFORE_START on the range at its index, outlining the end", () => {
    const issues = apiRangeIssues(
      { message: "Monday: the end time (15:00) must be later than the start time (16:00).", code: "AVAILABILITY_END_BEFORE_START", details: { index: 2, field: "endTime" } },
      sent,
    );
    expect([...issues.entries()]).toEqual([["c", { message: COPY.endBeforeStart, start: false, end: true }]]);
  });

  it("marks both ranges of an AVAILABILITY_OVERLAP, each naming the other", () => {
    // b starts inside a: b's start and a's end are the clashing edges.
    const issues = apiRangeIssues(
      { code: "AVAILABILITY_OVERLAP", details: { index: 1, field: "startTime", overlaps_index: 0 } },
      sent,
    );
    expect(issues.get("b")).toEqual({ message: COPY.overlap("09:00", "13:00"), start: true, end: false });
    expect(issues.get("a")).toEqual({ message: COPY.overlap("12:00", "15:00"), start: false, end: true });

    // The later range starts first: its end runs into the earlier one's start.
    const early = apiRangeIssues(
      { code: "AVAILABILITY_OVERLAP", details: { index: 0, field: "endTime", overlaps_index: 1 } },
      [r("x", "12:00", "15:00"), r("y", "10:00", "13:00")],
    );
    expect(early.get("x")).toEqual({ message: COPY.overlap("10:00", "13:00"), start: false, end: true });
    expect(early.get("y")).toEqual({ message: COPY.overlap("12:00", "15:00"), start: true, end: false });
  });

  it("leaves a coded refusal without a usable index for the banner", () => {
    // Custom-hours exceptions send AVAILABILITY_END_BEFORE_START with no index.
    expect(apiRangeIssues({ code: "AVAILABILITY_END_BEFORE_START", message: "End after start." }, sent).size).toBe(0);
    expect(apiRangeIssues({ code: "AVAILABILITY_OVERLAP", details: { index: 9, overlaps_index: 0 } }, sent).size).toBe(0);
    expect(apiRangeIssues({ code: "AVAILABILITY_OVERLAP", details: { index: 1 } }, sent).size).toBe(0);
  });
});

describe("mergeExceptions", () => {
  it("adds a re-blocked date once, since the API returns the existing row", () => {
    const prev = [{ id: "e1", date: "2026-12-10" }];
    const added = [{ id: "e1", date: "2026-12-10" }, { id: "e2", date: "2026-12-11" }];
    expect(mergeExceptions(prev, added).map((e) => e.id)).toEqual(["e1", "e2"]);
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
