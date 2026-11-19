import { describe, expect, it } from "vitest";
import {
  countVisitsInDays,
  countVisitsThisWeek,
  shortDay,
  toWeekStart,
  visitsRow,
  weekStartOf,
} from "./visits";
import { CHECKED_IN_TODAY, NO_VISITS_THIS_WEEK, lastVisit, visitsThisWeek } from "./visitsCopy";

const NOW = new Date(2026, 10, 19, 17, 0); // Thu 19 Nov 2026
const at = (d: number, h = 7) => new Date(2026, 10, d, h, 30).toISOString();

describe("gym visit counts (mobile #255 countVisitsThisWeek)", () => {
  it("starts the week on the member's day, Monday by default", () => {
    expect(weekStartOf(NOW).getDate()).toBe(16);
    expect(weekStartOf(NOW, "sunday").getDate()).toBe(15);
    expect(toWeekStart("sunday")).toBe("sunday");
    expect(toWeekStart(undefined)).toBe("monday");
    expect(toWeekStart("friday")).toBe("monday");
  });

  it("counts this week up to now, skipping bad dates", () => {
    const list = [at(19), at(16), at(15), "nonsense", { checked_in_at: at(17) }];
    expect(countVisitsThisWeek(list, NOW)).toBe(3);
    expect(countVisitsThisWeek(list, NOW, "sunday")).toBe(4);
    expect(countVisitsThisWeek([at(19, 18)], NOW)).toBe(0); // after now
  });

  it("counts the last 30 days, today included", () => {
    expect(countVisitsInDays([at(19), at(1), new Date(2026, 9, 20, 9).toISOString(), new Date(2026, 9, 21, 9).toISOString()], NOW, 30)).toBe(3);
  });

  it("writes days as Tue 17 Nov", () => {
    expect(shortDay(new Date(2026, 10, 17))).toBe("Tue 17 Nov");
  });
});

describe("visitsRow (board web-visits H1-H4)", () => {
  it("checked in today counts today at least once", () => {
    expect(visitsRow({ stats: { has_checked_in_today: true }, weekCount: 0 })).toEqual({
      title: CHECKED_IN_TODAY,
      meta: visitsThisWeek(1),
    });
    expect(visitsRow({ stats: { has_checked_in_today: true }, weekCount: 4 })?.meta).toBe("4 visits this week");
  });

  it("names the last visit when today has none", () => {
    expect(visitsRow({ stats: { has_checked_in_today: false, last_check_in_at: at(17) }, weekCount: 2 })).toEqual({
      title: lastVisit("Tue 17 Nov"),
      meta: "2 visits this week",
    });
  });

  it("says none yet this week, and never guesses an unknown count", () => {
    expect(visitsRow({ stats: { has_checked_in_today: false, last_check_in_at: at(14) }, weekCount: 0 })).toEqual({
      title: NO_VISITS_THIS_WEEK,
    });
    expect(visitsRow({ stats: { has_checked_in_today: false, last_check_in_at: at(17) }, weekCount: null })).toEqual({
      title: lastVisit("Tue 17 Nov"),
    });
    expect(visitsRow({ stats: { has_checked_in_today: false }, weekCount: null })).toBeNull();
    expect(visitsRow({ stats: null, weekCount: 3 })).toBeNull();
  });
});
