/**
 * Where web Explore looks from, as mobile's useExplorePlace decides it
 * (binectics-mobile src/hooks/useExplorePlace.ts), in this order:
 * 1. a city the member picked (from GET /utility/cities),
 * 2. the browser's position, once the member allowed it,
 * 3. the member's profile city, resolved to a point through the same city
 *    table the API places listings with (listing-place.ts), so the list is
 *    still nearest first,
 * 4. the profile city, or only the profile country, as a text filter,
 * 5. nothing: a global, top-rated list.
 * The place line always names which one is in use; it never claims "near
 * you" for a profile city.
 */
import { apiClient } from "@/lib/api/client";
import type { ExplorePlace, PickedCity } from "./exploreFilters";

export type PlaceSource = "city" | "gps" | "profile" | "country" | "none";

/** Why the browser gave no position. */
export type GeoFailure = "denied" | "unavailable" | "unsupported";

export interface ResolvedPlace {
  place: ExplorePlace;
  source: PlaceSource;
  /** The place line, e.g. "Lagos, NG". Null when nothing is known. */
  shown: string | null;
  /** "Lagos", for "No gyms near Lagos yet". */
  name: string | null;
  /** What card distances are measured from. */
  origin: { kind: "gps" | "city"; city?: string | null; country?: string | null };
}

export function resolveExplorePlace(input: {
  picked: PickedCity | null;
  gps: { lat: number; lng: number } | null;
  /** A short name for the browser's position, when one is known. */
  gpsLabel?: string | null;
  profileCity: string | null;
  profileCountry: string | null;
  /** The profile city's point, when /utility/cities matched it exactly. */
  profilePoint: { lat: number; lng: number } | null;
}): ResolvedPlace {
  const { picked, gps, profileCity, profileCountry, profilePoint } = input;
  const profileShown = profileCity ? (profileCountry ? `${profileCity}, ${profileCountry}` : profileCity) : null;
  if (picked) {
    return {
      place: { coords: { lat: picked.lat, lng: picked.lng }, city: null, country: null },
      source: "city",
      shown: `${picked.name}, ${picked.countryCode}`,
      name: picked.name,
      origin: { kind: "city", city: picked.name, country: picked.countryCode },
    };
  }
  if (gps) {
    return {
      place: { coords: gps, city: null, country: null },
      source: "gps",
      shown: input.gpsLabel ?? "Your location",
      name: input.gpsLabel ? input.gpsLabel.split(",")[0] : null,
      origin: { kind: "gps" },
    };
  }
  if (profileCity) {
    return {
      place: { coords: profilePoint, city: profilePoint ? null : profileCity, country: profileCountry },
      source: "profile",
      shown: profileShown,
      name: profileCity,
      origin: { kind: "city", city: profileCity, country: profileCountry },
    };
  }
  if (profileCountry) {
    return {
      place: { coords: null, city: null, country: profileCountry },
      source: "country",
      shown: profileCountry,
      name: null,
      origin: { kind: "city", city: null, country: profileCountry },
    };
  }
  return { place: { coords: null, city: null, country: null }, source: "none", shown: null, name: null, origin: { kind: "city" } };
}

/** Permission-purpose text, shown before the browser asks. */
export const LOCATION_PURPOSE = "Used only to sort by distance. Not saved.";

/**
 * The line under "Near me" saying which place is in use, after the browser
 * gave no position (requirement: tell the member what Explore fell back to).
 */
export function fallbackNotice(failure: GeoFailure, resolved: Pick<ResolvedPlace, "source" | "shown">): string {
  const why =
    failure === "denied"
      ? "Location is off."
      : failure === "unsupported"
        ? "This browser can't share your location."
        : "Couldn't find your location.";
  if (resolved.source === "profile" && resolved.shown) return `${why} Showing ${resolved.shown}, your profile city.`;
  if (resolved.source === "country" && resolved.shown) return `${why} Showing ${resolved.shown}, your profile country.`;
  return `${why} Pick a city to sort by distance.`;
}

/** The current place line's note: what the place is, in a few words. */
export function sourceNote(source: PlaceSource): string | null {
  if (source === "gps") return "Your location";
  if (source === "profile") return "Your profile city";
  if (source === "country") return "Your profile country";
  if (source === "city") return "Picked city";
  return null;
}

type GeoLike = Pick<Geolocation, "getCurrentPosition">;

/**
 * One position read. Only called from a tap (Near me, or the Nearest sort),
 * never on load, so the browser prompt always follows the member's intent.
 */
export function requestBrowserPosition(
  geo: GeoLike | null | undefined = typeof navigator !== "undefined" ? navigator.geolocation : undefined,
  timeoutMs = 10000,
): Promise<{ ok: true; lat: number; lng: number } | { ok: false; reason: GeoFailure }> {
  if (!geo) return Promise.resolve({ ok: false, reason: "unsupported" });
  return new Promise((resolve) => {
    try {
      geo.getCurrentPosition(
        (pos) => resolve({ ok: true, lat: pos.coords.latitude, lng: pos.coords.longitude }),
        // 1 = PERMISSION_DENIED; 2 POSITION_UNAVAILABLE and 3 TIMEOUT both read as "couldn't find".
        (err) => resolve({ ok: false, reason: err?.code === 1 ? "denied" : "unavailable" }),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
      );
    } catch {
      resolve({ ok: false, reason: "unavailable" });
    }
  });
}

/** Whether the browser already allows location (read silently on load). */
export async function geolocationPermission(): Promise<"granted" | "denied" | "prompt" | "unknown"> {
  try {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) return "unknown";
    const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
    return status.state;
  } catch {
    return "unknown";
  }
}

/** A city row from GET /utility/cities. */
export interface CityResult {
  name: string;
  stateName: string | null;
  countryCode: string;
  countryName: string | null;
  lat: number;
  lng: number;
}

interface RawCity {
  name?: unknown;
  state_name?: unknown;
  country_code?: unknown;
  country_name?: unknown;
  lat?: unknown;
  lng?: unknown;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null;

export function normalizeCity(raw: RawCity): CityResult | null {
  const name = str(raw.name);
  const countryCode = str(raw.country_code)?.toUpperCase() ?? null;
  const lat = num(raw.lat);
  const lng = num(raw.lng);
  if (!name || !countryCode || lat === null || lng === null) return null;
  return { name, stateName: str(raw.state_name), countryCode, countryName: str(raw.country_name), lat, lng };
}

/** Cities starting with `q`, exact names first (public, cached a day by the API). Throws on failure. */
export async function searchCities(q: string, opts: { countryCode?: string | null; limit?: number } = {}): Promise<CityResult[]> {
  const text = q.trim();
  if (!text) return [];
  const query = new URLSearchParams({ q: text });
  if (opts.countryCode) query.set("country_code", opts.countryCode);
  if (opts.limit) query.set("limit", String(opts.limit));
  const res = await apiClient.get<unknown>(`/utility/cities?${query.toString()}`, false);
  if (!res.success) throw new Error(res.message || "Couldn't search cities.");
  const body = res.data as unknown;
  const rows = (Array.isArray(body) ? body : Array.isArray((body as { data?: unknown })?.data) ? (body as { data: unknown[] }).data : []) as RawCity[];
  return rows.map(normalizeCity).filter((c): c is CityResult => c !== null);
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const profileCityCache = new Map<string, Promise<CityResult | null>>();

/**
 * The profile city as a point. Only an exact name (case and accents
 * ignored) counts: a free-typed city that merely starts like another must
 * not move the member.
 */
export function resolveProfileCity(city: string, country: string | null): Promise<CityResult | null> {
  const key = `${fold(city)}|${(country ?? "").toUpperCase()}`;
  let hit = profileCityCache.get(key);
  if (!hit) {
    hit = searchCities(city, { countryCode: country, limit: 10 })
      .then((rows) => rows.find((c) => fold(c.name) === fold(city)) ?? null)
      .catch(() => {
        profileCityCache.delete(key);
        return null;
      });
    profileCityCache.set(key, hit);
  }
  return hit;
}

/** For tests. */
export function clearProfileCityCache() {
  profileCityCache.clear();
}
