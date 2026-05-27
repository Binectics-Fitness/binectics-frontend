"use client";

import { useRegion } from "@/contexts/RegionContext";
import { type PlanTier, type CurrencyCode, getMarketPrice } from "@/lib/constants/regions";

export function useRegionPrice(tier: PlanTier) {
  const { currency, symbol, locale, formatPrice, formatAmount } = useRegion();

  return {
    formatted: formatPrice(tier),
    raw: getMarketPrice(tier, currency),
    currency,
    symbol,
    locale,
    formatAmount,
  };
}

export function useRegionPrices() {
  const region = useRegion();
  return {
    studio: region.formatPrice("studio"),
    premium: region.formatPrice("premium"),
    family: region.formatPrice("family"),
    studioRaw: getMarketPrice("studio", region.currency),
    premiumRaw: getMarketPrice("premium", region.currency),
    familyRaw: getMarketPrice("family", region.currency),
    currency: region.currency as CurrencyCode,
    symbol: region.symbol,
    formatAmount: region.formatAmount,
  };
}
