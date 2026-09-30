/**
 * Pure pieces of the admin currencies page (app/admin/currencies): the edit
 * draft, the PATCH body built from it, and how in-flight payments are
 * described. Kept out of the page so they can be unit-tested and so the page
 * module exports only its component.
 */

import type {
  AdminCurrency,
  CurrencyInFlight,
  PaymentMethodCode,
  ProviderCurrencyUsage,
  UpdateAdminCurrency,
} from "@/lib/api/admin";
import { ADMIN_CURRENCY_USES } from "@/lib/api/admin";

export interface CurrencyDraft {
  platform_enabled: boolean;
  provider_accounts_allowed: boolean;
  name: string;
  symbol: string;
  notes: string;
  gateways: Record<string, { account_enabled: boolean; methods: PaymentMethodCode[] }>;
}

/** The API reads a missing flag as allowed; so does the page. */
export function providerAccountsAllowed(c: Pick<AdminCurrency, "provider_accounts_allowed">): boolean {
  return c.provider_accounts_allowed !== false;
}

/** Provider-account usage, zeros when the API didn't send it. */
export function providerUsage(c: AdminCurrency): ProviderCurrencyUsage {
  return c.usage.provider ?? { organizations: 0, live_plans: 0, in_flight: 0 };
}

/** "3 orgs, 5 plans, 1 in progress" on providers' own accounts, or "" for none. */
export function describeProviderUsage(u: ProviderCurrencyUsage): string {
  if (u.organizations === 0 && u.live_plans === 0 && u.in_flight === 0) return "";
  const parts = [plural(u.organizations, "org"), plural(u.live_plans, "plan")];
  if (u.in_flight > 0) parts.push(`${u.in_flight} in progress`);
  return parts.join(", ");
}

export function draftOf(c: AdminCurrency): CurrencyDraft {
  return {
    platform_enabled: c.platform_enabled,
    provider_accounts_allowed: providerAccountsAllowed(c),
    name: c.name,
    symbol: c.symbol,
    notes: c.notes ?? "",
    gateways: Object.fromEntries(
      c.gateways.map((g) => [g.gateway, { account_enabled: g.account_enabled, methods: [...g.methods] }]),
    ),
  };
}

/** Only what changed, as the PATCH body. Empty when nothing did. */
export function currencyPatch(c: AdminCurrency, d: CurrencyDraft): UpdateAdminCurrency {
  const patch: UpdateAdminCurrency = {};
  if (d.platform_enabled !== c.platform_enabled) patch.platform_enabled = d.platform_enabled;
  if (d.provider_accounts_allowed !== providerAccountsAllowed(c)) {
    patch.provider_accounts_allowed = d.provider_accounts_allowed;
  }
  if (d.name.trim() && d.name.trim() !== c.name) patch.name = d.name.trim();
  if (d.symbol.trim() && d.symbol.trim() !== c.symbol) patch.symbol = d.symbol.trim();
  if (d.notes.trim() !== (c.notes ?? "")) patch.notes = d.notes.trim() || null;
  const gateways: NonNullable<UpdateAdminCurrency["gateways"]> = [];
  for (const g of c.gateways) {
    const next = d.gateways[g.gateway];
    if (!next) continue;
    const change: { gateway: string; account_enabled?: boolean; methods?: PaymentMethodCode[] } = {
      gateway: g.gateway,
    };
    if (next.account_enabled !== g.account_enabled) change.account_enabled = next.account_enabled;
    const same =
      next.methods.length === g.methods.length && next.methods.every((m) => g.methods.includes(m));
    if (!same) change.methods = next.methods;
    if (Object.keys(change).length > 1) gateways.push(change);
  }
  if (gateways.length) patch.gateways = gateways;
  return patch;
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "2 held bookings, 1 pending membership", or "" when nothing is in flight. */
export function describeInFlight(f: Partial<CurrencyInFlight> | undefined): string {
  if (!f) return "";
  const parts: string[] = [];
  if (f.pending_bookings) parts.push(plural(f.pending_bookings, "held booking"));
  if (f.pending_subscriptions) parts.push(plural(f.pending_subscriptions, "pending membership"));
  if (f.pending_provider_checkouts) parts.push(plural(f.pending_provider_checkouts, "provider checkout"));
  return parts.join(", ");
}

export { plural };

export const reasonKey = (reasons: readonly { code: string; message: string }[]) =>
  reasons.map((r) => `${r.code}:${r.message}`).join("|");

/**
 * The reasons most "off" uses in a row share, when at least two share them
 * exactly (GHS: "Paystack can charge GHS, but it isn't enabled on our
 * account" under several columns). The row states them once; a use that is
 * off for different reasons keeps its own (USD: bank transfer). Null when no
 * two off uses share their reasons.
 */
export function sharedOffReasons(currency: AdminCurrency): { code: string; message: string }[] | null {
  const off = ADMIN_CURRENCY_USES.map((u) => currency.effective[u]).filter(
    (e): e is NonNullable<typeof e> => !!e && !e.selectable && e.reasons.length > 0,
  );
  const counts = new Map<string, { n: number; reasons: { code: string; message: string }[] }>();
  for (const e of off) {
    const k = reasonKey(e.reasons);
    const hit = counts.get(k);
    counts.set(k, { n: (hit?.n ?? 0) + 1, reasons: e.reasons });
  }
  let best: { n: number; reasons: { code: string; message: string }[] } | null = null;
  for (const v of counts.values()) if (!best || v.n > best.n) best = v;
  return best && best.n >= 2 ? best.reasons : null;
}
