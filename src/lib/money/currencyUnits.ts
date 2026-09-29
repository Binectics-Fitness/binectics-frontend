/**
 * ISO 4217 minor-unit exponents: how many minor units make one major unit.
 *
 * Money travels as an integer count of the currency's smallest unit (kobo,
 * cents, fils). Turning that into a human amount needs the currency's
 * exponent, and it is NOT always 2: JPY, RWF and XOF have none, KWD and BHD
 * have three. A fixed `/ 100` shows ¥1,000 as ¥10 and a 1.000 KWD fee as
 * 10 KWD.
 *
 * This mirrors the API's `common/money/currency-units.ts`, the one exponent
 * table the platform seeds its `currencies` collection from. GET /currencies
 * carries `minor_unit` for every enabled currency; this table is what formats
 * any other code (a historical record in a currency that has since been
 * turned off, or one the platform never enabled). Keep the two in step.
 *
 * Exponent is a storage fact, not a display choice. NGN renders as whole
 * naira (see `displayFractionDigits`) but still stores kobo.
 */

/** Currencies whose smallest unit IS the major unit. */
const ZERO_EXPONENT = new Set([
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "ISK",
  "JPY",
  "KMF",
  "KRW",
  "PYG",
  "RWF",
  "UGX",
  "UYI",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
]);

/** Currencies subdivided into 1000 rather than 100. */
const THREE_EXPONENT = new Set(["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]);

/** ISO 4217 minor-unit exponent for `currency` (2 unless listed above). */
export function currencyExponent(currency: string): number {
  const code = (currency ?? "").toUpperCase();
  if (ZERO_EXPONENT.has(code)) return 0;
  if (THREE_EXPONENT.has(code)) return 3;
  return 2;
}

/** Minor units per major unit: 100 for USD, 1 for JPY, 1000 for KWD. */
export function minorPerMajor(currency: string): number {
  return 10 ** currencyExponent(currency);
}

/**
 * Currencies with a minor unit that people never quote in practice, so the
 * app renders them as whole amounts ("₦45,000", not "₦45,000.00"). Their
 * exponent is still 2 and their storage scale is still 100; this only
 * decides how many decimals a price field accepts and a label shows.
 */
const WHOLE_UNIT_DISPLAY = new Set(["NGN", "KES", "INR"]);

/**
 * The most decimals a currency ever displays: its exponent, or 0 for the
 * whole-unit display currencies above.
 */
export function currencyFractionDigits(currency: string): number {
  const code = (currency ?? "").toUpperCase();
  if (WHOLE_UNIT_DISPLAY.has(code)) return 0;
  return currencyExponent(code);
}

/**
 * Decimals to render for one amount: none for a whole amount ("$1,200"),
 * the currency's full precision for a fractional one ("$12.50"). Decided per
 * currency and per amount, never by magnitude, so a table stays consistent.
 */
export function displayFractionDigits(amount: number, currency: string): number {
  return Number.isInteger(amount) ? 0 : currencyFractionDigits(currency);
}
