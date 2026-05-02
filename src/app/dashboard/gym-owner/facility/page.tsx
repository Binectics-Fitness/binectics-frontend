"use client";

import { useEffect, useMemo, useState } from "react";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import {
  Dumbbell,
  HeartPulse,
  Flame,
  Lock,
  ShowerHead,
  Coffee,
  Car,
  Wifi,
  Shirt,
  UserCog,
  Users,
  Baby,
  Clock,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Sparkles,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// ─── Types & data ─────────────────────────────────────────────────────────

type FacilityCategory = "Equipment" | "Room" | "Amenity" | "Service";
type FacilityStatus = "Available" | "Maintenance";

interface Facility {
  id: number;
  name: string;
  category: FacilityCategory;
  status: FacilityStatus;
  condition: "Excellent" | "Good" | "Fair";
  description: string;
  icon: LucideIcon;
  gradient: string;
}

interface Amenity {
  name: string;
  enabled: boolean;
  icon: LucideIcon;
}

const FACILITIES: Facility[] = [
  {
    id: 1,
    name: "Free Weights",
    category: "Equipment",
    status: "Available",
    condition: "Excellent",
    description:
      "Full rack of dumbbells, barbells, and Olympic plates for strength training.",
    icon: Dumbbell,
    gradient: "from-accent-blue-500 to-accent-purple-500",
  },
  {
    id: 2,
    name: "Cardio Machines",
    category: "Equipment",
    status: "Available",
    condition: "Good",
    description:
      "Treadmills, ellipticals, rowers, and bikes for every cardio session.",
    icon: HeartPulse,
    gradient: "from-accent-blue-500 to-primary-500",
  },
  {
    id: 3,
    name: "Yoga Studio",
    category: "Room",
    status: "Available",
    condition: "Excellent",
    description: "Quiet, mirrored studio space for yoga, pilates, and stretch.",
    icon: Sparkles,
    gradient: "from-accent-purple-500 to-accent-blue-500",
  },
  {
    id: 4,
    name: "Sauna",
    category: "Amenity",
    status: "Maintenance",
    condition: "Fair",
    description:
      "Cedar sauna for post-workout recovery (currently being serviced).",
    icon: Flame,
    gradient: "from-accent-yellow-500 to-orange-500",
  },
  {
    id: 5,
    name: "Locker Rooms",
    category: "Amenity",
    status: "Available",
    condition: "Good",
    description: "Spacious lockers with digital locks and seating area.",
    icon: Lock,
    gradient: "from-neutral-700 to-neutral-900",
  },
  {
    id: 6,
    name: "Showers",
    category: "Amenity",
    status: "Available",
    condition: "Excellent",
    description: "Private shower stalls with premium toiletries.",
    icon: ShowerHead,
    gradient: "from-accent-blue-400 to-cyan-500",
  },
  {
    id: 7,
    name: "Juice Bar",
    category: "Service",
    status: "Available",
    condition: "Excellent",
    description:
      "Fresh juices, protein smoothies, and healthy snacks on demand.",
    icon: Coffee,
    gradient: "from-primary-500 to-accent-yellow-500",
  },
  {
    id: 8,
    name: "Parking",
    category: "Amenity",
    status: "Available",
    condition: "Good",
    description: "Covered parking with 50+ spaces, including EV charging.",
    icon: Car,
    gradient: "from-neutral-600 to-accent-blue-500",
  },
];

const AMENITIES: Amenity[] = [
  { name: "WiFi", enabled: true, icon: Wifi },
  { name: "Towel Service", enabled: true, icon: Shirt },
  { name: "Personal Training", enabled: true, icon: UserCog },
  { name: "Group Classes", enabled: true, icon: Users },
  { name: "Childcare", enabled: false, icon: Baby },
  { name: "24/7 Access", enabled: true, icon: Clock },
];

const CATEGORIES: ("All" | FacilityCategory)[] = [
  "All",
  "Equipment",
  "Room",
  "Amenity",
  "Service",
];

// ─── Component ────────────────────────────────────────────────────────────

export default function GymOwnerFacilityPage() {
  const [activeCategory, setActiveCategory] = useState<
    "All" | FacilityCategory
  >("All");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const featured = useMemo(
    () => FACILITIES.filter((f) => f.status === "Available").slice(0, 4),
    [],
  );

  const filtered = useMemo(
    () =>
      activeCategory === "All"
        ? FACILITIES
        : FACILITIES.filter((f) => f.category === activeCategory),
    [activeCategory],
  );

  // Auto-rotate the carousel every 5 seconds
  useEffect(() => {
    if (featured.length <= 1) return;
    const id = window.setInterval(() => {
      setCarouselIndex((i) => (i + 1) % featured.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [featured.length]);

  const goToPrev = () =>
    setCarouselIndex((i) => (i - 1 + featured.length) % featured.length);
  const goToNext = () =>
    setCarouselIndex((i) => (i + 1) % featured.length);

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">
              Facilities & Amenities
            </h1>
            <p className="text-foreground/60 mt-1">
              Manage your gym&apos;s facilities and amenities
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Total Facilities
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {FACILITIES.length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Available
              </p>
              <p className="text-3xl font-black text-primary-500 mt-2">
                {FACILITIES.filter((f) => f.status === "Available").length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Under Maintenance
              </p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">
                {FACILITIES.filter((f) => f.status === "Maintenance").length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-5 sm:p-6">
              <p className="text-sm font-medium text-foreground/60">
                Active Amenities
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {AMENITIES.filter((a) => a.enabled).length}
              </p>
            </div>
          </div>

          {/* Featured Carousel */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">
                Featured Facilities
              </h2>
              <div className="hidden sm:flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrev}
                  className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5 text-foreground" />
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  className="h-9 w-9 rounded-full border border-neutral-200 bg-white flex items-center justify-center hover:bg-neutral-50 transition-colors"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5 text-foreground" />
                </button>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-2xl">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${carouselIndex * 100}%)` }}
              >
                {featured.map((facility) => {
                  const Icon = facility.icon;
                  return (
                    <div key={facility.id} className="w-full flex-shrink-0">
                      <div
                        className={`relative bg-gradient-to-br ${facility.gradient} text-white p-6 sm:p-10 min-h-[260px] sm:min-h-[320px] flex flex-col sm:flex-row items-start sm:items-center gap-6`}
                      >
                        <div className="h-24 w-24 sm:h-36 sm:w-36 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0">
                          <Icon className="h-12 w-12 sm:h-20 sm:w-20" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur uppercase tracking-wide">
                            {facility.category}
                          </span>
                          <h3 className="text-2xl sm:text-4xl font-black mt-3 leading-tight">
                            {facility.name}
                          </h3>
                          <p className="mt-2 text-sm sm:text-base text-white/85 max-w-xl">
                            {facility.description}
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-foreground">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                              {facility.status}
                            </span>
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur text-white">
                              {facility.condition} condition
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dots */}
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
            </div>
          </section>

          {/* Amenities */}
          <section className="mb-10">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Amenities
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {AMENITIES.map((amenity) => {
                const Icon = amenity.icon;
                return (
                  <div
                    key={amenity.name}
                    className={`relative rounded-xl p-4 transition-all ${
                      amenity.enabled
                        ? "bg-white border-2 border-accent-blue-500 shadow-[var(--shadow-card)]"
                        : "bg-neutral-50 border-2 border-dashed border-neutral-200"
                    }`}
                  >
                    <div
                      className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 ${
                        amenity.enabled
                          ? "bg-accent-blue-50 text-accent-blue-500"
                          : "bg-neutral-100 text-neutral-400"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <p
                      className={`text-sm font-semibold ${
                        amenity.enabled
                          ? "text-foreground"
                          : "text-foreground/50"
                      }`}
                    >
                      {amenity.name}
                    </p>
                    <p
                      className={`mt-1 text-xs font-medium ${
                        amenity.enabled
                          ? "text-primary-600"
                          : "text-foreground/40"
                      }`}
                    >
                      {amenity.enabled ? "Active" : "Not offered"}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Category Filter + Gallery */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <h2 className="text-lg font-bold text-foreground">
                Facility Gallery
              </h2>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                      activeCategory === cat
                        ? "bg-foreground text-white"
                        : "bg-white border border-neutral-200 text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((facility) => {
                const Icon = facility.icon;
                const underMaintenance = facility.status === "Maintenance";
                return (
                  <div
                    key={facility.id}
                    className="group bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)] hover:shadow-lg transition-shadow flex flex-col"
                  >
                    {/* Hero */}
                    <div
                      className={`relative h-44 bg-gradient-to-br ${facility.gradient} flex items-center justify-center overflow-hidden`}
                    >
                      <Icon className="h-20 w-20 text-white/90 transition-transform group-hover:scale-110 duration-500" />
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
                        {facility.category}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="text-lg font-bold text-foreground">
                        {facility.name}
                      </h3>
                      <p className="mt-1 text-sm text-foreground/60 line-clamp-2">
                        {facility.description}
                      </p>

                      <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between">
                        <div>
                          <p className="text-xs text-foreground/50 font-medium">
                            Condition
                          </p>
                          <p className="text-sm font-semibold text-foreground mt-0.5">
                            {facility.condition}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-accent-blue-500 hover:bg-accent-blue-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="bg-white rounded-2xl p-10 text-center shadow-[var(--shadow-card)]">
                <p className="text-foreground/60">
                  No facilities match this category.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
