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
});
