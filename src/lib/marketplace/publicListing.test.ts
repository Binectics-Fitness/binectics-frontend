import { describe, expect, it, vi } from "vitest";
import { API_UPSTREAM_URL, serverApiBaseUrl } from "@/lib/api/upstream";
import { SITE_URL } from "@/lib/site-url";
import {
  buildListingJsonLd,
  buildListingMetadata,
  fetchPublicListing,
  fetchSitemapListingEntries,
  listingApiPath,
  parseListingParam,
  serializeJsonLd,
  type PublicListing,
} from "./publicListing";

const ID = "6ab9848b08b89fe65f3bf175";

function listing(overrides: Partial<PublicListing> = {}): PublicListing {
  return {
    _id: ID,
    slug: "nouriva-wellness-consult",
    organization_id: undefined,
    professional_id: { _id: "p1", first_name: "Olabisi", last_name: "Adebayo" },
    account_type: "dietitian",
    headline: "Nouriva Wellness Consult",
    bio: "Personalised nutrition for sustainable weight loss.",
    specialties: ["Weight loss", "Postpartum"],
    certifications: [],
    languages: [],
    facilities: [],
    amenities: [],
    photos: ["https://res.cloudinary.com/demo/image/upload/a.jpg"],
    city: "Lagos",
    country_code: "NG",
    currency: "NGN",
    accepting_clients: true,
    is_published: true,
    verification_badge: "none",
    is_suspended: false,
    active_client_count: 2,
    average_rating: 4.8,
    review_count: 12,
    created_at: "2026-09-27T21:03:07.820Z",
    updated_at: "2026-09-27T21:26:02.355Z",
    ...overrides,
  } as PublicListing;
}

const json = (body: unknown, status = 200) => Response.json(body, { status });

describe("parseListingParam", () => {
  it("reads 24 hex characters as an id", () => {
    expect(parseListingParam(ID)).toEqual({ kind: "id", id: ID });
    expect(parseListingParam(ID.toUpperCase())).toEqual({ kind: "id", id: ID });
  });

  it("reads anything slug-shaped as a slug", () => {
    expect(parseListingParam("nouriva-wellness-consult")).toEqual({ kind: "slug", slug: "nouriva-wellness-consult" });
    expect(parseListingParam("Iron-Temple")).toEqual({ kind: "slug", slug: "iron-temple" });
  });

  it("refuses what can be neither", () => {
    for (const junk of ["", "ab", "-lead", "trail-", "double--hyphen", "has space", "a/b", "%E0%A4%A", "<script>", "x".repeat(81)]) {
      expect(parseListingParam(junk)).toBeNull();
    }
  });

  it("routes an id and a slug to their own endpoints", () => {
    expect(listingApiPath({ kind: "id", id: ID })).toBe(`/marketplace/listings/${ID}`);
    expect(listingApiPath({ kind: "slug", slug: "iron-temple" })).toBe("/marketplace/listings/by-slug/iron-temple");
  });
});

describe("serverApiBaseUrl", () => {
  it("uses an absolute NEXT_PUBLIC_API_URL", () => {
    expect(serverApiBaseUrl({ NEXT_PUBLIC_API_URL: "https://binectics.netlify.app/api/v1/" })).toBe(
      "https://binectics.netlify.app/api/v1",
    );
  });

  it("falls back to the proxy's upstream when unset or relative", () => {
    expect(serverApiBaseUrl({})).toBe(API_UPSTREAM_URL);
    expect(serverApiBaseUrl({ NEXT_PUBLIC_API_URL: "/api/v1" })).toBe(API_UPSTREAM_URL);
  });
});

describe("fetchPublicListing", () => {
  it("looks a slug up by slug and an id by id", async () => {
    const fetchImpl = vi.fn(async () => json({ success: true, data: listing() }));
    await fetchPublicListing("nouriva-wellness-consult", fetchImpl);
    await fetchPublicListing(ID, fetchImpl);
    const urls = fetchImpl.mock.calls.map((c) => String((c as unknown[])[0]));
    expect(urls[0]).toMatch(/\/marketplace\/listings\/by-slug\/nouriva-wellness-consult$/);
    expect(urls[1]).toMatch(new RegExp(`/marketplace/listings/${ID}$`));
  });

  it("is null for junk without asking the API", async () => {
    const fetchImpl = vi.fn();
    expect(await fetchPublicListing("not a listing!", fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("is null for a 404 and for a hidden listing", async () => {
    expect(await fetchPublicListing(ID, vi.fn(async () => json({ success: false }, 404)))).toBeNull();
    expect(
      await fetchPublicListing(ID, vi.fn(async () => json({ success: true, data: listing({ is_published: false }) }))),
    ).toBeNull();
  });

  it("throws on an outage rather than calling it a 404", async () => {
    await expect(fetchPublicListing(ID, vi.fn(async () => json({}, 502)))).rejects.toThrow(/502/);
  });
});

describe("buildListingMetadata", () => {
  it("titles the profile without the brand and describes it from the bio", () => {
    const meta = buildListingMetadata(listing());
    expect(meta.title).toBe("Olabisi Adebayo · Dietitian in Lagos");
    expect(String(meta.title)).not.toMatch(/Binectics/);
    expect(meta.description).toBe("Personalised nutrition for sustainable weight loss.");
  });

  it("is canonical at the slug even when reached by id", () => {
    expect(buildListingMetadata(listing()).alternates?.canonical).toBe("/marketplace/nouriva-wellness-consult");
  });

  it("falls back to the id address when there is no slug", () => {
    expect(buildListingMetadata(listing({ slug: undefined })).alternates?.canonical).toBe(`/marketplace/${ID}`);
  });

  it("uses the first photo as the share image", () => {
    const og = buildListingMetadata(listing()).openGraph as { images?: { url: string }[] };
    expect(og.images?.[0]?.url).toBe("https://res.cloudinary.com/demo/image/upload/a.jpg");
    const none = buildListingMetadata(listing({ photos: [] })).openGraph as { images?: unknown };
    expect(none.images).toBeUndefined();
  });

  it("trims a long bio at a word boundary", () => {
    const meta = buildListingMetadata(listing({ bio: "word ".repeat(80) }));
    expect(String(meta.description).length).toBeLessThanOrEqual(160);
    expect(String(meta.description)).toMatch(/word…$/);
  });

  it("builds a description from the headline when there is no bio", () => {
    expect(buildListingMetadata(listing({ bio: "" })).description).toBe(
      "Nouriva Wellness Consult. Dietitian in Lagos on Binectics.",
    );
  });
});

describe("buildListingJsonLd", () => {
  it("describes a solo provider as a Person, with no ratings", () => {
    const ld = buildListingJsonLd(listing());
    expect(ld["@type"]).toBe("Person");
    expect(ld.name).toBe("Olabisi Adebayo");
    expect(ld.url).toBe(`${SITE_URL}/marketplace/nouriva-wellness-consult`);
    expect(ld.address).toEqual({ "@type": "PostalAddress", addressLocality: "Lagos", addressCountry: "NG" });
    expect(ld.knowsAbout).toEqual(["Weight loss", "Postpartum"]);
    const text = JSON.stringify(ld);
    expect(text).not.toMatch(/aggregateRating|AggregateRating|"review"|Review"/);
  });

  it("describes a gym as an ExerciseGym with its street address", () => {
    const ld = buildListingJsonLd(
      listing({ account_type: "gym_owner", organization_id: { _id: "o1", name: "Iron Temple" }, address: "12 Allen Ave" }),
    );
    expect(ld["@type"]).toBe("ExerciseGym");
    expect(ld.name).toBe("Iron Temple");
    expect((ld.address as Record<string, string>).streetAddress).toBe("12 Allen Ave");
  });

  it("describes a non-gym organisation as a ProfessionalService", () => {
    const ld = buildListingJsonLd(listing({ organization_id: { _id: "o1", name: "Nouriva Clinic" } }));
    expect(ld["@type"]).toBe("ProfessionalService");
  });
});

describe("serializeJsonLd", () => {
  it("cannot be closed early by listing text", () => {
    const out = serializeJsonLd(buildListingJsonLd(listing({ bio: '</script><script>alert("x")</script> & more' })));
    expect(out).not.toMatch(/<\/script/i);
    expect(out).not.toMatch(/[<>&]/);
    expect(JSON.parse(out).description).toBe('</script><script>alert("x")</script> & more');
  });

  it("escapes line and paragraph separators", () => {
    const out = serializeJsonLd({ a: "x\u2028y\u2029z" });
    expect(out).not.toMatch(/[\u2028\u2029]/);
    expect(JSON.parse(out).a).toBe("x\u2028y\u2029z");
  });
});

describe("fetchSitemapListingEntries", () => {
  const page = (listings: Partial<PublicListing>[], totalPages: number) =>
    json({ success: true, data: { listings, pagination: { total_pages: totalPages } } });

  it("walks the pages and names each listing by slug, else id", async () => {
    const full = Array.from({ length: 50 }, (_, i) => ({ _id: `id${i}`, slug: `listing-${i}` }));
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(page(full, 2))
      .mockResolvedValueOnce(page([{ _id: ID }], 2));
    const entries = await fetchSitemapListingEntries(fetchImpl);
    expect(entries).toHaveLength(51);
    expect(entries[0].url).toBe(`${SITE_URL}/marketplace/listing-0`);
    expect(entries[50].url).toBe(`${SITE_URL}/marketplace/${ID}`);
  });

  it("stops at the cap", async () => {
    const full = Array.from({ length: 50 }, (_, i) => ({ _id: `id${i}`, slug: `listing-${i}` }));
    const fetchImpl = vi.fn(async () => page(full, 99));
    expect(await fetchSitemapListingEntries(fetchImpl, 30)).toHaveLength(30);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("keeps what it has when a later page fails, and never throws", async () => {
    const full = Array.from({ length: 50 }, (_, i) => ({ _id: `id${i}`, slug: `listing-${i}` }));
    const fetchImpl = vi.fn().mockResolvedValueOnce(page(full, 3)).mockRejectedValueOnce(new Error("down"));
    expect(await fetchSitemapListingEntries(fetchImpl)).toHaveLength(50);
    expect(await fetchSitemapListingEntries(vi.fn(async () => json({}, 500)))).toEqual([]);
  });
});
