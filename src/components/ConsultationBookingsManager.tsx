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
import { Calendar, CalendarDays, Clock, Globe2, RefreshCw } from "lucide-react";

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
            <ul className="divide-y divide-neutral-100">
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
                const statusStyles: Record<string, string> = {
                  [ConsultationBookingStatus.CONFIRMED]:
                    "bg-green-50 text-green-700",
                  [ConsultationBookingStatus.PENDING]:
                    "bg-yellow-50 text-yellow-700",
                  [ConsultationBookingStatus.COMPLETED]:
                    "bg-blue-50 text-blue-700",
                  [ConsultationBookingStatus.CANCELLED]:
                    "bg-neutral-100 text-foreground-tertiary",
                  [ConsultationBookingStatus.NO_SHOW]:
                    "bg-red-50 text-red-700",
                };

                return (
                  <li
                    key={booking.id}
                    className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {typeName}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            statusStyles[booking.status] ??
                            "bg-neutral-100 text-foreground-tertiary"
                          }`}
                        >
                          {booking.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-foreground-tertiary">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          <span className="text-foreground-secondary">
                            {startsAt} – {endsAt}
                          </span>
                          <span>• {durationMinutes} min</span>
                        </span>
                        {booking.clientTimezone && (
                          <span className="inline-flex items-center gap-1.5">
                            <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {booking.clientTimezone}
                          </span>
                        )}
                      </div>
                      {booking.notes && (
                        <p className="mt-2 text-xs text-foreground-secondary">
                          <span className="font-semibold">Client note:</span>{" "}
                          {booking.notes}
                        </p>
                      )}
                    </div>

                    {isActionable && (
                      <div className="flex flex-wrap gap-2 sm:shrink-0">
                        <button
                          disabled={isActioning}
                          onClick={() => completeBooking(booking.id)}
                          className="inline-flex h-8 items-center rounded-lg bg-primary-500 px-3 text-xs font-semibold text-foreground hover:bg-primary-600 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark complete
                        </button>
                        <button
                          disabled={isActioning}
                          onClick={() => openRescheduleProvider(booking)}
                          className="inline-flex h-8 items-center rounded-lg border border-neutral-200 px-3 text-xs font-medium text-foreground-secondary hover:bg-neutral-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Reschedule
                        </button>
                        <button
                          disabled={isActioning}
                          onClick={() => cancelBookingAsProvider(booking.id)}
                          className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Reschedule modal */}
        {rescheduleTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-neutral-100 p-5">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    Reschedule booking
                  </h3>
                  <p className="mt-0.5 text-xs text-foreground-tertiary">
                    Currently:{" "}
                    {formatLocal(
                      rescheduleTarget.startsAt,
                      "EEE, MMM d • h:mm a",
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRescheduleTarget(null);
                    setRescheduleReason("");
                    setRescheduleSelectedSlot(null);
                    setRescheduleSelectedDate("");
                  }}
                  aria-label="Close"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-tertiary hover:bg-neutral-100 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {rescheduleLoadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
                  </div>
                ) : rescheduleSlots.length === 0 ? (
                  <div className="py-12 text-center">
                    <Calendar
                      className="mx-auto h-10 w-10 text-foreground-tertiary mb-3"
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold text-foreground">
                      No available slots
                    </p>
                    <p className="mt-1 text-xs text-foreground-tertiary">
                      No openings in the next 14 days. Try cancelling instead.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr]">
                    {/* Day rail */}
                    <div className="sm:max-h-[400px] sm:overflow-y-auto sm:border-r border-neutral-100 p-3 sm:p-2">
                      <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-tertiary">
                        Date
                      </p>
                      <div className="flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible">
                        {rescheduleSlotDates.map((d) => {
                          const count = rescheduleSlots.filter(
                            (s) =>
                              formatLocal(s.startsAt, "yyyy-MM-dd") === d.key,
                          ).length;
                          const isActive = rescheduleSelectedDate === d.key;
                          return (
                            <button
                              key={d.key}
                              onClick={() => {
                                setRescheduleSelectedDate(d.key);
                                setRescheduleSelectedSlot(null);
                              }}
                              className={`flex shrink-0 items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                isActive
                                  ? "bg-foreground text-background"
                                  : "text-foreground-secondary hover:bg-neutral-100"
                              }`}
                            >
                              <span className="font-medium">{d.label}</span>
                              <span
                                className={`ml-3 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isActive
                                    ? "bg-white/20 text-background"
                                    : "bg-neutral-100 text-foreground-tertiary"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time grid */}
                    <div className="sm:max-h-[400px] sm:overflow-y-auto p-4">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-foreground-tertiary">
                        Available times
                      </p>
                      {!rescheduleSelectedDate ? (
                        <p className="py-8 text-center text-sm text-foreground-tertiary">
                          Pick a date to see times.
                        </p>
                      ) : rescheduleTimesForDate.length === 0 ? (
                        <p className="py-8 text-center text-sm text-foreground-tertiary">
                          No times available on this day.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {rescheduleTimesForDate.map((s) => {
                            const isSelected =
                              rescheduleSelectedSlot?.startsAt === s.startsAt;
                            return (
                              <button
                                key={s.startsAt}
                                disabled={!s.isAvailable}
                                onClick={() => setRescheduleSelectedSlot(s)}
                                title={dualTimezoneLabel(
                                  s.startsAt,
                                  s.endsAt,
                                  s.providerTimezone,
                                )}
                                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                  isSelected
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-neutral-200 text-foreground-secondary hover:border-foreground"
                                }`}
                              >
                                {formatLocal(s.startsAt, "h:mm a")}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-100 p-5">
                <label className="mb-1 block text-xs font-semibold text-foreground-secondary">
                  Reason{" "}
                  <span className="font-normal text-foreground-tertiary">
                    (optional, shared with client)
                  </span>
                </label>
                <input
                  type="text"
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="mb-4 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-foreground focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                  placeholder="e.g. Schedule conflict"
                />

                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-foreground-tertiary">
                    {rescheduleSelectedSlot
                      ? `New time: ${formatLocal(
                          rescheduleSelectedSlot.startsAt,
                          "EEE, MMM d • h:mm a",
                        )}`
                      : "Select a new date and time"}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setRescheduleTarget(null);
                        setRescheduleReason("");
                        setRescheduleSelectedSlot(null);
                        setRescheduleSelectedDate("");
                      }}
                      className="inline-flex h-9 items-center rounded-lg px-4 text-sm font-medium text-foreground-secondary hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={!rescheduleSelectedSlot || rescheduling}
                      onClick={confirmRescheduleProvider}
                      className="inline-flex h-9 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                    >
                      {rescheduling ? "Rescheduling…" : "Confirm reschedule"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
