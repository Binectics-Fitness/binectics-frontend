/**
 * Display helpers for a marketplace listing card. The price is the listing's
 * own "from" price in its own currency, as the API returns it; there is no
 * conversion and no made-up fallback amount.
 */

import type { MarketplaceListing } from "@/lib/types";
import type { PlatformCurrency } from "@/lib/api/currencies";
import { formatMinor } from "@/lib/currencies/helpers";

type Populated = MarketplaceListing & {
  organization?: { name?: string } | null;
  professional?: { first_name?: string; last_name?: string } | null;
};

/** The org's name, else the professional's, else the headline. */
export function listingDisplayName(l: MarketplaceListing): string {
  const p = l as Populated;
  const org = typeof l.organization_id === "object" && l.organization_id ? l.organization_id.name : p.organization?.name;
  if (org) return org;
  const pro =
    typeof l.professional_id === "object" && l.professional_id ? l.professional_id : p.professional ?? null;
  const full = pro ? `${pro.first_name ?? ""} ${pro.last_name ?? ""}`.trim() : "";
  return full || l.headline;
}

/** "From ₦15,000" from price_from_minor, else the listing's own label, else null. */
export function listingPriceFrom(
  l: Pick<MarketplaceListing, "price_from_minor" | "currency" | "price_label">,
  list?: readonly PlatformCurrency[] | null,
): string | null {
  if (typeof l.price_from_minor === "number" && l.price_from_minor > 0 && l.currency) {
    return `From ${formatMinor(l.currency, l.price_from_minor, { list })}`;
  }
  return l.price_label?.trim() || null;
}
