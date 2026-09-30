import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { normalizeCurrencies, normalizeCurrency, currenciesService } from "@/lib/api/currencies";
import { apiClient } from "@/lib/api/client";
import { useCurrencies } from "@/lib/queries/currencies";
import {
  currencyOptions,
  describeCurrencyError,
  formatMinor,
  isSelectable,
  suggestCurrency,
} from "@/lib/currencies/helpers";
import { currency, SEEDED_CURRENCIES } from "../setup/currencyFixtures";

describe("normalizeCurrency", () => {
  it("keeps a well-formed row", () => {
    expect(
      normalizeCurrency({
        code: "ngn",
        name: "Nigerian Naira",
        symbol: "₦",
        minor_unit: 2,
        selectable: { price: true, charge_card: true, charge_transfer: false },
        suggested_for_countries: ["ng"],
        gateways: [{ gateway: "Paystack", label: "Paystack", methods: ["card", "ussd"] }],
      }),
    ).toEqual({
      code: "NGN",
      name: "Nigerian Naira",
      symbol: "₦",
      minor_unit: 2,
      selectable: { price: true, charge_card: true, charge_transfer: false },
      suggested_for_countries: ["NG"],
      gateways: [{ gateway: "paystack", label: "Paystack", methods: ["card"] }],
    });
  });

  it("reads missing or malformed gateways as none", () => {
    expect(normalizeCurrency({ code: "ZAR" })?.gateways).toEqual([]);
    expect(normalizeCurrency({ code: "ZAR", gateways: [null, { label: "x" }] })?.gateways).toEqual([]);
  });

  it("reads a missing flag as not selectable, never as allowed", () => {
    const c = normalizeCurrency({ code: "GHS", name: "Cedi", symbol: "GH₵", minor_unit: 2 });
    expect(c?.selectable).toEqual({ price: false, charge_card: false, charge_transfer: false });
  });

  it("falls back to the ISO exponent when minor_unit is missing or nonsense", () => {
    expect(normalizeCurrency({ code: "JPY" })?.minor_unit).toBe(0);
    expect(normalizeCurrency({ code: "KWD", minor_unit: 9 })?.minor_unit).toBe(3);
  });

  it("drops rows without a valid ISO code and duplicate codes", () => {
    expect(normalizeCurrency({ code: "NAIRA" })).toBeNull();
    expect(normalizeCurrency(null)).toBeNull();
    expect(normalizeCurrencies([{ code: "NGN" }, { code: "ngn" }, { code: "X" }]).map((c) => c.code)).toEqual(["NGN"]);
    expect(normalizeCurrencies({ not: "an array" })).toEqual([]);
  });
});

describe("currenciesService.list", () => {
  it("reads GET /currencies and normalises it", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue({
      success: true,
      data: [{ code: "ngn", selectable: { price: true } }],
    });
    const res = await currenciesService.list();
    expect(get).toHaveBeenCalledWith("/currencies", false);
    expect(res.data?.[0]).toMatchObject({ code: "NGN", selectable: { price: true, charge_card: false } });
    get.mockRestore();
  });
});

describe("useCurrencies", () => {
  const list = [
    currency("NGN", { selectable: { price: true, charge_card: true, charge_transfer: true } }),
    currency("GHS", { selectable: { price: true, charge_card: false } }),
    currency("USD", { selectable: { price: false, charge_card: false } }),
  ];
  let client: QueryClient;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    vi.spyOn(currenciesService, "list").mockResolvedValue({ success: true, data: list });
  });

  it("filters to the currencies selectable for each use", async () => {
    const price = renderHook(() => useCurrencies("price"), { wrapper });
    await waitFor(() => expect(price.result.current.data).toBeDefined());
    expect(price.result.current.data!.map((c) => c.code)).toEqual(["NGN", "GHS"]);

    const card = renderHook(() => useCurrencies("charge_card"), { wrapper });
    await waitFor(() => expect(card.result.current.data).toBeDefined());
    expect(card.result.current.data!.map((c) => c.code)).toEqual(["NGN"]);

    const transfer = renderHook(() => useCurrencies("charge_transfer"), { wrapper });
    await waitFor(() => expect(transfer.result.current.data).toBeDefined());
    expect(transfer.result.current.data!.map((c) => c.code)).toEqual(["NGN"]);
  });

  it("returns the whole list without a use, and keeps it on `all` either way", async () => {
    const { result } = renderHook(() => useCurrencies(), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data!.map((c) => c.code)).toEqual(["NGN", "GHS", "USD"]);
    const priced = renderHook(() => useCurrencies("price"), { wrapper });
    await waitFor(() => expect(priced.result.current.all).toBeDefined());
    expect(priced.result.current.all!.map((c) => c.code)).toEqual(["NGN", "GHS", "USD"]);
  });
});

describe("suggestCurrency", () => {
  it("suggests the country's currency when it is selectable", () => {
    expect(suggestCurrency("NG", SEEDED_CURRENCIES)).toBe("NGN");
    expect(suggestCurrency("ng", SEEDED_CURRENCIES)).toBe("NGN");
  });

  it("returns null when the country's currency is not selectable, and never falls back to USD", () => {
    expect(suggestCurrency("GH", SEEDED_CURRENCIES)).toBeNull();
    expect(suggestCurrency("US", SEEDED_CURRENCIES)).toBeNull();
  });

  it("returns null for a country no currency is suggested for, or no country", () => {
    expect(suggestCurrency("FR", SEEDED_CURRENCIES)).toBeNull();
    expect(suggestCurrency("", SEEDED_CURRENCIES)).toBeNull();
    expect(suggestCurrency(undefined, SEEDED_CURRENCIES)).toBeNull();
    expect(suggestCurrency("NG", [])).toBeNull();
  });

  it("respects the use it is asked for", () => {
    const list = [currency("KES", { suggested_for_countries: ["KE"], selectable: { price: true, charge_card: false } })];
    expect(suggestCurrency("KE", list, "price")).toBe("KES");
    expect(suggestCurrency("KE", list, "charge_card")).toBeNull();
  });
});

describe("formatMinor", () => {
  it("uses a two-decimal exponent", () => {
    expect(formatMinor("USD", 4999)).toBe("$49.99");
    expect(formatMinor("NGN", 2_500_000, { list: SEEDED_CURRENCIES })).toBe("₦25,000");
  });

  it("uses a zero-decimal exponent", () => {
    expect(formatMinor("JPY", 1000)).toBe("¥1,000");
  });

  it("uses a three-decimal exponent", () => {
    expect(formatMinor("KWD", 12345)).toMatch(/12\.345/);
  });

  it("formats a historical code that is not in the list with the ISO table", () => {
    // EUR is not in the seeded list at all; the record still renders.
    expect(formatMinor("EUR", 1250, { list: SEEDED_CURRENCIES })).toBe("€12.50");
    expect(formatMinor("XOF", 5000, { list: SEEDED_CURRENCIES })).toMatch(/5,000/);
  });

  it("prefers the list's minor_unit when it has the code", () => {
    const list = [currency("ABC", { minor_unit: 0 })];
    expect(formatMinor("ABC", 1200, { list })).toMatch(/1,200/);
  });
});

describe("currency pickers", () => {
  it("offer only selectable currencies", () => {
    expect(currencyOptions(SEEDED_CURRENCIES, "price").map((o) => o.value)).toEqual(["NGN"]);
  });

  it("keep a record's saved currency visible without offering it as new", () => {
    const opts = currencyOptions(SEEDED_CURRENCIES, "price", "EUR");
    expect(opts.map((o) => o.value)).toEqual(["NGN", "EUR"]);
    expect(opts[1].label).toMatch(/not available/);
  });

  it("isSelectable checks code and use", () => {
    expect(isSelectable("ngn", SEEDED_CURRENCIES, "price")).toBe(true);
    expect(isSelectable("GHS", SEEDED_CURRENCIES, "price")).toBe(false);
    expect(isSelectable(null, SEEDED_CURRENCIES, "price")).toBe(false);
  });
});

describe("describeCurrencyError", () => {
  it("joins the server's message and its reasons", () => {
    expect(
      describeCurrencyError({
        code: "CURRENCY_NOT_SELECTABLE",
        message: "Prices can't be set in GHS right now.",
        details: {
          reasons: [
            { code: "gateway_account_disabled", message: "Paystack can charge GHS, but it isn't enabled on our account" },
          ],
        },
      }),
    ).toBe("Prices can't be set in GHS right now. Paystack can charge GHS, but it isn't enabled on our account.");
  });

  it("passes CURRENCY_LOCKED and CURRENCY_MISSING messages through", () => {
    expect(describeCurrencyError({ code: "CURRENCY_LOCKED", message: "This price has a payment in progress." })).toBe(
      "This price has a payment in progress.",
    );
    expect(describeCurrencyError({ code: "CURRENCY_MISSING", message: "" })).toMatch(/currency/);
  });

  it("ignores other failures", () => {
    expect(describeCurrencyError({ code: "VALIDATION_FAILED", message: "name is required" })).toBeNull();
    expect(describeCurrencyError({ message: "Network error" })).toBeNull();
  });
});

describe("apiClient currency error detail", () => {
  it("folds top-level reasons, in_flight and uses_lost into details", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: "CURRENCY_IN_USE",
          message: "GHS has 2 payment(s) in progress.",
          in_flight: { pending_bookings: 2, pending_subscriptions: 0, pending_provider_checkouts: 0 },
          uses_lost: ["price"],
          reasons: [{ code: "platform_disabled", message: "Turned off on the platform" }],
        }),
        { status: 409, headers: { "content-type": "application/json" } },
      ),
    );
    const res = await apiClient.patch("/admin/currencies/GHS", {});
    expect(res).toMatchObject({
      success: false,
      status: 409,
      code: "CURRENCY_IN_USE",
      details: {
        in_flight: { pending_bookings: 2 },
        uses_lost: ["price"],
        reasons: [{ code: "platform_disabled" }],
      },
    });
    fetchMock.mockRestore();
  });
});
