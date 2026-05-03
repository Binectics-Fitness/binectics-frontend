"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import ConfirmationModal from "@/components/ConfirmationModal";
import FacilityItemFormModal, {
  type FacilityFormValues,
} from "@/components/FacilityItemFormModal";
import {
  useAddFacilityItem,
  useDeleteFacilityItem,
  useFacilityItems,
  useMyListings,
  useUpdateAmenities,
  useUpdateFacilityItem,
} from "@/lib/queries/marketplace";
import {
  AmenityKey,
  FacilityCategory,
  FacilityStatus,
  type FacilityItem,
} from "@/lib/types";
import {
  AMENITY_CATALOGUE,
  FACILITY_CATEGORY_LABELS,
  FACILITY_CONDITION_LABELS,
  getFacilityGradient,
  getFacilityIcon,
} from "@/lib/constants/facility-catalogue";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";

const FILTER_LABELS: { key: "ALL" | FacilityCategory; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: FacilityCategory.EQUIPMENT, label: "Equipment" },
  { key: FacilityCategory.ROOM, label: "Room" },
  { key: FacilityCategory.AMENITY, label: "Amenity" },
  { key: FacilityCategory.SERVICE, label: "Service" },
];

export default function ManageFacilityPage() {
  const params = useParams<{ listingId: string }>();
  const listingId = params.listingId;

  const { data: listings, isLoading: listingsLoading } = useMyListings();
  const listing = listings?.find((l) => l._id === listingId);
  const { data: items, isLoading: itemsLoading } = useFacilityItems(listingId);

  const addMutation = useAddFacilityItem(listingId);
  const updateMutation = useUpdateFacilityItem(listingId);
  const deleteMutation = useDeleteFacilityItem(listingId);
  const amenitiesMutation = useUpdateAmenities(listingId);

  const [activeCategory, setActiveCategory] = useState<
    "ALL" | FacilityCategory
  >("ALL");
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FacilityItem | null>(null);
  const [deleting, setDeleting] = useState<FacilityItem | null>(null);

  // Local optimistic amenity state
  const [amenities, setAmenities] = useState<AmenityKey[]>([]);
  useEffect(() => {
    if (listing) {
      // Listing.amenities is string[] of canonical AmenityKey
      setAmenities((listing.amenities ?? []) as AmenityKey[]);
    }
  }, [listing]);

  const featured = useMemo(
    () =>
      (items ?? []).filter(
        (f) => f.is_featured && f.status === FacilityStatus.AVAILABLE,
      ),
    [items],
  );

  const filtered = useMemo(() => {
    const list = items ?? [];
    if (activeCategory === "ALL") return list;
    return list.filter((f) => f.category === activeCategory);
  }, [items, activeCategory]);

  // Auto-rotate the carousel
  useEffect(() => {
    if (featured.length <= 1) return;
    const id = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % featured.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [featured.length]);

  // Reset slide if items shrink
  useEffect(() => {
    if (carouselIndex >= featured.length && featured.length > 0) {
      setCarouselIndex(0);
    }
  }, [featured.length, carouselIndex]);

  if (listingsLoading || itemsLoading) return <DashboardLoading />;

  if (!listing) {
    return (
      <div className="flex min-h-screen bg-background">
        <GymOwnerSidebar />
        <main className="md:ml-64 flex-1 p-6">
          <div className="max-w-2xl mx-auto bg-white rounded-2xl p-10 text-center shadow-[var(--shadow-card)]">
            <p className="text-foreground font-semibold">
              Listing not found or you don&apos;t have access.
            </p>
            <Link
              href="/dashboard/gym-owner/facility"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-blue-500"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to locations
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const items_ = items ?? [];
  const totalCount = items_.length;
  const availableCount = items_.filter(
    (f) => f.status === FacilityStatus.AVAILABLE,
  ).length;
  const maintenanceCount = items_.filter(
    (f) => f.status === FacilityStatus.MAINTENANCE,
  ).length;

  function toggleAmenity(key: AmenityKey) {
    const next = amenities.includes(key)
      ? amenities.filter((a) => a !== key)
      : [...amenities, key];
    setAmenities(next);
    amenitiesMutation.mutate(next, {
      onError: () => {
        // revert on failure
        setAmenities(amenities);
      },
    });
  }

  async function handleSubmit(values: FacilityFormValues) {
    if (editing) {
      await updateMutation.mutateAsync({
        itemId: editing._id,
        payload: values,
      });
    } else {
      await addMutation.mutateAsync(values);
    }
    setFormOpen(false);
    setEditing(null);
  }

  async function handleDelete() {
    if (!deleting) return;
    await deleteMutation.mutateAsync(deleting._id);
    setDeleting(null);
  }

  const goToPrev = () =>
    setCarouselIndex((i) => (i - 1 + featured.length) % featured.length);
  const goToNext = () =>
    setCarouselIndex((i) => (i + 1) % featured.length);

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <Link
                href="/dashboard/gym-owner/facility"
                className="inline-flex items-center gap-1 text-xs font-semibold text-foreground/60 hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All locations
              </Link>
              <h1 className="mt-1 text-2xl sm:text-3xl font-black text-foreground">
                {listing.headline}
              </h1>
              <p className="text-foreground/60 mt-1 text-sm">
                Manage facilities and amenities for this location
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600"
            >
              <Plus className="h-4 w-4" />
              Add facility
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Total Facilities
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {totalCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Available
              </p>
              <p className="text-3xl font-black text-primary-500 mt-2">
                {availableCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Under Maintenance
              </p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">
                {maintenanceCount}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Active Amenities
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {amenities.length}
              </p>
            </div>
          </div>

          {/* Featured Carousel */}
          {featured.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  Featured Facilities
                </h2>
                {featured.length > 1 && (
                  <div className="hidden sm:flex items-center gap-2">
                    <button
                      type="button"
                      onClick={goToPrev}
                      className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="h-5 w-5 text-foreground" />
                    </button>
                    <button
                      type="button"
                      onClick={goToNext}
                      className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50"
                      aria-label="Next"
                    >
                      <ChevronRight className="h-5 w-5 text-foreground" />
                    </button>
                  </div>
                )}
              </div>

              <div className="relative overflow-hidden rounded-2xl">
                <div
                  className="flex transition-transform duration-500 ease-out"
                  style={{
                    transform: `translateX(-${carouselIndex * 100}%)`,
                  }}
                >
                  {featured.map((facility) => {
                    const Icon = getFacilityIcon(facility.icon_key);
                    const gradientClass = getFacilityGradient(
                      facility.gradient,
                    );
                    return (
                      <div
                        key={facility._id}
                        className="w-full flex-shrink-0"
                      >
                        <div
                          className={`relative bg-gradient-to-br ${gradientClass} text-white p-6 sm:p-10 min-h-[260px] sm:min-h-[320px] flex flex-col sm:flex-row items-start sm:items-center gap-6 overflow-hidden`}
                        >
                          {facility.image_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={facility.image_url}
                              alt={facility.name}
                              className="absolute inset-0 h-full w-full object-cover opacity-90"
                            />
                          ) : (
                            <div className="h-24 w-24 sm:h-36 sm:w-36 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                              <Icon className="h-12 w-12 sm:h-20 sm:w-20" />
                            </div>
                          )}
                          <div className="relative flex-1 min-w-0">
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur uppercase tracking-wide">
                              {FACILITY_CATEGORY_LABELS[facility.category]}
                            </span>
                            <h3 className="text-2xl sm:text-4xl font-black mt-3 leading-tight">
                              {facility.name}
                            </h3>
                            {facility.description && (
                              <p className="mt-2 text-sm sm:text-base text-white/85 max-w-xl">
                                {facility.description}
                              </p>
                            )}
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-foreground">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                                Available
                              </span>
                              <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur text-white">
                                {FACILITY_CONDITION_LABELS[facility.condition]}{" "}
                                condition
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {featured.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                    {featured.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setCarouselIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-2 rounded-full transition-all ${
                          i === carouselIndex
                            ? "w-8 bg-white"
                            : "w-2 bg-white/50 hover:bg-white/75"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Amenities */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Amenities</h2>
              {amenitiesMutation.isPending && (
                <span className="text-xs text-foreground/50">Saving…</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {AMENITY_CATALOGUE.map((amenity) => {
                const Icon = amenity.icon;
                const enabled = amenities.includes(amenity.key);
                return (
                  <button
                    key={amenity.key}
                    type="button"
                    onClick={() => toggleAmenity(amenity.key)}
                    disabled={amenitiesMutation.isPending}
                    className={`text-left rounded-xl p-4 transition-all disabled:opacity-70 ${
                      enabled
                        ? "bg-white border-2 border-accent-blue-500 shadow-[var(--shadow-card)]"
                        : "bg-neutral-50 border-2 border-dashed border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                        enabled
                          ? "bg-accent-blue-50 text-accent-blue-500"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        enabled ? "text-foreground" : "text-foreground/50"
                      }`}
                    >
                      {amenity.label}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        enabled ? "text-primary-600" : "text-foreground/40"
                      }`}
                    >
                      {enabled ? "Active" : "Tap to enable"}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Gallery */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-foreground">
                Facility Gallery
              </h2>
              <div className="flex flex-wrap gap-2">
                {FILTER_LABELS.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      activeCategory === cat.key
                        ? "bg-foreground text-white"
                        : "bg-white border border-neutral-200 text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center shadow-[var(--shadow-card)]">
                <p className="text-foreground/60 text-sm">
                  {totalCount === 0
                    ? "No facilities yet — add your first one above."
                    : "No facilities match this category."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((facility) => {
                  const Icon = getFacilityIcon(facility.icon_key);
                  const gradientClass = getFacilityGradient(facility.gradient);
                  const underMaintenance =
                    facility.status === FacilityStatus.MAINTENANCE;
                  return (
                    <div
                      key={facility._id}
                      className="group bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-lg transition-shadow flex flex-col"
                    >
                      <div
                        className={`relative h-44 bg-gradient-to-br ${gradientClass} flex items-center justify-center overflow-hidden`}
                      >
                        {facility.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={facility.image_url}
                            alt={facility.name}
                            className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105 duration-500"
                          />
                        ) : (
                          <Icon className="h-20 w-20 text-white/90 transition-transform group-hover:scale-110 duration-500" />
                        )}
                        {underMaintenance ? (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-accent-yellow-500 text-foreground shadow">
                            <Wrench className="h-3 w-3" />
                            Maintenance
                          </span>
                        ) : (
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-white text-foreground shadow">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                            Available
                          </span>
                        )}
                        <span className="absolute top-3 right-3 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-black/25 backdrop-blur text-white">
                          {FACILITY_CATEGORY_LABELS[facility.category]}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="text-lg font-bold text-foreground">
                          {facility.name}
                        </h3>
                        {facility.description && (
                          <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                            {facility.description}
                          </p>
                        )}

                        <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-foreground/50 font-medium">
                              Condition
                            </p>
                            <p className="text-sm font-semibold text-foreground mt-0.5">
                              {FACILITY_CONDITION_LABELS[facility.condition]}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditing(facility);
                                setFormOpen(true);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-accent-blue-500 hover:bg-accent-blue-50"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleting(facility)}
                              className="inline-flex items-center gap-1 p-2 rounded-lg text-foreground/50 hover:bg-red-50 hover:text-red-600"
                              aria-label="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <FacilityItemFormModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        initial={editing}
        saving={addMutation.isPending || updateMutation.isPending}
      />

      <ConfirmationModal
        isOpen={!!deleting}
        title="Delete facility?"
        description={
          deleting
            ? `"${deleting.name}" will be removed from this location's marketplace profile. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
        isConfirming={deleteMutation.isPending}
      />
    </div>
  );
}
