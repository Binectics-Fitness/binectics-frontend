"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "@/components/AdminSidebar";
import { marketplaceService } from "@/lib/api/marketplace";
import {
  MarketplaceListing,
  MarketplaceListingDocument,
  MarketplaceVerificationBadge,
} from "@/lib/types";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert, showPrompt } from "@/lib/ui/dialogs";

function badgePillClasses(badge: MarketplaceVerificationBadge): string {
  if (badge === MarketplaceVerificationBadge.VERIFIED) {
    return "bg-accent-blue-100 text-accent-blue-700";
  }

  if (badge === MarketplaceVerificationBadge.PREMIUM_VERIFIED) {
    return "bg-accent-yellow-100 text-accent-yellow-700";
  }

  if (badge === MarketplaceVerificationBadge.FEATURED) {
    return "bg-primary-100 text-primary-700";
  }

  return "bg-neutral-100 text-foreground-secondary";
}

function badgeLabel(badge: MarketplaceVerificationBadge): string {
  if (badge === MarketplaceVerificationBadge.VERIFIED) return "Verified";
  if (badge === MarketplaceVerificationBadge.PREMIUM_VERIFIED) return "Premium";
  if (badge === MarketplaceVerificationBadge.FEATURED) return "Featured";
  return "None";
}

export default function AdminProvidersPage() {
  const [gymListings, setGymListings] = useState<MarketplaceListing[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [selectedDocsListingId, setSelectedDocsListingId] = useState<
    string | null
  >(null);
  const [listingDocuments, setListingDocuments] = useState<
    MarketplaceListingDocument[]
  >([]);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const { requestConfirmation, confirmationModal } = useConfirmationModal();

  const loadGymListings = useCallback(async () => {
    setIsLoading(true);
    const res = await marketplaceService.getAdminGymListings();
    if (res.success && res.data) {
      setGymListings(res.data);
    } else {
      await showAlert(res.message || "Failed to load gym listings");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGymListings();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadGymListings]);

  const filteredGyms = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return gymListings;

    return gymListings.filter((listing) => {
      const organization =
        typeof listing.organization_id === "object"
          ? listing.organization_id
          : null;
      const owner =
        typeof listing.professional_id === "object"
          ? listing.professional_id
          : null;

      return (
        listing.headline.toLowerCase().includes(q) ||
        (organization?.name || "").toLowerCase().includes(q) ||
        `${owner?.first_name || ""} ${owner?.last_name || ""}`
          .toLowerCase()
          .includes(q) ||
        (listing.city || "").toLowerCase().includes(q)
      );
    });
  }, [gymListings, searchQuery]);

  const setBadge = async (
    listingId: string,
    badge: MarketplaceVerificationBadge,
  ) => {
    setIsMutating(true);
    const res =
      badge === MarketplaceVerificationBadge.NONE
        ? await marketplaceService.revokeGymBadge(listingId)
        : await marketplaceService.awardGymBadge(listingId, {
            verification_badge: badge,
          });

    if (res.success) {
      await loadGymListings();
      await showAlert("Badge updated successfully");
    } else {
      await showAlert(res.message || "Failed to update badge");
    }
    setIsMutating(false);
  };

  const handleSuspend = (listing: MarketplaceListing) => {
    requestConfirmation({
      title: "Suspend gym listing?",
      description: "Suspended gyms will be hidden from marketplace search.",
      confirmLabel: "Suspend",
      onConfirm: async () => {
        const reason = await showPrompt({
          title: "Suspension reason (optional)",
          message: "Enter a short reason for internal moderation history:",
          placeholder: "Policy violation, spam, etc.",
          confirmLabel: "Continue",
        });

        setIsMutating(true);
        const res = await marketplaceService.suspendGym(listing._id, {
          reason: reason || undefined,
        });

        if (res.success) {
          await loadGymListings();
          await showAlert("Gym suspended successfully");
        } else {
          await showAlert(res.message || "Failed to suspend gym");
        }
        setIsMutating(false);
      },
    });
  };

  const handleUnsuspend = (listingId: string) => {
    requestConfirmation({
      title: "Unsuspend gym listing?",
      description: "The gym will become visible in marketplace search again.",
      confirmLabel: "Unsuspend",
      onConfirm: async () => {
        setIsMutating(true);
        const res = await marketplaceService.unsuspendGym(listingId);
        if (res.success) {
          await loadGymListings();
          await showAlert("Gym unsuspended successfully");
        } else {
          await showAlert(res.message || "Failed to unsuspend gym");
        }
        setIsMutating(false);
      },
    });
  };

  const handleViewDocuments = async (listingId: string) => {
    setSelectedDocsListingId(listingId);
    setIsLoadingDocuments(true);
    const res = await marketplaceService.getAdminGymListingDocuments(listingId);
    if (res.success && res.data) {
      setListingDocuments(res.data);
    } else {
      setListingDocuments([]);
      await showAlert(res.message || "Failed to load listing documents");
    }
    setIsLoadingDocuments(false);
  };

  const selectedListing =
    selectedDocsListingId == null
      ? null
      : gymListings.find((listing) => listing._id === selectedDocsListingId) ||
        null;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <header className="bg-white border-b border-gray-200">
          <div className="px-6 py-6">
            <h1 className="text-3xl font-black text-foreground">
              Gym Moderation
            </h1>
            <p className="mt-1 text-foreground/60">
              Manage suspension and verification badges for marketplace gyms.
            </p>
          </div>
        </header>

        <div className="p-6">
          <div className="bg-white p-4 shadow-card mb-6">
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Search gyms
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by headline, gym name, owner, or city..."
              className="w-full px-4 py-3 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="bg-white shadow-card overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-foreground/60">
                Loading gym listings...
              </div>
            ) : filteredGyms.length === 0 ? (
              <div className="p-8 text-center text-foreground/60">
                No gyms found.
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Gym
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Docs
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-foreground uppercase tracking-wider">
                      Badge
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGyms.map((listing) => {
                    const organization =
                      typeof listing.organization_id === "object"
                        ? listing.organization_id
                        : null;
                    const owner =
                      typeof listing.professional_id === "object"
                        ? listing.professional_id
                        : null;

                    return (
                      <tr key={listing._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {organization?.name || listing.headline}
                          </p>
                          <p className="text-sm text-foreground/60">
                            {owner
                              ? `${owner.first_name} ${owner.last_name}`
                              : "Owner unavailable"}
                            {listing.city ? ` • ${listing.city}` : ""}
                          </p>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-foreground-secondary">
                            {listing.supporting_documents_count ?? 0}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold ${
                              listing.is_suspended
                                ? "bg-red-100 text-red-700"
                                : "bg-primary-100 text-primary-700"
                            }`}
                          >
                            {listing.is_suspended ? "Suspended" : "Active"}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 text-xs font-semibold ${badgePillClasses(
                              listing.verification_badge,
                            )}`}
                          >
                            {badgeLabel(listing.verification_badge)}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <button
                              disabled={isMutating}
                              onClick={() =>
                                setBadge(
                                  listing._id,
                                  MarketplaceVerificationBadge.VERIFIED,
                                )
                              }
                              className="px-3 py-1 text-xs font-semibold bg-accent-blue-100 text-accent-blue-700 hover:bg-accent-blue-200 disabled:opacity-50"
                            >
                              Blue ✓
                            </button>
                            <button
                              disabled={isMutating}
                              onClick={() =>
                                setBadge(
                                  listing._id,
                                  MarketplaceVerificationBadge.PREMIUM_VERIFIED,
                                )
                              }
                              className="px-3 py-1 text-xs font-semibold bg-accent-yellow-100 text-accent-yellow-700 hover:bg-accent-yellow-200 disabled:opacity-50"
                            >
                              Gold ✓
                            </button>
                            <button
                              disabled={isMutating}
                              onClick={() =>
                                setBadge(
                                  listing._id,
                                  MarketplaceVerificationBadge.FEATURED,
                                )
                              }
                              className="px-3 py-1 text-xs font-semibold bg-primary-100 text-primary-700 hover:bg-primary-200 disabled:opacity-50"
                            >
                              ★ Featured
                            </button>
                            <button
                              disabled={isMutating}
                              onClick={() =>
                                setBadge(
                                  listing._id,
                                  MarketplaceVerificationBadge.NONE,
                                )
                              }
                              className="px-3 py-1 text-xs font-semibold bg-neutral-100 text-foreground-secondary hover:bg-neutral-200 disabled:opacity-50"
                            >
                              Revoke
                            </button>

                            <button
                              disabled={isMutating}
                              onClick={() =>
                                void handleViewDocuments(listing._id)
                              }
                              className="px-3 py-1 text-xs font-semibold bg-neutral-100 text-foreground hover:bg-neutral-200 disabled:opacity-50"
                            >
                              Docs
                            </button>

                            {listing.is_suspended ? (
                              <button
                                disabled={isMutating}
                                onClick={() => handleUnsuspend(listing._id)}
                                className="px-3 py-1 text-xs font-semibold bg-primary-500 text-foreground hover:bg-primary-600 disabled:opacity-50"
                              >
                                Unsuspend
                              </button>
                            ) : (
                              <button
                                disabled={isMutating}
                                onClick={() => handleSuspend(listing)}
                                className="px-3 py-1 text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Suspend
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {selectedListing && (
            <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Supporting Documents
                  </h3>
                  <p className="text-sm text-foreground-secondary">
                    {selectedListing.headline}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedDocsListingId(null);
                    setListingDocuments([]);
                  }}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-foreground hover:border-neutral-400"
                >
                  Close
                </button>
              </div>

              {isLoadingDocuments ? (
                <p className="text-sm text-foreground-secondary">
                  Loading documents...
                </p>
              ) : listingDocuments.length === 0 ? (
                <p className="text-sm text-foreground-secondary">
                  No supporting documents uploaded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {listingDocuments.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {doc.file_name}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {(doc.file_size / 1024 / 1024).toFixed(2)} MB •{" "}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-lg bg-primary-500 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-primary-600"
                      >
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {confirmationModal}
    </div>
  );
}
