"use client";

import Link from "next/link";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useMyListings } from "@/lib/queries/marketplace";
import { Building2, MapPin, ChevronRight, Plus } from "lucide-react";

export default function GymOwnerLocationsPage() {
  const { data: listings, isLoading } = useMyListings();

  if (isLoading) return <DashboardLoading />;

  const items = listings ?? [];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Gym Locations
              </h1>
              <p className="text-foreground/60 mt-1 text-sm">
                Each physical gym is its own marketplace listing. Pick a
                location to manage its facilities, amenities and photos.
              </p>
            </div>
            <Link
              href="/dashboard/gym-owner/marketplace"
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add new location
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-[var(--shadow-card)]">
              <Building2 className="h-10 w-10 text-foreground/30 mx-auto" />
              <p className="mt-3 text-foreground font-semibold">
                No marketplace listings yet
              </p>
              <p className="mt-1 text-sm text-foreground/60">
                Create your first gym listing to start managing facilities and
                amenities.
              </p>
              <Link
                href="/dashboard/gym-owner/marketplace"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create your first listing
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {items.map((listing) => {
                const orgName =
                  typeof listing.organization_id === "object" &&
                  listing.organization_id
                    ? listing.organization_id.name
                    : null;
                const addr = [listing.address, listing.city, listing.country_code]
                  .filter(Boolean)
                  .join(", ");
                const facilitiesCount = listing.facility_items?.length ?? 0;
                const amenitiesCount = listing.amenities?.length ?? 0;

                return (
                  <Link
                    key={listing._id}
                    href={`/dashboard/gym-owner/facility/${listing._id}`}
                    className="group block bg-white rounded-2xl shadow-[var(--shadow-card)] hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="relative h-32 bg-gradient-to-br from-accent-blue-500 to-accent-purple-500">
                      {listing.profile_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={listing.profile_image}
                          alt={listing.headline}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/80">
                          <Building2 className="h-12 w-12" />
                        </div>
                      )}
                      {listing.is_published ? (
                        <span className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-foreground shadow">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                          Published
                        </span>
                      ) : (
                        <span className="absolute top-3 right-3 inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-foreground/70 text-white shadow">
                          Draft
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h2 className="text-lg font-bold text-foreground line-clamp-1">
                        {listing.headline}
                      </h2>
                      {orgName && (
                        <p className="mt-0.5 text-xs text-foreground/50 font-semibold">
                          {orgName}
                        </p>
                      )}
                      {addr && (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-foreground/70">
                          <MapPin className="h-4 w-4 text-foreground/40" />
                          <span className="line-clamp-1">{addr}</span>
                        </p>
                      )}
                      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-foreground/60">
                            <span className="font-bold text-foreground">
                              {facilitiesCount}
                            </span>{" "}
                            facilities
                          </span>
                          <span className="text-foreground/60">
                            <span className="font-bold text-foreground">
                              {amenitiesCount}
                            </span>{" "}
                            amenities
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-blue-500 group-hover:translate-x-0.5 transition-transform">
                          Manage
                          <ChevronRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
