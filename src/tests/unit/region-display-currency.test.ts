import { describe, it, expect } from "vitest";
import { resolveDisplayCurrency } from "@/contexts/RegionContext";
import { marketingCurrency, marketingMonthlyPrice } from "@/lib/constants/regions";
import { currency, SEEDED_CURRENCIES } from "../setup/currencyFixtures";

describe("resolveDisplayCurrency", () => {
  it("trusts the geo currency only when the platform lists it", () => {
    expect(resolveDisplayCurrency({ list: SEEDED_CURRENCIES, geoCurrency: "KES", country: "KE" })).toBe("KES");
    // EUR is not listed: fall back to the first currency prices can be set in.
    expect(resolveDisplayCurrency({ list: SEEDED_CURRENCIES, geoCurrency: "EUR", country: "DE" })).toBe("NGN");
  });

  it("prefers the visitor's own listed pick", () => {
    expect(resolveDisplayCurrency({ list: SEEDED_CURRENCIES, override: "zar", geoCurrency: "NGN" })).toBe("ZAR");
    expect(resolveDisplayCurrency({ list: SEEDED_CURRENCIES, override: "JPY", geoCurrency: "NGN" })).toBe("NGN");
  });

  it("uses the country's suggestion, then the first selectable, never a made-up USD", () => {
    const list = [currency("GHS", { suggested_for_countries: ["GH"] }), currency("NGN")];
    expect(resolveDisplayCurrency({ list, country: "GH" })).toBe("GHS");
    expect(resolveDisplayCurrency({ list, country: "US" })).toBe("GHS");
    expect(resolveDisplayCurrency({ list: [], country: "US" })).toBe("");
    expect(resolveDisplayCurrency({ list: undefined, geoCurrency: "USD" })).toBe("");
  });
});

describe("marketing prices", () => {
  it("show in the visitor's currency when the copy has it, else USD", () => {
    expect(marketingCurrency("NGN")).toBe("NGN");
    expect(marketingCurrency("GHS")).toBe("USD");
    expect(marketingCurrency("")).toBe("USD");
  });

  it("carry their own currency, and annual is ten months shown monthly", () => {
    expect(marketingMonthlyPrice("studio", "ngn", "monthly")).toEqual({ amount: 45_000, currency: "NGN" });
    expect(marketingMonthlyPrice("studio", "GHS", "annual")).toEqual({ amount: 40, currency: "USD" });
  });
});
