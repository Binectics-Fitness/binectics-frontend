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
import type { CurrencyUse, OrgPriceCurrency, PlatformCurrency } from "@/lib/api/currencies";
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

/**
 * Options for a MEMBERSHIP price picker from the org's price currencies
 * (useOrgPriceCurrencies): the selectable ones, those only the org's own
 * account can take marked with `providerHint` ("Your Paystack account"), plus
 * `keep` when it is the saved currency and no longer selectable.
 */
export function orgPriceOptions(
  list: readonly OrgPriceCurrency[] | null | undefined,
  keep?: string | null,
  providerHint = "Your own payment account",
): { label: string; value: string }[] {
  const options = (list ?? [])
    .filter((c) => c.selectable)
    .map((c) => ({
      label: c.route === "provider" ? `${currencyLabel(c)} (${providerHint})` : currencyLabel(c),
      value: c.code,
    }));
  const kept = keep?.toUpperCase();
  if (kept && !options.some((o) => o.value === kept)) {
    options.push({ label: `${kept} (not available for new prices)`, value: kept });
  }
  return options;
}

/** The org price row for `code` when membership prices can use it, else null. */
export function orgPriceCurrency(
  code: string | null | undefined,
  list: readonly OrgPriceCurrency[] | null | undefined,
): OrgPriceCurrency | null {
  if (!code) return null;
  const upper = code.toUpperCase();
  return (list ?? []).find((c) => c.code === upper && c.selectable) ?? null;
}

/**
 * One line under a membership price picker when the chosen currency is paid
 * into the org's own account, else null.
 */
export function providerRouteNote(
  code: string | null | undefined,
  list: readonly OrgPriceCurrency[] | null | undefined,
  providerHint = "Your own payment account",
): string | null {
  const row = orgPriceCurrency(code, list);
  if (!row || row.route !== "provider") return null;
  const where = providerHint.charAt(0).toLowerCase() + providerHint.slice(1);
  return `${row.code} is paid only through ${where}. Keep it connected so members can pay.`;
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

// ─── Provider-account currencies ────────────────────────────────────────────

export const PROVIDER_CURRENCY_ERROR_CODES = [
  "PROVIDER_CURRENCY_NOT_ON_ACCOUNT",
  "PROVIDER_CURRENCY_UNKNOWN",
  "PROVIDER_CURRENCY_UNSUPPORTED",
  "PROVIDER_CURRENCY_BLOCKED",
  "PROVIDER_ACCOUNT_MISSING",
  "GATEWAY_NOT_SUPPORTED",
  "PROVIDER_ACCOUNT_CHECK_FAILED",
] as const;

/**
 * What to tell a provider when adding, removing or re-checking a currency on
 * their own account is refused. A 502 PROVIDER_ACCOUNT_CHECK_FAILED (or any
 * 5xx) keys off the code only: the API hides 5xx messages in production. The
 * 400s carry plain server copy ("Your Paystack account doesn't have GHS
 * enabled. Enable it with Paystack, then try again."); the fallbacks below
 * only cover an empty message.
 */
export function providerCurrencyMessage(
  res: Pick<ApiResponse<unknown>, "code" | "message" | "status">,
  gatewayLabel: string,
  code?: string,
): string {
  if (res.code === "PROVIDER_ACCOUNT_CHECK_FAILED" || (res.status ?? 0) >= 500) {
    return `We couldn't reach ${gatewayLabel} to check your account. Try again.`;
  }
  const message = (res.message ?? "").trim();
  if (message) return message;
  const c = code ?? "This currency";
  switch (res.code) {
    case "PROVIDER_CURRENCY_NOT_ON_ACCOUNT":
      return `Your ${gatewayLabel} account doesn't have ${c} enabled. Enable it with ${gatewayLabel}, then try again.`;
    case "PROVIDER_CURRENCY_UNKNOWN":
      return `${c} isn't a currency we recognise.`;
    case "PROVIDER_CURRENCY_UNSUPPORTED":
      return `${gatewayLabel} can't charge ${c}, so it can't be added.`;
    case "PROVIDER_CURRENCY_BLOCKED":
      return `${c} can't be used with your own ${gatewayLabel} account right now.`;
    case "PROVIDER_ACCOUNT_MISSING":
      return `Connect your ${gatewayLabel} account first.`;
    case "GATEWAY_NOT_SUPPORTED":
      return "That payment provider's currencies can't be checked yet.";
    default:
      return "Something went wrong. Try again.";
  }
}

function count(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "2 active plans and 1 payment in progress", or "" when nothing is held. */
export function describeCurrencyLock(lock: { live_plans: number; pending_payments: number } | undefined): string {
  if (!lock) return "";
  const parts: string[] = [];
  if (lock.live_plans > 0) parts.push(count(lock.live_plans, "active plan", "active plans"));
  if (lock.pending_payments > 0) {
    parts.push(count(lock.pending_payments, "payment in progress", "payments in progress"));
  }
  return parts.join(" and ");
}

/**
 * Every ISO 4217 code this browser knows, with its English name, for the
 * "add a currency" picker. Not a list of what Paystack accepts: the API
 * checks each one with Paystack and says why when it can't be added. Empty
 * when the runtime has no Intl.supportedValuesOf; the caller then takes a
 * typed code.
 */
export function isoCurrencyChoices(): { code: string; name: string }[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "currency") => string[] };
  if (typeof intl.supportedValuesOf !== "function") return [];
  let codes: string[];
  try {
    codes = intl.supportedValuesOf("currency");
  } catch {
    return [];
  }
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "currency" });
  } catch {
    names = null;
  }
  return codes
    .filter((c) => /^[A-Z]{3}$/.test(c))
    .map((code) => ({ code, name: names?.of(code) ?? code }));
}
