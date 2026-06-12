import { describe, expect, it } from "vitest";

import { formatCurrency, formatSignedCurrency } from "@/utils/format";

describe("formatCurrency", () => {
  it("uses narrow currency symbols when available", () => {
    expect(formatCurrency(45500, "NGN", "en-NG")).toContain("₦");
    expect(formatCurrency(49, "GBP", "en-GB")).toContain("£");
  });

  it("falls back to code + numeric amount for unsupported currency codes", () => {
    const amount = formatCurrency(12.5, "ZZZ", "en-US");
    expect(amount).toContain("ZZZ");
    expect(amount).toMatch(/12\.50|12,50/);
  });

  it("formats signed currency amounts with optional plus prefix", () => {
    expect(formatSignedCurrency(-1200, "ZAR", "en-ZA")).toContain("−");
    expect(formatSignedCurrency(-1200, "ZAR", "en-ZA")).toContain("R");
    expect(formatSignedCurrency(1200, "ZAR", "en-ZA", { showPlus: true })).toContain("+");
  });

  it("renders zero-decimal currencies without minor units, regardless of magnitude or cents", () => {
    // A single fee table must be internally consistent: a large amount and a
    // small fractional one both round to whole units (no ₦25,000 next to ₦475.00).
    expect(formatCurrency(25000, "NGN", "en-NG")).not.toContain(".");
    expect(formatCurrency(475.5, "NGN", "en-NG")).not.toContain(".");
    expect(formatCurrency(250.25, "KES", "en-KE")).not.toContain(".");
  });

  it("renders whole amounts cleanly, without trailing decimals, regardless of magnitude", () => {
    // Magnitude must not change the decimals: a large and a small whole USD
    // amount both render without decimals (no $1,200 next to $48.00).
    expect(formatCurrency(1200, "USD", "en-US")).not.toContain(".");
    expect(formatCurrency(48, "USD", "en-US")).not.toContain(".");
  });

  it("keeps cents for fractional two-decimal amounts, even above 1000", () => {
    expect(formatCurrency(12.5, "USD", "en-US")).toContain(".50");
    expect(formatCurrency(1234.5, "USD", "en-US")).toContain(".50");
  });
});
