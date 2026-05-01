"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { dualTimezoneLabel, formatLocal } from "@/utils/format";
import { UserRole } from "@/lib/types";
import {
  consultationsService,
  ConsultationBookingStatus,
  type ConsultationBooking,
  type ConsultationSlot,
  type ConsultationType,
} from "@/lib/api/consultations";
import { CalendarDays, RefreshCw } from "lucide-react";

type Props = {
  role: UserRole;
  sidebar: ReactNode;
  description?: string;
};

export default function ConsultationBookingsManager({
  role,
  sidebar,
  description = "Manage your upcoming and past consultation bookings.",
}: Props) {
  const { isLoading, isAuthorized } = useRoleGuard(role);

  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsFilter, setBookingsFilter] = useState<
    "upcoming" | "past" | "all"
  >("upcoming");
  const [actioningBookingId, setActioningBookingId] = useState<string | null>(
    null,
  );
  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([]);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Reschedule state
  const [rescheduleTarget, setRescheduleTarget] =
    useState<ConsultationBooking | null>(null);
  const [rescheduleSlots, setRescheduleSlots] = useState<ConsultationSlot[]>(
    [],
  );
  const [rescheduleLoadingSlots, setRescheduleLoadingSlots] = useState(false);
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState("");
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] =
    useState<ConsultationSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState("");
  const [rescheduling, setRescheduling] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    const params: {
      status?: ConsultationBookingStatus;
      from?: string;
      to?: string;
    } = {};
    const now = new Date();

    if (bookingsFilter === "upcoming") {
      params.from = now.toISOString().slice(0, 10);
    } else if (bookingsFilter === "past") {
      params.to = now.toISOString().slice(0, 10);
    }

    const res = await consultationsService.getProviderBookings(params);
    if (res.success && res.data) {
      setBookings(res.data);
    } else {
      setBookings([]);
    }
    setLoadingBookings(false);
  }, [bookingsFilter]);

  useEffect(() => {
    consultationsService.getTypes({ includeInactive: true }).then((res) => {
      if (res.success && res.data) {
        setConsultationTypes(res.data);
      }
    });
  }, []);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const completeBooking = async (id: string) => {
    setActioningBookingId(id);
    const res = await consultationsService.completeBooking(id);
    if (res.success) {
      await loadBookings();
      setMessage({ text: "Booking marked as completed.", type: "success" });
    } else {
      setMessage({
        text: res.message ?? "Failed to complete booking.",
        type: "error",
      });
    }
    setActioningBookingId(null);
  };

  const cancelBookingAsProvider = async (id: string) => {
    setActioningBookingId(id);
    const res = await consultationsService.cancelBooking(id, {
      reason: "Cancelled by provider",
    });
    if (res.success) {
      await loadBookings();
      setMessage({ text: "Booking cancelled.", type: "success" });
    } else {
      setMessage({
        text: res.message ?? "Failed to cancel booking.",
        type: "error",
      });
    }
    setActioningBookingId(null);
  };

  const openRescheduleProvider = async (booking: ConsultationBooking) => {
    setRescheduleTarget(booking);
    setRescheduleSelectedSlot(null);
    setRescheduleSelectedDate("");
    setRescheduleReason("");
    setRescheduleSlots([]);
    setRescheduleLoadingSlots(true);

    const dateFrom = new Date().toISOString().slice(0, 10);
    const dateTo = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const res = await consultationsService.getProviderSlots(
      booking.providerId,
      {
        consultationTypeId: booking.consultationTypeId,
        dateFrom,
        dateTo,
      },
    );

    if (res.success && res.data) {
      const available = res.data.filter((s) => s.isAvailable);
      setRescheduleSlots(available);
      const first = available[0];
      if (first) {
        setRescheduleSelectedDate(formatLocal(first.startsAt, "yyyy-MM-dd"));
      }
    }
    setRescheduleLoadingSlots(false);
  };

  const confirmRescheduleProvider = async () => {
    if (!rescheduleTarget || !rescheduleSelectedSlot) return;
    setRescheduling(true);

    const res = await consultationsService.rescheduleBooking(
      rescheduleTarget.id,
      {
        startsAt: rescheduleSelectedSlot.startsAt,
        reason: rescheduleReason.trim() || undefined,
      },
    );

    if (res.success) {
      setRescheduleTarget(null);
      setRescheduleReason("");
      setRescheduleSelectedSlot(null);
      setRescheduleSelectedDate("");
      await loadBookings();
      setMessage({ text: "Booking rescheduled.", type: "success" });
    } else {
      const msg = (res.message ?? "Failed to reschedule.").toLowerCase();
      const isConflict =
        msg.includes("conflict") ||
        msg.includes("taken") ||
        msg.includes("unavailable") ||
        msg.includes("already booked") ||
        msg.includes("no longer available") ||
        msg.includes("slot");
      if (isConflict) {
        setRescheduleSelectedSlot(null);
        setMessage({
          text: "That slot was just taken. Pick another time.",
          type: "error",
        });
        if (rescheduleTarget) {
          const now = new Date();
          const twoWeeks = new Date(now.getTime() + 14 * 86400000);
          const fresh = await consultationsService.getProviderSlots(
            rescheduleTarget.providerId,
            {
              consultationTypeId: rescheduleTarget.consultationTypeId,
              dateFrom: now.toISOString(),
              dateTo: twoWeeks.toISOString(),
            },
          );
          if (fresh.success && fresh.data) {
            setRescheduleSlots(
              fresh.data.filter((s: ConsultationSlot) => s.isAvailable),
            );
          }
        }
      } else {
        setMessage({
          text: res.message ?? "Failed to reschedule booking.",
          type: "error",
        });
      }
    }
    setRescheduling(false);
  };

  const rescheduleSlotDates = useMemo(() => {
    const dates = new Map<string, { key: string; label: string }>();
    for (const slot of rescheduleSlots) {
      const key = formatLocal(slot.startsAt, "yyyy-MM-dd");
      if (!dates.has(key)) {
        dates.set(key, {
          key,
          label: formatLocal(slot.startsAt, "EEE, MMM d"),
        });
      }
    }
    return Array.from(dates.values());
  }, [rescheduleSlots]);

  const rescheduleTimesForDate = useMemo(() => {
    if (!rescheduleSelectedDate) return [];
    return rescheduleSlots.filter(
      (s) => formatLocal(s.startsAt, "yyyy-MM-dd") === rescheduleSelectedDate,
    );
  }, [rescheduleSlots, rescheduleSelectedDate]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const typeMap = new Map(consultationTypes.map((t) => [t.id, t.name]));

  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
            Bookings
          </h1>
          <p className="mt-2 text-foreground-secondary">{description}</p>
        </div>

        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm ${
              message.type === "success"
                ? "bg-green-50 text-green-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {(["upcoming", "past", "all"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setBookingsFilter(filter)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  bookingsFilter === filter
                    ? "bg-foreground text-background"
                    : "bg-neutral-100 text-foreground-secondary hover:bg-neutral-200"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={() => void loadBookings()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-100 px-3 text-sm font-medium text-foreground-secondary hover:bg-neutral-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
          {loadingBookings ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-12 text-center">
              <CalendarDays
                className="mx-auto h-12 w-12 text-foreground-tertiary mb-4"
                aria-hidden="true"
              />
              <p className="text-lg font-semibold text-foreground mb-2">
                No {bookingsFilter === "all" ? "" : bookingsFilter} bookings
              </p>
              <p className="text-sm text-foreground-secondary">
                Client bookings will appear here once someone books a
                consultation with you.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
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
                const isActionable =
                  booking.status === ConsultationBookingStatus.CONFIRMED ||
                  booking.status === ConsultationBookingStatus.PENDING;
                const isActioning = actioningBookingId === booking.id;

                return (
                  <div
                    key={booking.id}
                    className="rounded-xl border border-neutral-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700 rounded">
                            {typeName}
                          </span>
                          <span
                            className={`rounded px-3 py-1 text-xs font-semibold ${
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

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div>
                            <p className="text-foreground-tertiary mb-0.5">
                              Date & Time
                            </p>
                            <p className="font-medium text-foreground">
                              {startsAt} – {endsAt}
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary mb-0.5">
                              Duration
                            </p>
                            <p className="font-medium text-foreground">
                              {durationMinutes} min
                            </p>
                          </div>
                          <div>
                            <p className="text-foreground-tertiary mb-0.5">
                              Client Timezone
                            </p>
                            <p className="font-medium text-foreground">
                              {booking.clientTimezone || "—"}
                            </p>
                          </div>
                        </div>

                        {booking.notes && (
                          <p className="mt-2 text-sm text-foreground-secondary">
                            <span className="font-medium">Client note:</span>{" "}
                            {booking.notes}
                          </p>
                        )}
                      </div>

                      {isActionable && (
                        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                          <button
                            disabled={isActioning}
                            onClick={() => completeBooking(booking.id)}
                            className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-50"
                          >
                            Mark Complete
                          </button>
                          <button
                            disabled={isActioning}
                            onClick={() => openRescheduleProvider(booking)}
                            className="rounded-lg px-4 py-2 text-sm font-medium text-accent-blue-500 hover:bg-accent-blue-50 transition-colors disabled:opacity-50"
                          >
                            Reschedule
                          </button>
                          <button
                            disabled={isActioning}
                            onClick={() =>
                              cancelBookingAsProvider(booking.id)
                            }
                            className="rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Reschedule modal */}
        {rescheduleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
              <h3 className="mb-4 text-lg font-bold text-foreground">
                Reschedule Booking
              </h3>

              {rescheduleLoadingSlots ? (
                <p className="py-8 text-center text-sm text-foreground-tertiary">
                  Loading available slots…
                </p>
              ) : rescheduleSlots.length === 0 ? (
                <p className="py-8 text-center text-sm text-foreground-tertiary">
                  No available slots in the next 14 days.
                </p>
              ) : (
                <>
                  <label className="mb-1 block text-sm font-medium text-foreground-secondary">
                    Pick a date
                  </label>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {rescheduleSlotDates.map((d) => (
                      <button
                        key={d.key}
                        onClick={() => {
                          setRescheduleSelectedDate(d.key);
                          setRescheduleSelectedSlot(null);
                        }}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                          rescheduleSelectedDate === d.key
                            ? "border-accent-blue-500 bg-accent-blue-50 text-accent-blue-700"
                            : "border-neutral-200 text-foreground-secondary hover:border-neutral-300"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  {rescheduleSelectedDate && (
                    <>
                      <label className="mb-1 block text-sm font-medium text-foreground-secondary">
                        Pick a time
                      </label>
                      <div className="mb-4 flex flex-wrap gap-2">
                        {rescheduleTimesForDate.map((s) => {
                          const label = dualTimezoneLabel(
                            s.startsAt,
                            s.endsAt,
                            s.providerTimezone,
                          );
                          return (
                            <button
                              key={s.startsAt}
                              disabled={!s.isAvailable}
                              onClick={() => setRescheduleSelectedSlot(s)}
                              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
                                rescheduleSelectedSlot?.startsAt === s.startsAt
                                  ? "border-accent-blue-500 bg-accent-blue-50 text-accent-blue-700"
                                  : "border-neutral-200 text-foreground-secondary hover:border-neutral-300"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </>
              )}

              <label className="mb-1 block text-sm font-medium text-foreground-secondary">
                Reason (optional)
              </label>
              <textarea
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
                className="mb-4 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-foreground focus:border-accent-blue-500 focus:outline-none"
                placeholder="Let the client know why…"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setRescheduleTarget(null);
                    setRescheduleReason("");
                    setRescheduleSelectedSlot(null);
                    setRescheduleSelectedDate("");
                  }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-neutral-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={!rescheduleSelectedSlot || rescheduling}
                  onClick={confirmRescheduleProvider}
                  className="rounded-lg bg-accent-blue-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                >
                  {rescheduling ? "Rescheduling…" : "Confirm Reschedule"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
