"use client";

import { useEffect, useState } from "react";
import { marketplaceService } from "@/lib/api/marketplace";
import { paidContentService, type ContentOffer } from "@/lib/api/paidContent";
import { offersFromListing } from "@/lib/paidContent/offers";

const MAX_PROVIDERS = 6;

/**
 * Paid items the member's own providers offer and the member does not hold
 * yet: my providers -> each listing's `content_offers` -> minus what the
 * member already has (any state, so a frozen item shows as a renew card on
 * its own row instead of twice). Quiet on any failure; the list is a
 * convenience. Does nothing while `enabled` is false.
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
      const [listings, held] = await Promise.all([
        Promise.all(unique.map((id) => marketplaceService.getListingById(id))),
        paidContentService.myEntitlements(100),
      ]);
      if (!active) return;
      const owned = new Set((held.success && held.data ? held.data.items : []).map((e) => `${e.itemKind}:${e.itemId}`));
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
