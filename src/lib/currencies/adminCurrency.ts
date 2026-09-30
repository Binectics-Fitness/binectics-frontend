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
  UpdateAdminCurrency,
} from "@/lib/api/admin";

export interface CurrencyDraft {
  platform_enabled: boolean;
  name: string;
  symbol: string;
  notes: string;
  gateways: Record<string, { account_enabled: boolean; methods: PaymentMethodCode[] }>;
}

export function draftOf(c: AdminCurrency): CurrencyDraft {
  return {
    platform_enabled: c.platform_enabled,
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
