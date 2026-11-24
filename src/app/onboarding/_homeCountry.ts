"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOptionalRegion } from "@/contexts/RegionContext";

/**
 * The country a provider track starts on (ISO 3166-1 alpha-2): the
 * account's own when it has one, else the visitor's detected region (web
 * sign-up asks for no country). Undefined until either is known, and when
 * the region is only the API's fallback: the track never starts on one
 * fixed country.
 */
export function useHomeCountry(): string | undefined {
  const { user } = useAuth();
  const region = useOptionalRegion();
  const own = user?.country_code?.toUpperCase();
  if (own && /^[A-Z]{2}$/.test(own)) return own;
  return region?.isDetected && !region.isFallback && /^[A-Z]{2}$/.test(region.country) ? region.country : undefined;
}
