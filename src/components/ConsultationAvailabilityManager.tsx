"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import DashboardLoading from "@/components/DashboardLoading";
import SearchableSelect from "@/components/SearchableSelect";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import {
  dualTimezoneLabel,
  formatLocal,
  getClientTimezone,
} from "@/utils/format";
import { UserRole } from "@/lib/types";
import {
  consultationsService,
  ConsultationBookingStatus,
  ConsultationProviderRole,
  AvailabilityExceptionType,
  type AvailabilityException,
  type ConsultationBooking,
  type ConsultationSlot,
  type ConsultationType,
} from "@/lib/api/consultations";
import {
  Plus,
  Trash2,
  CalendarDays,
  RefreshCw,
  Archive,
} from "lucide-react";

type DayRange = { id: string; startTime: string; endTime: string };
type DaySchedule = { enabled: boolean; ranges: DayRange[] };
type WeekSchedule = Record<number, DaySchedule>;

const weekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const weekDayShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const makeEmptyWeek = (): WeekSchedule =>
  Object.fromEntries(
    weekDays.map((_, i) => [i, { enabled: false, ranges: [] as DayRange[] }]),
  ) as WeekSchedule;

const defaultRange = (): DayRange => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2),
  startTime: "09:00",
  endTime: "17:00",
});

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
  const [schedule, setSchedule] = useState<WeekSchedule>(makeEmptyWeek);
  const [scheduleTimezone, setScheduleTimezone] = useState<string>(userTimezone);
  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);
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

  const enabledDayCount = useMemo(
    () =>
      Object.values(schedule).filter(
        (d) => d.enabled && d.ranges.length > 0,
      ).length,
    [schedule],
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
        const week = makeEmptyWeek();
        let detectedTz: string | null = null;
        for (const rule of res.data) {
          if (!rule.isActive) continue;
          if (!detectedTz) detectedTz = rule.timezone;
          const day = week[rule.dayOfWeek];
          day.enabled = true;
          day.ranges.push({
            id: rule.id,
            startTime: rule.startTime,
            endTime: rule.endTime,
          });
        }
        // Sort ranges per day
        for (const day of Object.values(week)) {
          day.ranges.sort((a, b) => a.startTime.localeCompare(b.startTime));
        }
        setSchedule(week);
        if (detectedTz) setScheduleTimezone(detectedTz);
      }
    });

    consultationsService.getTypes({ includeInactive: true }).then((res) => {
      if (res.success && res.data) {
        setConsultationTypes(res.data);
      }
    });
  }, []);

  const createType = async () => {
    if (!newType.name.trim()) {
      setMessage({
        text: "Consultation type name is required.",
        type: "error",
      });
      return;
    }

    if (
      newType.defaultDurationMinutes < 5 ||
      newType.defaultDurationMinutes > 240
    ) {
      setMessage({
        text: "Duration must be between 5 and 240 minutes.",
        type: "error",
      });
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
      setMessage({
        text: "Consultation type created successfully.",
        type: "success",
      });
    } else {
      setMessage({
        text: response.message ?? "Failed to create consultation type.",
        type: "error",
      });
    }

    setIsCreatingType(false);
  };

  const deleteType = async (id: string) => {
    setDeletingTypeId(id);
    setMessage(null);

    const response = await consultationsService.deleteType(id);

    if (response.success && response.data) {
      setConsultationTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isActive: false } : t)),
      );
      setMessage({
        text: "Consultation type archived successfully.",
        type: "success",
      });
    } else {
      setMessage({
        text: response.message ?? "Failed to archive consultation type.",
        type: "error",
      });
    }

    setDeletingTypeId(null);
  };

  const toggleDay = (day: number) => {
    setSchedule((prev) => {
      const cur = prev[day];
      if (cur.enabled) {
        return { ...prev, [day]: { enabled: false, ranges: [] } };
      }
      return {
        ...prev,
        [day]: { enabled: true, ranges: [defaultRange()] },
      };
    });
    setMessage(null);
  };

  const addRange = (day: number) => {
    setSchedule((prev) => {
      const cur = prev[day];
      const last = cur.ranges[cur.ranges.length - 1];
      const next: DayRange = last
        ? { ...defaultRange(), startTime: last.endTime, endTime: "23:00" }
        : defaultRange();
      return { ...prev, [day]: { ...cur, ranges: [...cur.ranges, next] } };
    });
  };

  const removeRange = (day: number, rangeId: string) => {
    setSchedule((prev) => {
      const cur = prev[day];
      const ranges = cur.ranges.filter((r) => r.id !== rangeId);
      return {
        ...prev,
        [day]: ranges.length === 0
          ? { enabled: false, ranges: [] }
          : { ...cur, ranges },
      };
    });
  };

  const updateRange = (
    day: number,
    rangeId: string,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setSchedule((prev) => {
      const cur = prev[day];
      return {
        ...prev,
        [day]: {
          ...cur,
          ranges: cur.ranges.map((r) =>
            r.id === rangeId ? { ...r, [field]: value } : r,
          ),
        },
      };
    });
  };

  const copyToWeekdays = () => {
    const monday = schedule[1];
    if (!monday.enabled || monday.ranges.length === 0) {
      setMessage({
        text: "Set Monday's hours first to copy them to the rest of the week.",
        type: "error",
      });
      return;
    }
    setSchedule((prev) => {
      const next = { ...prev };
      for (let d = 2; d <= 5; d++) {
        next[d] = {
          enabled: true,
          ranges: monday.ranges.map((r) => ({ ...r, id: defaultRange().id })),
        };
      }
      return next;
    });
    setMessage(null);
  };

  const saveAvailability = async () => {
    // Validate
    const payload: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      timezone: string;
      isActive: boolean;
    }> = [];
    for (let day = 0; day < 7; day++) {
      const d = schedule[day];
      if (!d.enabled) continue;
      for (const r of d.ranges) {
        if (r.startTime >= r.endTime) {
          setMessage({
            text: `${weekDays[day]}: start time must be before end time.`,
            type: "error",
          });
          return;
        }
        payload.push({
          dayOfWeek: day,
          startTime: r.startTime,
          endTime: r.endTime,
          timezone: scheduleTimezone,
          isActive: true,
        });
      }
    }

    setIsSaving(true);
    setMessage(null);

    const response = await consultationsService.setMyAvailability(payload);

    if (response.success && response.data) {
      // Re-derive schedule from saved rules
      const week = makeEmptyWeek();
      for (const rule of response.data) {
        if (!rule.isActive) continue;
        const day = week[rule.dayOfWeek];
        day.enabled = true;
        day.ranges.push({
          id: rule.id,
          startTime: rule.startTime,
          endTime: rule.endTime,
        });
      }
      for (const day of Object.values(week)) {
        day.ranges.sort((a, b) => a.startTime.localeCompare(b.startTime));
      }
      setSchedule(week);
      setMessage({
        text: "Availability saved.",
        type: "success",
      });
    } else {
      setMessage({
        text: response.message ?? "Failed to update availability.",
        type: "error",
      });
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
      setMessage({
        text: "Date is required for the exception.",
        type: "error",
      });
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
      setMessage({
        text: res.message ?? "Failed to create exception.",
        type: "error",
      });
    }

    setIsCreatingException(false);
  };

  const deleteException = async (id: string) => {
    const res = await consultationsService.deleteException(id);
    if (res.success) {
      setExceptions((prev) => prev.filter((e) => e.id !== id));
    } else {
      setMessage({
        text: res.message ?? "Failed to remove exception.",
        type: "error",
      });
    }
  };

  // --- Provider Bookings ---
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
      (s) => formatLocal(s.startsAt, "yyyy-MM-dd") === rescheduleSelectedDate,
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
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
            Consultations
          </h1>
          <p className="mt-2 text-foreground-secondary">{description}</p>
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
            {/* Weekly Schedule */}
            <section className="mb-8 rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Weekly Schedule
                  </h2>
                  <p className="mt-0.5 text-xs text-foreground-tertiary">
                    {enabledDayCount === 0
                      ? "Toggle days to set when you accept bookings"
                      : `Available on ${enabledDayCount} day${enabledDayCount === 1 ? "" : "s"}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={copyToWeekdays}
                    className="hidden sm:inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-xs font-medium text-foreground-secondary hover:bg-neutral-50 transition-colors"
                  >
                    Copy Mon to Tue–Fri
                  </button>
                  <button
                    type="button"
                    onClick={saveAvailability}
                    disabled={isSaving}
                    className="inline-flex h-9 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>

              <div className="divide-y divide-neutral-100">
                {weekDays.map((dayName, dayIndex) => {
                  const day = schedule[dayIndex];
                  return (
                    <div
                      key={dayName}
                      className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start"
                    >
                      <label className="flex items-center gap-3 sm:w-40 sm:shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={day.enabled}
                          onClick={() => toggleDay(dayIndex)}
                          className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
                            day.enabled ? "bg-primary-500" : "bg-neutral-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                              day.enabled ? "translate-x-4" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-sm font-semibold ${
                            day.enabled
                              ? "text-foreground"
                              : "text-foreground-tertiary"
                          }`}
                        >
                          <span className="sm:hidden">{weekDayShort[dayIndex]}</span>
                          <span className="hidden sm:inline">{dayName}</span>
                        </span>
                      </label>

                      <div className="flex-1">
                        {!day.enabled ? (
                          <span className="text-sm text-foreground-tertiary">
                            Unavailable
                          </span>
                        ) : (
                          <div className="space-y-2">
                            {day.ranges.map((range) => (
                              <div
                                key={range.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="time"
                                  value={range.startTime}
                                  onChange={(e) =>
                                    updateRange(
                                      dayIndex,
                                      range.id,
                                      "startTime",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-foreground focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                                />
                                <span className="text-foreground-tertiary text-sm">–</span>
                                <input
                                  type="time"
                                  value={range.endTime}
                                  onChange={(e) =>
                                    updateRange(
                                      dayIndex,
                                      range.id,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                  className="w-28 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-foreground focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeRange(dayIndex, range.id)}
                                  aria-label="Remove time range"
                                  className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-tertiary hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addRange(dayIndex)}
                              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-accent-blue-600 hover:bg-accent-blue-50 transition-colors"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              Add time range
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-neutral-100 p-4 sm:p-5">
                <label className="block text-xs font-semibold text-foreground-secondary mb-2">
                  Timezone
                </label>
                <div className="max-w-md">
                  <SearchableSelect
                    value={scheduleTimezone}
                    onChange={(val) => setScheduleTimezone(val)}
                    options={timezoneOptions.map((tz) => ({
                      label: tz,
                      value: tz,
                    }))}
                    placeholder="Select timezone"
                  />
                </div>
                <p className="mt-2 text-xs text-foreground-tertiary">
                  Clients see times converted to their own timezone automatically.
                </p>
              </div>
            </section>

            {/* Consultation Types */}
            <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-neutral-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Consultation Types
                  </h2>
                  <p className="mt-0.5 text-xs text-foreground-tertiary">
                    What sessions can clients book with you?
                  </p>
                </div>
                {!showTypeForm && (
                  <button
                    type="button"
                    onClick={() => setShowTypeForm(true)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-foreground px-3 text-sm font-semibold text-background hover:bg-foreground-secondary transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    New Type
                  </button>
                )}
              </div>

              {/* Inline create form */}
              {showTypeForm && (
                <div className="border-b border-neutral-100 bg-neutral-50/50 p-5">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={newType.name}
                        onChange={(event) =>
                          setNewType((prev) => ({
                            ...prev,
                            name: event.target.value,
                          }))
                        }
                        placeholder="e.g. Initial consultation"
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                        Duration (min)
                      </label>
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
                        className="w-full sm:w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                      Description{" "}
                      <span className="font-normal text-foreground-tertiary">
                        (optional, shown to clients)
                      </span>
                    </label>
                    <textarea
                      value={newType.description}
                      onChange={(event) =>
                        setNewType((prev) => ({
                          ...prev,
                          description: event.target.value,
                        }))
                      }
                      rows={2}
                      placeholder="What will be covered in this session?"
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTypeForm(false);
                        setNewType({
                          name: "",
                          description: "",
                          defaultDurationMinutes: 30,
                          isActive: true,
                        });
                      }}
                      className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-foreground-secondary hover:bg-neutral-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await createType();
                        if (newType.name.trim()) {
                          // close on success (createType resets the form on success)
                          setShowTypeForm(false);
                        }
                      }}
                      disabled={isCreatingType || !newType.name.trim()}
                      className="inline-flex h-9 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                    >
                      {isCreatingType ? "Creating…" : "Create Type"}
                    </button>
                  </div>
                </div>
              )}

              <div className="p-5">
                {roleTypes.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-sm text-foreground-secondary">
                      No consultation types yet.
                    </p>
                    {!showTypeForm && (
                      <button
                        type="button"
                        onClick={() => setShowTypeForm(true)}
                        className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-accent-blue-600 hover:bg-accent-blue-50 transition-colors"
                      >
                        <Plus className="h-4 w-4" />
                        Add your first type
                      </button>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {roleTypes.map((type) => (
                      <li
                        key={type.id}
                        className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {type.name}
                            </p>
                            {!type.isActive && (
                              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground-tertiary">
                                Archived
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-foreground-tertiary">
                            {type.defaultDurationMinutes} min
                            {type.description && ` • ${type.description}`}
                          </p>
                        </div>
                        {type.isActive && (
                          <button
                            type="button"
                            onClick={() => deleteType(type.id)}
                            disabled={deletingTypeId === type.id}
                            aria-label="Archive type"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-tertiary hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <Archive className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
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
                              exc.type === AvailabilityExceptionType.UNAVAILABLE
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
