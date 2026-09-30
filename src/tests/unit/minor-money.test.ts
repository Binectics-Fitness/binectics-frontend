import { describe, it, expect } from "vitest";
import {
  minorToMajor,
  majorToMinor,
  maxSafeMajor,
  formatMinorMap,
  dominantCurrency,
} from "@/lib/money/minorMoney";

const fmt = (major: number, currency: string) => `${currency} ${major}`;

describe("minorToMajor", () => {
  it("divides by 100 for a two-decimal currency", () => {
    expect(minorToMajor(12345, "USD")).toBe(123.45);
    expect(minorToMajor(0, "NGN")).toBe(0);
    expect(minorToMajor(-5000, "ZAR")).toBe(-50);
  });

  it("uses the ISO exponent, not a fixed 100", () => {
    // JPY and RWF have no minor unit; KWD has three decimals.
    expect(minorToMajor(1000, "JPY")).toBe(1000);
    expect(minorToMajor(1000, "RWF")).toBe(1000);
    expect(minorToMajor(12345, "KWD")).toBe(12.345);
  });
});

describe("majorToMinor", () => {
  it("scales by the ISO exponent and rounds away float noise", () => {
    expect(majorToMinor(12.34, "USD")).toBe(1234);
    expect(majorToMinor(1000, "JPY")).toBe(1000);
    expect(majorToMinor(1.5, "BHD")).toBe(1500);
  });

  it("keeps the whole-naira display rule out of storage (NGN still stores kobo)", () => {
    expect(majorToMinor(5000, "NGN")).toBe(500000);
  });
});

describe("maxSafeMajor", () => {
  it("shrinks with the exponent", () => {
    expect(maxSafeMajor("JPY")).toBe(Number.MAX_SAFE_INTEGER);
    expect(maxSafeMajor("USD")).toBe(Math.floor(Number.MAX_SAFE_INTEGER / 100));
    expect(maxSafeMajor("KWD")).toBe(Math.floor(Number.MAX_SAFE_INTEGER / 1000));
  });
});

describe("formatMinorMap", () => {
  it("returns null for missing, empty, or all-zero maps", () => {
    expect(formatMinorMap(null, fmt)).toBeNull();
    expect(formatMinorMap(undefined, fmt)).toBeNull();
    expect(formatMinorMap({}, fmt)).toBeNull();
    expect(formatMinorMap({ NGN: 0, USD: 0 }, fmt)).toBeNull();
  });

  it("converts each currency by its own exponent", () => {
    expect(formatMinorMap({ JPY: 5000, USD: 5000 }, fmt)).toBe("JPY 5000 · USD 50");
  });

  it("formats a single currency in major units", () => {
    expect(formatMinorMap({ NGN: 250000 }, fmt)).toBe("NGN 2500");
  });

  it("joins multiple currencies largest-first", () => {
    expect(formatMinorMap({ USD: 5000, NGN: 12000000 }, fmt)).toBe("NGN 120000 · USD 50");
  });

  it("skips zero entries but keeps non-zero ones", () => {
    expect(formatMinorMap({ USD: 0, ZAR: 9900 }, fmt)).toBe("ZAR 99");
  });
});

describe("dominantCurrency", () => {
  it("falls back when there is no data", () => {
    expect(dominantCurrency(null, "USD")).toBe("USD");
    expect(dominantCurrency({}, "ZAR")).toBe("ZAR");
  });

  it("picks the currency with the largest total", () => {
    expect(dominantCurrency({ USD: 5000, NGN: 12000000 }, "USD")).toBe("NGN");
  });
});
