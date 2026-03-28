"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { checkinsService } from "@/lib/api/checkins";
import {
  CheckInHistoryPeriod,
  type CheckIn,
  type MyCheckInDashboardStats,
  UserRole,
} from "@/lib/types";

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getListingName(checkIn: CheckIn): string {
  if (typeof checkIn.listing_id === "object" && checkIn.listing_id !== null) {
    return (checkIn.listing_id as { headline?: string }).headline ?? "Gym";
  }
  return "Gym";
}

function getListingCity(checkIn: CheckIn): string {
  if (typeof checkIn.listing_id === "object" && checkIn.listing_id !== null) {
    const listing = checkIn.listing_id as {
      city?: string;
      country_code?: string;
    };
    return [listing.city, listing.country_code].filter(Boolean).join(", ");
  }
  return "";
}

export default function MemberCheckInsPage() {
  const { isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [stats, setStats] = useState<MyCheckInDashboardStats | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "all" | "today" | "week" | "month"
  >("month");

  useEffect(() => {
    if (isLoading || !isAuthorized) return;
    let mounted = true;
    async function loadStats() {
      try {
        const res = await checkinsService.getMyDashboardStats();
        if (mounted && res.success && res.data) {
          setStats(res.data);
        }
      } catch {
        // non-critical
      }
    }
    void loadStats();
    return () => {
      mounted = false;
    };
  }, [isLoading, isAuthorized]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const period =
        selectedPeriod === "all"
          ? undefined
          : (selectedPeriod as CheckInHistoryPeriod);
      const res = await checkinsService.getMyHistory(period);
      if (res.success && res.data) {
        setCheckIns(res.data);
      }
    } catch {
      setCheckIns([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (isLoading || !isAuthorized) return;
    window.setTimeout(() => void loadHistory(), 0);
  }, [isLoading, isAuthorized, loadHistory]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <DashboardSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2">
              My Check-ins
            </h1>
            <p className="text-foreground/60">
              Track your gym attendance and streaks
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
            <div className="bg-white p-4 shadow-[var(--shadow-card)] rounded-xl">
              <p className="text-sm text-foreground/60 mb-1">Today</p>
              <div className="flex items-center gap-2">
                <span
                  className={`h-3 w-3 rounded-full ${
                    stats?.has_checked_in_today
                      ? "bg-primary-500"
                      : "bg-neutral-300"
                  }`}
                />
                <p className="text-lg font-bold text-foreground">
                  {stats?.has_checked_in_today ? "Done" : "Not yet"}
                </p>
              </div>
            </div>
            <div className="bg-white p-4 shadow-[var(--shadow-card)] rounded-xl">
              <p className="text-sm text-foreground/60 mb-1">Streak</p>
              <p className="text-2xl font-black text-foreground">
                {stats?.current_streak_days ?? 0}
                <span className="text-base font-normal text-foreground/50">
                  {" "}
                  days
                </span>
              </p>
            </div>
            <div className="bg-white p-4 shadow-[var(--shadow-card)] rounded-xl">
              <p className="text-sm text-foreground/60 mb-1">Total</p>
              <p className="text-2xl font-black text-foreground">
                {stats?.total_check_ins ?? 0}
              </p>
            </div>
            <div className="bg-white p-4 shadow-[var(--shadow-card)] rounded-xl">
              <p className="text-sm text-foreground/60 mb-1">Last Check-in</p>
              <p className="text-sm font-semibold text-foreground">
                {stats?.last_check_in_at
                  ? formatDate(stats.last_check_in_at as unknown as string)
                  : "—"}
              </p>
            </div>
          </div>

          {/* QR Help Link */}
          <div className="mb-6 flex justify-end">
            <Link
              href="/qr-help"
              className="text-sm font-semibold text-accent-blue-500 hover:text-accent-blue-600"
            >
              How does QR check-in work? →
            </Link>
          </div>

          {/* Period Filter */}
          <div className="flex gap-2 mb-6">
            {(["today", "week", "month", "all"] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? "bg-accent-blue-500 text-white"
                    : "bg-neutral-100 text-foreground hover:bg-neutral-200"
                }`}
              >
                {period === "all"
                  ? "All Time"
                  : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>

          {/* Check-in History */}
          <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Check-in History
            </h2>

            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-neutral-100 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : checkIns.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-foreground/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <p className="text-foreground/60 font-medium">
                  No check-ins in this period
                </p>
                <p className="text-sm text-foreground/40 mt-1">
                  Scan a gym&apos;s QR code to check in
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn._id}
                    className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white flex-shrink-0">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {getListingName(checkIn)}
                        </p>
                        {getListingCity(checkIn) && (
                          <p className="text-sm text-foreground/60">
                            {getListingCity(checkIn)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatTime(checkIn.checked_in_at)}
                      </p>
                      <p className="text-sm text-foreground/60">
                        {formatDate(checkIn.checked_in_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
