import { describe, it, expect } from "vitest";
import { taxIsInclusive } from "@/lib/tax/taxInclusive";

describe("taxIsInclusive", () => {
  it("is inclusive when the flag was never saved, like the Settings switch", () => {
    expect(taxIsInclusive({})).toBe(true);
    expect(taxIsInclusive({ tax_inclusive: null })).toBe(true);
    expect(taxIsInclusive(undefined)).toBe(true);
    expect(taxIsInclusive(null)).toBe(true);
  });

  it("follows a saved value either way", () => {
    expect(taxIsInclusive({ tax_inclusive: true })).toBe(true);
    expect(taxIsInclusive({ tax_inclusive: false })).toBe(false);
  });
});
