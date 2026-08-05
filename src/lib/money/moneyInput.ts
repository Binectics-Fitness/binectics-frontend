/**
 * Money *input* helpers — the write-side counterpart to minorMoney.ts
 * (which is read-side: rendering amounts the API already returned).
 *
 * These format money as the user types (grouping separators + currency
 * symbol) while keeping the underlying value a clean number, and parse
 * whatever ends up in the field — including a pasted, already-formatted
 * "₦120,000" — back into the minor units the API stores (`priceMinor`,
 * `amount_minor`).
 *
 * Everything here is pure and unit-tested in
 * src/tests/unit/money-input.test.ts. Caret bookkeeping lives in
 * <MoneyInput>, built on `significantCount` + `caretAfterSignificant`.
 *
 * Conventions inherited rather than reinvented:
 *   - minor = major * 100 app-wide (see minorMoney.minorToMajor).
 *   - how many decimals a currency admits comes from
 *     currencyFractionDigits() in lib/constants/regions — NGN/KES/JPY/…
 *     are whole-unit, so their inputs refuse a decimal point outright.
 *   - the symbol and grouping style come from Intl via the same
 *     narrowSymbol path formatCurrency() uses, so a field reads the same
 *     as the value will read once saved.
 */

import { currencyFractionDigits } from "@/lib/constants/regions";

export interface MoneyInputOptions {
  /** ISO 4217 code — decides both the symbol and whether decimals are allowed. */
  currency: string;
  /** Grouping/decimal style. Defaults to en-US ("1,234.56"). */
  locale?: string;
  /** Prefix the currency symbol. Default true. */
  showSymbol?: boolean;
}

const DEFAULT_LOCALE = "en-US";

/**
 * The currency's narrow symbol ("₦", "$", "R"), or the ISO code when Intl
 * has no symbol for it.
 */
export function currencySymbol(
  currency: string,
  locale: string = DEFAULT_LOCALE,
): string {
  const code = currency.toUpperCase();
  for (const currencyDisplay of ["narrowSymbol", "symbol"] as const) {
    try {
      const parts = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).formatToParts(0);
      const symbol = parts.find((p) => p.type === "currency")?.value;
      if (symbol) return symbol;
    } catch {
      // Unknown code for this display mode — fall through to the next.
    }
  }
  return code;
}

interface Separators {
  group: string;
  decimal: string;
  /** Characters that count as "the decimal point" for this locale. */
  decimalChars: string[];
}

/**
 * The locale's grouping and decimal characters ("," and "." for en-US,
 * "." and "," for de-DE, NBSP and "," for sv-SE).
 *
 * `decimalChars` additionally accepts a plain "." when the locale doesn't
 * already use it for grouping — someone typing "12.50" into an sv-SE field
 * means twelve fifty. In de-DE, where "." *is* the grouping mark, it stays
 * grouping; treating it as a decimal there would turn a pasted "1.234" into
 * one and a bit.
 */
function separatorsFor(locale: string): Separators {
  const parts = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
  }).formatToParts(12345.6);
  const group = parts.find((p) => p.type === "group")?.value ?? ",";
  const decimal = parts.find((p) => p.type === "decimal")?.value ?? ".";
  const decimalChars = [decimal];
  if (decimal !== "." && group !== ".") decimalChars.push(".");
  return { group, decimal, decimalChars };
}

const isDigit = (ch: string | undefined): boolean =>
  ch !== undefined && ch >= "0" && ch <= "9";

/**
 * Characters whose position the caret is measured against: digits and the
 * decimal point. Grouping separators, the currency symbol and whitespace
 * are excluded on purpose — the reformat regenerates them, so counting them
 * is what makes a caret drift.
 */
function isSignificant(
  ch: string,
  seps: Separators,
  fractionDigits: number,
): boolean {
  if (isDigit(ch)) return true;
  return fractionDigits > 0 && seps.decimalChars.includes(ch);
}

/**
 * Reduce arbitrary text to its numeric core: digits, at most one decimal
 * separator (only when the currency has decimals), and a leading minus.
 *
 * Deliberately tolerant, because this is also the paste path: "₦120,000",
 * "NGN 120 000" and "120,000.00" all collapse to the same digits.
 */
export function extractNumeric(
  raw: string,
  opts: MoneyInputOptions,
): { digits: string; negative: boolean } {
  const fractionDigits = currencyFractionDigits(opts.currency);
  const seps = separatorsFor(opts.locale ?? DEFAULT_LOCALE);

  const negative = raw.includes("-");
  let intPart = "";
  let fracPart = "";
  let seenDecimal = false;

  for (const ch of raw) {
    if (isDigit(ch)) {
      if (seenDecimal) {
        // Surplus fraction digits are dropped, not rounded — the user is
        // still typing, and rounding under the caret is worse than
        // refusing the keystroke.
        if (fracPart.length < fractionDigits) fracPart += ch;
      } else {
        intPart += ch;
      }
      continue;
    }
    if (
      fractionDigits > 0 &&
      !seenDecimal &&
      seps.decimalChars.includes(ch)
    ) {
      seenDecimal = true;
    }
    // Everything else (symbols, spaces, letters, grouping marks) is noise.
  }

  return { digits: seenDecimal ? `${intPart}.${fracPart}` : intPart, negative };
}

/**
 * Format for display in the field. Empty input stays empty — never "0" or
 * "₦0" — so the placeholder keeps showing and an untouched optional price
 * round-trips as "not set".
 *
 * A trailing decimal separator survives ("12." stays "$12.") so typing a
 * decimal point doesn't delete the character just pressed.
 */
export function formatMoneyInput(
  raw: string,
  opts: MoneyInputOptions,
): string {
  const locale = opts.locale ?? DEFAULT_LOCALE;
  const { digits, negative } = extractNumeric(raw, opts);
  if (digits === "" || digits === ".") return "";

  const [intPart, fracPart] = digits.split(".");
  const hasDecimal = digits.includes(".");
  // Number() rather than the raw string: a leading run of zeros is not money.
  const grouped = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(intPart || "0"));

  const seps = separatorsFor(locale);
  const symbol =
    opts.showSymbol === false ? "" : `${currencySymbol(opts.currency, locale)} `;

  return [
    negative ? "-" : "",
    symbol,
    grouped,
    hasDecimal ? `${seps.decimal}${fracPart ?? ""}` : "",
  ].join("");
}

/**
 * The field's value as a major-unit number, or null when the field holds no
 * number at all — empty, or pure noise like "abc". Null means "not set",
 * which is distinct from 0; callers must not coalesce it.
 */
export function parseMoneyMajor(
  raw: string,
  opts: MoneyInputOptions,
): number | null {
  const { digits, negative } = extractNumeric(raw, opts);
  if (digits === "" || digits === ".") return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

/**
 * The field's value in minor units, ready for `priceMinor` / `amount_minor`.
 * Rounded, because 12.34 * 100 is 1233.9999999999998 in IEEE 754 and a
 * float must never reach the wire as money.
 */
export function parseMoneyMinor(
  raw: string,
  opts: MoneyInputOptions,
): number | null {
  const major = parseMoneyMajor(raw, opts);
  if (major === null) return null;
  return Math.round(major * 100);
}

/** True when the field holds a negative amount — never a valid price. */
export function isNegativeMoneyInput(
  raw: string,
  opts: MoneyInputOptions,
): boolean {
  const major = parseMoneyMajor(raw, opts);
  return major !== null && major < 0;
}

/** minor units → the display string for that amount (prefill path). */
export function formatMinorForInput(
  minor: number | null | undefined,
  opts: MoneyInputOptions,
): string {
  if (minor === null || minor === undefined) return "";
  const fractionDigits = currencyFractionDigits(opts.currency);
  const major = minor / 100;
  return formatMoneyInput(major.toFixed(fractionDigits), opts);
}

/* ── Caret bookkeeping ────────────────────────────────────────
 * Formatting rewrites the string under the caret, so a naive controlled
 * input sends the caret to the end on every keystroke. The fix: don't
 * try to preserve a character index, preserve "how many significant
 * characters are to my left". Count before formatting, re-derive after.
 */

/** Digits and decimal points in `value` strictly left of `caret`. */
export function significantCount(
  value: string,
  caret: number,
  opts: MoneyInputOptions,
): number {
  const seps = separatorsFor(opts.locale ?? DEFAULT_LOCALE);
  const fractionDigits = currencyFractionDigits(opts.currency);
  let count = 0;
  for (let i = 0; i < Math.min(caret, value.length); i++) {
    if (isSignificant(value[i], seps, fractionDigits)) count++;
  }
  return count;
}

/**
 * The index in `formatted` just after its `count`-th significant character
 * — where the caret belongs once the reformat is applied. Grouping marks
 * and the symbol are skipped, which is what stops the caret drifting by
 * however many separators the reformat inserted.
 */
export function caretAfterSignificant(
  formatted: string,
  count: number,
  opts: MoneyInputOptions,
): number {
  const seps = separatorsFor(opts.locale ?? DEFAULT_LOCALE);
  const fractionDigits = currencyFractionDigits(opts.currency);
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (!isSignificant(formatted[i], seps, fractionDigits)) continue;
    // count === 0 means "left of every digit", i.e. just before this one.
    if (count <= 0) return i;
    seen++;
    if (seen === count) return i + 1;
  }
  return formatted.length;
}

/**
 * Backspace/Delete landing on a grouping separator or the symbol would
 * otherwise look broken: the character is removed, the reformat puts it
 * straight back, nothing appears to happen. Instead remove the nearest
 * *digit* in the direction of travel.
 *
 * Returns the string to reformat plus the significant-count the caret
 * should land on, or null when the default behaviour is already right
 * (the neighbouring character is a digit) or there is nothing to delete.
 */
export function deleteAcrossSeparator(
  value: string,
  caret: number,
  direction: "backward" | "forward",
  opts: MoneyInputOptions,
): { next: string; significant: number } | null {
  if (direction === "backward") {
    if (caret <= 0 || isDigit(value[caret - 1])) return null;
    let i = caret - 1;
    while (i >= 0 && !isDigit(value[i])) i--;
    if (i < 0) return null;
    return {
      next: value.slice(0, i) + value.slice(i + 1),
      significant: significantCount(value, i, opts),
    };
  }

  if (caret >= value.length || isDigit(value[caret])) return null;
  let i = caret;
  while (i < value.length && !isDigit(value[i])) i++;
  if (i >= value.length) return null;
  return {
    next: value.slice(0, i) + value.slice(i + 1),
    significant: significantCount(value, i, opts),
  };
}
