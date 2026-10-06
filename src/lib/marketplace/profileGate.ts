/**
 * The middleware's 404 for provider profiles that do not exist.
 *
 * The page calls notFound() itself, but the root loading.tsx boundary means
 * the response has already started streaming with a 200 by then; Next can
 * only add a noindex tag. A crawler needs the status, so the middleware
 * decides before rendering starts.
 */

import { serverApiBaseUrl } from "@/lib/api/upstream";
import { listingApiPath, parseListingParam } from "./listingRef";

/** Static routes beside /marketplace/[listingId]. */
const STATIC_CHILDREN = new Set(["search", "map"]);

/** The segment of a /marketplace/<segment> profile address, else null. */
export function profileSegment(pathname: string): string | null {
  const match = /^\/marketplace\/([^/]+)\/?$/.exec(pathname);
  if (!match || STATIC_CHILDREN.has(match[1])) return null;
  return match[1];
}

const LOOKUP_TIMEOUT_MS = 3_000;

/**
 * False only when the profile certainly does not exist: a segment that is
 * neither an id nor a slug, or an API 404. An outage or a slow answer is
 * true, and the page decides; a hiccup must never 404 a real profile.
 */
export async function profileMayExist(segment: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const ref = parseListingParam(segment);
  if (!ref) return false;
  try {
    const res = await fetchImpl(`${serverApiBaseUrl()}${listingApiPath(ref)}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    });
    await res.body?.cancel().catch(() => {});
    return res.status !== 404;
  } catch {
    return true;
  }
}
