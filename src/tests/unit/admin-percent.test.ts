import { describe, it, expect } from "vitest";
import { formatPercent } from "@/lib/admin/percent";

describe("formatPercent", () => {
  it("shows the API's percentage as it is: 1 of 58 users is 1.7%, not 170%", () => {
    expect(formatPercent(1.7)).toBe("1.7%");
  });

  it("does not mistake a small percentage for a fraction", () => {
    expect(formatPercent(0.5)).toBe("0.5%");
    expect(formatPercent(1)).toBe("1.0%");
  });

  it("handles zero and whole percentages", () => {
    expect(formatPercent(0)).toBe("0.0%");
    expect(formatPercent(50)).toBe("50.0%");
  });
});
