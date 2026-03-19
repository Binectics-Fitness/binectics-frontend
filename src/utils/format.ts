/**
 * Formatting Utilities
 * Pure functions for formatting dates, numbers, and strings.
 */

/**
 * Format a date string to a human-readable format.
 * @param dateStr - ISO date string
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string (e.g., "Mar 15, 2024")
 */
export function formatDate(
  dateStr: string | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateStr) return "N/A";
  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", options ?? { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Format a date string to a short format (e.g., "Jan 15").
 */
export function formatDateShort(dateStr: string | Date | undefined | null): string {
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
 * Format a number as currency string
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
