/**
 * How a provider is named and pictured on web: Explore cards, the public
 * profile, saved providers, the map and the profile's metadata.
 *
 * The title, gallery, hero, address and maps helpers are ported from
 * binectics-mobile src/utils/listingDisplay.ts (mobile PR #304) so both apps
 * name and picture a provider the same way: the business or the person is
 * the title, the headline is the line under it, and the hero is a listing
 * photo with the logo as a small avatar. Keep the two in step.
 *
 * The price is the listing's own "from" price in its own currency, as the
 * API returns it; there is no conversion and no made-up fallback amount.
 */

import type { MarketplaceListing } from "@/lib/types";
import type { PlatformCurrency } from "@/lib/api/currencies";
import { formatMinor } from "@/lib/currencies/helpers";
import { AMENITY_CATALOGUE } from "@/lib/constants/facility-catalogue";

const clean = (s: string | null | undefined): string => (typeof s === "string" ? s.trim() : "");

/**
 * The title: a gym's business name; a trainer's or dietitian's own name.
 * The headline only when neither is known, and "Provider" when there is
 * nothing at all. (Mobile: listingTitle.)
 */
export function providerTitle(input: {
  type?: string | null;
  organizationName?: string | null;
  professionalName?: string | null;
  headline?: string | null;
}): string {
  const org = clean(input.organizationName);
  const person = clean(input.professionalName);
  // A gym-staff trainer's or a solo workspace carries an organization too;
  // its name ("Chinedu Eze Training") is the fallback, not the title. A
  // gym's owner's name is never its title: only the business name.
  const names = input.type === "gym_owner" ? [org] : [person, org];
  return names.find(Boolean) || clean(input.headline) || "Provider";
}

/** The headline as the line under the title, or nothing when it already is the title. */
export function providerSubtitle(title: string, headline: string | null | undefined): string | undefined {
  const h = clean(headline);
  return h && h !== title ? h : undefined;
}

type Named = {
  account_type?: string;
  headline?: string | null;
  organization_id?: unknown;
  professional_id?: unknown;
  organization?: { name?: string | null } | null;
  professional?: { first_name?: string | null; last_name?: string | null } | null;
};

function populated<T>(v: unknown): T | null {
  return v && typeof v === "object" ? (v as T) : null;
}

/** The organization's and the professional's names from a listing, populated either way. */
export function listingNames(l: Named): { organizationName: string; professionalName: string } {
  const org = populated<{ name?: string | null }>(l.organization_id) ?? l.organization ?? null;
  const pro =
    populated<{ first_name?: string | null; last_name?: string | null }>(l.professional_id) ?? l.professional ?? null;
  return {
    organizationName: clean(org?.name),
    professionalName: pro ? `${clean(pro.first_name)} ${clean(pro.last_name)}`.trim() : "",
  };
}

/** The listing's title by {@link providerTitle}. */
export function listingDisplayName(l: Named | MarketplaceListing): string {
  const n = l as Named;
  return providerTitle({ type: n.account_type, ...listingNames(n), headline: n.headline });
}

/**
 * The listing's own photos, without the logo. The API puts the profile image
 * (a gym's logo, a coach's avatar) first in `photos`, so photos[0] was the
 * logo and the profile used it as a cropped hero. Duplicates and blanks go too.
 */
export function galleryPhotos(photos: readonly string[] | null | undefined, profileImage?: string | null): string[] {
  const avatar = clean(profileImage);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of photos ?? []) {
    const url = clean(raw);
    if (!url || url === avatar || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * The hero image: the first listing photo (the provider orders them, so the
 * first is their cover), else the first facility photo. Never the logo:
 * with no photo the page shows the logo as an avatar on a plain panel.
 */
export function listingHero(l: {
  photos?: readonly string[] | null;
  profile_image?: string | null;
  facility_items?: readonly { image_url?: string | null }[] | null;
}): string | undefined {
  const photo = galleryPhotos(l.photos, l.profile_image)[0];
  if (photo) return photo;
  const avatar = clean(l.profile_image);
  return l.facility_items?.map((f) => clean(f.image_url)).find((u) => !!u && u !== avatar);
}

/** "Towel Service" for TOWEL_SERVICE; an unknown code from a newer API reads as itself, tidied. */
export function amenityLabel(code: string): string {
  const known = AMENITY_CATALOGUE.find((a) => a.key === code);
  if (known) return known.label;
  if (!/^[A-Z0-9_]+$/.test(code)) return code; // free-text facility, as the provider wrote it
  const words = code.replace(/_/g, " ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** One of a gym's addresses on its public profile (binectics-api #374). */
export interface ListingLocation {
  id: string;
  name: string;
  street?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  is_primary?: boolean;
}

/** "9 Fola Osibo Road, Lagos 106104": the parts that exist, in reading order. */
export function addressLine(loc: Pick<ListingLocation, "street" | "city" | "postal_code">): string {
  const cityPart = [clean(loc.city), clean(loc.postal_code)].filter(Boolean).join(" ");
  return [clean(loc.street), cityPart].filter(Boolean).join(", ");
}

/** A Google Maps search for the address; works in any browser without a key. */
export function mapsUrl(loc: ListingLocation, gymName?: string): string {
  const q = [clean(gymName), clean(loc.street), clean(loc.city), clean(loc.postal_code), clean(loc.country)]
    .filter(Boolean)
    .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** The addresses worth showing (a name at least), primary first; [] when the API sent none. */
export function publicLocations(raw: unknown): ListingLocation[] {
  if (!Array.isArray(raw)) return [];
  const out: ListingLocation[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const name = typeof r.name === "string" ? r.name.trim() : "";
    if (!name) continue;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    out.push({
      id: str(r.id) ?? str(r._id) ?? name,
      name,
      street: str(r.street),
      city: str(r.city),
      postal_code: str(r.postal_code),
      country: str(r.country),
      is_primary: r.is_primary === true,
    });
  }
  return out.sort((a, b) => Number(!!b.is_primary) - Number(!!a.is_primary));
}

/** "From ₦15,000" from price_from_minor, else the listing's own label, else null. */
export function listingPriceFrom(
  l: Pick<MarketplaceListing, "price_from_minor" | "currency" | "price_label">,
  list?: readonly PlatformCurrency[] | null,
): string | null {
  if (typeof l.price_from_minor === "number" && l.price_from_minor > 0 && l.currency) {
    return `From ${formatMinor(l.currency, l.price_from_minor, { list })}`;
  }
  return l.price_label?.trim() || null;
}
