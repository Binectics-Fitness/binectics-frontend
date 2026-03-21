"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DieticianSidebar from "@/components/DieticianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import {
  consultationsService,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import {
  progressService,
  type DashboardStats,
  type ClientProfile,
  type LatestWeight,
} from "@/lib/api/progress";

function getClientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object" && profile.client_id) {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Unknown Client";
}

function computeProgress(
  profile: ClientProfile,
  latestWeights: Record<string, LatestWeight | null>,
): number {
  const start = profile.starting_weight_kg;
  const target = profile.target_weight_kg;
  if (typeof start !== "number" || typeof target !== "number") return 0;
  if (!isFinite(start) || !isFinite(target) || start === target) return 0;

  const latest = latestWeights[profile._id];
  if (!latest) return 0;

  const current = latest.weight_kg;
  const totalChange = target - start;
  const currentChange = current - start;
  let progress = (currentChange / totalChange) * 100;

  return Math.max(0, Math.min(100, Math.round(progress)));
}

export default function DieticianDashboard() {
  const { user, isLoading, isAuthorized } = useRoleGuard("DIETICIAN");
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(
    null,
  );
  const [clientProfiles, setClientProfiles] = useState<ClientProfile[]>([]);
  const [latestWeights, setLatestWeights] = useState<
    Record<string, LatestWeight | null>
  >({});
  const [todayProviderBookings, setTodayProviderBookings] = useState<
    ConsultationBooking[]
  >([]);

  useEffect(() => {
    if (!user) return;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    progressService.getDashboardStats().then((res) => {
      if (res.success && res.data) setDashboardStats(res.data);
    });
    progressService.getMyClientProfiles().then((res) => {
      if (res.success && res.data) setClientProfiles(res.data.slice(0, 4));
    });
    progressService.getLatestWeights().then((res) => {
      if (res.success && res.data) setLatestWeights(res.data);
    });

    consultationsService
      .getProviderBookings({
        from: startOfDay.toISOString(),
        to: endOfDay.toISOString(),
      })
      .then((res) => {
        if (res.success && res.data) {
          setTodayProviderBookings(res.data);
        }
      });
  }, [user]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const displayName = user ? `${user.first_name} ${user.last_name}` : "";
  const completedTodayCount = todayProviderBookings.filter(
    (booking) => booking.status === "COMPLETED",
  ).length;
  const upcomingTodayCount = todayProviderBookings.filter(
    (booking) => booking.status === "CONFIRMED" || booking.status === "PENDING",
  ).length;

  // Stats cards
  const stats = [
    {
      label: "Consultations Today",
      value: todayProviderBookings.length.toString(),
      subtext: `${completedTodayCount} completed, ${upcomingTodayCount} upcoming`,
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      color: "bg-accent-purple-100",
    },
    {
      label: "Active Clients",
      value: dashboardStats?.active_clients?.toString() ?? "—",
      subtext: `${dashboardStats?.total_clients ?? 0} total clients`,
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      color: "bg-primary-100",
    },
    {
      label: "This Week Earnings",
      value: "$1,760",
      subtext: "22 consultations completed",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: "bg-accent-yellow-100",
    },
    {
      label: "Avg. Rating",
      value: "4.9",
      subtext: "Based on 189 reviews",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      color: "bg-accent-blue-100",
    },
  ];

  // Transform API bookings to display format
  const todayConsultations = todayProviderBookings.map((booking) => {
    const startDate = new Date(booking.startsAt);
    const endDate = new Date(booking.endsAt);

    // Format time as HH:MM AM/PM
    const time = startDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    // Calculate duration in minutes
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.round(durationMs / (1000 * 60));
    const duration = `${durationMinutes} min`;

    // Look up client name from clientProfiles array
    const clientProfile = clientProfiles.find((profile) => {
      const clientId =
        typeof profile.client_id === "string"
          ? profile.client_id
          : profile.client_id?._id;
      return clientId === booking.clientUserId;
    });

    let client = "Client";
    if (clientProfile) {
      const clientObj =
        typeof clientProfile.client_id === "object"
          ? clientProfile.client_id
          : null;
      if (clientObj) {
        client =
          `${clientObj.first_name || ""} ${clientObj.last_name || ""}`.trim();
      }
    }

    // Map booking status to display status
    const displayStatus =
      booking.status === "COMPLETED" || booking.status === "NO_SHOW"
        ? "completed"
        : "upcoming";

    // Generic user avatar SVG
    const avatar = (
      <svg
        className="h-8 w-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    );

    return {
      time,
      client,
      type: "Consultation", // Generic type since we don't fetch type name yet
      duration,
      status: displayStatus,
      avatar,
    };
  });

  // Recent meal plans
  const recentMealPlans = [
    {
      name: "High Protein Weight Loss",
      client: "Sarah Johnson",
      calories: "1,500 kcal",
      macros: "P: 40% C: 30% F: 30%",
      duration: "4 weeks",
    },
    {
      name: "Muscle Building Plan",
      client: "John Doe",
      calories: "2,800 kcal",
      macros: "P: 30% C: 45% F: 25%",
      duration: "8 weeks",
    },
    {
      name: "Balanced Maintenance",
      client: "Mike Wilson",
      calories: "2,200 kcal",
      macros: "P: 25% C: 50% F: 25%",
      duration: "12 weeks",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: "Create Meal Plan",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v12m0 0a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
      ),
      href: "/dashboard/dietician/meal-plans/new",
      color: "bg-primary-500",
    },
    {
      label: "View All Clients",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      href: "/dashboard/dietician/clients",
      color: "bg-accent-purple-500",
    },
    {
      label: "Check Schedule",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      href: "/dashboard/dietician/consultations",
      color: "bg-accent-yellow-500",
    },
    {
      label: "Recipe Library",
      icon: (
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      href: "/dashboard/dietician/recipes",
      color: "bg-accent-blue-500",
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DieticianSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl font-black text-foreground mb-2">
                Welcome back, {displayName}!
              </h1>
              <p className="text-foreground-secondary">
                {dashboardStats
                  ? `${dashboardStats.active_clients} active clients • ${dashboardStats.pending_requests} pending requests`
                  : "Loading stats..."}
              </p>
            </div>
            <Link
              href="/dashboard/dietician/settings"
              className="inline-flex h-10 items-center justify-center border border-neutral-200 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center  ${stat.color} text-2xl`}
              >
                {stat.icon}
              </div>
              <p className="font-display text-2xl font-black text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-foreground-secondary mb-1">
                {stat.label}
              </p>
              <p className="text-xs text-foreground-tertiary">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-black text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`group  ${action.color} p-6 text-center shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <p className="font-semibold text-white">{action.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Today's Consultations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Today's Consultations
              </h2>
              <Link
                href="/dashboard/dietician/consultations"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-background p-6 shadow-card">
              {todayConsultations.length === 0 ? (
                <EmptyState message="No consultations scheduled for today." />
              ) : (
                <ul className="space-y-4">
                  {todayConsultations.map((consultation, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-2xl shrink-0">
                        {consultation.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {consultation.client}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {consultation.type} • {consultation.duration}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-foreground">
                          {consultation.time}
                        </p>
                        <span
                          className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            consultation.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {consultation.status === "completed"
                            ? "Done"
                            : "Upcoming"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Client Nutrition Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Client Progress
              </h2>
              <Link
                href="/dashboard/dietician/clients"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-background p-6 shadow-card">
              {clientProfiles.length === 0 ? (
                <EmptyState message="No clients yet. Add your first client to get started." />
              ) : (
                <ul className="space-y-5">
                  {clientProfiles.map((profile) => {
                    const name = getClientName(profile);
                    const goal = profile.goals[0] ?? "—";
                    const start = profile.starting_weight_kg;
                    const target = profile.target_weight_kg;
                    const progress = computeProgress(profile, latestWeights);
                    return (
                      <li
                        key={profile._id}
                        className="pb-5 border-b border-neutral-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xl shrink-0">
                            {typeof profile.client_id === "object" &&
                            profile.client_id.profile_picture ? (
                              <img
                                src={profile.client_id.profile_picture}
                                alt={name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <svg
                                className="h-5 w-5 text-neutral-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {name}
                            </p>
                            <p className="text-xs text-foreground-tertiary">
                              {start ? `${start} kg` : "—"} →{" "}
                              {target ? `${target} kg` : "—"}
                            </p>
                          </div>
                          <span className="bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700 shrink-0">
                            {goal}
                          </span>
                        </div>
                        {start &&
                          target &&
                          start !== target &&
                          (latestWeights[profile._id] ? (
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-foreground-secondary">
                                  Progress
                                </span>
                                <span className="font-semibold text-foreground">
                                  {progress}%
                                </span>
                              </div>
                              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-foreground-tertiary">
                              No weight logs yet
                            </p>
                          ))}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        {/* Recent Meal Plans */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-black text-foreground">
              Recent Meal Plans
            </h2>
            <Link
              href="/dashboard/dietician/meal-plans"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentMealPlans.map((plan, index) => (
              <div
                key={index}
                className="bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
              >
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-foreground-secondary mb-4">
                  {plan.client}
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-tertiary">Calories</span>
                    <span className="font-semibold text-foreground">
                      {plan.calories}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-tertiary">Macros</span>
                    <span className="font-semibold text-foreground">
                      {plan.macros}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-tertiary">Duration</span>
                    <span className="font-semibold text-foreground">
                      {plan.duration}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
