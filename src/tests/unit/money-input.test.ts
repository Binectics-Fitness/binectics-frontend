import { describe, it, expect } from "vitest";
import {
  caretAfterSignificant,
  currencySymbol,
  deleteAcrossSeparator,
  extractNumeric,
  formatMinorForInput,
  formatMoneyInput,
  isNegativeMoneyInput,
  parseMoneyMajor,
  parseMoneyMinor,
  significantCount,
} from "@/lib/money/moneyInput";

const NGN = { currency: "NGN" }; // whole-unit currency (no decimals)
const USD = { currency: "USD" }; // two-decimal currency

describe("currencySymbol", () => {
  it("resolves the narrow symbol for supported currencies", () => {
    expect(currencySymbol("NGN")).toBe("₦");
    expect(currencySymbol("USD")).toBe("$");
    expect(currencySymbol("ngn")).toBe("₦");
  });

  it("falls back to the ISO code when there is no symbol", () => {
    expect(currencySymbol("XBT")).toBe("XBT");
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

  it("flags a minus anywhere in the input", () => {
    expect(extractNumeric("-500", NGN)).toEqual({
      digits: "500",
      negative: true,
    });
  });
});

describe("formatMoneyInput", () => {
  it("leaves empty input empty — never 0 or ₦0", () => {
    expect(formatMoneyInput("", NGN)).toBe("");
    expect(formatMoneyInput("   ", NGN)).toBe("");
    expect(formatMoneyInput("₦", NGN)).toBe("");
  });

  it("formats a zero the user actually typed", () => {
    expect(formatMoneyInput("0", NGN)).toBe("₦ 0");
  });

  it("groups thousands as the user types", () => {
    expect(formatMoneyInput("6", NGN)).toBe("₦ 6");
    expect(formatMoneyInput("60", NGN)).toBe("₦ 60");
    expect(formatMoneyInput("600", NGN)).toBe("₦ 600");
    expect(formatMoneyInput("6000", NGN)).toBe("₦ 6,000");
    expect(formatMoneyInput("60000", NGN)).toBe("₦ 60,000");
    expect(formatMoneyInput("1234567", NGN)).toBe("₦ 1,234,567");
  });

  it("re-formats a pasted, already-formatted value", () => {
    expect(formatMoneyInput("₦120,000", NGN)).toBe("₦ 120,000");
    expect(formatMoneyInput("NGN 120 000", NGN)).toBe("₦ 120,000");
    expect(formatMoneyInput("$1,234.56", USD)).toBe("$ 1,234.56");
  });

  it("keeps decimals for currencies that have them", () => {
    expect(formatMoneyInput("12.5", USD)).toBe("$ 12.5");
    expect(formatMoneyInput("12.", USD)).toBe("$ 12.");
    expect(formatMoneyInput("1234.05", USD)).toBe("$ 1,234.05");
  });

  it("refuses a decimal point for whole-unit currencies", () => {
    expect(formatMoneyInput("12.", NGN)).toBe("₦ 12");
    expect(formatMoneyInput("12.5", NGN)).toBe("₦ 125");
  });

  it("drops leading zeros", () => {
    expect(formatMoneyInput("000600", NGN)).toBe("₦ 600");
  });

  it("renders a negative amount with a leading minus", () => {
    expect(formatMoneyInput("-500", NGN)).toBe("-₦ 500");
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

  it("honours a locale's own grouping and decimal marks", () => {
    // de-DE: "." groups, "," is the decimal mark — and a typed "." must stay
    // grouping there, so "1.234" is one thousand two hundred, not 1.234.
    expect(formatMoneyInput("1234.56", { currency: "EUR", locale: "de-DE" }))
      .toBe("€ 123.456");
    expect(formatMoneyInput("1234,56", { currency: "EUR", locale: "de-DE" }))
      .toBe("€ 1.234,56");
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
    expect(parseMoneyMajor("₦ 0", NGN)).toBe(0);
    expect(parseMoneyMinor("₦ 0", NGN)).toBe(0);
  });

  it("converts to minor units with the app-wide ×100 convention", () => {
    expect(parseMoneyMinor("₦ 120,000", NGN)).toBe(12_000_000);
    expect(parseMoneyMinor("$ 1,234.56", USD)).toBe(123_456);
  });

  it("rounds instead of trusting float arithmetic", () => {
    // 12.34 * 100 is 1233.9999999999998 in IEEE 754.
    expect(parseMoneyMinor("$ 12.34", USD)).toBe(1234);
  });

  it("keeps the sign of a negative amount", () => {
    expect(parseMoneyMajor("-500", NGN)).toBe(-500);
    expect(parseMoneyMinor("-500", NGN)).toBe(-50_000);
    expect(isNegativeMoneyInput("-500", NGN)).toBe(true);
    expect(isNegativeMoneyInput("500", NGN)).toBe(false);
    expect(isNegativeMoneyInput("", NGN)).toBe(false);
  });
});

describe("formatMinorForInput", () => {
  it("renders a stored minor amount for editing", () => {
    expect(formatMinorForInput(12_000_000, NGN)).toBe("₦ 120,000");
    expect(formatMinorForInput(123_456, USD)).toBe("$ 1,234.56");
    expect(formatMinorForInput(1_200, USD)).toBe("$ 12.00");
  });

  it("renders nothing for a missing amount", () => {
    expect(formatMinorForInput(null, NGN)).toBe("");
    expect(formatMinorForInput(undefined, NGN)).toBe("");
  });
});

describe("caret bookkeeping", () => {
  it("counts digits left of the caret, ignoring symbol and grouping", () => {
    //  ₦ 1 2 , 3 4 5
    //  0123456789
    expect(significantCount("₦ 12,345", 0, NGN)).toBe(0);
    expect(significantCount("₦ 12,345", 2, NGN)).toBe(0);
    expect(significantCount("₦ 12,345", 4, NGN)).toBe(2);
    expect(significantCount("₦ 12,345", 8, NGN)).toBe(5);
  });

  it("counts the decimal point as significant when the currency has one", () => {
    expect(significantCount("$ 12.34", 7, USD)).toBe(5);
    // NGN has no decimals, so a stray "." is not a tracked position.
    expect(significantCount("₦ 12.34", 7, NGN)).toBe(4);
  });

  it("re-derives the caret after the reformat inserts a separator", () => {
    // "₦ 1234" with the caret after "1234", one more digit typed → "₦ 12,345"
    const formatted = formatMoneyInput("12345", NGN);
    expect(formatted).toBe("₦ 12,345");
    expect(caretAfterSignificant(formatted, 5, NGN)).toBe(8);
  });

  it("keeps a mid-string caret put rather than jumping to the end", () => {
    // User has "₦ 1,234" and types "9" between 1 and 2 → raw "₦ 19,234".
    // Four significant chars precede the caret in the raw string ("1", "9"
    // are 2 — the caret sits right after the typed 9).
    const raw = "₦ 19,234";
    const caret = 4; // just after the "9"
    const significant = significantCount(raw, caret, NGN);
    expect(significant).toBe(2);
    const formatted = formatMoneyInput(raw, NGN);
    expect(formatted).toBe("₦ 19,234");
    expect(caretAfterSignificant(formatted, significant, NGN)).toBe(4);
  });

  it("puts the caret before the first digit for a zero count", () => {
    expect(caretAfterSignificant("₦ 12,345", 0, NGN)).toBe(2);
    expect(caretAfterSignificant("", 0, NGN)).toBe(0);
  });

  it("clamps past-the-end counts to the string length", () => {
    expect(caretAfterSignificant("₦ 12", 9, NGN)).toBe(4);
  });
});

describe("deleteAcrossSeparator", () => {
  it("does nothing when the neighbour is already a digit", () => {
    expect(deleteAcrossSeparator("₦ 1,234", 7, "backward", NGN)).toBeNull();
    expect(deleteAcrossSeparator("₦ 1,234", 4, "forward", NGN)).toBeNull();
  });

  it("backspacing over a grouping separator removes the digit before it", () => {
    // "₦ 1,234" with the caret between "," and "2".
    const step = deleteAcrossSeparator("₦ 1,234", 4, "backward", NGN);
    expect(step).not.toBeNull();
    expect(formatMoneyInput(step!.next, NGN)).toBe("₦ 234");
    expect(step!.significant).toBe(0);
  });

  it("backspacing into the symbol deletes nothing", () => {
    expect(deleteAcrossSeparator("₦ 234", 2, "backward", NGN)).toBeNull();
    expect(deleteAcrossSeparator("₦ 234", 0, "backward", NGN)).toBeNull();
  });

  it("forward-deleting a separator removes the digit after it", () => {
    // "₦ 1,234" with the caret between "1" and ",".
    const step = deleteAcrossSeparator("₦ 1,234", 3, "forward", NGN);
    expect(step).not.toBeNull();
    expect(formatMoneyInput(step!.next, NGN)).toBe("₦ 134");
    expect(step!.significant).toBe(1);
  });

  it("forward-deleting at the end of the string does nothing", () => {
    expect(deleteAcrossSeparator("₦ 234", 5, "forward", NGN)).toBeNull();
  });
});
