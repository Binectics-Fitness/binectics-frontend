import { formatInTimeZone } from "date-fns-tz";
import { displayFractionDigits } from "@/lib/constants/regions";

/**
 * Formatting Utilities
 * Pure functions for formatting dates, numbers, and strings.
 */

/**
 * Format a date string to a human-readable format.
 * @deprecated In org-scoped dashboards prefer useOrgFormat().fmtDate (respects
 * the org's saved date format & time zone); otherwise formatLocal()/formatInTz().
 * @param dateStr - ISO date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string (e.g., "Mar 15, 2024")
 */
export function formatDate(
  dateStr: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  locale: string = "en-US",
): string {
  if (!dateStr) return "N/A";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(locale, {
    timeZone: getClientTimezone(),
    ...(options ?? { month: "short", day: "numeric", year: "numeric" }),
  }).format(date);
}

/**
 * Get browser/client IANA timezone.
 */
export function getClientTimezone(): string {
  if (typeof Intl === "undefined") return "UTC";
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

/**
 * Format a UTC date/time in a provided IANA timezone.
 */
export function formatInTz(
  utcIso: string | Date,
  formatStr: string,
  timezone: string,
): string {
  const date = typeof utcIso === "string" ? new Date(utcIso) : utcIso;
  if (isNaN(date.getTime())) return "N/A";
  return formatInTimeZone(date, timezone, formatStr);
}

/**
 * Format a UTC date/time in the current user's local timezone.
 */
export function formatLocal(utcIso: string | Date, formatStr: string): string {
  return formatInTz(utcIso, formatStr, getClientTimezone());
}

/**
 * Build a dual-timezone slot label for consultation scheduling UIs.
 */
export function dualTimezoneLabel(
  startsAt: string,
  endsAt: string,
  providerTimezone: string,
  clientTimezone: string = getClientTimezone(),
): string {
  const clientStart = formatInTz(startsAt, "EEE, MMM d • h:mm", clientTimezone);
  const clientEnd = formatInTz(endsAt, "h:mm a", clientTimezone);

  if (providerTimezone === clientTimezone) {
    return `${clientStart} - ${clientEnd}`;
  }

  const providerStart = formatInTz(startsAt, "h:mm", providerTimezone);
  const providerEnd = formatInTz(endsAt, "h:mm a", providerTimezone);

  return `${clientStart} - ${clientEnd} (your time) · ${providerStart} - ${providerEnd} (provider time)`;
}

/**
 * Format a date string to a short format (e.g., "Jan 15").
 */
export function formatDateShort(
  dateStr: string | Date | undefined | null,
): string {
  return formatDate(dateStr, { month: "short", day: "numeric" });
}

/**
 * Return a signed numeric change string (e.g., "+3.5" or "−2.1").
 * Uses a real minus sign (−) for negative values.
 */
export function signedChange(value: number | undefined | null): string {
  if (value === undefined || value === null) return "—";
  if (value > 0) return `+${value}`;
  if (value < 0) return `−${Math.abs(value)}`;
  return "0";
}

/**
 * Format a number as currency string.
 *
 * Uses `currencyDisplay: "narrowSymbol"` so currencies render with their
 * native short symbol (e.g. NGN -> ₦, GBP -> £, INR -> ₹) instead of the
 * ISO code. Falls back to the standard symbol when no narrow form exists.
 */
export function formatCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
): string {
  // Decimals decided per currency + whether the amount is whole — never by
  // magnitude (which rendered ₦25,000 next to ₦475.00). Round prices stay clean
  // ("$1,200"); fractional amounts keep their cents ("$12.50").
  const digits = displayFractionDigits(amount, currency);
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(amount);
  } catch {
    try {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      }).format(amount);
    } catch {
      const upper = currency.toUpperCase();
      return `${upper} ${amount.toFixed(digits)}`;
    }
  }
}

export function formatSignedCurrency(
  amount: number,
  currency: string = "USD",
  locale: string = "en-US",
  options?: { showPlus?: boolean },
): string {
  const sign = amount < 0 ? "− " : amount > 0 && options?.showPlus ? "+ " : "";
  return `${sign}${formatCurrency(Math.abs(amount), currency, locale)}`;
}

/**
 * Strip HTML tags from a string, returning plain text.
 * Useful for displaying rich-text content in truncated card previews.
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
