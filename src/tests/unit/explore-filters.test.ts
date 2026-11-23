import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FILTERS,
  applyEmptyAction,
  buildListingParams,
  distanceLabel,
  emptyActions,
  emptyCopy,
  exploreQueryString,
  parseExploreQuery,
  placeLabel,
  resultsCaption,
  sortCaption,
  type ExploreFilters,
} from "@/lib/marketplace/exploreFilters";
import {
  fallbackNotice,
  requestBrowserPosition,
  resolveExplorePlace,
} from "@/lib/marketplace/explorePlace";

const parse = (qs: string) => parseExploreQuery(new URLSearchParams(qs));
const NONE = { coords: null, city: null, country: null };

describe("Explore filters <-> URL", () => {
  it("keeps a plain /marketplace plain", () => {
    expect(exploreQueryString(DEFAULT_FILTERS, null)).toBe("");
    expect(parse("")).toEqual({ filters: DEFAULT_FILTERS, picked: null });
  });

  it("round-trips every filter and a picked city", () => {
    const f: ExploreFilters = {
      type: "dietitian",
      query: "pcos",
      radiusKm: 10,
      sort: "price_asc",
      acceptingOnly: true,
      verifiedOnly: true,
      minRating: 4,
      specs: ["pcos", "diabetes"],
      pops: ["adults"],
      page: 2,
    };
    const picked = { name: "Lagos", countryCode: "NG", lat: 6.45, lng: 3.39 };
    const qs = exploreQueryString(f, picked);
    expect(qs).toBe(
      "type=dietitian&q=pcos&sort=price_asc&radius=10&accepting=1&verified=1&rating=4&specs=pcos%2Cdiabetes&pops=adults&city=Lagos&country=NG&lat=6.45&lng=3.39&page=2",
    );
    expect(parse(qs)).toEqual({ filters: f, picked });
  });

  it("drops unknown or malformed values instead of sending them", () => {
    const { filters, picked } = parse("type=wizard&sort=nearest&radius=7&rating=5&page=-3&specs=pcos,bogus&city=Lagos&country=Nigeria&lat=x&lng=3");
    expect(filters).toEqual({ ...DEFAULT_FILTERS });
    expect(picked).toBeNull();
  });

  it("keeps dietitian credentials only on the Dietitians tab", () => {
    expect(parse("type=gym_owner&specs=pcos").filters.specs).toEqual([]);
    expect(exploreQueryString({ ...DEFAULT_FILTERS, type: "gym_owner", specs: ["pcos"] }, null)).toBe("type=gym_owner");
  });
});

describe("Explore search request (mobile listingQuery parameters)", () => {
  it("sends coordinates and the radius when Explore has a point, never city text", () => {
    const p = buildListingParams({ ...DEFAULT_FILTERS, radiusKm: 25 }, { coords: { lat: 6.5, lng: 3.4 }, city: "Lagos", country: "NG" });
    expect(p).toEqual({ page: 1, limit: 20, lat: 6.5, lng: 3.4, radius_km: 25 });
  });

  it("falls back to the city and country as text, then to nothing", () => {
    expect(buildListingParams(DEFAULT_FILTERS, { coords: null, city: "Lagos", country: "NG" })).toEqual({ page: 1, limit: 20, city: "Lagos", country_code: "NG" });
    expect(buildListingParams(DEFAULT_FILTERS, { coords: null, city: null, country: "NG" })).toEqual({ page: 1, limit: 20, country_code: "NG" });
    expect(buildListingParams(DEFAULT_FILTERS, NONE)).toEqual({ page: 1, limit: 20 });
  });

  it("maps the type, search, sort and every filter to the API's names", () => {
    const p = buildListingParams(
      { ...DEFAULT_FILTERS, type: "dietitian", query: "  ada  ", sort: "price_asc", acceptingOnly: true, verifiedOnly: true, minRating: 3, specs: ["pcos"], pops: ["athletes", "adults"], page: 3 },
      NONE,
      "NGN",
    );
    expect(p).toEqual({
      page: 3,
      limit: 20,
      account_type: "dietitian",
      q: "ada",
      sort: "price_asc",
      currency: "NGN",
      accepting_clients: true,
      verified_only: true,
      min_rating: 3,
      specializations: "pcos",
      populations: "athletes,adults",
    });
  });

  it("sends the currency only with the price sort, and no sort for the default", () => {
    expect(buildListingParams({ ...DEFAULT_FILTERS, sort: "rating" }, NONE, "NGN")).toEqual({ page: 1, limit: 20, sort: "rating" });
    expect(buildListingParams(DEFAULT_FILTERS, NONE, "NGN")).not.toHaveProperty("sort");
    expect(buildListingParams(DEFAULT_FILTERS, NONE, "NGN")).not.toHaveProperty("currency");
  });
});

describe("Explore captions and empty states (mobile copy)", () => {
  const near = { coords: { lat: 1, lng: 2 }, city: null, country: null };
  it("says how many, and where, only as far as the request went", () => {
    expect(resultsCaption(5, { ...DEFAULT_FILTERS, radiusKm: 25 }, near, "Lagos")).toBe("5 providers near Lagos, within 25 km");
    expect(resultsCaption(1, { ...DEFAULT_FILTERS, type: "personal_trainer" }, { coords: null, city: "Lagos", country: "NG" }, "Lagos")).toBe("1 trainer in Lagos");
    expect(resultsCaption(2, DEFAULT_FILTERS, NONE, null)).toBe("2 providers");
    expect(sortCaption(DEFAULT_FILTERS, near)).toBe("Sorted by nearest");
    expect(sortCaption(DEFAULT_FILTERS, NONE)).toBe("Sorted by top rated");
  });

  it("offers single-change actions", () => {
    expect(emptyActions(DEFAULT_FILTERS, true)).toEqual([{ id: "pick-city", label: "Search another city" }]);
    const f = { ...DEFAULT_FILTERS, query: "x", radiusKm: 10, acceptingOnly: true };
    expect(emptyActions(f, true).map((a) => a.label)).toEqual(["Clear search", "Widen to 25 km", 'Remove "Accepting clients"']);
    expect(applyEmptyAction(f, "widen").radiusKm).toBe(25);
    expect(applyEmptyAction(f, "clear-search").query).toBe("");
    expect(emptyCopy({ ...DEFAULT_FILTERS, type: "gym_owner" }, "Lagos", true).title).toBe("No gyms near Lagos yet");
  });

  it("labels distance without fake precision and never prints 'undefined'", () => {
    expect(distanceLabel(4.24, { kind: "gps" }, { location_precision: "exact" })).toBe("4.2 km");
    expect(distanceLabel(4.24, { kind: "gps" }, { location_precision: "city" })).toBe("About 4 km");
    expect(distanceLabel(3, { kind: "city", city: "Lagos", country: "NG" }, { city: "lagos", country_code: "NG" })).toBeUndefined();
    expect(distanceLabel(17.4, { kind: "city", city: "Lagos" }, { city: "Ibadan" })).toBe("17 km");
    expect(distanceLabel(null, { kind: "gps" }, {})).toBeUndefined();
    expect(placeLabel({ city: "Lagos" })).toBe("Lagos");
    expect(placeLabel({ city: "Lagos", country_code: "NG" })).toBe("Lagos, NG");
    expect(placeLabel({})).toBeUndefined();
  });
});

describe("Explore place and the geolocation fallback", () => {
  const base = { picked: null, gps: null, profileCity: "Lagos", profileCountry: "NG", profilePoint: null };

  it("prefers a picked city, then the browser, then the profile city, then the country", () => {
    expect(resolveExplorePlace({ ...base, picked: { name: "Abuja", countryCode: "NG", lat: 9, lng: 7 }, gps: { lat: 1, lng: 1 } }).source).toBe("city");
    expect(resolveExplorePlace({ ...base, gps: { lat: 1, lng: 1 } })).toMatchObject({ source: "gps", place: { coords: { lat: 1, lng: 1 } } });
    expect(resolveExplorePlace({ ...base, profilePoint: { lat: 6.4, lng: 3.3 } })).toMatchObject({
      source: "profile",
      shown: "Lagos, NG",
      place: { coords: { lat: 6.4, lng: 3.3 }, city: null },
    });
    expect(resolveExplorePlace(base)).toMatchObject({ source: "profile", place: { coords: null, city: "Lagos", country: "NG" } });
    expect(resolveExplorePlace({ ...base, profileCity: null })).toMatchObject({ source: "country", place: { country: "NG" } });
    expect(resolveExplorePlace({ ...base, profileCity: null, profileCountry: null }).source).toBe("none");
  });

  it("says which place is in use when the browser gives no position", () => {
    expect(fallbackNotice("denied", { source: "profile", shown: "Lagos, NG" })).toBe("Location is off. Showing Lagos, NG, your profile city.");
    expect(fallbackNotice("unavailable", { source: "country", shown: "NG" })).toBe("Couldn't find your location. Showing NG, your profile country.");
    expect(fallbackNotice("unsupported", { source: "none", shown: null })).toBe("This browser can't share your location. Pick a city to sort by distance.");
  });

  it("reads a position, a refusal, a failure and a browser without geolocation", async () => {
    const ok = { getCurrentPosition: vi.fn((s: PositionCallback) => s({ coords: { latitude: 6.5, longitude: 3.4 } } as GeolocationPosition)) };
    await expect(requestBrowserPosition(ok)).resolves.toEqual({ ok: true, lat: 6.5, lng: 3.4 });
    const denied = { getCurrentPosition: vi.fn((_s: PositionCallback, e?: PositionErrorCallback | null) => e?.({ code: 1 } as GeolocationPositionError)) };
    await expect(requestBrowserPosition(denied)).resolves.toEqual({ ok: false, reason: "denied" });
    const timeout = { getCurrentPosition: vi.fn((_s: PositionCallback, e?: PositionErrorCallback | null) => e?.({ code: 3 } as GeolocationPositionError)) };
    await expect(requestBrowserPosition(timeout)).resolves.toEqual({ ok: false, reason: "unavailable" });
    await expect(requestBrowserPosition(null)).resolves.toEqual({ ok: false, reason: "unsupported" });
  });
});
