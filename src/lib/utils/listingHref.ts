import type { MarketplaceListing } from "@/lib/types";

/**
 * Resolve the canonical public URL for a marketplace listing.
 *
 * Prefers per-account-type slug routes (`/gyms/:slug`, `/trainers/:slug`,
 * `/dietitians/:slug`) when a slug is available. Falls back to the legacy
 * id-based detail route so older links keep working until backfill completes.
 */
export function listingHref(
  listing: Pick<MarketplaceListing, "_id" | "account_type"> & {
    slug?: string;
  },
): string {
  if (listing.slug) {
    switch (listing.account_type) {
      case "gym_owner":
        return `/gyms/${listing.slug}`;
      case "personal_trainer":
        return `/trainers/${listing.slug}`;
      case "dietitian":
        return `/dietitians/${listing.slug}`;
    }
  }
  return `/marketplace/${listing._id}`;
}
