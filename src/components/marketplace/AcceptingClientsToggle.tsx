"use client";

import { useState } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceListing } from "@/lib/types";

interface Props {
  listing: MarketplaceListing;
  onUpdated: (listing: MarketplaceListing) => void;
}

/**
 * Quick-toggle pill for the listing owner to switch
 * `accepting_clients` on/off without opening the full edit form.
 */
export default function AcceptingClientsToggle({ listing, onUpdated }: Props) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const accepting = listing.accepting_clients;

  const handleToggle = async () => {
    setIsSaving(true);
    setError("");
    const res = await marketplaceService.updateMyListing({
      accepting_clients: !accepting,
    });
    if (res.success && res.data) {
      onUpdated(res.data);
    } else {
      setError(res.message || "Failed to update");
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isSaving}
        aria-pressed={accepting}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition-colors disabled:opacity-60 ${
          accepting
            ? "bg-primary-50 text-primary-700 ring-primary-200 hover:bg-primary-100"
            : "bg-neutral-100 text-foreground-secondary ring-neutral-200 hover:bg-neutral-200"
        }`}
        title={
          accepting
            ? "You are accepting new clients. Click to pause."
            : "You are not accepting new clients. Click to enable."
        }
      >
        {accepting ? (
          <CheckCircle2 className="h-3.5 w-3.5" />
        ) : (
          <XCircle className="h-3.5 w-3.5" />
        )}
        {isSaving
          ? "Saving..."
          : accepting
            ? "Accepting clients"
            : "Not accepting clients"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
