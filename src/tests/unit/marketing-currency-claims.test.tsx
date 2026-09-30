import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { PlatformCurrency } from "@/lib/api/currencies";
import {
  currencyListPhrase,
  gatewayCurrencySummary,
  payableCurrencies,
} from "@/lib/currencies/helpers";
import {
  CurrencyKpis,
  GatewayStrip,
  PaidInPhrase,
  demoMoney,
  fillDemoMoney,
} from "@/components/marketing/CurrencyFacts";
import { CurrencyDemo, demoCurrencies } from "@/components/ds/CurrencyDemo";
import { hubStats } from "@/components/HeartbeatMotion";
import { currency, SEEDED_CURRENCIES } from "../setup/currencyFixtures";

/**
 * Marketing counts, lists and gateway names come from GET /currencies:
 * "you can be paid in" = listed with a gateway; nothing is claimed while the
 * list is empty or unknown.
 */

const state = vi.hoisted(() => ({ data: undefined as PlatformCurrency[] | undefined }));
vi.mock("@/lib/queries/currencies", () => ({
  useCurrencyList: () => ({ data: state.data, isPending: state.data === undefined, isError: false }),
}));

const PAYSTACK = { gateway: "paystack", label: "Paystack", methods: ["card" as const] };

describe("currency helpers", () => {
  it("counts only currencies a gateway can charge", () => {
    expect(payableCurrencies(SEEDED_CURRENCIES).map((c) => c.code)).toEqual(["NGN"]);
    expect(gatewayCurrencySummary(SEEDED_CURRENCIES)).toEqual([
      { gateway: "paystack", label: "Paystack", codes: ["NGN"] },
    ]);
  });

  it("phrases a short list by code and a long one by count", () => {
    expect(currencyListPhrase([])).toBe("");
    expect(currencyListPhrase(["NGN"])).toBe("NGN");
    expect(currencyListPhrase(["NGN", "ZAR"])).toBe("NGN and ZAR");
    expect(currencyListPhrase(["NGN", "ZAR", "KES"])).toBe("NGN, ZAR and KES");
    expect(currencyListPhrase(["NGN", "ZAR", "KES", "GHS"])).toBe("4 currencies");
  });
});

describe("marketing copy from the list", () => {
  beforeEach(() => {
    state.data = undefined;
  });

  it("derives the paid-in phrase from the list, and says nothing without one", () => {
    state.data = SEEDED_CURRENCIES;
    const { container, rerender } = render(<p>runs your payments<PaidInPhrase />.</p>);
    expect(container.textContent).toBe("runs your payments in NGN.");

    state.data = [
      ...SEEDED_CURRENCIES.map((c) => ({ ...c, gateways: [PAYSTACK] })),
    ];
    rerender(<p>runs your payments<PaidInPhrase />.</p>);
    expect(container.textContent).toBe("runs your payments in 5 currencies.");

    state.data = [];
    rerender(<p>runs your payments<PaidInPhrase />.</p>);
    expect(container.textContent).toBe("runs your payments.");
  });

  it("lists gateways with their currencies, and only those", () => {
    state.data = SEEDED_CURRENCIES;
    render(<GatewayStrip />);
    expect(screen.getByText("Paystack · NGN")).toBeInTheDocument();
    expect(screen.queryByText(/Stripe|Flutterwave/)).toBeNull();
  });

  it("counts payable and listed currencies separately", () => {
    state.data = SEEDED_CURRENCIES;
    render(<CurrencyKpis />);
    expect(screen.getByText("Currencies you can be paid in").nextSibling?.textContent).toBe("1");
    expect(screen.getByText("Currencies listed").nextSibling?.textContent).toBe("5");
  });
});

describe("demo animations", () => {
  beforeEach(() => {
    state.data = undefined;
  });

  it("cycle only through currencies we can charge", () => {
    expect(demoCurrencies(SEEDED_CURRENCIES)).toEqual([
      { id: "NGN", name: "Nigerian Naira", currency: "NGN", symbol: "₦", gateway: "Paystack", methods: "Card" },
    ]);
  });

  it("render without currency labels when the list is empty", () => {
    state.data = [];
    const { container } = render(<CurrencyDemo />);
    expect(container.textContent).not.toMatch(/NGN|ZAR|GBP|KES|INR|Paystack/);
    expect(screen.getByText("Your price")).toBeInTheDocument();
  });

  it("label map hubs from the list", () => {
    expect(hubStats("NG", SEEDED_CURRENCIES)).toEqual({ stats: ["NGN", "Paystack"], live: "Payments live" });
    expect(hubStats("ZA", SEEDED_CURRENCIES)).toEqual({ stats: ["ZAR"], live: "Coming soon" });
    expect(hubStats("GB", SEEDED_CURRENCIES)).toEqual({ stats: [], live: null });
    expect(hubStats("NG", [currency("NGN")])).toEqual({ stats: [], live: null });
  });
});

describe("sample amounts in product demos", () => {
  it("use the first currency we can charge", () => {
    const money = demoMoney(SEEDED_CURRENCIES);
    expect(money.code).toBe("NGN");
    expect(money(38400)).toBe("₦38,400");
    expect(money(1_080_000, { compact: true })).toBe("₦ 1.08M");
    expect(fillDemoMoney("Refund request · {{850}}", money)).toBe("Refund request · ₦850");
  });

  it("carry no currency label without a payable currency", () => {
    const money = demoMoney([]);
    expect(money.code).toBe("");
    expect(money(38400)).toBe("38,400");
    expect(fillDemoMoney("{{38400k}} booked", money)).toBe("38.4K booked");
  });

  it("escape the amount in HTML copy", () => {
    const money = demoMoney([currency("XOF", { symbol: "<b>", gateways: [PAYSTACK] })]);
    expect(fillDemoMoney("{{5000k}}", money, { html: true })).toBe("&#60;b&#62; 5K");
  });
});
