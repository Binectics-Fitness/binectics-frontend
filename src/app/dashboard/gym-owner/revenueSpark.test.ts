import { describe, expect, it } from "vitest";
import type { OrgCheckInDashboardStats } from "@/lib/types";
import {
  dailyRevenueSpark,
  pickRevenueCurrency,
  revenueCardFigures,
  seriesCurrencies,
  statsCurrencies,
} from "./revenueSpark";

const now = new Date("2026-10-06T12:00:00Z");
const mixed = [
  { date: "2026-10-02", revenue_minor: 9_000, currency: "USD" },
  { date: "2026-10-03", revenue_minor: 2_000_000, currency: "NGN" },
];

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

  it("never mixes currencies: plots only the currency it is given", () => {
    const spark = dailyRevenueSpark(mixed, now, 30, "USD");
    expect(spark?.currency).toBe("USD");
    expect(spark?.values.reduce((a, b) => a + b, 0)).toBe(9_000);
  });

  it("is null when the given currency has no rows, even if another does", () => {
    expect(dailyRevenueSpark(mixed, now, 30, "GHS")).toBeNull();
  });

  it("with no currency given, picks by code, not by the biggest raw number", () => {
    const spark = dailyRevenueSpark(
      [
        { date: "2026-10-02", revenue_minor: 2_000_000, currency: "USD" },
        { date: "2026-10-03", revenue_minor: 9_000, currency: "GHS" },
      ],
      now,
    );
    expect(spark?.currency).toBe("GHS");
  });
});

describe("pickRevenueCurrency", () => {
  it("keeps the preferred currency when it has revenue, however small", () => {
    // 2,000,000 kobo is ₦20,000 (about $13); 9,000 cents is $90.
    expect(pickRevenueCurrency("USD", ["NGN", "USD"])).toBe("USD");
  });

  it("keeps the preferred currency when nothing has revenue", () => {
    expect(pickRevenueCurrency("ngn", [])).toBe("NGN");
  });

  it("moves to a currency that has revenue when the preferred one has none", () => {
    expect(pickRevenueCurrency("NGN", ["USD"])).toBe("USD");
    expect(pickRevenueCurrency(null, ["USD", "GHS"])).toBe("GHS");
    expect(pickRevenueCurrency(null, [])).toBeNull();
  });

  it("reads currencies from the series window and from the stats breakdown", () => {
    expect(seriesCurrencies([...mixed, { date: "2026-08-01", revenue_minor: 1, currency: "GHS" }], now).sort()).toEqual([
      "NGN",
      "USD",
    ]);
    expect(
      statsCurrencies({
        revenue_by_currency: [
          { currency: "NGN", today_minor: 0, week_minor: 0, month_minor: 5 },
          { currency: "USD", today_minor: 0, week_minor: 0, month_minor: 0 },
        ],
      } as OrgCheckInDashboardStats),
    ).toEqual(["NGN"]);
  });
});

const base = {
  today_check_ins: 0,
  week_check_ins: 0,
  month_check_ins: 0,
  active_members: 0,
  average_rating: 0,
  review_count: 0,
  recent_check_ins: [],
};

describe("revenueCardFigures", () => {
  it("reads an older API's major units in the org currency, as before", () => {
    const stats = { ...base, revenue_today: 1, revenue_week: 2, revenue_month: 3 } as OrgCheckInDashboardStats;
    expect(revenueCardFigures(stats, "USD", "NGN")).toEqual({
      currency: "NGN",
      today: 1,
      week: 2,
      month: 3,
      others: [],
    });
  });

  it("reads every figure in its own currency and lists the others apart", () => {
    const stats: OrgCheckInDashboardStats = {
      ...base,
      revenue_today: 50,
      revenue_week: 50,
      revenue_month: 50,
      revenue_today_minor: 5_000,
      revenue_week_minor: 5_000,
      revenue_month_minor: 5_000,
      revenue_currency: "USD",
      revenue_by_currency: [
        { currency: "USD", today_minor: 5_000, week_minor: 5_000, month_minor: 5_000 },
        { currency: "NGN", today_minor: 0, week_minor: 1_200_000, month_minor: 1_200_000 },
      ],
    };
    expect(revenueCardFigures(stats, "USD", "USD")).toEqual({
      currency: "USD",
      today: 50,
      week: 50,
      month: 50,
      others: [{ currency: "NGN", month: 12_000 }],
    });
  });

  it("follows the overview currency when the org's own had no revenue", () => {
    const stats: OrgCheckInDashboardStats = {
      ...base,
      revenue_today: 0,
      revenue_week: 0,
      revenue_month: 0,
      revenue_today_minor: 0,
      revenue_week_minor: 0,
      revenue_month_minor: 0,
      revenue_currency: "NGN",
      revenue_by_currency: [{ currency: "USD", today_minor: 0, week_minor: 9_900, month_minor: 9_900 }],
    };
    expect(revenueCardFigures(stats, "USD", "NGN")).toMatchObject({ currency: "USD", month: 99, others: [] });
    expect(revenueCardFigures(stats, "NGN", "NGN")).toMatchObject({
      currency: "NGN",
      month: 0,
      others: [{ currency: "USD", month: 99 }],
    });
  });
});
