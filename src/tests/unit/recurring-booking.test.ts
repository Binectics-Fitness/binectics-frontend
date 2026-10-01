import { describe, it, expect } from "vitest";
import { repeatBlockedForPaid } from "@/lib/bookings/recurring";

describe("repeatBlockedForPaid", () => {
  it("blocks repeating a priced session, which would leave unpaid holds", () => {
    expect(repeatBlockedForPaid({ priceMinor: 2_000_000 })).toBe(true);
  });

  it("allows free sessions, and a type not loaded yet", () => {
    expect(repeatBlockedForPaid({ priceMinor: 0 })).toBe(false);
    expect(repeatBlockedForPaid({ priceMinor: null })).toBe(false);
    expect(repeatBlockedForPaid(undefined)).toBe(false);
  });
});
