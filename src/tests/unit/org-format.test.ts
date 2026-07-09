import { describe, it, expect } from "vitest";
import {
  resolveOrgFormatPrefs,
  formatOrgDate,
  formatOrgTime,
  formatOrgDateTime,
  formatOrgNumber,
  formatOrgMoney,
  localeForNumberFormat,
  WEEK_STARTS_ON,
} from "@/lib/format/orgFormat";

/** Intl uses non-breaking / narrow spaces as group separators — normalize. */
const plain = (s: string) => s.replace(/[  ]/g, " ");

const prefs = (overrides: Partial<Parameters<typeof resolveOrgFormatPrefs>[0]> = {}) =>
  resolveOrgFormatPrefs({
    time_zone: "Africa/Johannesburg",
    first_day_of_week: "monday",
    date_format: "DD MMM YYYY",
    time_format: "24h",
    number_format: "1,234.56",
    currency: "ZAR",
    ...overrides,
  });

describe("resolveOrgFormatPrefs", () => {
  it("falls back to defaults (and a browser time zone) with no org", () => {
    const p = resolveOrgFormatPrefs(null);
    expect(p.firstDayOfWeek).toBe("monday");
    expect(p.dateFormat).toBe("DD MMM YYYY");
    expect(p.timeFormat).toBe("24h");
    expect(p.numberFormat).toBe("1,234.56");
    expect(p.currency).toBe("USD");
    expect(p.timeZone.length).toBeGreaterThan(0);
  });

  it("carries saved org settings through", () => {
    const p = prefs({ date_format: "YYYY-MM-DD", time_format: "12h" });
    expect(p.dateFormat).toBe("YYYY-MM-DD");
    expect(p.timeFormat).toBe("12h");
    expect(p.timeZone).toBe("Africa/Johannesburg");
  });
});

describe("formatOrgDate / Time / DateTime", () => {
  const utcNoon = "2026-05-18T12:00:00Z"; // 14:00 in Johannesburg (UTC+2)

  it("renders every date format token", () => {
    expect(formatOrgDate(utcNoon, prefs())).toBe("18 May 2026");
    expect(formatOrgDate(utcNoon, prefs({ date_format: "DD/MM/YYYY" }))).toBe("18/05/2026");
    expect(formatOrgDate(utcNoon, prefs({ date_format: "MM/DD/YYYY" }))).toBe("05/18/2026");
    expect(formatOrgDate(utcNoon, prefs({ date_format: "YYYY-MM-DD" }))).toBe("2026-05-18");
  });

  it("renders both time formats in the org's zone", () => {
    expect(formatOrgTime(utcNoon, prefs())).toBe("14:00");
    expect(formatOrgTime(utcNoon, prefs({ time_format: "12h" }))).toBe("2:00 PM");
  });

  it("rolls the date across the org's timezone boundary", () => {
    // 23:30 UTC is already the next day in Johannesburg.
    expect(formatOrgDate("2026-05-18T23:30:00Z", prefs())).toBe("19 May 2026");
  });

  it("combines date and time", () => {
    expect(formatOrgDateTime(utcNoon, prefs())).toBe("18 May 2026 · 14:00");
  });

  it("degrades to N/A on empty/invalid input", () => {
    expect(formatOrgDate(null, prefs())).toBe("N/A");
    expect(formatOrgTime(undefined, prefs())).toBe("N/A");
    expect(formatOrgDate("not-a-date", prefs())).toBe("N/A");
  });
});

describe("formatOrgNumber", () => {
  it("renders every number format token", () => {
    expect(plain(formatOrgNumber(1234.56, prefs()))).toBe("1,234.56");
    expect(plain(formatOrgNumber(1234.56, prefs({ number_format: "1.234,56" })))).toBe("1.234,56");
    expect(plain(formatOrgNumber(1234.56, prefs({ number_format: "1 234,56" })))).toBe("1 234,56");
  });
});

describe("formatOrgMoney", () => {
  it("groups per the org's number style, keeping the amount's currency", () => {
    const comma = plain(formatOrgMoney(45000, "NGN", prefs()));
    expect(comma).toContain("45,000");
    const dot = plain(formatOrgMoney(45000, "NGN", prefs({ number_format: "1.234,56" })));
    expect(dot).toContain("45.000");
  });

  it("falls back to the org default currency when none is given", () => {
    const out = formatOrgMoney(100, null, prefs());
    // ZAR narrow symbol is "R"
    expect(out).toContain("R");
  });
});

describe("week start + locale maps", () => {
  it("maps first_day_of_week tokens to getDay() indices", () => {
    expect(WEEK_STARTS_ON.sunday).toBe(0);
    expect(WEEK_STARTS_ON.monday).toBe(1);
    expect(WEEK_STARTS_ON.saturday).toBe(6);
  });

  it("maps number formats to implementing locales", () => {
    expect(localeForNumberFormat("1,234.56")).toBe("en-US");
    expect(localeForNumberFormat("1.234,56")).toBe("de-DE");
    expect(localeForNumberFormat("1 234,56")).toBe("sv-SE");
  });
});
