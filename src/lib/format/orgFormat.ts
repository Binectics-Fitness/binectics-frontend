/**
 * Preference-aware formatting core (pure functions, no React).
 *
 * Turns the org-level locale settings saved on the Settings page
 * (date_format / time_format / number_format / first_day_of_week / time_zone)
 * into concrete rendering. Components should normally reach this through the
 * useOrgFormat() hook, which resolves prefs from the active organization;
 * non-component code can call these directly with an explicit prefs object.
 */

import { formatInTz, getClientTimezone, formatCurrency } from "@/utils/format";
import {
  LOCALE_DEFAULTS,
  type FirstDayOfWeek,
  type DateFormat,
  type TimeFormat,
  type NumberFormat,
} from "@/lib/constants/settingsLocale";

/** The subset of Organization the formatters care about. */
export interface OrgFormatSource {
  time_zone?: string;
  first_day_of_week?: FirstDayOfWeek;
  date_format?: DateFormat;
  time_format?: TimeFormat;
  number_format?: NumberFormat;
  currency?: string;
}

/** Fully-resolved preferences — every field has a usable value. */
export interface OrgFormatPrefs {
  timeZone: string;
  firstDayOfWeek: FirstDayOfWeek;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
  currency: string;
}

/** Saved date_format token → date-fns pattern. */
const DATE_PATTERNS: Record<DateFormat, string> = {
  "DD MMM YYYY": "d MMM yyyy",
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
};

/** Saved time_format token → date-fns pattern. */
const TIME_PATTERNS: Record<TimeFormat, string> = {
  "12h": "h:mm a",
  "24h": "HH:mm",
};

/**
 * Saved number_format token → an Intl locale that produces exactly that
 * grouping/decimal style, for both plain numbers and currency.
 */
const NUMBER_LOCALES: Record<NumberFormat, string> = {
  "1,234.56": "en-US",
  "1.234,56": "de-DE",
  "1 234,56": "sv-SE",
};

/** Saved first_day_of_week token → JS getDay() index (date-fns weekStartsOn). */
export const WEEK_STARTS_ON: Record<FirstDayOfWeek, 0 | 1 | 6> = {
  sunday: 0,
  monday: 1,
  saturday: 6,
};

/**
 * Merge an organization's saved settings with defaults (and the browser
 * time zone) into fully-resolved preferences. Accepts null/undefined so
 * callers outside an org context degrade gracefully.
 */
export function resolveOrgFormatPrefs(
  org?: OrgFormatSource | null,
): OrgFormatPrefs {
  return {
    timeZone: org?.time_zone || getClientTimezone(),
    firstDayOfWeek: org?.first_day_of_week ?? LOCALE_DEFAULTS.first_day_of_week,
    dateFormat: org?.date_format ?? LOCALE_DEFAULTS.date_format,
    timeFormat: org?.time_format ?? LOCALE_DEFAULTS.time_format,
    numberFormat: org?.number_format ?? LOCALE_DEFAULTS.number_format,
    currency: org?.currency ?? "USD",
  };
}

/** The Intl locale implementing the prefs' number style. */
export function localeForNumberFormat(numberFormat: NumberFormat): string {
  return NUMBER_LOCALES[numberFormat] ?? "en-US";
}

/**
 * The Intl locale whose day/month ORDER matches the org's date_format —
 * for compact labels (calendar chips, "Jan 5" ranges) that Intl builds
 * from parts rather than a full pattern.
 */
export function localeForDateFormat(prefs: OrgFormatPrefs): string {
  switch (prefs.dateFormat) {
    case "MM/DD/YYYY":
      return "en-US";
    case "YYYY-MM-DD":
      return "en-CA"; // ISO ordering
    default:
      return "en-GB"; // DD-first for 'DD MMM YYYY' and 'DD/MM/YYYY'
  }
}

/** "18 May 2026" (per the org's date_format, in the org's time zone). */
export function formatOrgDate(
  date: string | Date | null | undefined,
  prefs: OrgFormatPrefs,
): string {
  if (!date) return "N/A";
  return formatInTz(date, DATE_PATTERNS[prefs.dateFormat], prefs.timeZone);
}

/** "14:30" or "2:30 PM" (per the org's time_format, in the org's time zone). */
export function formatOrgTime(
  date: string | Date | null | undefined,
  prefs: OrgFormatPrefs,
): string {
  if (!date) return "N/A";
  return formatInTz(date, TIME_PATTERNS[prefs.timeFormat], prefs.timeZone);
}

/** Date and time together, e.g. "18 May 2026 · 14:30". */
export function formatOrgDateTime(
  date: string | Date | null | undefined,
  prefs: OrgFormatPrefs,
): string {
  if (!date) return "N/A";
  const pattern = `${DATE_PATTERNS[prefs.dateFormat]} · ${TIME_PATTERNS[prefs.timeFormat]}`;
  return formatInTz(date, pattern, prefs.timeZone);
}

/** Plain number with the org's grouping/decimal style. */
export function formatOrgNumber(
  value: number,
  prefs: OrgFormatPrefs,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(
    localeForNumberFormat(prefs.numberFormat),
    options,
  ).format(value);
}

/**
 * Money in a specific currency, grouped per the org's number style.
 * Pass the amount's own currency (a plan priced in NGN stays ₦) — the org
 * default is only the fallback for amounts with no currency of their own.
 */
export function formatOrgMoney(
  amount: number,
  currency: string | null | undefined,
  prefs: OrgFormatPrefs,
): string {
  return formatCurrency(
    amount,
    currency || prefs.currency,
    localeForNumberFormat(prefs.numberFormat),
  );
}
