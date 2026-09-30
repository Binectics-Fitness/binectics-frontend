/**
 * GET /currencies: the platform's one list of currencies, and what each can
 * be used for right now. Every currency picker is built from this, filtered
 * by the use at hand (see useCurrencies). The API decides; the client never
 * keeps its own list.
 *
 * Only platform-enabled currencies are listed. A record in any other code
 * (history, or a price set before the currency was turned off) still formats
 * with Intl and the ISO exponent table (lib/money/currencyUnits).
 */

import { apiClient } from "./client";
import type { ApiResponse } from "@/lib/types";
import { currencyExponent } from "@/lib/money/currencyUnits";

/** What a currency can be picked for. */
export type CurrencyUse = "price" | "charge_card" | "charge_transfer";

export const CURRENCY_USES: readonly CurrencyUse[] = [
  "price",
  "charge_card",
  "charge_transfer",
];

/** A payment method a gateway collects a currency by. */
export type PaymentMethodCode = "card" | "bank_transfer";

/**
 * A gateway that can charge a currency for the platform right now, with the
 * methods confirmed for it.
 */
export interface ChargingGateway {
  /** Gateway id, e.g. "paystack". */
  gateway: string;
  /** Display name, e.g. "Paystack". */
  label: string;
  methods: PaymentMethodCode[];
}

export interface PlatformCurrency {
  /** ISO 4217, upper case. */
  code: string;
  name: string;
  symbol: string;
  /** ISO exponent: 2 for NGN, 0 for JPY, 3 for KWD. */
  minor_unit: number;
  selectable: Record<CurrencyUse, boolean>;
  /** ISO 3166 alpha-2 countries this is the usual currency of. */
  suggested_for_countries: string[];
  /**
   * Gateways that can charge it for us right now. Empty when it can't be
   * paid (it may still be listed for display).
   */
  gateways: ChargingGateway[];
}

const ISO_CODE = /^[A-Z]{3}$/;

const METHODS: readonly PaymentMethodCode[] = ["card", "bank_transfer"];

/** `gateways[]` made safe: rows without an id are dropped, unknown methods ignored. */
export function normalizeGateways(raw: unknown): ChargingGateway[] {
  if (!Array.isArray(raw)) return [];
  const out: ChargingGateway[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const g = row as Record<string, unknown>;
    const id = typeof g.gateway === "string" ? g.gateway.trim().toLowerCase() : "";
    if (!id || out.some((x) => x.gateway === id)) continue;
    const label =
      typeof g.label === "string" && g.label.trim()
        ? g.label.trim()
        : id.charAt(0).toUpperCase() + id.slice(1);
    const methods = Array.isArray(g.methods)
      ? METHODS.filter((m) => (g.methods as unknown[]).includes(m))
      : [];
    out.push({ gateway: id, label, methods });
  }
  return out;
}

/**
 * One row of the response, made safe to render. A row without a valid code
 * is dropped; a missing flag reads as "not selectable", never as allowed; a
 * missing exponent comes from the ISO table.
 */
export function normalizeCurrency(raw: unknown): PlatformCurrency | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const code = typeof r.code === "string" ? r.code.trim().toUpperCase() : "";
  if (!ISO_CODE.test(code)) return null;
  const sel =
    r.selectable && typeof r.selectable === "object"
      ? (r.selectable as Record<string, unknown>)
      : {};
  const minor =
    typeof r.minor_unit === "number" &&
    Number.isInteger(r.minor_unit) &&
    r.minor_unit >= 0 &&
    r.minor_unit <= 3
      ? r.minor_unit
      : currencyExponent(code);
  return {
    code,
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : code,
    symbol: typeof r.symbol === "string" && r.symbol.trim() ? r.symbol.trim() : code,
    minor_unit: minor,
    selectable: {
      price: sel.price === true,
      charge_card: sel.charge_card === true,
      charge_transfer: sel.charge_transfer === true,
    },
    suggested_for_countries: Array.isArray(r.suggested_for_countries)
      ? r.suggested_for_countries
          .filter((c): c is string => typeof c === "string")
          .map((c) => c.trim().toUpperCase())
          .filter((c) => /^[A-Z]{2}$/.test(c))
      : [],
    gateways: normalizeGateways(r.gateways),
  };
}

/** The whole response, normalised; duplicate codes keep the first row. */
export function normalizeCurrencies(raw: unknown): PlatformCurrency[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: PlatformCurrency[] = [];
  for (const row of raw) {
    const c = normalizeCurrency(row);
    if (!c || seen.has(c.code)) continue;
    seen.add(c.code);
    out.push(c);
  }
  return out;
}

export const currenciesService = {
  async list(): Promise<ApiResponse<PlatformCurrency[]>> {
    const res = await apiClient.get<unknown>("/currencies", false);
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: normalizeCurrencies(res.data) };
  },
};
