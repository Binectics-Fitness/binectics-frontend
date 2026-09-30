/**
 * Pure helpers over the platform currency list (GET /currencies). Kept free
 * of React so the rules can be pinned in unit tests:
 *
 *  - a country only ever SUGGESTS a currency, and only one that is
 *    selectable for the use at hand; with none, the answer is null and the
 *    caller asks the person to choose. There is no USD (or any) fallback.
 *  - any ISO code formats, listed or not, so history always renders.
 */

import type { ApiResponse } from "@/lib/types";
import type { CurrencyUse, PlatformCurrency } from "@/lib/api/currencies";
import { currencyExponent } from "@/lib/money/currencyUnits";
import { formatCurrency } from "@/utils/format";

/** Currencies selectable for `use`, in the API's order. */
export function selectableFor(
  list: readonly PlatformCurrency[] | null | undefined,
  use: CurrencyUse,
): PlatformCurrency[] {
  return (list ?? []).filter((c) => c.selectable[use]);
}

/** True when `code` is in the list and selectable for `use`. */
export function isSelectable(
  code: string | null | undefined,
  list: readonly PlatformCurrency[] | null | undefined,
  use: CurrencyUse,
): boolean {
  if (!code) return false;
  const upper = code.toUpperCase();
  return (list ?? []).some((c) => c.code === upper && c.selectable[use]);
}

/**
 * The currency a country suggests for `use` (default `price`), or null when
 * none of that country's currencies can be used. Null means "ask": never
 * substitute a currency the person did not choose.
 */
export function suggestCurrency(
  countryCode: string | null | undefined,
  list: readonly PlatformCurrency[] | null | undefined,
  use: CurrencyUse = "price",
): string | null {
  const country = (countryCode ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return null;
  const hit = (list ?? []).find(
    (c) => c.selectable[use] && c.suggested_for_countries.includes(country),
  );
  return hit?.code ?? null;
}

/**
 * A MINOR-unit amount in `code`, formatted with Intl. The exponent comes from
 * the list row when there is one (the API's minor_unit), else the ISO table,
 * so a code the platform no longer offers still renders correctly.
 */
export function formatMinor(
  code: string | null | undefined,
  amountMinor: number,
  opts: { list?: readonly PlatformCurrency[] | null; locale?: string } = {},
): string {
  const upper = (code ?? "").toUpperCase();
  const row = opts.list?.find((c) => c.code === upper);
  const exponent = row ? row.minor_unit : currencyExponent(upper);
  return formatCurrency(amountMinor / 10 ** exponent, upper || null, opts.locale);
}

/**
 * The currencies a customer can be paid in right now: listed AND at least
 * one gateway can charge them. Marketing counts and lists come from this.
 */
export function payableCurrencies(
  list: readonly PlatformCurrency[] | null | undefined,
): PlatformCurrency[] {
  return (list ?? []).filter((c) => c.gateways.length > 0);
}

/**
 * Which gateway charges which payable currencies, in list order:
 * [{ label: "Paystack", codes: ["NGN"] }]. For "Paystack: NGN" copy.
 */
export function gatewayCurrencySummary(
  list: readonly PlatformCurrency[] | null | undefined,
): { gateway: string; label: string; codes: string[] }[] {
  const out: { gateway: string; label: string; codes: string[] }[] = [];
  for (const c of list ?? []) {
    for (const g of c.gateways) {
      let row = out.find((r) => r.gateway === g.gateway);
      if (!row) {
        row = { gateway: g.gateway, label: g.label, codes: [] };
        out.push(row);
      }
      if (!row.codes.includes(c.code)) row.codes.push(c.code);
    }
  }
  return out;
}

/**
 * Marketing phrase for a set of currency codes: "NGN", "NGN and ZAR",
 * "NGN, ZAR and KES", then "4 currencies". Empty for none, so the caller
 * can drop the phrase instead of claiming a number.
 */
export function currencyListPhrase(codes: readonly string[]): string {
  if (codes.length === 0) return "";
  if (codes.length > 3) return `${codes.length} currencies`;
  if (codes.length === 1) return codes[0];
  return `${codes.slice(0, -1).join(", ")} and ${codes[codes.length - 1]}`;
}

/** "NGN · ₦, Nigerian Naira": how a picker labels a currency. */
export function currencyLabel(c: Pick<PlatformCurrency, "code" | "name" | "symbol">): string {
  return c.symbol && c.symbol !== c.code
    ? `${c.code} · ${c.symbol}, ${c.name}`
    : `${c.code}, ${c.name}`;
}

/**
 * Options for a currency picker: the currencies selectable for `use`, plus
 * `keep` when it is the record's saved currency and no longer selectable, so
 * an edit form can show what is stored without offering it to anyone else.
 */
export function currencyOptions(
  list: readonly PlatformCurrency[] | null | undefined,
  use: CurrencyUse,
  keep?: string | null,
): { label: string; value: string }[] {
  const options = selectableFor(list, use).map((c) => ({
    label: currencyLabel(c),
    value: c.code,
  }));
  const kept = keep?.toUpperCase();
  if (kept && !options.some((o) => o.value === kept)) {
    options.push({ label: `${kept} (not available for new prices)`, value: kept });
  }
  return options;
}

export const CURRENCY_ERROR_CODES = [
  "CURRENCY_NOT_SELECTABLE",
  "CURRENCY_MISSING",
  "CURRENCY_LOCKED",
] as const;

export interface CurrencyReason {
  code: string;
  message: string;
}

/** The `reasons[]` a CURRENCY_NOT_SELECTABLE refusal carries, if any. */
export function currencyReasons(res: Pick<ApiResponse<unknown>, "details">): CurrencyReason[] {
  const raw = res.details?.reasons;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (r): r is CurrencyReason =>
        !!r && typeof r === "object" && typeof (r as CurrencyReason).message === "string",
    )
    .map((r) => ({ code: String(r.code ?? ""), message: r.message }));
}

/**
 * What to tell the person when a write is refused for its currency: the
 * server's own message, plus the reasons it gave ("Prices can't be set in
 * GHS right now. Paystack can charge GHS, but it isn't enabled on our
 * account."). Null for any other failure, so callers keep their own copy.
 */
export function describeCurrencyError(
  res: Pick<ApiResponse<unknown>, "code" | "message" | "details">,
): string | null {
  if (!res.code || !(CURRENCY_ERROR_CODES as readonly string[]).includes(res.code)) {
    return null;
  }
  const base = (res.message ?? "").trim() || "This currency can't be used right now.";
  const reasons = currencyReasons(res).map((r) => r.message.replace(/\.$/, ""));
  if (reasons.length === 0) return base;
  const sep = /[.!?]$/.test(base) ? " " : ". ";
  return `${base}${sep}${reasons.join(". ")}.`;
}

/** The currency message when there is one, else `fallback` (or the server's message). */
export function writeErrorMessage(
  res: Pick<ApiResponse<unknown>, "code" | "message" | "details">,
  fallback: string,
): string {
  return describeCurrencyError(res) ?? res.message ?? fallback;
}
