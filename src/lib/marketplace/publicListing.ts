/**
 * Server-side reads of a public provider profile, and what search engines
 * are told about it: the page metadata, the schema.org JSON-LD and the
 * sitemap entries. The fetchers run on the server only (an absolute API URL,
 * no cookies); the builders are pure so the rules can be pinned in tests.
 */

import { cache } from "react";
import type { Metadata, MetadataRoute } from "next";
import type { MarketplaceListing, MarketplaceMembershipPlan } from "@/lib/types";
import { serverApiBaseUrl } from "@/lib/api/upstream";
import { SITE_URL } from "@/lib/site-url";
import { listingDisplayName } from "./listingDisplay";
import { listingApiPath, parseListingParam } from "./listingRef";

export { listingApiPath, parseListingParam, type ListingRef } from "./listingRef";

/** A listing as the public detail endpoints return it, owners populated. */
export type PublicListing = MarketplaceListing & {
  organization?: { _id?: string; name?: string } | null;
  professional?: { _id?: string; first_name?: string; last_name?: string; profile_picture?: string } | null;
};

/* ─── Fetching ───────────────────────────────────────────────── */

type Fetch = typeof fetch;

// The API caches these reads for 60s; asking more often gains nothing.
const LISTING_REVALIDATE_SECONDS = 60;
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * The published listing a URL segment names, or null when there is none
 * (unknown, unpublished, suspended or malformed). Any other failure throws,
 * so an API outage shows the error page rather than a 404 that would drop
 * the profile from search indexes.
 */
export async function fetchPublicListing(raw: string, fetchImpl: Fetch = fetch): Promise<PublicListing | null> {
  const ref = parseListingParam(raw);
  if (!ref) return null;
  const res = await fetchImpl(`${serverApiBaseUrl()}${listingApiPath(ref)}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: LISTING_REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Listing lookup failed with HTTP ${res.status}`);
  const body = (await res.json()) as { data?: PublicListing | null };
  const listing = body?.data;
  if (!listing || typeof listing !== "object" || !listing._id) return null;
  // The API already hides these; checked again so a change there can never
  // publish a hidden profile here.
  if (listing.is_published === false || listing.is_suspended === true) return null;
  return listing;
}

/** One lookup per request, shared by generateMetadata and the page. */
export const getPublicListing = cache((raw: string) => fetchPublicListing(raw));

/**
 * The listing's public plans. Optional content: a failure shows the profile
 * without plans rather than failing the page.
 */
export async function fetchPublicListingPlans(
  listingId: string,
  fetchImpl: Fetch = fetch,
): Promise<MarketplaceMembershipPlan[]> {
  try {
    const res = await fetchImpl(`${serverApiBaseUrl()}/marketplace/listings/${encodeURIComponent(listingId)}/plans`, {
      headers: { Accept: "application/json" },
      next: { revalidate: LISTING_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const body = (await res.json()) as { data?: unknown };
    return Array.isArray(body?.data) ? (body.data as MarketplaceMembershipPlan[]) : [];
  } catch {
    return [];
  }
}

/* ─── What the page tells search engines ─────────────────────── */

const ROLE_LABELS: Record<string, string> = {
  gym_owner: "Gym",
  personal_trainer: "Personal trainer",
  dietitian: "Dietitian",
};

function roleLabel(l: Pick<MarketplaceListing, "account_type">): string {
  return ROLE_LABELS[l.account_type] ?? "Provider";
}

/** Site-relative address of the profile: the slug when there is one. */
export function listingPath(l: Pick<MarketplaceListing, "_id" | "slug">): string {
  return `/marketplace/${l.slug ? encodeURIComponent(l.slug) : l._id}`;
}

/** Only absolute http(s) URLs can be handed to crawlers as images. */
function listingImages(l: PublicListing): string[] {
  const candidates = [...(l.photos ?? []), l.profile_image];
  return [...new Set(candidates.filter((u): u is string => typeof u === "string" && /^https?:\/\//i.test(u)))];
}

function collapse(text: string | undefined | null): string {
  return (text ?? "").replace(/\s+/g, " ").trim();
}

/** Cuts at a word boundary so a snippet never ends mid-word. */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, "")}…`;
}

/** "Kemi Adeyemi · Personal trainer in Lagos". The layout appends the brand. */
export function listingTitle(l: PublicListing): string {
  const name = listingDisplayName(l);
  const city = collapse(l.city);
  return city ? `${name} · ${roleLabel(l)} in ${city}` : `${name} · ${roleLabel(l)}`;
}

/** The bio as a search snippet, else a sentence built from the headline. */
export function listingDescription(l: PublicListing): string {
  const bio = collapse(l.bio);
  if (bio) return truncate(bio, 160);
  const city = collapse(l.city);
  const role = roleLabel(l);
  const where = city ? `${role} in ${city}` : role;
  const headline = collapse(l.headline);
  return headline ? `${headline}. ${where} on Binectics.` : `${where} on Binectics.`;
}

export function buildListingMetadata(l: PublicListing): Metadata {
  const title = listingTitle(l);
  const description = listingDescription(l);
  const path = listingPath(l);
  const image = listingImages(l)[0];
  const images = image ? [{ url: image, alt: listingDisplayName(l) }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    // Replaces the root openGraph object rather than merging into it, so the
    // site-wide fields are repeated here.
    openGraph: {
      type: "website",
      siteName: "Binectics",
      locale: "en_US",
      url: path,
      title,
      description,
      images,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

/**
 * schema.org description of the provider. A gym is an ExerciseGym; a team
 * under an organisation is a ProfessionalService (both LocalBusiness types);
 * a solo trainer or dietitian is a Person. No AggregateRating or Review: the
 * ratings are collected by the listing itself, which search engines treat as
 * self-serving and ineligible.
 */
export function buildListingJsonLd(l: PublicListing): Record<string, unknown> {
  const url = `${SITE_URL}${listingPath(l)}`;
  const name = listingDisplayName(l);
  const description = collapse(l.bio) || collapse(l.headline) || undefined;
  const images = listingImages(l);
  const image = images.length > 1 ? images : images[0];
  const city = collapse(l.city) || undefined;
  const country = collapse(l.country_code).toUpperCase() || undefined;
  const orgName =
    typeof l.organization_id === "object" && l.organization_id ? l.organization_id.name : l.organization?.name;

  const base = { "@context": "https://schema.org", name, description, url, image };

  if (l.account_type === "gym_owner" || orgName) {
    // A business's street address is public on its listing; a person's is not
    // asked for, so only a business carries one.
    const street = collapse(l.address) || undefined;
    const address =
      city || country || street
        ? { "@type": "PostalAddress", streetAddress: street, addressLocality: city, addressCountry: country }
        : undefined;
    return {
      ...base,
      "@type": l.account_type === "gym_owner" ? "ExerciseGym" : "ProfessionalService",
      address,
    };
  }

  const specialties = (l.specialties ?? []).map(collapse).filter(Boolean);
  return {
    ...base,
    "@type": "Person",
    jobTitle: roleLabel(l),
    address: city || country ? { "@type": "PostalAddress", addressLocality: city, addressCountry: country } : undefined,
    knowsAbout: specialties.length > 0 ? specialties : undefined,
  };
}

/**
 * JSON for a <script type="application/ld+json"> body. Listing text is
 * written by providers, so "<", ">" and "&" are escaped as JSON unicode
 * escapes: "</script>" in a bio cannot close the tag, and the parsed JSON is
 * unchanged. U+2028/2029 are escaped for older JavaScript parsers.
 */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/* ─── Sitemap ────────────────────────────────────────────────── */

/** The search endpoint's page-size ceiling (SearchListingsDto @Max(50)). */
const SITEMAP_PAGE_SIZE = 50;
/** Hard cap on listing entries. Past it the sitemap needs splitting. */
export const SITEMAP_LISTING_CAP = 1000;
export const SITEMAP_REVALIDATE_SECONDS = 3600;

/**
 * Sitemap entries for published listings, newest first. Never throws: a page
 * that fails ends the walk and the entries gathered so far are returned, so
 * an unreachable API costs the listing entries, never the sitemap.
 */
export async function fetchSitemapListingEntries(
  fetchImpl: Fetch = fetch,
  cap: number = SITEMAP_LISTING_CAP,
): Promise<MetadataRoute.Sitemap> {
  const entries = new Map<string, MetadataRoute.Sitemap[number]>();
  const maxPages = Math.ceil(cap / SITEMAP_PAGE_SIZE);
  for (let page = 1; page <= maxPages && entries.size < cap; page++) {
    let listings: PublicListing[];
    let totalPages: number;
    try {
      const res = await fetchImpl(
        `${serverApiBaseUrl()}/marketplace/listings?page=${page}&limit=${SITEMAP_PAGE_SIZE}&sort=newest`,
        {
          headers: { Accept: "application/json" },
          next: { revalidate: SITEMAP_REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
      if (!res.ok) break;
      const body = (await res.json()) as {
        data?: { listings?: PublicListing[]; pagination?: { total_pages?: number } };
      };
      listings = Array.isArray(body?.data?.listings) ? body.data.listings : [];
      totalPages = Number(body?.data?.pagination?.total_pages) || page;
    } catch {
      break;
    }
    for (const l of listings) {
      if (!l || typeof l._id !== "string" || entries.size >= cap) continue;
      const url = `${SITE_URL}${listingPath(l)}`;
      const modified = new Date(l.updated_at ?? l.published_at ?? Number.NaN);
      entries.set(url, {
        url,
        ...(Number.isNaN(modified.getTime()) ? {} : { lastModified: modified }),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
    if (page >= totalPages || listings.length < SITEMAP_PAGE_SIZE) break;
  }
  return [...entries.values()];
}
