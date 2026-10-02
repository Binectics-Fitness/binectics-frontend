import type { Metadata } from "next";
import { ListingDetailClient } from "./ListingDetailClient";

export const metadata: Metadata = {
  title: "Listing Details",
  description: "Moderate a provider listing: suspension, badge and documents.",
};

export default async function AdminSingleListingPage({
  params,
}: {
  params: Promise<{ listingId: string }>;
}) {
  const { listingId } = await params;
  return <ListingDetailClient listingId={listingId} />;
}
