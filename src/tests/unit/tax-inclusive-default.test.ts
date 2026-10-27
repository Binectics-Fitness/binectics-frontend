import { describe, it, expect } from "vitest";
import { taxIsInclusive } from "@/lib/tax/taxInclusive";

describe("taxIsInclusive", () => {
  it("does not guess when the flag was never saved: undefined, so callers prompt", () => {
    expect(taxIsInclusive({})).toBeUndefined();
    expect(taxIsInclusive({ tax_inclusive: null })).toBeUndefined();
    expect(taxIsInclusive(undefined)).toBeUndefined();
    expect(taxIsInclusive(null)).toBeUndefined();
  });

  it("follows a saved value either way", () => {
    expect(taxIsInclusive({ tax_inclusive: true })).toBe(true);
    expect(taxIsInclusive({ tax_inclusive: false })).toBe(false);
  });
});
