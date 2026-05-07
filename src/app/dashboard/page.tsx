"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import OnboardingBanner from "@/components/OnboardingBanner";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { useMyCheckInStats } from "@/lib/queries/checkins";
import { useMyOrganizations } from "@/lib/queries/teams";
import { useMyJournalEntries } from "@/lib/queries/progress";
import { useSearchListings } from "@/lib/queries/marketplace";
import { listingHref } from "@/lib/utils/listingHref";

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [resolvingPerspective, setResolvingPerspective] = useState(true);

  const readyToFetch = !isLoading && isAuthorized && !!user;
  const { data: myOrgs } = useMyOrganizations(readyToFetch);
  const { data: checkInStatus } = useMyCheckInStats(readyToFetch);
  const { data: journalData } = useMyJournalEntries(20, readyToFetch);
  const journalCount = journalData?.entries.length ?? null;
  const hasMoreJournals = journalData?.next_cursor !== null;

  // Marketplace: featured listing (top-rated)
  const { data: featuredData } = useSearchListings(
    { sort: "rating", limit: 1 },
    readyToFetch,
  );
  const featuredListing = featuredData?.listings?.[0] ?? null;

  // Marketplace: recommended listings
  const { data: recommendedData } = useSearchListings(
    { sort: "rating", limit: 4, page: 2 },
    readyToFetch,
  );
  const recommendedListings = recommendedData?.listings ?? [];

  // Marketplace: collection counts by type
  const { data: gymCount } = useSearchListings(
    { account_type: "gym_owner", limit: 1 },
    readyToFetch,
  );
  const { data: trainerCount } = useSearchListings(
    { account_type: "personal_trainer", limit: 1 },
    readyToFetch,
  );
  const { data: dietitianCount } = useSearchListings(
    { account_type: "dietitian", limit: 1 },
    readyToFetch,
  );

  useEffect(() => {
    if (isLoading || !isAuthorized || !user) return;

    // Wait for org query to resolve
    if (myOrgs === undefined) return;

    const isOwnerOfAnyOrg = myOrgs.some((org) => org.is_owner);
    if (isOwnerOfAnyOrg) {
      router.replace("/dashboard/gym-owner");
      return;
    }
    setResolvingPerspective(false);
  }, [isLoading, isAuthorized, user, myOrgs, router]);

  if (isLoading || resolvingPerspective) return <DashboardLoading />;
  if (!isAuthorized) return null;

  // TypeScript guard - at this point user is guaranteed to be non-null
  if (!user) return null;

  // Extract user display name (first name or full name)
  const displayName = user.first_name || user.last_name || "there";

  const userStats = {
    isOnboardingComplete: user.is_onboarding_complete ?? false,
  };

  // Helper: extract professional display name from a listing
  const getProviderName = (listing: (typeof recommendedListings)[number]) => {
    if (typeof listing.professional_id === "object") {
      return `${listing.professional_id.first_name} ${listing.professional_id.last_name}`;
    }
    return "";
  };

  // Helper: label for account type
  const accountTypeLabel = (type: string) => {
    switch (type) {
      case "gym_owner":
        return "Gym";
      case "personal_trainer":
        return "Personal Trainer";
      case "dietitian":
        return "Dietitian";
      default:
        return type;
    }
  };

  // Collection cards driven by real totals
  const collections = [
    {
      title: "Gyms",
      count: gymCount?.pagination?.total ?? 0,
      href: "/marketplace?account_type=gym_owner",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
        </svg>
      ),
      color: "bg-gradient-to-br from-accent-blue-400 to-accent-blue-600",
    },
    {
      title: "Personal Trainers",
      count: trainerCount?.pagination?.total ?? 0,
      href: "/marketplace?account_type=personal_trainer",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: "bg-gradient-to-br from-accent-yellow-400 to-accent-yellow-600",
    },
    {
      title: "Dietitians",
      count: dietitianCount?.pagination?.total ?? 0,
      href: "/marketplace?account_type=dietitian",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: "bg-gradient-to-br from-accent-purple-400 to-accent-purple-600",
    },
    {
      title: "All Listings",
      count: (gymCount?.pagination?.total ?? 0) + (trainerCount?.pagination?.total ?? 0) + (dietitianCount?.pagination?.total ?? 0),
      href: "/marketplace",
      icon: (
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: "bg-gradient-to-br from-primary-400 to-primary-600",
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      {/* Main Content */}
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="hidden sm:block h-8 w-1 rounded-full bg-gradient-to-b from-primary-500 to-primary-600" />
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              Welcome back, {displayName}!
            </h1>
          </div>
          <p className="text-sm sm:text-base text-foreground-secondary">
            {checkInStatus
              ? checkInStatus.current_streak_days > 0
                ? `You're on a ${checkInStatus.current_streak_days}-day streak with ${checkInStatus.total_check_ins} total check-ins.`
                : checkInStatus.total_check_ins > 0
                  ? `You've logged ${checkInStatus.total_check_ins} check-ins so far. Ready for your next workout?`
                  : "Ready for your first workout? Check in when you arrive."
              : "Ready for your next workout? Check in when you arrive."}
          </p>
        </div>

        {/* Onboarding Banner — shown first for new users */}
        {!userStats.isOnboardingComplete && (
          <div className="mb-6 sm:mb-8">
            <OnboardingBanner userRole={user.role} userName={displayName} />
          </div>
        )}

        {/* Check-in & Journal */}
        <div className="mb-6 sm:mb-8">
          {checkInStatus && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-neutral-200 rounded-xl shadow-[var(--shadow-card)]">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  checkInStatus.has_checked_in_today
                    ? "bg-primary-500 shadow-glow-green"
                    : "bg-neutral-400"
                }`}
              />
              <span className="text-sm text-foreground">
                {checkInStatus.has_checked_in_today
                  ? "Checked in today"
                  : checkInStatus.last_check_in_at
                    ? `Last check-in: ${new Date(
                        checkInStatus.last_check_in_at,
                      ).toLocaleDateString()}`
                    : "No check-ins yet"}
              </span>
            </div>
          )}

          <div className="mt-4 max-w-xl rounded-xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    My Journal Entries
                  </p>
                  {journalCount !== null && journalCount > 0 && (
                    <span className="rounded-full bg-primary-500 px-2 py-0.5 text-xs font-bold text-foreground">
                      {hasMoreJournals ? `${journalCount}+` : journalCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-foreground-secondary mt-1">
                  View notes and progress updates from your trainer and
                  dietitian.
                </p>
              </div>
              <Link
                href="/dashboard/journals"
                className="rounded-lg bg-primary-500 px-3 py-2 text-sm font-semibold text-foreground hover:bg-primary-600 whitespace-nowrap"
              >
                View Journals
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 sm:mb-8">
          <div className="relative max-w-2xl">
            <input
              type="text"
              placeholder="Search gyms, trainers, workouts, or nutrition plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 bg-white py-3 pl-12 pr-4 text-sm shadow-[var(--shadow-card)] transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:shadow-[var(--shadow-card-hover)]"
            />
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-tertiary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Selected Just For You */}
        <section className="mb-8 sm:mb-12">
          <h2 className="font-display text-xl sm:text-2xl font-black text-foreground mb-4 sm:mb-6">
            Selected just for you
          </h2>
          {featuredListing ? (
            <div className="bg-linear-to-r from-accent-yellow-50 to-accent-yellow-100 p-4 sm:p-6 md:p-8">
              <div className="flex flex-col-reverse md:flex-row items-start gap-4 sm:gap-6 md:gap-8">
                <div className="flex-1">
                  {featuredListing.accepting_clients && (
                    <div className="mb-4 inline-flex items-center gap-2 bg-primary-500 px-3 py-1 text-xs font-bold text-white">
                      <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
                      Accepting Clients
                    </div>
                  )}
                  <h3 className="font-display text-xl sm:text-2xl font-bold text-foreground mb-2">
                    {featuredListing.headline}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-4">
                    {[featuredListing.city, featuredListing.country_code].filter(Boolean).join(", ")}
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-6">
                    <div className="flex items-center gap-1">
                      <svg className="h-5 w-5 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-semibold text-foreground">
                        {featuredListing.average_rating.toFixed(1)}
                      </span>
                      <span className="text-sm text-foreground-secondary">
                        ({featuredListing.review_count} reviews)
                      </span>
                    </div>
                    <span className="text-sm text-foreground-secondary">
                      {accountTypeLabel(featuredListing.account_type)}
                      {featuredListing.specialties.length > 0 && ` • ${featuredListing.specialties.slice(0, 2).join(", ")}`}
                    </span>
                  </div>
                  <Link
                    href={listingHref(featuredListing)}
                    className="inline-flex h-11 sm:h-12 items-center justify-center bg-primary-500 px-6 sm:px-8 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-primary-600"
                  >
                    View Profile
                  </Link>
                </div>
                <div className="shrink-0">
                  {featuredListing.profile_image ? (
                    <img
                      src={featuredListing.profile_image}
                      alt={featuredListing.headline}
                      className="h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 object-cover shadow-lg"
                    />
                  ) : (
                    <div className="flex h-24 w-24 sm:h-28 sm:w-28 md:h-32 md:w-32 items-center justify-center bg-white shadow-lg">
                      <svg className="h-8 w-8 text-foreground-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
              <p className="text-sm text-foreground-secondary">
                No listings available yet.{" "}
                <Link href="/marketplace" className="text-accent-blue-500 hover:underline">
                  Browse the marketplace
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* Recommended for you */}
        <section className="mb-8 sm:mb-12">
          <div className="mb-4 sm:mb-6">
            <h2 className="font-display text-xl sm:text-2xl font-black text-foreground mb-2">
              Recommended for you
            </h2>
            <p className="text-sm text-foreground-secondary">
              We think you&apos;ll like these
            </p>
          </div>
          {recommendedListings.length > 0 ? (
            <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recommendedListings.map((listing) => (
                <Link
                  key={listing._id}
                  href={listingHref(listing)}
                  className="group bg-white p-4 sm:p-6 rounded-xl shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1 h-full flex flex-col"
                >
                  <div className="mb-4 inline-flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center bg-accent-blue-100 rounded-lg overflow-hidden">
                    {listing.profile_image ? (
                      <img
                        src={listing.profile_image}
                        alt={listing.headline}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <svg className="h-8 w-8 text-accent-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-primary-500 transition-colors">
                    {listing.headline}
                  </h3>
                  <p className="text-sm text-foreground-secondary mb-3">
                    {getProviderName(listing)}
                  </p>
                  <div className="flex items-center justify-between text-sm text-foreground-tertiary mb-4">
                    <span>{accountTypeLabel(listing.account_type)}</span>
                    {listing.city && <span>{listing.city}</span>}
                  </div>
                  <div className="mt-auto flex items-center gap-1">
                    <svg className="h-4 w-4 text-accent-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-sm font-semibold text-foreground">
                      {listing.average_rating.toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
              <p className="text-sm text-foreground-secondary">
                No recommendations available yet.{" "}
                <Link href="/marketplace" className="text-accent-blue-500 hover:underline">
                  Explore the marketplace
                </Link>
              </p>
            </div>
          )}
        </section>

        {/* Browse by Category */}
        <section>
          <div className="mb-4 sm:mb-6">
            <h2 className="font-display text-xl sm:text-2xl font-black text-foreground mb-2">
              Browse by category
            </h2>
            <p className="text-sm text-foreground-secondary">
              Find gyms, trainers, and dietitians on the marketplace
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {collections.map((collection, index) => (
              <Link
                key={index}
                href={collection.href}
                className={`group relative overflow-hidden rounded-xl ${collection.color} p-6 sm:p-8 text-center shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 h-full flex flex-col justify-center`}
              >
                <div className="mb-4 text-4xl sm:text-5xl text-white">
                  {collection.icon}
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white mb-2">
                  {collection.title}
                </h3>
                <p className="text-sm text-white/90">
                  {collection.count} {collection.count === 1 ? "listing" : "listings"}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
