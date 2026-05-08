"use client";

import { useParams } from "next/navigation";
import MarketplaceListingDetail from "@/components/marketplace/MarketplaceListingDetail";

export default function MarketplaceListingPage() {
  const params = useParams();
  const raw = Array.isArray(params.listingId)
    ? params.listingId[0]
    : params.listingId;
  const listingId = String(raw ?? "");

  return (
    <MarketplaceListingDetail
      listingId={listingId}
      backHref="/marketplace"
      backLabel="Back to marketplace"
    />
  );
}
