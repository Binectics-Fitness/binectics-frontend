"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLoading from "@/components/DashboardLoading";
import TimezoneHelpBadge from "@/components/TimezoneHelpBadge";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { getClientTimezone } from "@/utils/format";
import type { UserRole } from "@/lib/types";
import {
  consultationsService,
  type AvailabilityRule,
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

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [newRule, setNewRule] = useState({
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "17:00",
    timezone: userTimezone,
    isActive: true,
  });

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.isActive),
    [rules],
  );

  useEffect(() => {
    consultationsService.getMyAvailability().then((res) => {
      if (res.success && res.data) {
        setRules(res.data);
      }
    });
  }, []);

  const addRule = () => {
    if (newRule.startTime >= newRule.endTime) {
      setMessage("Start time must be earlier than end time.");
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
      setMessage("Availability updated successfully.");
    } else {
      setMessage(response.message ?? "Failed to update availability.");
    }

    setIsSaving(false);
  };

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-background">
      {sidebar}

      <main className="ml-64 flex-1 p-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground">
              Consultation Availability
            </h1>
            <p className="mt-2 text-foreground-secondary">{description}</p>
          </div>

          <button
            onClick={saveAvailability}
            disabled={isSaving}
            className="rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Availability"}
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-foreground">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-card">
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
                setNewRule((prev) => ({ ...prev, startTime: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />

            <input
              type="time"
              value={newRule.endTime}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, endTime: e.target.value }))
              }
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />

            <select
              value={newRule.timezone}
              onChange={(e) =>
                setNewRule((prev) => ({ ...prev, timezone: e.target.value }))
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
            Rules are saved in your selected timezone. Client booking times are
            displayed in each client&apos;s local timezone automatically.
          </p>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Current Rules</h2>
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
                      {weekDays[rule.dayOfWeek]} • {rule.startTime} - {rule.endTime}
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
      </main>
    </div>
  );
}