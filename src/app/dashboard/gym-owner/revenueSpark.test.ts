import { describe, expect, it } from "vitest";
import { dailyRevenueSpark } from "./revenueSpark";

const now = new Date("2026-10-06T12:00:00Z");

describe("dailyRevenueSpark", () => {
  it("returns null when the window has no revenue", () => {
    expect(dailyRevenueSpark([], now)).toBeNull();
    expect(dailyRevenueSpark([{ date: "2026-08-01", revenue_minor: 500, currency: "NGN" }], now)).toBeNull();
  });

  it("gives one value per UTC day, ending today, with empty days as real zeros", () => {
    const spark = dailyRevenueSpark(
      [
        { date: "2026-10-01", revenue_minor: 5_000_000, currency: "NGN" },
        { date: "2026-10-06", revenue_minor: 1_500_000, currency: "NGN" },
      ],
      now,
    );
    expect(spark?.currency).toBe("NGN");
    expect(spark?.values).toHaveLength(30);
    expect(spark?.values[29]).toBe(1_500_000);
    expect(spark?.values[24]).toBe(5_000_000);
    expect(spark?.values.filter((v) => v !== 0)).toHaveLength(2);
  });

  it("never mixes currencies: plots the one with the most revenue in the window", () => {
    const spark = dailyRevenueSpark(
      [
        { date: "2026-10-02", revenue_minor: 9_000, currency: "USD" },
        { date: "2026-10-03", revenue_minor: 2_000_000, currency: "NGN" },
      ],
      now,
    );
    expect(spark?.currency).toBe("NGN");
    expect(spark?.values.reduce((a, b) => a + b, 0)).toBe(2_000_000);
  });
});
