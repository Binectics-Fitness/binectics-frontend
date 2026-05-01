"use client";

import Link from "next/link";
import Image from "next/image";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { type ClientProfile } from "@/lib/api/progress";
import { useDashboardStats, useClientProfiles } from "@/lib/queries/progress";

function getClientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object" && profile.client_id) {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Unknown Client";
}

export default function TrainerDashboard() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.TRAINER);
  const { data: dashboardStats } = useDashboardStats(!!user);
  const { data: allClientProfiles } = useClientProfiles(undefined, !!user);
  const clientProfiles = allClientProfiles?.slice(0, 4) ?? [];

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const displayName = user ? `${user.first_name} ${user.last_name}` : "";

  // Stats cards (only fields backed by real API data)
  const stats = [
    {
      label: "Active Clients",
      value: dashboardStats?.active_clients?.toString() ?? "0",
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
      color: "icon-glow-green",
    },
    {
      label: "Pending Requests",
      value: dashboardStats?.pending_requests?.toString() ?? "0",
      subtext: "Awaiting your review",
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
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
      color: "icon-glow-blue",
    },
    {
      label: "Pending Invitations",
      value: dashboardStats?.pending_invitations?.toString() ?? "0",
      subtext: "Sent to potential clients",
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
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      ),
      color: "icon-glow-yellow",
    },
    {
      label: "Total Clients",
      value: dashboardStats?.total_clients?.toString() ?? "0",
      subtext: "All-time client roster",
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
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ),
      color: "icon-glow-purple",
    },
  ];

  // Today's sessions (no integration yet)
  const todaySessions: Array<{
    time: string;
    client: string;
    type: string;
    duration: string;
    status: "upcoming" | "completed";
    avatar: React.ReactNode;
  }> = [];

  // Quick actions
  const quickActions = [
    {
      label: "Create Workout Plan",
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
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
      href: "/dashboard/trainer/workouts/create",
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
      href: "/dashboard/trainer/clients",
      color: "bg-accent-blue-500",
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
      href: "/dashboard/trainer/sessions",
      color: "bg-accent-yellow-500",
    },
    {
      label: "Exercise Library",
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
      href: "/dashboard/trainer/exercises",
      color: "bg-accent-purple-500",
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      {/* Main Content */}
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 rounded-full bg-gradient-to-b from-accent-yellow-500 to-accent-yellow-600" />
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
            </div>
            <Link
              href="/dashboard/trainer/settings"
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
              className="bg-white rounded-xl p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)]"
            >
              <div
                className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${stat.color} text-2xl`}
              >
                {stat.icon}
              </div>
              <p className="font-display text-2xl font-black text-foreground mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-foreground-secondary mb-1">
                {stat.label}
              </p>
              <p className="text-sm text-foreground-tertiary">{stat.subtext}</p>
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
                className={`group flex flex-col gap-3 rounded-xl ${action.color} p-5 text-white shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-1`}
              >
                <div className="text-white/90">{action.icon}</div>
                <p className="text-base font-semibold leading-snug">
                  {action.label}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Today's Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Today&apos;s Sessions
              </h2>
              <Link
                href="/dashboard/trainer/sessions"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)]">
              {todaySessions.length === 0 ? (
                <EmptyState
                  compact
                  accent="blue"
                  title="No sessions today"
                  description="You don't have any sessions scheduled for today. Enjoy the break or open up new availability."
                  actionLabel="View Schedule"
                  actionHref="/dashboard/trainer/sessions"
                  icon={
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0V11.25A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                  }
                />
              ) : (
                <ul className="space-y-4 p-6">
                  {todaySessions.map((session, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-2xl">
                        {session.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">
                          {session.client}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {session.type} • {session.duration}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium text-foreground">
                          {session.time}
                        </p>
                        <span
                          className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                            session.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {session.status === "completed" ? "Done" : "Upcoming"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Client Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Client Progress
              </h2>
              <Link
                href="/dashboard/trainer/clients"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-[var(--shadow-card)]">
              {clientProfiles.length === 0 ? (
                <EmptyState message="No clients yet. Add your first client to get started." />
              ) : (
                <ul className="space-y-5">
                  {clientProfiles.map((profile) => {
                    const name = getClientName(profile);
                    const goal = profile.goals?.[0] ?? "—";
                    const joined = new Date(
                      profile.created_at,
                    ).toLocaleDateString();
                    return (
                      <li
                        key={profile._id}
                        className="pb-5 border-b border-neutral-100 last:border-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xl">
                            {typeof profile.client_id === "object" &&
                            profile.client_id.profile_picture ? (
                              <Image
                                src={profile.client_id.profile_picture}
                                alt={name}
                                width={40}
                                height={40}
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
                            <p className="text-sm text-foreground-tertiary">
                              Joined {joined}
                            </p>
                          </div>
                          <span className="bg-primary-100 shrink-0 px-2 py-1 text-xs font-semibold text-primary-700">
                            {goal}
                          </span>
                        </div>
                        {profile.starting_weight_kg &&
                          profile.target_weight_kg &&
                          profile.starting_weight_kg !==
                            profile.target_weight_kg && (
                            <p className="text-sm text-foreground-tertiary">
                              {profile.starting_weight_kg} kg →{" "}
                              {profile.target_weight_kg} kg
                            </p>
                          )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
