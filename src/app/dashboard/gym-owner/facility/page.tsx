"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GymDashboardShell } from "@/components/ds/GymDashboardShell";
import { AddLocationButton } from "./_actions";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceListing } from "@/lib/types";

type ListingWithItems = MarketplaceListing & {
  facilityItemsCount: number;
};

function formatBadge(type: string) {
  if (type === "GYM_OWNER") return "Gym";
  if (type === "PERSONAL_TRAINER") return "Trainer";
  if (type === "DIETITIAN") return "Dietitian";
  return "Listing";
}

export default function GymLocationsPage() {
  const [locations, setLocations] = useState<ListingWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      const listingsRes = await marketplaceService.getMyListings();

      if (!listingsRes.success || !listingsRes.data || !mounted) {
        setLocations([]);
        setLoading(false);
        return;
      }

      const itemsCount = await Promise.all(
        listingsRes.data.map(async (listing) => {
          const itemsRes = await marketplaceService.getMyListingFacilityItems(
            listing._id,
          );
          return {
            ...listing,
            facilityItemsCount: itemsRes.success && itemsRes.data ? itemsRes.data.length : 0,
          };
        }),
      );

      if (!mounted) return;
      setLocations(itemsCount);
      setLoading(false);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <GymDashboardShell
      activeItem="Locations · 4"
      crumb="Locations"
      actions={<AddLocationButton />}
    >
      <div>
        <h1 className="text-[30px] font-medium" style={{ letterSpacing: "-0.022em", color: "var(--ink)" }}>Locations</h1>
        <div className="text-[13.5px] mt-1.5" style={{ color: "var(--fg-3)" }}>{loading ? "Loading your locations..." : `${locations.length} active listings`}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
        {locations.map((l) => (
          <div key={l._id} className="rounded-(--r-3) overflow-hidden" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
            {/* Photo placeholder */}
            <div className="relative h-[140px]" style={{ background: "repeating-linear-gradient(135deg, oklch(0.90 0.014 248) 0 10px, oklch(0.93 0.012 248) 10px 20px)", borderBottom: "1px solid var(--border)" }}>
              <span className="absolute top-2.5 left-2.5 inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[12px] font-medium bg-bg border border-border" style={{ color: "var(--ink)" }}>{formatBadge(l.account_type)}</span>
            </div>

            {/* Body */}
            <div className="px-4.5 py-4">
              <h3 className="text-[18px] font-medium" style={{ letterSpacing: "-0.01em", color: "var(--ink)" }}>{l.headline}</h3>
              <div className="text-[12.5px] mt-1" style={{ color: "var(--fg-3)" }}>{l.address ?? "No address set"}</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {[
                  { k: "Members", v: String(l.active_client_count ?? 0) },
                  { k: "Facilities", v: String(l.facilityItemsCount) },
                  { k: "Reviews", v: String(l.review_count ?? 0) },
                  { k: "Rating", v: String(l.average_rating ?? 0) },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="font-mono text-[10px] uppercase tracking-[0.04em]" style={{ color: "var(--fg-3)" }}>{s.k}</div>
                    <div className="text-[16px] font-medium mt-0.5" style={{ color: "var(--ink)", fontVariantNumeric: "tabular-nums" }}>{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-1.5 px-4.5 pb-3">
              {l.amenities.slice(0, 7).map((a) => (
                <span key={a} className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[11.5px] bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>{a}</span>
              ))}
              {l.amenities.length === 0 && (
                <span className="inline-flex items-center h-5.5 px-2 rounded-(--r-1) text-[11.5px] bg-bg-3 border border-border" style={{ color: "var(--fg-2)" }}>No amenities listed</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="text-[12.5px]" style={{ color: "var(--fg-3)" }}>Location · <strong style={{ color: "var(--ink)" }}>{l.city ?? "-"}, {l.country_code ?? "-"}</strong></span>
              <Link href={`/dashboard/gym-owner/locations/${l._id}`} className="btn-ghost-v2 sm">Manage location</Link>
            </div>
          </div>
        ))}
        {!loading && locations.length === 0 && (
          <div className="rounded-(--r-3) p-4 text-[13px]" style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg-3)" }}>
            No listings found. Add a location to get started.
          </div>
        )}
      </div>
    </GymDashboardShell>
  );
}
