"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
  type ConsultationType,
} from "@/lib/api/consultations";
import { progressService, type ClientProfile } from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";

export default function BookingsPage() {
  const { isAuthenticated, isLoading } = useRequireAuth();
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">(
    "upcoming",
  );
  const [upcomingBookings, setUpcomingBookings] = useState<
    ConsultationBooking[]
  >([]);
  const [pastBookings, setPastBookings] = useState<ConsultationBooking[]>([]);
  const [types, setTypes] = useState<ConsultationType[]>([]);
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [actioningBookingId, setActioningBookingId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const bookings = selectedTab === "upcoming" ? upcomingBookings : pastBookings;
  const upcomingCount = upcomingBookings.length;
  const pastCount = pastBookings.length;

  const typeMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const type of types) {
      map.set(type.id, type.name);
    }
    return map;
  }, [types]);

  const providerMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const profile of profiles) {
      if (typeof profile.professional_id !== "object") continue;
      const provider = profile.professional_id;
      map.set(
        provider._id,
        `${provider.first_name} ${provider.last_name}`.trim() || provider.email,
      );
    }
    return map;
  }, [profiles]);

  const loadAllBookings = useCallback(async () => {
    setLoadingBookings(true);
    setError(null);

    const [upcomingResponse, pastResponse] = await Promise.all([
      consultationsService.getMyBookings("upcoming"),
      consultationsService.getMyBookings("past"),
    ]);

    setUpcomingBookings(
      upcomingResponse.success && upcomingResponse.data
        ? upcomingResponse.data
        : [],
    );
    setPastBookings(
      pastResponse.success && pastResponse.data ? pastResponse.data : [],
    );

    if (!upcomingResponse.success && !pastResponse.success) {
      setError(
        upcomingResponse.message ||
          pastResponse.message ||
          "Failed to load bookings.",
      );
    }

    setLoadingBookings(false);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let mounted = true;

    async function loadMetadata() {
      const [typesResponse, profilesResponse] = await Promise.all([
        consultationsService.getTypes(),
        progressService.getMyOwnProfiles(),
      ]);

      if (!mounted) return;

      if (typesResponse.success && typesResponse.data) {
        setTypes(typesResponse.data);
      }
      if (profilesResponse.success && profilesResponse.data) {
        setProfiles(profilesResponse.data);
      }
    }

    loadMetadata();
    loadAllBookings();

    return () => {
      mounted = false;
    };
  }, [isAuthenticated, loadAllBookings]);

  const onCancelBooking = async (bookingId: string) => {
    setActioningBookingId(bookingId);
    const response = await consultationsService.cancelBooking(bookingId, {
      reason: "Cancelled by client from bookings dashboard",
    });

    if (!response.success) {
      setError(response.message || "Failed to cancel booking.");
      setActioningBookingId(null);
      return;
    }

    await loadAllBookings();
    setActioningBookingId(null);
  };

  if (isLoading) return <DashboardLoading />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">
            My Bookings
          </h1>
          <p className="text-foreground-secondary">
            Manage your gym visits, trainer sessions, and consultations
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-neutral-200">
            <div className="flex gap-8">
              <button
                onClick={() => setSelectedTab("upcoming")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  selectedTab === "upcoming"
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                Upcoming ({upcomingCount})
              </button>
              <button
                onClick={() => setSelectedTab("past")}
                className={`pb-4 text-sm font-medium transition-colors ${
                  selectedTab === "past"
                    ? "border-b-2 border-foreground text-foreground"
                    : "text-foreground-secondary hover:text-foreground"
                }`}
              >
                Past ({pastCount})
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Bookings List */}
        <div className="space-y-4">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
            </div>
          ) : (
            bookings.map((booking) => {
              const providerName =
                providerMap.get(booking.providerId) ||
                `Provider ${booking.providerId.slice(-6)}`;
              const typeName =
                typeMap.get(booking.consultationTypeId) || "Consultation";
              const startsAt = formatLocal(
                booking.startsAt,
                "EEE, MMM d • h:mm a",
              );
              const endsAt = formatLocal(booking.endsAt, "h:mm a");
              const durationMinutes = Math.max(
                0,
                Math.round(
                  (new Date(booking.endsAt).getTime() -
                    new Date(booking.startsAt).getTime()) /
                    60000,
                ),
              );
              const isCancelable =
                booking.status === ConsultationBookingStatus.CONFIRMED ||
                booking.status === ConsultationBookingStatus.PENDING;

              return (
                <div
                  key={booking.id}
                  className="bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                          {typeName}
                        </span>
                        <span
                          className={`px-3 py-1 text-xs font-semibold ${
                            booking.status ===
                            ConsultationBookingStatus.CONFIRMED
                              ? "bg-green-100 text-green-700"
                              : booking.status ===
                                  ConsultationBookingStatus.COMPLETED
                                ? "bg-blue-100 text-blue-700"
                                : booking.status ===
                                      ConsultationBookingStatus.CANCELLED ||
                                    booking.status ===
                                      ConsultationBookingStatus.NO_SHOW
                                  ? "bg-neutral-100 text-foreground-tertiary"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {booking.status.replace("_", " ")}
                        </span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-foreground mb-2">
                        {providerName} - {typeName}
                      </h3>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-foreground-tertiary mb-1">
                            Date & Time
                          </p>
                          <p className="font-medium text-foreground">
                            {startsAt} - {endsAt}
                          </p>
                        </div>
                        <div>
                          <p className="text-foreground-tertiary mb-1">
                            Location
                          </p>
                          <p className="font-medium text-foreground">Virtual</p>
                        </div>
                        <div>
                          <p className="text-foreground-tertiary mb-1">
                            Duration
                          </p>
                          <p className="font-medium text-foreground">
                            {durationMinutes} min
                          </p>
                        </div>
                      </div>
                    </div>

                    {isCancelable && (
                      <div className="flex gap-2 ml-6">
                        <Link
                          href={`/dashboard/bookings/consultations?providerId=${encodeURIComponent(booking.providerId)}`}
                          className="px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-neutral-100 transition-colors"
                        >
                          Book New Time
                        </Link>
                        <button
                          disabled={actioningBookingId === booking.id}
                          onClick={() => onCancelBooking(booking.id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {!loadingBookings && bookings.length === 0 && (
            <div className="bg-background p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-foreground-tertiary mb-4"
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
              <p className="text-lg font-semibold text-foreground mb-2">
                No {selectedTab} bookings
              </p>
              <p className="text-sm text-foreground-secondary mb-6">
                {selectedTab === "upcoming"
                  ? "Book your next consultation from your connected providers."
                  : "Your past consultations will appear here."}
              </p>
              {selectedTab === "upcoming" && (
                <Link
                  href="/dashboard/bookings/consultations"
                  className="inline-flex h-10 items-center justify-center bg-primary-500 px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600"
                >
                  Book Consultation
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
