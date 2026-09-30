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

// ─── Membership price currencies for one org ────────────────────────────────

/**
 * Who takes a payment in a currency: the platform's own Paystack account, or
 * the provider's own connected one (CURRENCY_MODEL.md, "Provider-account
 * currencies").
 */
export type CurrencyRoute = "platform" | "provider";

export interface CurrencyReason {
  code: string;
  message: string;
}

/**
 * One row of GET /marketplace/organizations/:id/price-currencies: a currency
 * this org's MEMBERSHIP prices may use. Platform-enabled currencies plus the
 * ones verified on the org's own payment account. Session types and bookings
 * never use this list: they are charged on the platform account.
 */
export interface OrgPriceCurrency {
  code: string;
  name: string;
  symbol: string;
  minor_unit: number;
  /** Membership prices can be set in it for this org right now. */
  selectable: boolean;
  /** Who would take the money; null when not selectable. */
  route: CurrencyRoute | null;
  /** Why not, when not selectable. */
  reasons: CurrencyReason[];
  payable: {
    card: { selectable: boolean; route: CurrencyRoute | null };
    bank_transfer: { selectable: boolean; route: CurrencyRoute | null };
  };
  /** Verified on the org's own payment account. */
  provider_verified: boolean;
}

function routeOf(raw: unknown): CurrencyRoute | null {
  return raw === "platform" || raw === "provider" ? raw : null;
}

function payableOf(raw: unknown): { selectable: boolean; route: CurrencyRoute | null } {
  const p = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const selectable = p.selectable === true;
  return { selectable, route: selectable ? routeOf(p.route) : null };
}

/** One price-currencies row made safe; a missing flag reads as "not selectable". */
export function normalizeOrgPriceCurrency(raw: unknown): OrgPriceCurrency | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const code = typeof r.code === "string" ? r.code.trim().toUpperCase() : "";
  if (!ISO_CODE.test(code)) return null;
  const selectable = r.selectable === true;
  const minor =
    typeof r.minor_unit === "number" &&
    Number.isInteger(r.minor_unit) &&
    r.minor_unit >= 0 &&
    r.minor_unit <= 3
      ? r.minor_unit
      : currencyExponent(code);
  const payable = r.payable && typeof r.payable === "object" ? (r.payable as Record<string, unknown>) : {};
  return {
    code,
    name: typeof r.name === "string" && r.name.trim() ? r.name.trim() : code,
    symbol: typeof r.symbol === "string" && r.symbol.trim() ? r.symbol.trim() : code,
    minor_unit: minor,
    selectable,
    route: selectable ? routeOf(r.route) : null,
    reasons: Array.isArray(r.reasons)
      ? r.reasons
          .filter(
            (x): x is CurrencyReason =>
              !!x && typeof x === "object" && typeof (x as CurrencyReason).message === "string",
          )
          .map((x) => ({ code: String(x.code ?? ""), message: x.message }))
      : [],
    payable: { card: payableOf(payable.card), bank_transfer: payableOf(payable.bank_transfer) },
    provider_verified: r.provider_verified === true,
  };
}

export function normalizeOrgPriceCurrencies(raw: unknown): OrgPriceCurrency[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: OrgPriceCurrency[] = [];
  for (const row of raw) {
    const c = normalizeOrgPriceCurrency(row);
    if (!c || seen.has(c.code)) continue;
    seen.add(c.code);
    out.push(c);
  }
  return out;
}

/**
 * A platform row seen as an org price row: what a picker falls back to when
 * the org's own list can't be read (no org yet, or an API without the
 * endpoint). Everything in it is on the platform route.
 */
export function platformAsOrgPriceCurrency(c: PlatformCurrency): OrgPriceCurrency {
  const on = (s: boolean) => ({ selectable: s, route: s ? ("platform" as const) : null });
  return {
    code: c.code,
    name: c.name,
    symbol: c.symbol,
    minor_unit: c.minor_unit,
    selectable: c.selectable.price,
    route: c.selectable.price ? "platform" : null,
    reasons: [],
    payable: { card: on(c.selectable.charge_card), bank_transfer: on(c.selectable.charge_transfer) },
    provider_verified: false,
  };
}

export const currenciesService = {
  async list(): Promise<ApiResponse<PlatformCurrency[]>> {
    const res = await apiClient.get<unknown>("/currencies", false);
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: normalizeCurrencies(res.data) };
  },

  /** GET /marketplace/organizations/:id/price-currencies. */
  async listForOrg(organizationId: string): Promise<ApiResponse<OrgPriceCurrency[]>> {
    const res = await apiClient.get<unknown>(
      `/marketplace/organizations/${encodeURIComponent(organizationId)}/price-currencies`,
    );
    if (!res.success) return { ...res, data: undefined };
    return { ...res, data: normalizeOrgPriceCurrencies(res.data) };
  },
};
