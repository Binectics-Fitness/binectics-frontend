import { normalizeOffer, type ContentOffer } from "@/lib/api/paidContent";

/** The sellable offers in a listing's raw `content_offers`; junk and unsellable rows dropped. */
export function offersFromListing(listing: unknown): ContentOffer[] {
  const raw = (listing as { content_offers?: unknown } | null | undefined)?.content_offers;
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeOffer)
    .filter((o): o is ContentOffer => !!o && !!o.itemId && (o.prices.length > 0 || o.plans.length > 0));
}

/** What a delivered copy says about its paid access (`access` on the member's own copy). */
export function deliveredAccess(plan: { access?: unknown; paid_access?: unknown }): {
  frozen: boolean;
  itemId: string | null;
} {
  const a = plan.access as { state?: unknown } | undefined;
  const p = plan.paid_access as { item_id?: unknown } | undefined;
  const itemId = p?.item_id != null && String(p.item_id) ? String(p.item_id) : null;
  return { frozen: a?.state === "frozen" && !!itemId, itemId };
}
