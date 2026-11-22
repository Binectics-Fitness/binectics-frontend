import { describe, expect, it } from "vitest";
import { isNgMobile, normaliseNgPhone } from "./ngPhone";

describe("normaliseNgPhone", () => {
  it.each([
    ["08031234567", "+2348031234567"],
    ["0803 123 4567", "+2348031234567"],
    ["+234 803 123 4567", "+2348031234567"],
    ["2348031234567", "+2348031234567"],
    ["+234-803-123-4567", "+2348031234567"],
    ["(0803) 123-4567", "+2348031234567"],
    ["09161234567", "+2349161234567"],
  ])("accepts %s", (input, e164) => {
    expect(normaliseNgPhone(input)).toBe(e164);
  });

  it.each(["", "0803123456", "080312345678", "+2340803123456", "+44 7700 900123", "phone", "+234 803 123 456a"])(
    "rejects %s",
    (input) => {
      expect(normaliseNgPhone(input)).toBeNull();
    },
  );
});

describe("isNgMobile", () => {
  it("accepts mobile prefixes", () => {
    for (const n of ["07031234567", "08031234567", "08131234567", "09031234567", "09161234567"]) {
      expect(isNgMobile(n)).toBe(true);
    }
  });
  it("rejects a Lagos landline", () => {
    expect(isNgMobile("012345678" + "9")).toBe(false);
  });
});
