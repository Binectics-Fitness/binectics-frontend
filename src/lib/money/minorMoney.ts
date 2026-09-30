/**
 * Minor-unit money helpers, shared by every provider earnings surface
 * (dietitian + trainer). The transactions ledger and the session-earnings
 * estimate both report amounts in the currency's minor unit (kobo/cents);
 * the org formatters (fmtMoney) take MAJOR units.
 * Pure functions — unit-tested in src/tests/unit/minor-money.test.ts.
 */

import { minorPerMajor } from "./currencyUnits";

/**
 * Minor → major for display, by the currency's ISO exponent: 12345 USD cents
 * is 123.45, 12345 JPY is 12345, 12345 KWD fils is 12.345.
 *
 * `currency` is required on purpose. A fixed `/ 100` was right for every
 * currency the app happened to price in, and wrong the moment a zero- or
 * three-decimal currency appeared; an optional parameter defaulting to 100
 * is how that bug survives.
 */
export function minorToMajor(minor: number, currency: string): number {
  return minor / minorPerMajor(currency);
}

/**
 * The inverse, for the write side (lib/money/moneyInput). Rounded, because
 * 12.34 * 100 is 1233.9999999999998 in IEEE 754 and a float must never reach
 * the wire as money.
 */
export function majorToMinor(major: number, currency: string): number {
  return Math.round(major * minorPerMajor(currency));
}

/**
 * The largest major-unit amount whose minor value is still an exact integer
 * in `currency`. Past this, `majorToMinor` returns a number that cannot
 * round-trip: 1e22 serialises into a request body as "1e+22" and means
 * nothing to the API.
 */
export function maxSafeMajor(currency: string): number {
  return Math.floor(Number.MAX_SAFE_INTEGER / minorPerMajor(currency));
}

/**
 * Render a {currency: minorAmount} map as one display string, largest amount
 * first (e.g. "₦120,000 · $50"). Returns null when the map is empty or all
 * zero so callers can render their own zero state.
 */
export function formatMinorMap(
  byCurrency: Record<string, number> | null | undefined,
  fmt: (major: number, currency: string) => string,
): string | null {
  if (!byCurrency) return null;
  const entries = Object.entries(byCurrency).filter(([, minor]) => minor !== 0);
  if (entries.length === 0) return null;
  entries.sort((a, b) => b[1] - a[1]);
  return entries
    .map(([currency, minor]) => fmt(minorToMajor(minor, currency), currency))
    .join(" · ");
}

/**
 * Pick the currency to plot on a single-currency chart: the one with the
 * largest all-time total, falling back to the org/default currency.
 */
export function dominantCurrency(
  byCurrency: Record<string, number> | null | undefined,
  fallback: string,
): string {
  if (!byCurrency) return fallback;
  let best: string | null = null;
  let bestValue = -Infinity;
  for (const [currency, minor] of Object.entries(byCurrency)) {
    if (minor > bestValue) {
      best = currency;
      bestValue = minor;
    }
  }
  return best ?? fallback;
}
