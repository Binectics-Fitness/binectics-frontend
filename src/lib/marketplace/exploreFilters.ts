/**
 * Web Explore's filters, as one value, and how they map to the URL and to
 * GET /marketplace/listings. A port of binectics-mobile
 * src/utils/exploreFilters.ts (#250, #253, #256): the same fields, the same
 * API query parameters, the same captions and empty states. Nothing here is
 * invented client-side.
 *
 * URL keys (defaults are left out, so a plain /marketplace stays plain):
 *   type     gym_owner | personal_trainer | dietitian
 *   q        search text
 *   sort     rating | newest | price_asc (absent: nearest when a place has
 *            coordinates, otherwise top rated)
 *   radius   5 | 10 | 25 | 50 (km; only sent with coordinates)
 *   accepting=1, verified=1, rating=3|4
 *   specs, pops   dietitian codes, comma-separated
 *   city, country, lat, lng   a city the member picked
 *   page     1-based
 * The browser's own position is never written to the URL, so a shared link
 * carries no one's location.
 */
import type { MarketplaceAccountType, MarketplaceSearchParams } from "@/lib/types";
import { DIETITIAN_POPULATIONS, DIETITIAN_SPECIALIZATIONS } from "@/lib/credentials/dietitian";

export type ExploreSort = "default" | "rating" | "newest" | "price_asc";
export type ExploreType = MarketplaceAccountType | "";

export interface ExploreFilters {
  type: ExploreType;
  query: string;
  /** Only sent when Explore has coordinates. */
  radiusKm: number;
  sort: ExploreSort;
  acceptingOnly: boolean;
  verifiedOnly: boolean;
  /** 0 = any. Unreviewed providers have no rating, so a minimum hides them. */
  minRating: 0 | 3 | 4;
  /** Dietitian credential codes; only sent while Dietitians is selected. */
  specs: string[];
  pops: string[];
  page: number;
}

/** A city from GET /utility/cities that the member picked. */
export interface PickedCity {
  name: string;
  countryCode: string;
  lat: number;
  lng: number;
}

/** Where distances are measured from, or only a city/country text filter. */
export interface ExplorePlace {
  coords: { lat: number; lng: number } | null;
  city: string | null;
  country: string | null;
}

export const DEFAULT_RADIUS_KM = 50;
export const RADIUS_STEPS_KM = [5, 10, 25, 50] as const;
export const PAGE_SIZE = 20;

export const DEFAULT_FILTERS: ExploreFilters = {
  type: "",
  query: "",
  radiusKm: DEFAULT_RADIUS_KM,
  sort: "default",
  acceptingOnly: false,
  verifiedOnly: false,
  minRating: 0,
  specs: [],
  pops: [],
  page: 1,
};

export const TYPE_TABS: readonly { label: string; value: ExploreType }[] = [
  { label: "All", value: "" },
  { label: "Gyms", value: "gym_owner" },
  { label: "Trainers", value: "personal_trainer" },
  { label: "Dietitians", value: "dietitian" },
];

export const SORT_OPTIONS: readonly { label: string; value: ExploreSort }[] = [
  { label: "Nearest", value: "default" },
  { label: "Top rated", value: "rating" },
  { label: "Newest", value: "newest" },
  { label: "Price, low to high", value: "price_asc" },
];

export const RATING_OPTIONS: readonly { label: string; value: 0 | 3 | 4 }[] = [
  { label: "Any", value: 0 },
  { label: "3+", value: 3 },
  { label: "4+", value: 4 },
];

const TYPE_NOUN: Record<MarketplaceAccountType, { one: string; many: string }> = {
  gym_owner: { one: "gym", many: "gyms" },
  personal_trainer: { one: "trainer", many: "trainers" },
  dietitian: { one: "dietitian", many: "dietitians" },
};

export function typeNoun(type: ExploreType): { one: string; many: string } {
  return type ? TYPE_NOUN[type] : { one: "provider", many: "providers" };
}

const TYPES = new Set<string>(["gym_owner", "personal_trainer", "dietitian"]);
const SORTS = new Set<string>(["rating", "newest", "price_asc"]);
const SPEC_CODES = new Set(DIETITIAN_SPECIALIZATIONS.map((s) => s.code));
const POP_CODES = new Set(DIETITIAN_POPULATIONS.map((s) => s.code));

function codes(raw: string | null, allowed: Set<string>): string[] {
  if (!raw) return [];
  return [...new Set(raw.split(",").map((c) => c.trim()).filter((c) => allowed.has(c)))];
}

function finite(raw: string | null): number | null {
  if (raw === null || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Reads the URL. Unknown or malformed values fall back to the defaults. */
export function parseExploreQuery(sp: Pick<URLSearchParams, "get">): {
  filters: ExploreFilters;
  picked: PickedCity | null;
} {
  const type = sp.get("type") ?? "";
  const sort = sp.get("sort") ?? "";
  const radius = finite(sp.get("radius"));
  const rating = finite(sp.get("rating"));
  const page = finite(sp.get("page"));
  const filters: ExploreFilters = {
    type: TYPES.has(type) ? (type as MarketplaceAccountType) : "",
    query: (sp.get("q") ?? "").slice(0, 100),
    radiusKm: RADIUS_STEPS_KM.includes(radius as (typeof RADIUS_STEPS_KM)[number]) ? (radius as number) : DEFAULT_RADIUS_KM,
    sort: SORTS.has(sort) ? (sort as ExploreSort) : "default",
    acceptingOnly: sp.get("accepting") === "1",
    verifiedOnly: sp.get("verified") === "1",
    minRating: rating === 3 || rating === 4 ? rating : 0,
    specs: codes(sp.get("specs"), SPEC_CODES),
    pops: codes(sp.get("pops"), POP_CODES),
    page: page && page >= 1 ? Math.floor(page) : 1,
  };
  if (filters.type !== "dietitian") {
    filters.specs = [];
    filters.pops = [];
  }
  const name = sp.get("city")?.trim();
  const country = sp.get("country")?.trim().toUpperCase();
  const lat = finite(sp.get("lat"));
  const lng = finite(sp.get("lng"));
  const picked =
    name && country && /^[A-Z]{2}$/.test(country) && lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
      ? { name, countryCode: country, lat, lng }
      : null;
  return { filters, picked };
}

/** The query string for a state ("" for all defaults), keys in a stable order. */
export function exploreQueryString(f: ExploreFilters, picked: PickedCity | null): string {
  const out = new URLSearchParams();
  if (f.type) out.set("type", f.type);
  const q = f.query.trim();
  if (q) out.set("q", q);
  if (f.sort !== "default") out.set("sort", f.sort);
  if (f.radiusKm !== DEFAULT_RADIUS_KM) out.set("radius", String(f.radiusKm));
  if (f.acceptingOnly) out.set("accepting", "1");
  if (f.verifiedOnly) out.set("verified", "1");
  if (f.minRating > 0) out.set("rating", String(f.minRating));
  if (f.type === "dietitian") {
    if (f.specs.length) out.set("specs", f.specs.join(","));
    if (f.pops.length) out.set("pops", f.pops.join(","));
  }
  if (picked) {
    out.set("city", picked.name);
    out.set("country", picked.countryCode);
    out.set("lat", String(picked.lat));
    out.set("lng", String(picked.lng));
  }
  if (f.page > 1) out.set("page", String(f.page));
  return out.toString();
}

/** Dietitian credential filters only exist while Dietitians is the chosen type. */
export function credentialsActive(f: ExploreFilters): boolean {
  return f.type === "dietitian" && (f.specs.length > 0 || f.pops.length > 0);
}

/**
 * The request for one page, with the parameters mobile sends
 * (marketplace.ts listingQuery): coordinates and a radius when Explore has
 * a point, otherwise the city and country as text, otherwise nothing (a
 * global, top-rated list).
 */
export function buildListingParams(
  f: ExploreFilters,
  place: ExplorePlace,
  /** The member's own currency: sent with the price sort only. */
  currency?: string | null,
): MarketplaceSearchParams {
  const params: MarketplaceSearchParams = { page: f.page, limit: PAGE_SIZE };
  if (f.type) params.account_type = f.type;
  const q = f.query.trim();
  if (q) params.q = q;
  if (place.coords) {
    params.lat = place.coords.lat;
    params.lng = place.coords.lng;
    params.radius_km = f.radiusKm;
  } else {
    if (place.country) params.country_code = place.country;
    if (place.city) params.city = place.city;
  }
  if (f.sort !== "default") params.sort = f.sort;
  if (f.sort === "price_asc" && currency) params.currency = currency;
  if (f.acceptingOnly) params.accepting_clients = true;
  if (f.verifiedOnly) params.verified_only = true;
  if (f.minRating > 0) params.min_rating = f.minRating;
  if (credentialsActive(f)) {
    if (f.specs.length) params.specializations = f.specs.join(",");
    if (f.pops.length) params.populations = f.pops.join(",");
  }
  return params;
}

/** Whether anything beyond the type and the search text narrows the list. */
export function hasNarrowingFilters(f: ExploreFilters, hasCoords: boolean): boolean {
  return (
    (hasCoords && f.radiusKm !== DEFAULT_RADIUS_KM) ||
    f.acceptingOnly ||
    f.verifiedOnly ||
    f.minRating > 0 ||
    credentialsActive(f)
  );
}

/** The filters cleared; the type, the search text and the sort stay. */
export function clearFilters(f: ExploreFilters): ExploreFilters {
  return { ...DEFAULT_FILTERS, type: f.type, query: f.query, sort: f.sort };
}

/** The next distance step up, or null at the widest. */
export function widerRadius(km: number): number | null {
  return RADIUS_STEPS_KM.find((s) => s > km) ?? null;
}

/** "1 trainer", "12 providers": from pagination.total, never the loaded count. */
export function countLabel(total: number, type: ExploreType): string {
  const noun = typeNoun(type);
  return `${total} ${total === 1 ? noun.one : noun.many}`;
}

/**
 * The line above the list: how many, and where, claiming only what the
 * request did ("5 trainers near Lagos, within 25 km").
 */
export function resultsCaption(total: number, f: ExploreFilters, place: ExplorePlace, placeName: string | null): string {
  const count = countLabel(total, f.type);
  if (place.coords) return placeName ? `${count} near ${placeName}, within ${f.radiusKm} km` : `${count} within ${f.radiusKm} km`;
  if (place.city) return `${count} in ${place.city}`;
  if (place.country) return `${count} in ${place.country}`;
  return count;
}

/** What the list is sorted by. Nearest only when coordinates were sent. */
export function sortCaption(f: ExploreFilters, place: ExplorePlace): string {
  if (f.sort === "rating") return "Sorted by top rated";
  if (f.sort === "newest") return "Sorted by newest";
  if (f.sort === "price_asc") return "Sorted by price, low to high";
  return place.coords ? "Sorted by nearest" : "Sorted by top rated";
}

export type EmptyActionId =
  | "clear-search"
  | "widen"
  | "remove-accepting"
  | "remove-verified"
  | "remove-rating"
  | "clear-credentials"
  | "pick-city";

/** Each action changes exactly one named thing (mobile emptyActions). */
export function emptyActions(f: ExploreFilters, hasCoords: boolean): { id: EmptyActionId; label: string }[] {
  if (!f.query.trim() && !hasNarrowingFilters(f, hasCoords)) return [{ id: "pick-city", label: "Search another city" }];
  const out: { id: EmptyActionId; label: string }[] = [];
  if (f.query.trim()) out.push({ id: "clear-search", label: "Clear search" });
  const wider = hasCoords ? widerRadius(f.radiusKm) : null;
  if (wider) out.push({ id: "widen", label: `Widen to ${wider} km` });
  if (f.acceptingOnly) out.push({ id: "remove-accepting", label: 'Remove "Accepting clients"' });
  if (f.verifiedOnly) out.push({ id: "remove-verified", label: 'Remove "Verified only"' });
  if (f.minRating > 0) out.push({ id: "remove-rating", label: `Remove "Rated ${f.minRating}+"` });
  if (credentialsActive(f)) out.push({ id: "clear-credentials", label: "Clear specialities" });
  return out;
}

/** The filter change an action makes; "pick-city" changes the place instead. */
export function applyEmptyAction(f: ExploreFilters, id: Exclude<EmptyActionId, "pick-city">): ExploreFilters {
  const next = { ...f, page: 1 };
  switch (id) {
    case "clear-search":
      return { ...next, query: "" };
    case "widen":
      return { ...next, radiusKm: widerRadius(f.radiusKm) ?? f.radiusKm };
    case "remove-accepting":
      return { ...next, acceptingOnly: false };
    case "remove-verified":
      return { ...next, verifiedOnly: false };
    case "remove-rating":
      return { ...next, minRating: 0 };
    case "clear-credentials":
      return { ...next, specs: [], pops: [] };
  }
}

/** Category-specific empty copy. The place is only named when it is known. */
export function emptyCopy(f: ExploreFilters, placeName: string | null, hasCoords: boolean): { title: string; description: string } {
  const q = f.query.trim();
  if (q) return { title: `No matches for "${q}"`, description: "Check the spelling, or try a shorter search." };
  const many = typeNoun(f.type).many;
  if (hasNarrowingFilters(f, hasCoords)) {
    return { title: `No ${many} match`, description: "Try a wider distance or drop a filter." };
  }
  const where = placeName ? ` near ${placeName}` : "";
  return {
    title: `No ${many}${where} yet`,
    description: `We only list ${many} that have joined Binectics, so some areas have none yet.`,
  };
}

/**
 * The card's distance, claiming no more precision than the points have
 * (mobile utils/plans.ts distanceLabel): from the browser's position to a
 * provider-placed listing "4.2 km"; to a city-level listing "About 4 km";
 * from a city (profile or picked) whole km, and nothing for a listing in
 * that same city. Undefined without a distance from the API.
 */
export function distanceLabel(
  km: number | null | undefined,
  origin: { kind: "gps" | "city"; city?: string | null; country?: string | null },
  listing: { city?: string | null; country_code?: string | null; location_precision?: string | null },
): string | undefined {
  if (km == null || !Number.isFinite(km) || km < 0) return undefined;
  const whole = Math.max(1, Math.round(km));
  if (origin.kind === "gps") {
    return listing.location_precision === "exact" ? `${Math.max(0.1, Math.round(km * 10) / 10).toFixed(1)} km` : `About ${whole} km`;
  }
  const fold = (s: string | null | undefined) =>
    (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  const sameCity =
    !!origin.city &&
    fold(listing.city) === fold(origin.city) &&
    (!origin.country || !listing.country_code || fold(listing.country_code) === fold(origin.country));
  return sameCity ? undefined : `${whole} km`;
}

/** "Lagos, NG", "Lagos", "NG" or undefined (never "Lagos, undefined"). */
export function placeLabel(l: { city?: string | null; country_code?: string | null }): string | undefined {
  const city = l.city?.trim();
  const country = l.country_code?.trim();
  if (!city) return country || undefined;
  return country ? `${city}, ${country}` : city;
}
