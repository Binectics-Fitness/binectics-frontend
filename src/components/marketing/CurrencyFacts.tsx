"use client";

/**
 * Marketing facts about currencies and payment providers, read from
 * GET /currencies so they only ever say what an admin has turned on:
 *
 *  - "you can be paid in": listed currencies with at least one gateway
 *    that can charge them (payableCurrencies);
 *  - "listed": every platform-enabled currency.
 *
 * While the list loads, or if it can't be read, each piece renders nothing
 * (or neutral copy) rather than a number.
 */

import { useCurrencyList } from "@/lib/queries/currencies";
import type { PaymentMethodCode, PlatformCurrency } from "@/lib/api/currencies";
import {
  currencyListPhrase,
  gatewayCurrencySummary,
  payableCurrencies,
} from "@/lib/currencies/helpers";

const METHOD_LABELS: Record<PaymentMethodCode, string> = {
  card: "Card",
  bank_transfer: "Bank transfer",
};

/** "Card, Bank transfer" for the methods any payable currency offers on a gateway. */
export function gatewayMethods(list: readonly PlatformCurrency[] | null | undefined, gateway: string): string[] {
  const seen = new Set<PaymentMethodCode>();
  for (const c of list ?? []) {
    for (const g of c.gateways) if (g.gateway === gateway) g.methods.forEach((m) => seen.add(m));
  }
  return (Object.keys(METHOD_LABELS) as PaymentMethodCode[]).filter((m) => seen.has(m)).map((m) => METHOD_LABELS[m]);
}

/**
 * " in NGN" / " in 5 currencies" after a verb ("runs your payments"), or
 * nothing while the list is unknown or empty.
 */
export function PaidInPhrase({ prefix = " in " }: { prefix?: string }) {
  const { data } = useCurrencyList();
  const phrase = currencyListPhrase(payableCurrencies(data).map((c) => c.code));
  return phrase ? <>{`${prefix}${phrase}`}</> : null;
}

/** A strip of the payment providers we run, "Paystack · NGN". Nothing when none. */
export function GatewayStrip() {
  const { data } = useCurrencyList();
  const rows = gatewayCurrencySummary(data);
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-center border-b border-border">
      {rows.map((r) => (
        <div
          key={r.gateway}
          className="py-4 sm:py-7 px-4 sm:px-8 text-center text-fg-3 font-mono text-[11px] sm:text-[12px] uppercase tracking-[0.04em]"
        >
          {r.label} · {r.codes.join(", ")}
        </div>
      ))}
    </div>
  );
}

/** One card per payment provider: the currencies it charges and how. */
export function GatewayCards() {
  const { data, isPending } = useCurrencyList();
  const rows = gatewayCurrencySummary(data);
  if (isPending) return <p className="text-[14px]" style={{ color: "var(--fg-3)" }}>Loading payment providers</p>;
  if (rows.length === 0) {
    return (
      <p className="text-[14.5px] leading-[1.55] max-w-[56ch]" style={{ color: "var(--fg-2)" }}>
        The currencies you can be paid in are listed in your dashboard when you set a price.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {rows.map((g) => {
        const methods = gatewayMethods(data, g.gateway);
        return (
          <div key={g.gateway} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
            <h3 className="text-[18px] font-medium mb-3" style={{ color: "var(--ink)" }}>{g.label}</h3>
            <div className="space-y-1.5">
              {[
                ["Currencies", g.codes.join(", ")],
                ["Methods", methods.length > 0 ? methods.join(", ") : "-"],
                ["Fees", "Shown at checkout"],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3 text-[14px]">
                  <span className="font-mono text-[12px] uppercase tracking-[0.02em] w-24 shrink-0 pt-0.5" style={{ color: "var(--fg-3)" }}>
                    {label}
                  </span>
                  <span className="break-words min-w-0" style={{ color: "var(--fg-2)" }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function countryNames(codes: readonly string[]): string {
  if (codes.length === 0) return "-";
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {
    names = null;
  }
  return codes.map((c) => names?.of(c) ?? c).join(", ");
}

/** Every listed currency, where it's usual, and who can charge it today. */
export function CurrencyCoverageTable() {
  const { data, isPending } = useCurrencyList();
  if (isPending) return <p className="text-[14px]" style={{ color: "var(--fg-3)" }}>Loading currencies</p>;
  if (!data || data.length === 0) {
    return (
      <p className="text-[14.5px]" style={{ color: "var(--fg-2)" }}>
        Currencies are listed here as each one is enabled.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px]" style={{ color: "var(--fg-2)", minWidth: "480px" }}>
        <thead>
          <tr className="text-left font-mono text-[11px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>
            <th className="pb-3 pr-4 font-medium">Currency</th>
            <th className="pb-3 pr-4 font-medium">Usual in</th>
            <th className="pb-3 font-medium">Payments</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c) => (
            <tr key={c.code} style={{ borderTop: "1px solid var(--border)" }}>
              <td className="py-3 pr-4">
                <span className="font-mono text-[13px] mr-2" style={{ color: "var(--ink)" }}>{c.code}</span>
                {c.name}
              </td>
              <td className="py-3 pr-4">{countryNames(c.suggested_for_countries)}</td>
              <td className="py-3">
                {c.gateways.length > 0 ? c.gateways.map((g) => g.label).join(", ") : "Not yet available"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Counts from the list: payable currencies, listed currencies, payment providers. */
export function CurrencyKpis() {
  const { data } = useCurrencyList();
  if (!data || data.length === 0) return null;
  const kpis = [
    { label: "Currencies you can be paid in", value: payableCurrencies(data).length },
    { label: "Currencies listed", value: data.length },
    { label: "Payment providers", value: gatewayCurrencySummary(data).length },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-(--r-3) p-4.5" style={{ background: "var(--bg-2)" }}>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{k.label}</div>
          <div className="text-[24px] sm:text-[32px] font-medium mt-1" style={{ letterSpacing: "-0.024em", color: "var(--ink)" }}>
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}

/** The number of currencies we can charge today, or "-" until known. */
export function PayableCurrencyCount() {
  const { data } = useCurrencyList();
  return <>{data ? String(payableCurrencies(data).length) : "-"}</>;
}

export type DemoMoney = ((major: number, opts?: { compact?: boolean }) => string) & {
  /** The demo currency's code, or "" when there is none. */
  code: string;
};

function compactNumber(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return String(n);
}

/**
 * A formatter for sample amounts in product demos, in the first currency we
 * can charge today (GET /currencies). The amounts are illustrations, not
 * prices; with no payable currency (or before the list loads) they render
 * as bare numbers with no currency label. Pure; exported for tests.
 */
export function demoMoney(list: readonly PlatformCurrency[] | null | undefined): DemoMoney {
  const c = payableCurrencies(list)[0];
  const fmt = ((major: number, opts?: { compact?: boolean }) => {
    if (!c) return opts?.compact ? compactNumber(major) : major.toLocaleString("en");
    if (opts?.compact) return `${c.symbol} ${compactNumber(major)}`;
    try {
      return new Intl.NumberFormat("en", {
        style: "currency",
        currency: c.code,
        currencyDisplay: "narrowSymbol",
        maximumFractionDigits: 0,
      }).format(major);
    } catch {
      return `${c.symbol} ${major.toLocaleString("en")}`;
    }
  }) as DemoMoney;
  fmt.code = c?.code ?? "";
  return fmt;
}

/** demoMoney for the current currency list. */
export function useDemoMoney(): DemoMoney {
  const { data } = useCurrencyList();
  return demoMoney(data);
}

/**
 * Fills `{{38400}}` (full) and `{{38400k}}` (compact) sample-amount tokens
 * in demo copy with `money`. Lets static demo data keep its numbers without
 * naming a currency. With `html`, the amount is escaped for copy rendered
 * as HTML (the symbol comes from the API).
 */
export function fillDemoMoney(text: string, money: DemoMoney, opts: { html?: boolean } = {}): string {
  return text.replace(/\{\{(\d+)(k?)\}\}/g, (_, n: string, k: string) => {
    const out = money(Number(n), { compact: k === "k" });
    return opts.html ? out.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`) : out;
  });
}

/** Partner cards for the payment providers we run, from GET /currencies. */
export function GatewayPartnerCards() {
  const { data, isPending } = useCurrencyList();
  const rows = gatewayCurrencySummary(data);
  if (isPending) return null;
  if (rows.length === 0) {
    return (
      <p className="text-[14px]" style={{ color: "var(--fg-3)" }}>
        Payment partners are listed here as each one goes live.
      </p>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
      {rows.map((g) => {
        const methods = gatewayMethods(data, g.gateway).map((m) => m.toLowerCase());
        return (
          <div key={g.gateway} className="rounded-(--r-3) p-6" style={{ background: "var(--bg-2)" }}>
            <h3 className="text-[17px] font-medium mb-2" style={{ color: "var(--ink)" }}>{g.label}</h3>
            <p className="text-[13.5px] leading-[1.55]" style={{ color: "var(--fg-2)" }}>
              Takes payments in {g.codes.join(", ")}
              {methods.length > 0 ? `, by ${methods.join(" and ")}` : ""}.
            </p>
          </div>
        );
      })}
    </div>
  );
}
