"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLoading from "@/components/DashboardLoading";
import TimezoneHelpBadge from "@/components/TimezoneHelpBadge";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { dualTimezoneLabel, formatLocal, getClientTimezone } from "@/utils/format";
import { UserRole } from "@/lib/types";
import {
  consultationsService,
  ConsultationBookingStatus,
  ConsultationProviderRole,
  AvailabilityExceptionType,
  type AvailabilityException,
  type AvailabilityRule,
  type ConsultationBooking,
  type ConsultationSlot,
  type ConsultationType,
} from "@/lib/api/consultations";

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const fallbackTimezones = [
  "UTC",
  "Africa/Lagos",
  "Africa/Nairobi",
  "Africa/Cairo",
  "Europe/London",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

function getTimezoneOptions(): string[] {
  const timezoneSource =
    typeof Intl !== "undefined" && "supportedValuesOf" in Intl
      ? (Intl.supportedValuesOf("timeZone") as string[])
      : fallbackTimezones;

  const userTimezone = getClientTimezone();
  if (!timezoneSource.includes(userTimezone)) {
    return [userTimezone, ...timezoneSource];
  }

  return timezoneSource;
}

type ConsultationAvailabilityManagerProps = {
  role: UserRole;
  sidebar: ReactNode;
  description: string;
};

export default function ConsultationAvailabilityManager({
  role,
  sidebar,
  description,
}: ConsultationAvailabilityManagerProps) {
  const { isLoading, isAuthorized } = useRoleGuard(role);
  const timezoneOptions = useMemo(() => getTimezoneOptions(), []);
  const userTimezone = useMemo(() => getClientTimezone(), []);

  const [activeTab, setActiveTab] = useState<
    "availability" | "exceptions" | "bookings"
  >("availability");
  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Exceptions state
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [isCreatingException, setIsCreatingException] = useState(false);
  const [newException, setNewException] = useState({
    date: "",
    type: AvailabilityExceptionType.UNAVAILABLE as AvailabilityExceptionType,
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });

  // Bookings state
  const [bookings, setBookings] = useState<ConsultationBooking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsFilter, setBookingsFilter] = useState<
    "upcoming" | "past" | "all"
  >("upcoming");
  const [actioningBookingId, setActioningBookingId] = useState<string | null>(
    null,
  );

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

  const [newRule, setNewRule] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    timezone: userTimezone,
    isActive: true,
  });

  const providerRoleForType: ConsultationProviderRole =
    role === UserRole.DIETITIAN
      ? ConsultationProviderRole.DIETITIAN
      : role === UserRole.TRAINER
        ? ConsultationProviderRole.PERSONAL_TRAINER
        : ConsultationProviderRole.OTHER;

  const [newType, setNewType] = useState({
    name: "",
    description: "",
    defaultDurationMinutes: 30,
    isActive: true,
  });

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.isActive),
    [rules],
  );

  const roleTypes = useMemo(
    () =>
      consultationTypes.filter(
        (type) => type.providerRole === providerRoleForType,
      ),
    [consultationTypes, providerRoleForType],
  );

  useEffect(() => {
    consultationsService.getMyAvailability().then((res) => {
      if (res.success && res.data) {
        setRules(res.data);
      }
    });

    consultationsService.getTypes().then((res) => {
      if (res.success && res.data) {
        setConsultationTypes(res.data);
      }
    });
  }, []);

  const createType = async () => {
    if (!newType.name.trim()) {
      setMessage({ text: "Consultation type name is required.", type: "error" });
      return;
    }

    if (
      newType.defaultDurationMinutes < 5 ||
      newType.defaultDurationMinutes > 240
    ) {
      setMessage({ text: "Duration must be between 5 and 240 minutes.", type: "error" });
      return;
    }

    setIsCreatingType(true);
    setMessage(null);

    const response = await consultationsService.createType({
      name: newType.name.trim(),
      description: newType.description.trim() || undefined,
      providerRole: providerRoleForType,
      defaultDurationMinutes: newType.defaultDurationMinutes,
      isActive: newType.isActive,
    });

    if (response.success && response.data) {
      setConsultationTypes((prev) => [...prev, response.data!]);
      setNewType({
        name: "",
        description: "",
        defaultDurationMinutes: 30,
        isActive: true,
      });
      setMessage({ text: "Consultation type created successfully.", type: "success" });
    } else {
      setMessage({ text: response.message ?? "Failed to create consultation type.", type: "error" });
    }

    setIsCreatingType(false);
  };

  const addRule = () => {
    if (newRule.startTime >= newRule.endTime) {
      setMessage({ text: "Start time must be earlier than end time.", type: "error" });
      return;
    }

    const nextRule: AvailabilityRule = {
      id: crypto.randomUUID(),
      ...newRule,
    };
    setRules((prev) => [...prev, nextRule]);
    setMessage(null);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((rule) => rule.id !== id));
  };

  const saveAvailability = async () => {
    setIsSaving(true);
    setMessage(null);

    const payload = rules.map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      timezone: rule.timezone,
      isActive: rule.isActive,
    }));

    const response = await consultationsService.setMyAvailability(payload);

    if (response.success && response.data) {
      setRules(response.data);
      setMessage({ text: "Availability updated successfully.", type: "success" });
    } else {
      setMessage({ text: response.message ?? "Failed to update availability.", type: "error" });
    }

    setIsSaving(false);
  };

  // --- Exceptions ---
  const loadExceptions = useCallback(async () => {
    setLoadingExceptions(true);
    const res = await consultationsService.getMyExceptions();
    if (res.success && res.data) {
      setExceptions(res.data);
    }
    setLoadingExceptions(false);
  }, []);

  const createException = async () => {
    if (!newException.date) {
      setMessage({ text: "Date is required for the exception.", type: "error" });
      return;
    }

    setIsCreatingException(true);
    setMessage(null);

    const payload: {
      date: string;
      type: "UNAVAILABLE" | "CUSTOM_HOURS";
      startTime?: string;
      endTime?: string;
      timezone?: string;
      reason?: string;
    } = {
      date: newException.date,
      type: newException.type,
      reason: newException.reason.trim() || undefined,
    };

    if (newException.type === AvailabilityExceptionType.CUSTOM_HOURS) {
      payload.startTime = newException.startTime;
      payload.endTime = newException.endTime;
      payload.timezone = userTimezone;
    }

    const res = await consultationsService.createException(payload);

    if (res.success && res.data) {
      setExceptions((prev) => [...prev, res.data!]);
      setNewException({
        date: "",
        type: AvailabilityExceptionType.UNAVAILABLE,
        startTime: "09:00",
        endTime: "17:00",
        reason: "",
      });
      setMessage({ text: "Exception added successfully.", type: "success" });
    } else {
      setMessage({ text: res.message ?? "Failed to create exception.", type: "error" });
    }

    setIsCreatingException(false);
  };

  const deleteException = async (id: string) => {
    const res = await consultationsService.deleteException(id);
    if (res.success) {
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } else {
      setMessage({ text: res.message ?? "Failed to remove exception.", type: "error" });
    }
  };

  // --- Provider Bookings ---
  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    const params: { status?: ConsultationBookingStatus; from?: string; to?: string } = {};
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

  const completeBooking = async (id: string) => {
    setActioningBookingId(id);
    const res = await consultationsService.completeBooking(id);
    if (res.success) {
      await loadBookings();
      setMessage({ text: "Booking marked as completed.", type: "success" });
    } else {
      setMessage({ text: res.message ?? "Failed to complete booking.", type: "error" });
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
      setMessage({ text: res.message ?? "Failed to cancel booking.", type: "error" });
    }
    setActioningBookingId(null);
  };

  // --- Reschedule ---
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
        // Re-fetch fresh slots
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
      (s) =>
        formatLocal(s.startsAt, "yyyy-MM-dd") === rescheduleSelectedDate,
    );
  }, [rescheduleSlots, rescheduleSelectedDate]);

  // Load exceptions on mount, bookings when tab switches
  useEffect(() => {
    void loadExceptions();
  }, [loadExceptions]);

  useEffect(() => {
    if (activeTab === "bookings") {
      void loadBookings();
    }
  }, [activeTab, loadBookings]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const typeMap = new Map(consultationTypes.map((t) => [t.id, t.name]));

  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              Consultations
            </h1>
            <p className="mt-2 text-foreground-secondary">{description}</p>
          </div>

          {activeTab === "availability" && (
            <button
              onClick={saveAvailability}
              disabled={isSaving}
              className="w-full rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {isSaving ? "Saving..." : "Save Availability"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-neutral-200">
            <div className="flex gap-4 sm:gap-8 overflow-x-auto">
              {(
                [
                  { key: "availability", label: "Availability" },
                  { key: "exceptions", label: "Blocked Dates" },
                  { key: "bookings", label: "Client Bookings" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    setMessage(null);
                  }}
                  className={`pb-3 sm:pb-4 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? "border-b-2 border-foreground text-foreground"
                      : "text-foreground-secondary hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
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

        {/* ===== AVAILABILITY TAB ===== */}
        {activeTab === "availability" && (
          <>
            <section className="mb-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-4 text-xl font-bold text-foreground">
                Consultation Types
              </h2>

              <div className="grid gap-3 md:grid-cols-4">
                <input
                  type="text"
                  value={newType.name}
                  onChange={(event) =>
                    setNewType((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Type name"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />

                <input
                  type="number"
                  min={5}
                  max={240}
                  value={newType.defaultDurationMinutes}
                  onChange={(event) =>
                    setNewType((prev) => ({
                      ...prev,
                      defaultDurationMinutes: Number(event.target.value || 0),
                    }))
                  }
                  placeholder="Duration (minutes)"
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />

                <select
                  value={newType.isActive ? "active" : "inactive"}
                  onChange={(event) =>
                    setNewType((prev) => ({
                      ...prev,
                      isActive: event.target.value === "active",
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>

                <button
                  onClick={createType}
                  disabled={isCreatingType}
                  className="rounded-lg bg-accent-purple-500 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreatingType ? "Creating..." : "Create Type"}
                </button>
              </div>

              <textarea
                value={newType.description}
                onChange={(event) =>
                  setNewType((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={2}
                placeholder="Optional description (visible to clients when booking)"
                className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />

              <div className="mt-4 space-y-2">
                {roleTypes.length === 0 ? (
                  <p className="text-sm text-foreground-secondary">
                    No consultation types yet for this role.
                  </p>
                ) : (
                  roleTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {type.name}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {type.defaultDurationMinutes} min •{" "}
                          {type.providerRole}
                          {type.description && ` • ${type.description}`}
                        </p>
                      </div>
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          type.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-neutral-100 text-foreground-secondary"
                        }`}
                      >
                        {type.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="mb-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  Add Availability Rule
                </h2>
                <TimezoneHelpBadge message="Timezone controls how your selected day and time are interpreted. Example: Monday 09:00 in Africa/Lagos is converted automatically for clients in other countries." />
              </div>

              <div className="grid gap-4 md:grid-cols-5">
                <select
                  value={newRule.dayOfWeek}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      dayOfWeek: Number(e.target.value),
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  {weekDays.map((day, index) => (
                    <option key={day} value={index}>
                      {day}
                    </option>
                  ))}
                </select>

                <input
                  type="time"
                  value={newRule.startTime}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      startTime: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />

                <input
                  type="time"
                  value={newRule.endTime}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      endTime: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />

                <select
                  value={newRule.timezone}
                  onChange={(e) =>
                    setNewRule((prev) => ({
                      ...prev,
                      timezone: e.target.value,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  {timezoneOptions.map((timezone) => (
                    <option key={timezone} value={timezone}>
                      {timezone}
                    </option>
                  ))}
                </select>

                <button
                  onClick={addRule}
                  className="rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white"
                >
                  Add Rule
                </button>
              </div>

              <p className="mt-3 text-xs text-foreground-secondary">
                Rules are saved in your selected timezone. Client booking times
                are displayed in each client&apos;s local timezone automatically.
              </p>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  Current Rules
                </h2>
                <span className="text-sm text-foreground-secondary">
                  {activeRules.length} active rules
                </span>
              </div>

              {rules.length === 0 ? (
                <p className="text-sm text-foreground-secondary">
                  No availability rules configured yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {weekDays[rule.dayOfWeek]} • {rule.startTime} -{" "}
                          {rule.endTime}
                        </p>
                        <p className="text-xs text-foreground-secondary">
                          {rule.timezone}
                        </p>
                      </div>

                      <button
                        onClick={() => removeRule(rule.id)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ===== BLOCKED DATES (EXCEPTIONS) TAB ===== */}
        {activeTab === "exceptions" && (
          <>
            <section className="mb-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="mb-2 text-xl font-bold text-foreground">
                Block a Date
              </h2>
              <p className="mb-4 text-sm text-foreground-secondary">
                Block specific dates when you&apos;re unavailable (sick days,
                holidays) or set custom hours for a particular date.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <input
                  type="date"
                  value={newException.date}
                  onChange={(e) =>
                    setNewException((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  min={new Date().toISOString().slice(0, 10)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />

                <select
                  value={newException.type}
                  onChange={(e) =>
                    setNewException((prev) => ({
                      ...prev,
                      type: e.target.value as AvailabilityExceptionType,
                    }))
                  }
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value={AvailabilityExceptionType.UNAVAILABLE}>
                    Full Day Off
                  </option>
                  <option value={AvailabilityExceptionType.CUSTOM_HOURS}>
                    Custom Hours
                  </option>
                </select>

                {newException.type ===
                  AvailabilityExceptionType.CUSTOM_HOURS && (
                  <>
                    <input
                      type="time"
                      value={newException.startTime}
                      onChange={(e) =>
                        setNewException((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                    <input
                      type="time"
                      value={newException.endTime}
                      onChange={(e) =>
                        setNewException((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </>
                )}
              </div>

              <input
                type="text"
                value={newException.reason}
                onChange={(e) =>
                  setNewException((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                placeholder="Optional reason (e.g. Holiday, Doctor's appointment)"
                className="mt-3 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />

              <button
                onClick={createException}
                disabled={isCreatingException}
                className="mt-3 rounded-lg bg-accent-blue-500 px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingException ? "Adding..." : "Add Exception"}
              </button>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  Current Exceptions
                </h2>
                <span className="text-sm text-foreground-secondary">
                  {exceptions.length} exception{exceptions.length !== 1 && "s"}
                </span>
              </div>

              {loadingExceptions ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
                </div>
              ) : exceptions.length === 0 ? (
                <p className="text-sm text-foreground-secondary">
                  No blocked dates or exceptions configured.
                </p>
              ) : (
                <div className="space-y-3">
                  {exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-foreground">
                            {exc.date}
                          </p>
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-semibold ${
                              exc.type ===
                              AvailabilityExceptionType.UNAVAILABLE
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {exc.type === AvailabilityExceptionType.UNAVAILABLE
                              ? "Day Off"
                              : "Custom Hours"}
                          </span>
                        </div>
                        <p className="text-xs text-foreground-secondary">
                          {exc.type ===
                          AvailabilityExceptionType.CUSTOM_HOURS &&
                          exc.startTime &&
                          exc.endTime
                            ? `${exc.startTime} – ${exc.endTime}`
                            : "Unavailable all day"}
                          {exc.reason && ` • ${exc.reason}`}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteException(exc.id)}
                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-semibold text-red-600"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ===== CLIENT BOOKINGS TAB ===== */}
        {activeTab === "bookings" && (
          <>
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
                className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-foreground-secondary hover:bg-neutral-200"
              >
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
                    No {bookingsFilter === "all" ? "" : bookingsFilter}{" "}
                    bookings
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
                                <span className="font-medium">
                                  Client note:
                                </span>{" "}
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
                      {/* Date picker */}
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

                      {/* Time picker */}
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
                                    rescheduleSelectedSlot?.startsAt ===
                                    s.startsAt
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

                  {/* Reason */}
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
          </>
        )}
      </main>
    </div>
  );
}
