import { describe, it, expect } from "vitest";
import {
  minorToMajor,
  formatMinorMap,
  dominantCurrency,
} from "@/app/dashboard/dietitian/earnings/minorMoney";

const fmt = (major: number, currency: string) => `${currency} ${major}`;

describe("minorToMajor", () => {
  it("converts minor units to major (app-wide /100 convention)", () => {
    expect(minorToMajor(12345)).toBe(123.45);
    expect(minorToMajor(0)).toBe(0);
    expect(minorToMajor(-5000)).toBe(-50);
  });
});

describe("formatMinorMap", () => {
  it("returns null for missing, empty, or all-zero maps", () => {
    expect(formatMinorMap(null, fmt)).toBeNull();
    expect(formatMinorMap(undefined, fmt)).toBeNull();
    expect(formatMinorMap({}, fmt)).toBeNull();
    expect(formatMinorMap({ NGN: 0, USD: 0 }, fmt)).toBeNull();
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
