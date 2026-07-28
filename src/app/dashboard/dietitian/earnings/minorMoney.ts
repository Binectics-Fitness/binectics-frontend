/**
 * Minor-unit money helpers for the earnings page. The transactions ledger and
 * the session-earnings estimate both report amounts in the currency's minor
 * unit (kobo/cents); the org formatters (fmtMoney) take MAJOR units.
 * Pure functions — unit-tested in src/tests/unit/dietitian-minor-money.test.ts.
 */

/** Convention across the app: minor / 100 (see billing + admin payments pages). */
export function minorToMajor(minor: number): number {
  return minor / 100;
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
