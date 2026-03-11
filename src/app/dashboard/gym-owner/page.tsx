"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useAuth } from "@/contexts/AuthContext";
import { teamsService } from "@/lib/api/teams";

export default function GymOwnerDashboard() {
  const router = useRouter();
  const [selectedPeriod, setSelectedPeriod] = useState("today");
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { user } = useAuth();
  const [canViewOwnerDashboard, setCanViewOwnerDashboard] = useState(false);
  const [resolvingPerspective, setResolvingPerspective] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function resolvePerspective() {
      if (authLoading || !isAuthorized || !user) return;

      if (user.role === "GYM_OWNER" || user.role === "ADMIN") {
        if (mounted) {
          setCanViewOwnerDashboard(true);
          setResolvingPerspective(false);
        }
        return;
      }

      try {
        const res = await teamsService.getMyOrganizations();
        if (!mounted) return;

        // Only org owners can view the owner dashboard
        const hasOwnerPerspective =
          !!res.success && !!res.data && res.data.some((org) => org.is_owner);

        if (hasOwnerPerspective) {
          setCanViewOwnerDashboard(true);
        } else {
          router.replace("/dashboard");
          return;
        }
      } finally {
        if (mounted) setResolvingPerspective(false);
      }
    }

    resolvePerspective();

    return () => {
      mounted = false;
    };
  }, [authLoading, isAuthorized, user, router]);

  if (authLoading || resolvingPerspective) return <DashboardLoading />;
  if (!isAuthorized || !canViewOwnerDashboard) return null;

  // Mock gym data
  const gymData = {
    name: "PowerHouse Fitness Downtown",
    location: "New York, NY",
    rating: 4.9,
    totalMembers: 1247,
    activeToday: 87,
    revenue: {
      today: 2340,
      thisWeek: 15680,
      thisMonth: 67450,
    },
  };

  // Stats cards
  const stats = [
    {
      label: "Check-ins Today",
      value: "87",
      change: "+12%",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-accent-blue-100",
      iconColor: "text-accent-blue-600",
    },
    {
      label: "Revenue Today",
      value: `$${gymData.revenue.today.toLocaleString()}`,
      change: "+8%",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-primary-100",
      iconColor: "text-primary-600",
    },
    {
      label: "Active Members",
      value: gymData.totalMembers.toLocaleString(),
      change: "+24",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-accent-yellow-100",
      iconColor: "text-accent-yellow-600",
    },
    {
      label: "Avg. Rating",
      value: gymData.rating.toFixed(1),
      change: "+0.2",
      changeType: "positive",
      icon: (
        <svg
          className="h-6 w-6"
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
      color: "bg-accent-purple-100",
      iconColor: "text-accent-purple-600",
    },
  ];

  // Recent check-ins
  const recentCheckins = [
    {
      name: "John Doe",
      time: "2 minutes ago",
      plan: "Pro",
      avatar: (
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
      ),
    },
    {
      name: "Sarah Johnson",
      time: "15 minutes ago",
      plan: "Elite",
      avatar: (
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
      ),
    },
    {
      name: "Mike Chen",
      time: "28 minutes ago",
      plan: "Pro",
      avatar: (
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
      ),
    },
    {
      name: "Emily Davis",
      time: "45 minutes ago",
      plan: "Starter",
      avatar: (
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
      ),
    },
    {
      name: "James Wilson",
      time: "1 hour ago",
      plan: "Pro",
      avatar: (
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
      ),
    },
  ];

  // Upcoming classes
  const upcomingClasses = [
    {
      name: "HIIT Training",
      time: "10:00 AM",
      instructor: "Mike Chen",
      capacity: "12/15",
      status: "filling",
    },
    {
      name: "Yoga Flow",
      time: "11:30 AM",
      instructor: "Sarah Johnson",
      capacity: "8/12",
      status: "available",
    },
    {
      name: "Strength Training",
      time: "2:00 PM",
      instructor: "John Doe",
      capacity: "15/15",
      status: "full",
    },
    {
      name: "CrossFit",
      time: "4:30 PM",
      instructor: "Emily Davis",
      capacity: "10/20",
      status: "available",
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: "Add New Class",
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
      href: "/dashboard/gym-owner/classes/new",
      color: "bg-primary-500",
    },
    {
      label: "View All Members",
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
      href: "/dashboard/gym-owner/members",
      color: "bg-accent-blue-500",
    },
    {
      label: "Revenue Report",
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
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
      href: "/dashboard/gym-owner/revenue",
      color: "bg-accent-yellow-500",
    },
    {
      label: "Manage Facility",
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
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      ),
      href: "/dashboard/gym-owner/facility",
      color: "bg-accent-purple-500",
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <GymOwnerSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl font-black text-foreground mb-2">
                {gymData.name}
              </h1>
              <p className="text-foreground-secondary">
                {gymData.location} • Managing your fitness empire
              </p>
            </div>
            <Link
              href="/dashboard/gym-owner/settings"
              className="inline-flex h-10 items-center justify-center border border-neutral-200 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
            >
              Edit Gym Profile
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
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center  ${stat.color} ${stat.iconColor}`}
                >
                  {stat.icon}
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                    stat.changeType === "positive"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-sm text-foreground-secondary mb-1">
                {stat.label}
              </p>
              <p className="font-display text-2xl font-black text-foreground">
                {stat.value}
              </p>
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
          {/* Recent Check-ins */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Recent Check-ins
              </h2>
              <Link
                href="/dashboard/gym-owner/checkins"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-background p-6 shadow-card">
              <ul className="space-y-4">
                {recentCheckins.map((checkin, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-2xl">
                      {checkin.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {checkin.name}
                      </p>
                      <p className="text-sm text-foreground-secondary">
                        {checkin.time}
                      </p>
                    </div>
                    <span className=" bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      {checkin.plan}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Upcoming Classes */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Today's Classes
              </h2>
              <Link
                href="/dashboard/gym-owner/classes"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Manage
              </Link>
            </div>
            <div className="bg-background p-6 shadow-card">
              <ul className="space-y-4">
                {upcomingClasses.map((classItem, index) => (
                  <li
                    key={index}
                    className="pb-4 border-b border-neutral-100 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {classItem.name}
                        </p>
                        <p className="text-sm text-foreground-secondary">
                          {classItem.instructor}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          classItem.status === "full"
                            ? "bg-red-100 text-red-700"
                            : classItem.status === "filling"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {classItem.capacity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-foreground-tertiary">
                      {classItem.time}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
