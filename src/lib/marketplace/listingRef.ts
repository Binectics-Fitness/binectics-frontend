/**
 * Which listing a /marketplace/<segment> URL names. Kept apart from
 * publicListing.ts, with no imports, because the middleware loads it too.
 */

export type ListingRef = { kind: "id"; id: string } | { kind: "slug"; slug: string };

const OBJECT_ID = /^[a-f0-9]{24}$/i;
// The API's slug shape (slug.util.ts isValidSlug): lowercase words joined by
// single hyphens, 3 to 80 characters. Anything else cannot be a listing, so
// it is a 404 here without a round trip.
const SLUG = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const SLUG_MIN = 3;
const SLUG_MAX = 80;

/**
 * Reads /marketplace/<segment>: 24 hex characters are an id, a slug-shaped
 * value is a slug, anything else is null. Decided here rather than left to
 * the API, whose id route answered a non-id with a 500 rather than a 404.
 */
export function parseListingParam(raw: string): ListingRef | null {
  let value: string;
  try {
    value = decodeURIComponent(raw).trim();
  } catch {
    return null;
  }
  if (OBJECT_ID.test(value)) return { kind: "id", id: value.toLowerCase() };
  const slug = value.toLowerCase();
  if (slug.length < SLUG_MIN || slug.length > SLUG_MAX) return null;
  if (!SLUG.test(slug) || slug.includes("--")) return null;
  return { kind: "slug", slug };
}

/** The API path that looks a ref up. */
export function listingApiPath(ref: ListingRef): string {
  return ref.kind === "id"
    ? `/marketplace/listings/${ref.id}`
    : `/marketplace/listings/by-slug/${encodeURIComponent(ref.slug)}`;
}
