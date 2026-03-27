"use client";

import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import {
  consultationsService,
  ConsultationBooking,
  ConsultationBookingStatus,
} from "@/lib/api/consultations";

const statusColors: Record<string, string> = {
  [ConsultationBookingStatus.CONFIRMED]: "bg-green-100 text-green-700",
  [ConsultationBookingStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [ConsultationBookingStatus.COMPLETED]: "bg-blue-100 text-blue-700",
  [ConsultationBookingStatus.CANCELLED]: "bg-neutral-100 text-neutral-500",
  [ConsultationBookingStatus.NO_SHOW]: "bg-red-100 text-red-700",
};

export default function Page() {
  const { user, isLoading: authLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [upcoming, setUpcoming] = useState<ConsultationBooking[]>([]);
  const [past, setPast] = useState<ConsultationBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [upRes, pastRes] = await Promise.all([
          consultationsService.getMyBookings("upcoming"),
          consultationsService.getMyBookings("past"),
        ]);
        if (upRes.success && upRes.data) setUpcoming(upRes.data);
        if (pastRes.success && pastRes.data) setPast(pastRes.data);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (authLoading || !isAuthorized) return <DashboardLoading />;

  const bookings = tab === "upcoming" ? upcoming : past;

  function formatDateTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Schedule
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          View your upcoming and past consultation bookings.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : upcoming.length === 0 && past.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">No Bookings Yet</h2>
            <p className="text-sm text-neutral-500 mb-4">Book a consultation with a trainer or dietitian to get started.</p>
            <a href="/marketplace" className="inline-flex px-4 py-2 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors">Browse Marketplace</a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setTab("upcoming")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === "upcoming"
                    ? "bg-primary-500 text-foreground"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Upcoming ({upcoming.length})
              </button>
              <button
                onClick={() => setTab("past")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === "past"
                    ? "bg-primary-500 text-foreground"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                Past ({past.length})
              </button>
            </div>

            {/* Bookings List */}
            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500 text-sm">
                  No {tab} bookings.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[b.status] ?? "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {b.status.replace(/_/g, " ")}
                      </span>
                      <span className="ml-auto text-xs text-neutral-400">
                        {formatDateTime(b.startsAt)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                      <span>
                        🕐 {formatTime(b.startsAt)} – {formatTime(b.endsAt)}
                      </span>
                      {b.providerTimezone && (
                        <span className="text-xs text-neutral-400">
                          ({b.clientTimezone || b.providerTimezone})
                        </span>
                      )}
                    </div>
                    {b.notes && (
                      <p className="mt-2 text-sm text-neutral-500">{b.notes}</p>
                    )}
                    {b.completionNote && (
                      <p className="mt-1 text-sm text-neutral-500 italic">
                        Provider note: {b.completionNote}
                      </p>
                    )}
                    {b.cancelReason && (
                      <p className="mt-1 text-sm text-red-500">
                        Cancel reason: {b.cancelReason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
