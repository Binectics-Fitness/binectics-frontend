/**
 * Minor-unit money helpers, shared by every provider earnings surface
 * (dietitian + trainer). The transactions ledger and the session-earnings
 * estimate both report amounts in the currency's minor unit (kobo/cents);
 * the org formatters (fmtMoney) take MAJOR units.
 * Pure functions — unit-tested in src/tests/unit/minor-money.test.ts.
 */

/** Convention across the app: minor / 100 (see billing + admin payments pages). */
export function minorToMajor(minor: number): number {
  return minor / 100;
}

/**
 * The inverse, for the write side (lib/money/moneyInput). Rounded, because
 * 12.34 * 100 is 1233.9999999999998 in IEEE 754 and a float must never reach
 * the wire as money.
 *
 * The ×100 factor lives here, once, so the read and write sides cannot drift:
 * every currency the app supports has an exponent-2 minor unit in storage
 * (see the API's common/money/currency-units.ts). NGN rendering as a whole
 * number is a *display* choice made in lib/constants/regions, not a different
 * storage exponent.
 */
export function majorToMinor(major: number): number {
  return Math.round(major * 100);
}

/**
 * The largest major-unit amount whose minor value is still an exact integer:
 * Number.MAX_SAFE_INTEGER / 100, floored. Past this, `majorToMinor` returns a
 * number that cannot round-trip — 1e22 serialises into a request body as
 * "1e+22" and means nothing to the API.
 */
export const MAX_SAFE_MAJOR = Math.floor(Number.MAX_SAFE_INTEGER / 100);

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
    .map(([currency, minor]) => fmt(minorToMajor(minor), currency))
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
