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
 *   - the minor↔major conversion is imported from minorMoney
 *     (minorToMajor / majorToMinor), so the ×100 factor exists once for
 *     both the read and the write side.
 *   - how many decimals a currency admits comes from
 *     currencyFractionDigits() in lib/constants/regions — NGN/KES/JPY/…
 *     are whole-unit, so their inputs refuse a decimal point outright —
 *     and how many to *render* for a given amount from
 *     displayFractionDigits(), the same rule formatCurrency() applies.
 *   - the symbol, its spacing and its position (prefix in en-US, suffix in
 *     de-DE) come from the same narrowSymbol formatToParts() call
 *     formatCurrency() makes, so a field reads exactly the same as the
 *     value will read once saved. money-input.test.ts pins that agreement
 *     by asserting formatMinorForInput() === formatCurrency() over a table
 *     of amounts; if formatCurrency's rules move, that test fails.
 */

import {
  currencyFractionDigits,
  displayFractionDigits,
} from "@/lib/constants/regions";
import {
  majorToMinor,
  minorToMajor,
  MAX_SAFE_MAJOR,
} from "@/lib/money/minorMoney";

export interface MoneyInputOptions {
  /** ISO 4217 code — decides both the symbol and whether decimals are allowed. */
  currency: string;
  /** Grouping/decimal style. Defaults to en-US ("1,234.56"). */
  locale?: string;
  /** Prefix the currency symbol. Default true. */
  showSymbol?: boolean;
}

const DEFAULT_LOCALE = "en-US";

const NUMERIC_PART_TYPES = new Set([
  "integer",
  "group",
  "decimal",
  "fraction",
  "minusSign",
  "plusSign",
]);

/**
 * The literal text Intl wraps a currency amount in, split by side: en-US puts
 * "₦" straight against the digits and "R " with a space, de-DE puts " €" after
 * them. Taking both sides verbatim from formatToParts is what makes the field
 * agree with formatCurrency character for character — inventing a `${symbol} `
 * prefix is what produced "₦ 60,000" against a rendered "₦60,000".
 */
function currencyAffixes(
  currency: string,
  locale: string,
): { prefix: string; suffix: string } {
  const code = currency.toUpperCase();
  for (const currencyDisplay of ["narrowSymbol", "symbol"] as const) {
    try {
      const parts = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        currencyDisplay,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).formatToParts(1);
      const first = parts.findIndex((p) => NUMERIC_PART_TYPES.has(p.type));
      if (first === -1) break;
      let last = parts.length - 1;
      while (last >= 0 && !NUMERIC_PART_TYPES.has(parts[last].type)) last--;
      const prefix = parts
        .slice(0, first)
        .map((p) => p.value)
        .join("");
      const suffix = parts
        .slice(last + 1)
        .map((p) => p.value)
        .join("");
      if (prefix || suffix) return { prefix, suffix };
    } catch {
      // Unknown code for this display mode — fall through to the next.
    }
  }
  // No symbol at all for this code: prefix the ISO code, as Intl itself does.
  return { prefix: `${code} `, suffix: "" };
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
 * How many integer digits a field will hold. 13 is not arbitrary: it is the
 * largest width whose minor value (13 digits + 2 fraction digits) still fits
 * Number.MAX_SAFE_INTEGER, so no amount the field accepts can lose precision
 * on the way to `priceMinor`. Without a cap, a 17-digit entry rewrote the
 * digit the user had just typed (…111 became …112) and a 20-digit one
 * serialised into the request body as 1.1111111111111111e+21.
 */
export const MAX_INTEGER_DIGITS = 13;

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

  // Only a *leading* minus is a sign. A minus anywhere counted as one turned
  // the mid-edit "1-2" into -12.
  const negative = raw.trimStart().startsWith("-");
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
      } else if (intPart === "0") {
        // A leading zero is a placeholder, not a digit: "0" then "6" is 6,
        // and a pasted run of zeros must not consume the width cap.
        intPart = ch;
      } else if (intPart.length < MAX_INTEGER_DIGITS) {
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
  const { prefix, suffix } =
    opts.showSymbol === false
      ? { prefix: "", suffix: "" }
      : currencyAffixes(opts.currency, locale);

  return [
    negative ? "-" : "",
    prefix,
    grouped,
    hasDecimal ? `${seps.decimal}${fracPart ?? ""}` : "",
    suffix,
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
  if (Math.abs(value) > MAX_SAFE_MAJOR) return null;
  return negative ? -value : value;
}

/**
 * The field's value in minor units, ready for `priceMinor` / `amount_minor`.
 *
 * Null rather than an approximation when the amount cannot be represented
 * exactly: a non-integer minor value, or one past MAX_SAFE_INTEGER, is a
 * corrupt amount, and the callers already treat null as "no price" and refuse
 * to save a non-empty field that parses to null.
 */
export function parseMoneyMinor(
  raw: string,
  opts: MoneyInputOptions,
): number | null {
  const major = parseMoneyMajor(raw, opts);
  if (major === null) return null;
  const minor = majorToMinor(major);
  return Number.isSafeInteger(minor) ? minor : null;
}

/** True when the field holds a negative amount — never a valid price. */
export function isNegativeMoneyInput(
  raw: string,
  opts: MoneyInputOptions,
): boolean {
  const major = parseMoneyMajor(raw, opts);
  return major !== null && major < 0;
}

/**
 * minor units → the display string for that amount (prefill path).
 *
 * Uses displayFractionDigits, so the field reads exactly as formatCurrency
 * renders the same amount: whole amounts lose their ".00", and a whole-unit
 * currency shows no decimals at all (₦1.99 reads "₦2", as it does everywhere
 * else in the app).
 *
 * That last case means the string this returns is LOSSY for a whole-unit
 * currency holding sub-unit precision — 199 kobo renders "₦2". Callers must
 * therefore keep the minor value they were given and send *that* back,
 * re-parsing the field only when the user has actually edited it. Round-
 * tripping this string through parseMoneyMinor turns 199 into 200.
 */
export function formatMinorForInput(
  minor: number | null | undefined,
  opts: MoneyInputOptions,
): string {
  if (minor === null || minor === undefined) return "";
  const major = minorToMajor(minor);
  const digits = displayFractionDigits(major, opts.currency);
  return formatMoneyInput(major.toFixed(digits), opts);
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
 * *significant* character in the direction of travel.
 *
 * Significant, not merely a digit: the decimal point is a character the user
 * can see and aim at, so deleting it must delete it. Scanning for a digit
 * instead skipped straight over the point and ate the digit beyond it —
 * Backspace on "$1,234.56" just right of the "." gave "$123.56", losing the
 * 4 and keeping the point. Here the point is significant, so the caller's
 * guard returns null, the browser's own delete removes it, and the fraction
 * merges into the integer part ("$1,234.56" → "$123,456") — which is what
 * deleting a decimal point means.
 *
 * Returns the string to reformat plus the significant-count the caret
 * should land on, or null when the default behaviour is already right
 * (the neighbouring character is significant) or there is nothing to delete.
 */
export function deleteAcrossSeparator(
  value: string,
  caret: number,
  direction: "backward" | "forward",
  opts: MoneyInputOptions,
): { next: string; significant: number } | null {
  const seps = separatorsFor(opts.locale ?? DEFAULT_LOCALE);
  const fractionDigits = currencyFractionDigits(opts.currency);
  const significant = (ch: string | undefined): boolean =>
    ch !== undefined && isSignificant(ch, seps, fractionDigits);

  if (direction === "backward") {
    if (caret <= 0 || significant(value[caret - 1])) return null;
    let i = caret - 1;
    while (i >= 0 && !significant(value[i])) i--;
    if (i < 0) return null;
    return {
      next: value.slice(0, i) + value.slice(i + 1),
      significant: significantCount(value, i, opts),
    };
  }

  if (caret >= value.length || significant(value[caret])) return null;
  let i = caret;
  while (i < value.length && !significant(value[i])) i++;
  if (i >= value.length) return null;
  return {
    next: value.slice(0, i) + value.slice(i + 1),
    significant: significantCount(value, i, opts),
  };
}
