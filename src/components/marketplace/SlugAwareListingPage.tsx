"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import MarketplaceListingDetail from "@/components/marketplace/MarketplaceListingDetail";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceListing } from "@/lib/types";

export interface SlugAwareListingPageProps {
  /** Route param key: "gymId" | "trainerId" | "dietitianId". */
  paramKey: "gymId" | "trainerId" | "dietitianId";
  backHref: string;
  backLabel: string;
}

/**
 * Resolves a route param that may be either a Mongo ObjectId or a public
 * slug, then renders the shared MarketplaceListingDetail.
 *
 * Used by /gyms/[gymId], /trainers/[trainerId], and /dietitians/[dietitianId].
 */
export default function SlugAwareListingPage({
  paramKey,
  backHref,
  backLabel,
}: SlugAwareListingPageProps) {
  const params = useParams();
  const raw = (params as Record<string, string | string[]>)[paramKey];
  const slugOrId = Array.isArray(raw) ? raw[0] : raw;

  const isObjectId = !!slugOrId && /^[0-9a-f]{24}$/i.test(slugOrId);

  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(
    isObjectId && slugOrId ? slugOrId : null,
  );
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function resolve() {
      if (!slugOrId) return;
      const res = isObjectId
        ? await marketplaceService.getListingById(slugOrId)
        : await marketplaceService.getListingBySlug(slugOrId);
      if (cancelled) return;
      if (res.success && res.data) {
        setListing(res.data);
        setResolvedId(res.data._id);
      } else {
        setNotFound(true);
      }
    }
    void resolve();
    return () => {
      cancelled = true;
    };
  }, [slugOrId, isObjectId]);

  if (!resolvedId && !notFound) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <MarketplaceListingDetail
      listingId={resolvedId ?? ""}
      initialListing={listing}
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
