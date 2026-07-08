/**
 * Locale-settings option lists for the gym-owner Settings page.
 *
 * The string values mirror the backend enums 1:1
 * (binectics-api/src/core/enums/{first-day-of-week,date-format,time-format,
 * number-format}.enum.ts) so the values round-trip through
 * PATCH /teams/organizations/:id without translation.
 */

export type FirstDayOfWeek = "sunday" | "monday" | "saturday";
export type DateFormat = "DD MMM YYYY" | "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
export type TimeFormat = "12h" | "24h";
export type NumberFormat = "1,234.56" | "1.234,56" | "1 234,56";

export interface LocaleOption<T> {
  value: T;
  /** Short dropdown label. */
  label: string;
  /** Live example shown beside the control. */
  preview: string;
}

export const FIRST_DAY_OPTIONS: LocaleOption<FirstDayOfWeek>[] = [
  { value: "monday", label: "Monday", preview: "Mon → Sun" },
  { value: "sunday", label: "Sunday", preview: "Sun → Sat" },
  { value: "saturday", label: "Saturday", preview: "Sat → Fri" },
];

export const DATE_FORMAT_OPTIONS: LocaleOption<DateFormat>[] = [
  { value: "DD MMM YYYY", label: "DD MMM YYYY", preview: "18 May 2026" },
  { value: "DD/MM/YYYY", label: "DD/MM/YYYY", preview: "18/05/2026" },
  { value: "MM/DD/YYYY", label: "MM/DD/YYYY", preview: "05/18/2026" },
  { value: "YYYY-MM-DD", label: "YYYY-MM-DD", preview: "2026-05-18" },
];

export const TIME_FORMAT_OPTIONS: LocaleOption<TimeFormat>[] = [
  { value: "24h", label: "24-hour", preview: "14:30" },
  { value: "12h", label: "12-hour", preview: "2:30 PM" },
];

export const NUMBER_FORMAT_OPTIONS: LocaleOption<NumberFormat>[] = [
  { value: "1,234.56", label: "1,234.56", preview: "1,234.56" },
  { value: "1.234,56", label: "1.234,56", preview: "1.234,56" },
  { value: "1 234,56", label: "1 234,56", preview: "1 234,56" },
];

/** Sensible defaults when the org hasn't set a preference yet. */
export const LOCALE_DEFAULTS = {
  first_day_of_week: "monday" as FirstDayOfWeek,
  date_format: "DD MMM YYYY" as DateFormat,
  time_format: "24h" as TimeFormat,
  number_format: "1,234.56" as NumberFormat,
};

/**
 * Full IANA time-zone list with a current UTC-offset label, e.g.
 * "Africa/Johannesburg · UTC+2". Falls back to a small curated list on the
 * rare runtime without `Intl.supportedValuesOf` (mirrors the guard used in
 * ConsultationAvailabilityManager).
 */
export function getTimeZoneOptions(): { value: string; label: string }[] {
  const zones =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : [
          "UTC",
          "Africa/Johannesburg",
          "Africa/Lagos",
          "Africa/Nairobi",
          "Europe/London",
          "America/New_York",
          "Asia/Dubai",
        ];

  return zones.map((zone) => ({ value: zone, label: `${zone} · ${utcOffsetLabel(zone)}` }));
}

/** "UTC+2" / "UTC-4:30" for a given IANA zone at the current instant. */
export function utcOffsetLabel(timeZone: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const raw = parts.find((p) => p.type === "timeZoneName")?.value ?? "UTC";
    return raw.replace("GMT", "UTC");
  } catch {
    return "UTC";
  }
}
