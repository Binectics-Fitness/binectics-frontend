import { describe, it, expect } from "vitest";
import {
  caretAfterSignificant,
  deleteAcrossSeparator,
  extractNumeric,
  formatMinorForInput,
  formatMoneyInput,
  isNegativeMoneyInput,
  parseMoneyMajor,
  parseMoneyMinor,
  significantCount,
  MAX_INTEGER_DIGITS,
} from "@/lib/money/moneyInput";
import { minorToMajor } from "@/lib/money/minorMoney";
import { formatCurrency } from "@/utils/format";

const NGN = { currency: "NGN" }; // whole-unit currency (no decimals)
const USD = { currency: "USD" }; // two-decimal currency

describe("currency symbols", () => {
  it("resolves the narrow symbol for supported currencies, case-insensitively", () => {
    expect(formatMoneyInput("45", NGN)).toBe("₦45");
    expect(formatMoneyInput("45", { currency: "usd" })).toBe("$45");
  });

  it("uses whatever Intl does for a code it has no symbol for", () => {
    expect(formatMoneyInput("45", { currency: "XBT" })).toBe(
      formatCurrency(45, "XBT"),
    );
  });

  it("does not throw on a malformed currency code", () => {
    // Intl rejects anything that is not three letters. The field degrades to
    // the code rather than taking the page down with a RangeError.
    expect(formatMoneyInput("45", { currency: "DOLLAR" })).toBe("DOLLAR 45");
  });
});

describe("extractNumeric", () => {
  it("keeps only digits for a whole-unit currency", () => {
    expect(extractNumeric("₦120,000", NGN)).toEqual({
      digits: "120000",
      negative: false,
    });
  });

  it("drops the decimal point for whole-unit currencies", () => {
    expect(extractNumeric("120.50", NGN).digits).toBe("12050");
  });

  it("keeps one decimal point for two-decimal currencies", () => {
    expect(extractNumeric("$1,234.56", USD).digits).toBe("1234.56");
  });

  it("ignores a second decimal point and surplus fraction digits", () => {
    expect(extractNumeric("1.2.3", USD).digits).toBe("1.23");
    expect(extractNumeric("1.23456", USD).digits).toBe("1.23");
  });

  it("treats only a LEADING minus as a sign", () => {
    expect(extractNumeric("-500", NGN)).toEqual({
      digits: "500",
      negative: true,
    });
    expect(extractNumeric("  -500", NGN).negative).toBe(true);
    // A minus mid-string is a stray character, not a sign: mid-edit "1-2" is
    // twelve, not minus twelve.
    expect(extractNumeric("1-2", NGN)).toEqual({
      digits: "12",
      negative: false,
    });
    expect(extractNumeric("500-", NGN).negative).toBe(false);
  });

  it("caps the integer width instead of losing precision", () => {
    const capped = "1".repeat(MAX_INTEGER_DIGITS);
    expect(extractNumeric("1".repeat(20), NGN).digits).toBe(capped);
    // Surplus digits are refused, never allowed to rewrite the ones already
    // typed: a 17-digit entry used to render …112 for …111.
    expect(extractNumeric("1".repeat(17), NGN).digits).toBe(capped);
    // The cap counts digits, not characters, so a pasted run of leading zeros
    // does not eat the whole allowance.
    expect(extractNumeric(`${"0".repeat(20)}600`, NGN).digits).toBe("600");
    // Fraction digits sit outside the cap.
    expect(extractNumeric(`${capped}.99`, USD).digits).toBe(`${capped}.99`);
  });
});

describe("formatMoneyInput", () => {
  it("leaves empty input empty — never 0 or ₦0", () => {
    expect(formatMoneyInput("", NGN)).toBe("");
    expect(formatMoneyInput("   ", NGN)).toBe("");
    expect(formatMoneyInput("₦", NGN)).toBe("");
  });

  it("formats a zero the user actually typed", () => {
    expect(formatMoneyInput("0", NGN)).toBe("₦0");
  });

  it("groups thousands as the user types", () => {
    expect(formatMoneyInput("6", NGN)).toBe("₦6");
    expect(formatMoneyInput("60", NGN)).toBe("₦60");
    expect(formatMoneyInput("600", NGN)).toBe("₦600");
    expect(formatMoneyInput("6000", NGN)).toBe("₦6,000");
    expect(formatMoneyInput("60000", NGN)).toBe("₦60,000");
    expect(formatMoneyInput("1234567", NGN)).toBe("₦1,234,567");
  });

  it("re-formats a pasted, already-formatted value", () => {
    expect(formatMoneyInput("₦120,000", NGN)).toBe("₦120,000");
    expect(formatMoneyInput("NGN 120 000", NGN)).toBe("₦120,000");
    expect(formatMoneyInput("$1,234.56", USD)).toBe("$1,234.56");
  });

  it("keeps decimals for currencies that have them", () => {
    expect(formatMoneyInput("12.5", USD)).toBe("$12.5");
    expect(formatMoneyInput("12.", USD)).toBe("$12.");
    expect(formatMoneyInput("1234.05", USD)).toBe("$1,234.05");
  });

  it("refuses a decimal point for whole-unit currencies", () => {
    expect(formatMoneyInput("12.", NGN)).toBe("₦12");
    expect(formatMoneyInput("12.5", NGN)).toBe("₦125");
  });

  it("drops leading zeros", () => {
    expect(formatMoneyInput("000600", NGN)).toBe("₦600");
  });

  it("renders a negative amount with a leading minus", () => {
    expect(formatMoneyInput("-500", NGN)).toBe("-₦500");
  });

  it("returns nothing for non-numeric text", () => {
    expect(formatMoneyInput("abc", NGN)).toBe("");
    expect(formatMoneyInput("free!", NGN)).toBe("");
  });

  it("omits the symbol when asked", () => {
    expect(formatMoneyInput("60000", { ...NGN, showSymbol: false })).toBe(
      "60,000",
    );
  });

  it("spaces the symbol exactly as Intl does, per currency", () => {
    // en-US sets "₦" and "$" straight against the digits but spaces "R"
    // and code-only currencies. Taking the spacing from Intl rather than
    // hardcoding "symbol + space" is what keeps the field identical to the
    // rendered value.
    expect(formatMoneyInput("45", { currency: "ZAR" })).toBe("R\u00A045");
    expect(formatMoneyInput("45", { currency: "AED" })).toBe("AED\u00A045");
    expect(formatMoneyInput("45", { currency: "GBP" })).toBe("£45");
  });

  it("honours a locale's own grouping, decimal marks and symbol position", () => {
    // de-DE: "." groups, "," is the decimal mark — and a typed "." must stay
    // grouping there, so "1.234" is one thousand two hundred, not 1.234.
    // The symbol is a suffix in de-DE, and the field follows.
    expect(formatMoneyInput("1234.56", { currency: "EUR", locale: "de-DE" }))
      .toBe("123.456\u00A0€");
    expect(formatMoneyInput("1234,56", { currency: "EUR", locale: "de-DE" }))
      .toBe("1.234,56\u00A0€");
  });

  it("refuses more integer digits than can survive the trip to minor units", () => {
    const typed = "1".repeat(MAX_INTEGER_DIGITS);
    // The 14th keystroke changes nothing — it does not silently rewrite the
    // digits already on screen.
    expect(formatMoneyInput(`${typed}1`, NGN)).toBe(formatMoneyInput(typed, NGN));
    expect(formatMoneyInput("1".repeat(20), NGN)).toBe("₦1,111,111,111,111");
  });
});

describe("parseMoneyMajor / parseMoneyMinor", () => {
  it("returns null for empty input (not set ≠ free)", () => {
    expect(parseMoneyMajor("", NGN)).toBeNull();
    expect(parseMoneyMinor("", NGN)).toBeNull();
    expect(parseMoneyMinor("₦", NGN)).toBeNull();
  });

  it("returns null for non-numeric input", () => {
    expect(parseMoneyMajor("abc", NGN)).toBeNull();
    expect(parseMoneyMinor("N/A", NGN)).toBeNull();
  });

  it("parses zero as zero, not null", () => {
    expect(parseMoneyMajor("₦0", NGN)).toBe(0);
    expect(parseMoneyMinor("₦0", NGN)).toBe(0);
  });

  it("converts to minor units with the app-wide ×100 convention", () => {
    expect(parseMoneyMinor("₦120,000", NGN)).toBe(12_000_000);
    expect(parseMoneyMinor("$1,234.56", USD)).toBe(123_456);
  });

  it("rounds instead of trusting float arithmetic", () => {
    // 12.34 * 100 is 1233.9999999999998 in IEEE 754.
    expect(parseMoneyMinor("$12.34", USD)).toBe(1234);
  });

  it("keeps the sign of a leading minus", () => {
    expect(parseMoneyMajor("-500", NGN)).toBe(-500);
    expect(parseMoneyMinor("-500", NGN)).toBe(-50_000);
    expect(isNegativeMoneyInput("-500", NGN)).toBe(true);
    expect(isNegativeMoneyInput("500", NGN)).toBe(false);
    expect(isNegativeMoneyInput("", NGN)).toBe(false);
    // …and does not invent one from a stray minus mid-string.
    expect(parseMoneyMinor("1-2", NGN)).toBe(1200);
    expect(isNegativeMoneyInput("1-2", NGN)).toBe(false);
  });

  it("never yields a minor value the wire cannot carry", () => {
    // Whatever is thrown at the field, the answer is either null or an exact
    // integer. A float like 1.1111111111111111e+21 must never reach a request
    // body as `priceMinor`.
    const pathological = [
      "9".repeat(30),
      `${"9".repeat(30)}.99`,
      "1".repeat(20),
      `${Number.MAX_SAFE_INTEGER}`,
      "1e21",
      `${"1".repeat(18)}.99`,
    ];
    for (const raw of pathological) {
      for (const opts of [NGN, USD]) {
        const minor = parseMoneyMinor(raw, opts);
        expect(minor === null || Number.isSafeInteger(minor)).toBe(true);
      }
    }
  });
});

describe("formatMinorForInput", () => {
  it("renders a stored minor amount for editing", () => {
    expect(formatMinorForInput(12_000_000, NGN)).toBe("₦120,000");
    expect(formatMinorForInput(123_456, USD)).toBe("$1,234.56");
    // A whole amount drops its ".00", exactly as the value renders elsewhere.
    expect(formatMinorForInput(1_200, USD)).toBe("$12");
    expect(formatMinorForInput(1_250, USD)).toBe("$12.50");
  });

  it("renders nothing for a missing amount", () => {
    expect(formatMinorForInput(null, NGN)).toBe("");
    expect(formatMinorForInput(undefined, NGN)).toBe("");
  });

  it("reads exactly as formatCurrency renders the same amount", () => {
    // The PR's whole point: the field and the saved value must not disagree.
    // If formatCurrency's rules move, this fails.
    const cases: Array<[number, string]> = [
      [6_000_000, "NGN"],
      [199, "NGN"],
      [12_000_050, "NGN"],
      [123_456, "USD"],
      [1_200, "USD"],
      [1_250, "USD"],
      [99_999, "GBP"],
      [4_500, "ZAR"],
      [4_500, "AED"],
      [-50_000, "NGN"],
    ];
    for (const [minor, currency] of cases) {
      expect(formatMinorForInput(minor, { currency })).toBe(
        formatCurrency(minorToMajor(minor), currency),
      );
    }
  });

  it("is LOSSY for a whole-unit currency holding sub-unit precision", () => {
    // Deliberate and documented: ₦1.99 reads "₦2" in the field just as it does
    // everywhere else. The consequence is that callers must keep the minor
    // value they were given rather than re-parsing this string on save —
    // ConsultationAvailabilityManager does, and its test proves it.
    expect(formatMinorForInput(199, NGN)).toBe("₦2");
    expect(parseMoneyMinor(formatMinorForInput(199, NGN), NGN)).toBe(200);
  });
});

describe("caret bookkeeping", () => {
  it("counts digits left of the caret, ignoring symbol and grouping", () => {
    //  ₦ 1 2 , 3 4 5
    //  0123456
    expect(significantCount("₦12,345", 0, NGN)).toBe(0);
    expect(significantCount("₦12,345", 1, NGN)).toBe(0);
    expect(significantCount("₦12,345", 3, NGN)).toBe(2);
    expect(significantCount("₦12,345", 7, NGN)).toBe(5);
  });

  it("counts the decimal point as significant when the currency has one", () => {
    expect(significantCount("$12.34", 6, USD)).toBe(5);
    // NGN has no decimals, so a stray "." is not a tracked position.
    expect(significantCount("₦12.34", 6, NGN)).toBe(4);
  });

  it("re-derives the caret after the reformat inserts a separator", () => {
    // "₦1234" with the caret after "1234", one more digit typed → "₦12,345"
    const formatted = formatMoneyInput("12345", NGN);
    expect(formatted).toBe("₦12,345");
    expect(caretAfterSignificant(formatted, 5, NGN)).toBe(7);
  });

  it("keeps a mid-string caret put rather than jumping to the end", () => {
    // User has "₦1,234" and types "9" between 1 and 2 → raw "₦19,234".
    const raw = "₦19,234";
    const caret = 3; // just after the "9"
    const significant = significantCount(raw, caret, NGN);
    expect(significant).toBe(2);
    const formatted = formatMoneyInput(raw, NGN);
    expect(formatted).toBe("₦19,234");
    expect(caretAfterSignificant(formatted, significant, NGN)).toBe(3);
  });

  it("puts the caret before the first digit for a zero count", () => {
    expect(caretAfterSignificant("₦12,345", 0, NGN)).toBe(1);
    expect(caretAfterSignificant("", 0, NGN)).toBe(0);
  });

  it("clamps past-the-end counts to the string length", () => {
    expect(caretAfterSignificant("₦12", 9, NGN)).toBe(3);
  });
});

describe("deleteAcrossSeparator", () => {
  //  ₦ 1 , 2 3 4
  //  0 1 2 3 4 5
  it("does nothing when the neighbour is already a digit", () => {
    expect(deleteAcrossSeparator("₦1,234", 6, "backward", NGN)).toBeNull();
    expect(deleteAcrossSeparator("₦1,234", 3, "forward", NGN)).toBeNull();
  });

  it("backspacing over a grouping separator removes the digit before it", () => {
    // "₦1,234" with the caret between "," and "2".
    const step = deleteAcrossSeparator("₦1,234", 3, "backward", NGN);
    expect(step).not.toBeNull();
    expect(formatMoneyInput(step!.next, NGN)).toBe("₦234");
    expect(step!.significant).toBe(0);
  });

  it("backspacing into the symbol deletes nothing", () => {
    expect(deleteAcrossSeparator("₦234", 1, "backward", NGN)).toBeNull();
    expect(deleteAcrossSeparator("₦234", 0, "backward", NGN)).toBeNull();
  });

  it("forward-deleting a separator removes the digit after it", () => {
    // "₦1,234" with the caret between "1" and ",".
    const step = deleteAcrossSeparator("₦1,234", 2, "forward", NGN);
    expect(step).not.toBeNull();
    expect(formatMoneyInput(step!.next, NGN)).toBe("₦134");
    expect(step!.significant).toBe(1);
  });

  it("forward-deleting at the end of the string does nothing", () => {
    expect(deleteAcrossSeparator("₦234", 4, "forward", NGN)).toBeNull();
  });

  it("still skips the grouping separator for a currency WITH decimals", () => {
    //  $ 1 , 2 3 4 . 5 6
    //  0 1 2 3 4 5 6 7 8
    const step = deleteAcrossSeparator("$1,234.56", 3, "backward", USD);
    expect(step).not.toBeNull();
    expect(formatMoneyInput(step!.next, USD)).toBe("$234.56");
    expect(step!.significant).toBe(0);
  });

  it("leaves the decimal point to the browser instead of eating a digit", () => {
    // The decimal point is significant, so the caret's neighbour IS the
    // character the user aimed at and the default delete is already right.
    // Scanning for a digit instead skipped the point and ate the "4":
    // Backspace here used to yield "$123.56".
    expect(deleteAcrossSeparator("$1,234.56", 7, "backward", USD)).toBeNull();
    expect(deleteAcrossSeparator("$1,234.56", 6, "forward", USD)).toBeNull();
    // Which leaves the fraction merged into the integer part — the meaning of
    // deleting a decimal point. (End to end in the component test.)
    expect(formatMoneyInput("$1,23456", USD)).toBe("$123,456");
  });

  it("skips a trailing symbol when the locale puts it after the digits", () => {
    const de = { currency: "EUR", locale: "de-DE" };
    //  1 . 2 3 4 , 5 0 ␠ €   (␠ = the NBSP Intl inserts)
    //  0 1 2 3 4 5 6 7 8 9
    const step = deleteAcrossSeparator("1.234,50\u00A0€", 10, "backward", de);
    expect(step).not.toBeNull();
    expect(formatMoneyInput(step!.next, de)).toBe("1.234,5\u00A0€");
  });
});
