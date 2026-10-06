import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  buildListingJsonLd,
  buildListingMetadata,
  fetchPublicListingPlans,
  getPublicListing,
  serializeJsonLd,
} from "@/lib/marketplace/publicListing";
import { ListingProfile } from "./ListingProfile";

/**
 * A public provider profile, at /marketplace/<id> or /marketplace/<slug>.
 * Rendered on the server so crawlers that run no JavaScript get the profile
 * itself; plan choice, checkout, saving and reviews stay client-side in
 * ListingProfile.
 */

type Props = { params: Promise<{ listingId: string }> };

// Incremental static regeneration: no profile is built ahead of time; each
// is rendered on its first request and then served from cache for a minute,
// the same window the API caches the listing for. The 404 status for an
// unknown profile is set by the middleware (profileGate.ts): notFound() here
// runs after the root loading.tsx boundary has already streamed a 200.
export const revalidate = 60;

export function generateStaticParams(): { listingId: string }[] {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { listingId } = await params;
  const listing = await getPublicListing(listingId);
  if (!listing) notFound();
  return buildListingMetadata(listing);
}

export default async function ListingPage({ params }: Props) {
  const { listingId } = await params;
  const listing = await getPublicListing(listingId);
  if (!listing) notFound();
  const plans = await fetchPublicListingPlans(listing._id);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildListingJsonLd(listing)) }}
      />
      <ListingProfile listing={listing} initialPlans={plans} />
    </>
  );
}
