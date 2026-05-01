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
import { getClientTimezone } from "@/utils/format";
import { UserRole } from "@/lib/types";
import {
  consultationsService,
  ConsultationProviderRole,
  AvailabilityExceptionType,
  type AvailabilityException,
} from "@/lib/api/consultations";
import { Plus, Trash2, CalendarOff } from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<"availability" | "exceptions">(
    "availability",
  );
  const [schedule, setSchedule] = useState<WeekSchedule>(makeEmptyWeek);
  const [scheduleTimezone, setScheduleTimezone] =
    useState<string>(userTimezone);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Session settings (single duration + buffer + min advance)
  const DEFAULT_SESSION_DURATION = 30;
  const [sessionDuration, setSessionDuration] = useState<number>(
    DEFAULT_SESSION_DURATION,
  );
  const [bufferMinutes, setBufferMinutes] = useState<number>(0);
  const [minAdvanceNoticeHours, setMinAdvanceNoticeHours] = useState<number>(0);
  const [activeTypeIds, setActiveTypeIds] = useState<string[]>([]);
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Exceptions state
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [loadingExceptions, setLoadingExceptions] = useState(false);
  const [isCreatingException, setIsCreatingException] = useState(false);
  const [exceptionMode, setExceptionMode] = useState<"single" | "range">(
    "single",
  );
  const [newException, setNewException] = useState({
    date: "",
    endDate: "",
    type: AvailabilityExceptionType.UNAVAILABLE as AvailabilityExceptionType,
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });

  const providerRoleForType: ConsultationProviderRole =
    role === UserRole.DIETITIAN
      ? ConsultationProviderRole.DIETITIAN
      : role === UserRole.TRAINER
        ? ConsultationProviderRole.PERSONAL_TRAINER
        : ConsultationProviderRole.OTHER;

  const enabledDayCount = useMemo(
    () =>
      Object.values(schedule).filter(
        (d) => d.enabled && d.ranges.length > 0,
      ).length,
    [schedule],
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

    // Load active types for this role; pick first as session settings source.
    consultationsService.getTypes().then((res) => {
      if (res.success && res.data) {
        const active = res.data.filter(
          (t) => t.providerRole === providerRoleForType && t.isActive,
        );
        if (active.length > 0) {
          setActiveTypeIds(active.map((t) => t.id));
          const first = active[0];
          setSessionDuration(first.defaultDurationMinutes);
          setBufferMinutes(first.bufferMinutes ?? 0);
          setMinAdvanceNoticeHours(
            Math.round((first.minAdvanceNoticeMinutes ?? 0) / 60),
          );
        }
      }
    });
  }, [providerRoleForType]);

  const saveSessionDuration = async () => {
    if (sessionDuration < 5 || sessionDuration > 240) {
      setMessage({
        text: "Session length must be between 5 and 240 minutes.",
        type: "error",
      });
      return;
    }
    if (bufferMinutes < 0 || bufferMinutes > 60) {
      setMessage({
        text: "Buffer must be between 0 and 60 minutes.",
        type: "error",
      });
      return;
    }
    if (minAdvanceNoticeHours < 0 || minAdvanceNoticeHours > 168) {
      setMessage({
        text: "Advance notice must be between 0 and 168 hours.",
        type: "error",
      });
      return;
    }

    setIsSavingSession(true);
    setMessage(null);

    // Archive ALL previous active types so only the new one remains.
    for (const id of activeTypeIds) {
      const archive = await consultationsService.deleteType(id);
      if (!archive.success) {
        setMessage({
          text: archive.message ?? "Failed to update session settings.",
          type: "error",
        });
        setIsSavingSession(false);
        return;
      }
    }

    const created = await consultationsService.createType({
      name: "Standard consultation",
      providerRole: providerRoleForType,
      defaultDurationMinutes: sessionDuration,
      bufferMinutes,
      minAdvanceNoticeMinutes: minAdvanceNoticeHours * 60,
      isActive: true,
    });

    if (created.success && created.data) {
      setActiveTypeIds([created.data.id]);
      setMessage({ text: "Session settings saved.", type: "success" });
    } else {
      setMessage({
        text: created.message ?? "Failed to save session settings.",
        type: "error",
      });
    }

    setIsSavingSession(false);
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

  const copyToWeekend = () => {
    const monday = schedule[1];
    if (!monday.enabled || monday.ranges.length === 0) {
      setMessage({
        text: "Set Monday's hours first to copy them to the weekend.",
        type: "error",
      });
      return;
    }
    setSchedule((prev) => {
      const next = { ...prev };
      for (const d of [0, 6]) {
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

    // Build the list of dates we need to block.
    const dates: string[] = [];
    if (exceptionMode === "range") {
      if (!newException.endDate) {
        setMessage({
          text: "End date is required for a date range.",
          type: "error",
        });
        return;
      }
      if (newException.endDate < newException.date) {
        setMessage({
          text: "End date must be on or after the start date.",
          type: "error",
        });
        return;
      }
      const cursor = new Date(`${newException.date}T00:00:00`);
      const end = new Date(`${newException.endDate}T00:00:00`);
      const diffDays =
        Math.round((end.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24)) +
        1;
      if (diffDays > 31) {
        setMessage({
          text: "Date range cannot exceed 31 days at a time.",
          type: "error",
        });
        return;
      }
      while (cursor <= end) {
        dates.push(cursor.toISOString().slice(0, 10));
        cursor.setDate(cursor.getDate() + 1);
      }
      // Range only makes sense for full-day blocks
      if (newException.type === AvailabilityExceptionType.CUSTOM_HOURS) {
        setMessage({
          text: "Date ranges only support full-day blocks.",
          type: "error",
        });
        return;
      }
    } else {
      dates.push(newException.date);
    }

    setIsCreatingException(true);
    setMessage(null);

    const created: AvailabilityException[] = [];
    for (const date of dates) {
      const payload: {
        date: string;
        type: "UNAVAILABLE" | "CUSTOM_HOURS";
        startTime?: string;
        endTime?: string;
        timezone?: string;
        reason?: string;
      } = {
        date,
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
        created.push(res.data);
      } else {
        setMessage({
          text: res.message ?? `Failed to block ${date}.`,
          type: "error",
        });
        if (created.length > 0) {
          setExceptions((prev) => [...prev, ...created]);
        }
        setIsCreatingException(false);
        return;
      }
    }

    setExceptions((prev) => [...prev, ...created]);
    setNewException({
      date: "",
      endDate: "",
      type: AvailabilityExceptionType.UNAVAILABLE,
      startTime: "09:00",
      endTime: "17:00",
      reason: "",
    });
    setMessage({
      text:
        created.length === 1
          ? "Date blocked successfully."
          : `Blocked ${created.length} dates successfully.`,
      type: "success",
    });

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

  // --- Load exceptions on mount ---
  useEffect(() => {
    void loadExceptions();
  }, [loadExceptions]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

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
                    onClick={copyToWeekend}
                    className="hidden sm:inline-flex h-9 items-center rounded-lg border border-neutral-200 px-3 text-xs font-medium text-foreground-secondary hover:bg-neutral-50 transition-colors"
                  >
                    Copy Mon to weekend
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

            {/* Session Settings */}
            <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between border-b border-neutral-100 p-5">
                <div>
                  <h2 className="text-lg font-bold text-foreground">
                    Session Settings
                  </h2>
                  <p className="mt-0.5 text-xs text-foreground-tertiary">
                    Length, buffer time, and minimum booking notice.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={saveSessionDuration}
                  disabled={isSavingSession}
                  className="inline-flex h-9 items-center rounded-lg bg-primary-500 px-4 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  {isSavingSession ? "Saving…" : "Save"}
                </button>
              </div>

              <div className="divide-y divide-neutral-100">
                <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Session length
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      Most providers use 30 or 60 minutes.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      step={5}
                      value={sessionDuration}
                      onChange={(e) =>
                        setSessionDuration(Number(e.target.value || 0))
                      }
                      className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                    <span className="text-sm text-foreground-secondary">
                      minutes
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Buffer between sessions
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      Time held back after each booking before the next slot starts.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      step={5}
                      value={bufferMinutes}
                      onChange={(e) =>
                        setBufferMinutes(Number(e.target.value || 0))
                      }
                      className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                    <span className="text-sm text-foreground-secondary">
                      minutes
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Minimum advance notice
                    </p>
                    <p className="mt-0.5 text-xs text-foreground-tertiary">
                      Clients can&apos;t book sessions starting sooner than this.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={168}
                      step={1}
                      value={minAdvanceNoticeHours}
                      onChange={(e) =>
                        setMinAdvanceNoticeHours(Number(e.target.value || 0))
                      }
                      className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                    <span className="text-sm text-foreground-secondary">
                      hours
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ===== BLOCKED DATES (EXCEPTIONS) TAB ===== */}
        {activeTab === "exceptions" && (
          <section className="rounded-2xl bg-white shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-neutral-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Blocked Dates
                </h2>
                <p className="mt-0.5 text-xs text-foreground-tertiary">
                  Sick days, holidays, or any one-off date you can&apos;t take
                  bookings.
                </p>
              </div>
              {exceptions.length > 0 && (
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-foreground-secondary">
                  {exceptions.length}
                </span>
              )}
            </div>

            {/* Inline add form */}
            <div className="border-b border-neutral-100 bg-neutral-50/50 p-5">
              {/* Mode toggle: single date vs range */}
              <div className="mb-3 inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
                {(
                  [
                    { value: "single", label: "Single date" },
                    { value: "range", label: "Date range" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setExceptionMode(opt.value);
                      // Force full-day for ranges
                      if (opt.value === "range") {
                        setNewException((prev) => ({
                          ...prev,
                          type: AvailabilityExceptionType.UNAVAILABLE,
                        }));
                      }
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      exceptionMode === opt.value
                        ? "bg-foreground text-background"
                        : "text-foreground-secondary hover:bg-neutral-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div className={exceptionMode === "range" ? "grid grid-cols-2 gap-2" : ""}>
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                      {exceptionMode === "range" ? "From" : "Date"}
                    </label>
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
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                  </div>
                  {exceptionMode === "range" && (
                    <div>
                      <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                        To
                      </label>
                      <input
                        type="date"
                        value={newException.endDate}
                        onChange={(e) =>
                          setNewException((prev) => ({
                            ...prev,
                            endDate: e.target.value,
                          }))
                        }
                        min={
                          newException.date ||
                          new Date().toISOString().slice(0, 10)
                        }
                        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                      />
                    </div>
                  )}
                </div>

                {exceptionMode === "single" && (
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                      Type
                    </label>
                    <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-0.5">
                      {(
                        [
                          {
                            value: AvailabilityExceptionType.UNAVAILABLE,
                            label: "Full day",
                          },
                          {
                            value: AvailabilityExceptionType.CUSTOM_HOURS,
                            label: "Custom hours",
                          },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            setNewException((prev) => ({
                              ...prev,
                              type: opt.value,
                            }))
                          }
                          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                            newException.type === opt.value
                              ? "bg-foreground text-background"
                              : "text-foreground-secondary hover:bg-neutral-100"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={createException}
                  disabled={isCreatingException || !newException.date}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-500 px-4 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  {isCreatingException
                    ? "Adding…"
                    : exceptionMode === "range"
                      ? "Block range"
                      : "Block date"}
                </button>
              </div>

              {exceptionMode === "single" &&
                newException.type ===
                  AvailabilityExceptionType.CUSTOM_HOURS && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:max-w-md">
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                      Start
                    </label>
                    <input
                      type="time"
                      value={newException.startTime}
                      onChange={(e) =>
                        setNewException((prev) => ({
                          ...prev,
                          startTime: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                      End
                    </label>
                    <input
                      type="time"
                      value={newException.endTime}
                      onChange={(e) =>
                        setNewException((prev) => ({
                          ...prev,
                          endTime: e.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                    />
                  </div>
                </div>
              )}

              <div className="mt-3">
                <label className="block text-xs font-semibold text-foreground-secondary mb-1">
                  Reason{" "}
                  <span className="font-normal text-foreground-tertiary">
                    (optional, private)
                  </span>
                </label>
                <input
                  type="text"
                  value={newException.reason}
                  onChange={(e) =>
                    setNewException((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                  placeholder="e.g. Holiday, Doctor's appointment"
                  className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm focus:border-accent-blue-500 focus:outline-none focus:ring-1 focus:ring-accent-blue-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="p-5">
              {loadingExceptions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
                </div>
              ) : exceptions.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarOff
                    className="mx-auto h-10 w-10 text-foreground-tertiary mb-3"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    No blocked dates
                  </p>
                  <p className="mt-1 text-xs text-foreground-tertiary">
                    Add a date above to block it from your booking calendar.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {[...exceptions]
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map((exc) => {
                      const dateObj = new Date(`${exc.date}T00:00:00`);
                      const formattedDate = dateObj.toLocaleDateString(
                        undefined,
                        {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      );
                      const isFullDay =
                        exc.type === AvailabilityExceptionType.UNAVAILABLE;
                      return (
                        <li
                          key={exc.id}
                          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {formattedDate}
                              </p>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                  isFullDay
                                    ? "bg-red-50 text-red-700"
                                    : "bg-yellow-50 text-yellow-700"
                                }`}
                              >
                                {isFullDay ? "Day off" : "Custom hours"}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-foreground-tertiary">
                              {!isFullDay && exc.startTime && exc.endTime
                                ? `${exc.startTime} – ${exc.endTime}`
                                : "Unavailable all day"}
                              {exc.reason && ` • ${exc.reason}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteException(exc.id)}
                            aria-label="Remove blocked date"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-foreground-tertiary hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
