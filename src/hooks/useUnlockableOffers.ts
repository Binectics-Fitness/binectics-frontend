"use client";

import { useEffect, useState } from "react";
import { marketplaceService } from "@/lib/api/marketplace";
import { paidContentService, type ContentOffer } from "@/lib/api/paidContent";
import { offersFromListing } from "@/lib/paidContent/offers";

const MAX_PROVIDERS = 6;
/** Entitlements are read 100 at a time, up to this many pages (500 items). */
const ENTITLEMENT_PAGE = 100;
const MAX_ENTITLEMENT_PAGES = 5;

/**
 * Every item the member holds, in any state, or null when the read failed or
 * the member holds more than the cap. Null means "do not know": the caller
 * shows no offers, since an item they already have must never be offered
 * for sale again.
 */
async function heldKeys(): Promise<Set<string> | null> {
  const held = new Set<string>();
  let cursor: string | null = null;
  for (let page = 0; page < MAX_ENTITLEMENT_PAGES; page++) {
    const res = await paidContentService.myEntitlements(ENTITLEMENT_PAGE, cursor);
    if (!res.success || !res.data) return null;
    for (const e of res.data.items) held.add(`${e.itemKind}:${e.itemId}`);
    cursor = res.data.nextCursor;
    if (!cursor) return held;
  }
  return null;
}

/**
 * Paid items the member's own providers offer and the member does not hold
 * yet: my providers -> each listing's `content_offers` -> minus what the
 * member already has (any state, so a frozen item shows as a renew card on
 * its own row instead of twice). Quiet on any failure; the list is a
 * convenience. Fails closed: if what the member holds cannot be read in full,
 * no offers show. Does nothing while `enabled` is false.
 */
export function useUnlockableOffers(enabled: boolean) {
  const [offers, setOffers] = useState<ContentOffer[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    void (async () => {
      const mine = await marketplaceService.getMyProviders();
      if (!active || !mine.success || !mine.data) return;
      const ids = [
        ...mine.data.professionals.map((p) => p.listing?._id),
        ...mine.data.gyms.map((g) => g.listing?._id),
      ].filter((id): id is string => !!id);
      const unique = [...new Set(ids)].slice(0, MAX_PROVIDERS);
      if (unique.length === 0) return;
      const [listings, owned] = await Promise.all([
        Promise.all(unique.map((id) => marketplaceService.getListingById(id))),
        heldKeys(),
      ]);
      if (!active || !owned) return;
      const seen = new Set<string>();
      const out: ContentOffer[] = [];
      for (const l of listings) {
        if (!l.success) continue;
        for (const o of offersFromListing(l.data)) {
          const key = `${o.itemKind}:${o.itemId}`;
          if (owned.has(key) || seen.has(key)) continue;
          seen.add(key);
          out.push(o);
        }
      }
      setOffers(out);
    })();
    return () => {
      active = false;
    };
  }, [enabled]);
  return offers;
}
