"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import TimezoneHelpBadge from "@/components/TimezoneHelpBadge";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
} from "@/lib/api/consultations";
import { UserRole } from "@/lib/types";
import { getClientTimezone } from "@/utils/format";

type TabKey = "upcoming" | "past" | "all";

const STATUS_COLORS: Record<ConsultationBookingStatus, string> = {
  [ConsultationBookingStatus.PENDING]: "bg-yellow-100 text-yellow-800",
  [ConsultationBookingStatus.CONFIRMED]: "bg-blue-100 text-blue-800",
  [ConsultationBookingStatus.COMPLETED]: "bg-green-100 text-green-800",
  [ConsultationBookingStatus.CANCELLED]: "bg-red-100 text-red-800",
  [ConsultationBookingStatus.NO_SHOW]: "bg-gray-100 text-gray-800",
};

function formatDateTime(iso: string, tz: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      timeZone: tz,
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }
}

export default function TrainerSessionsPage() {
  const { user, isLoading: authLoading } = useRoleGuard(UserRole.TRAINER);
  const userTimezone = getClientTimezone();

  const [tab, setTab] = useState<TabKey>("upcoming");
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");

    const now = new Date().toISOString();
    let params: Parameters<typeof consultationsService.getProviderBookings>[0];

    if (tab === "upcoming") {
      params = { from: now };
    } else if (tab === "past") {
      params = { to: now };
    } else {
      params = {};
    }

    const response = await consultationsService.getProviderBookings(params);
    if (response.success && response.data) {
      const sorted = [...response.data].sort((a, b) => {
        const dateA = new Date(a.startsAt).getTime();
        const dateB = new Date(b.startsAt).getTime();
        return tab === "past" ? dateB - dateA : dateA - dateB;
      });
      setBookings(sorted);
    } else {
      setError(response.message || "Failed to load sessions");
    }
    setIsLoading(false);
  }, [tab]);

  useEffect(() => {
    if (authLoading || !user) return;
    void loadBookings();
  }, [authLoading, user, loadBookings]);

  const handleComplete = async (id: string) => {
    setActionLoadingId(id);
    const response = await consultationsService.completeBooking(id);
    if (response.success) {
      await loadBookings();
    } else {
      setError(response.message || "Failed to complete session");
    }
    setActionLoadingId(null);
  };

  const handleCancel = async (id: string) => {
    setActionLoadingId(id);
    const response = await consultationsService.cancelBooking(id, {
      reason: "Cancelled by trainer",
    });
    if (response.success) {
      await loadBookings();
    } else {
      setError(response.message || "Failed to cancel session");
    }
    setActionLoadingId(null);
  };

  if (authLoading) return <DashboardLoading />;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
    { key: "all", label: "All" },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header with timezone info */}
        <section className="mb-8 rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                Sessions & Schedule
              </h1>
              <TimezoneHelpBadge
                message="Session times are shown in your local browser timezone. Availability rules you set in Consultation Availability are automatically converted for clients."
                label="Scheduling timezone help"
              />
            </div>
            <Link
              href="/dashboard/trainer/consultations"
              className="inline-flex items-center rounded-lg bg-accent-yellow-500 px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent-yellow-600"
            >
              Manage Availability
            </Link>
          </div>

          <p className="text-sm text-foreground/60">
            Your current browser timezone is{" "}
            <span className="font-semibold text-foreground">
              {userTimezone}
            </span>
            . All session times below are displayed in this timezone.
          </p>
        </section>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg bg-white p-1 shadow-card w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.key
                  ? "bg-accent-yellow-500 text-foreground"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-yellow-500 border-t-transparent" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-yellow-100">
              <svg
                className="h-8 w-8 text-accent-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">
              No {tab === "all" ? "" : tab} sessions
            </h3>
            <p className="text-sm text-foreground/60 mb-4">
              {tab === "upcoming"
                ? "You don't have any upcoming sessions. Set up your availability so clients can book."
                : tab === "past"
                  ? "No past sessions found."
                  : "No sessions found."}
            </p>
            {tab === "upcoming" && (
              <Link
                href="/dashboard/trainer/consultations"
                className="inline-flex items-center rounded-lg bg-accent-yellow-500 px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent-yellow-600"
              >
                Set Up Availability
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const isPending =
                booking.status === ConsultationBookingStatus.PENDING;
              const isConfirmed =
                booking.status === ConsultationBookingStatus.CONFIRMED;
              const canComplete =
                isConfirmed && new Date(booking.startsAt) <= new Date();
              const canCancel = isPending || isConfirmed;
              const isActionLoading = actionLoadingId === booking.id;

              return (
                <div
                  key={booking.id}
                  className="rounded-xl bg-white p-4 sm:p-6 shadow-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[booking.status]}`}
                        >
                          {booking.status}
                        </span>
                        {booking.consultationTypeId && (
                          <span className="text-xs text-foreground/50">
                            Type: {booking.consultationTypeId.slice(-6)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {formatDateTime(booking.startsAt, userTimezone)} –{" "}
                        {formatDateTime(booking.endsAt, userTimezone)}
                      </p>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        Client: {booking.clientUserId.slice(-8)}
                      </p>
                      {booking.notes && (
                        <p className="text-sm text-foreground/60 mt-1">
                          {booking.notes}
                        </p>
                      )}
                      {booking.cancelReason && (
                        <p className="text-xs text-red-600 mt-1">
                          Cancel reason: {booking.cancelReason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {canComplete && (
                        <button
                          onClick={() => handleComplete(booking.id)}
                          disabled={isActionLoading}
                          className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          {isActionLoading ? "..." : "Complete"}
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancel(booking.id)}
                          disabled={isActionLoading}
                          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {isActionLoading ? "..." : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
