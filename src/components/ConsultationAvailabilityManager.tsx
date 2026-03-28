"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import DashboardLoading from "@/components/DashboardLoading";
import TimezoneHelpBadge from "@/components/TimezoneHelpBadge";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { getClientTimezone } from "@/utils/format";
import { UserRole } from "@/lib/types";
import {
  consultationsService,
  ConsultationProviderRole,
  type AvailabilityRule,
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

  const [rules, setRules] = useState<AvailabilityRule[]>([]);
  const [consultationTypes, setConsultationTypes] = useState<
    ConsultationType[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingType, setIsCreatingType] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      setMessage("Consultation type name is required.");
      return;
    }

    if (
      newType.defaultDurationMinutes < 5 ||
      newType.defaultDurationMinutes > 240
    ) {
      setMessage("Duration must be between 5 and 240 minutes.");
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
      setMessage("Consultation type created successfully.");
    } else {
      setMessage(response.message ?? "Failed to create consultation type.");
    }

    setIsCreatingType(false);
  };

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

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              Consultation Availability
            </h1>
            <p className="mt-2 text-foreground-secondary">{description}</p>
          </div>

          <button
            onClick={saveAvailability}
            disabled={isSaving}
            className="w-full rounded-lg bg-primary-500 px-5 py-3 text-sm font-semibold text-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {isSaving ? "Saving..." : "Save Availability"}
          </button>
        </div>

        {message && (
          <div className="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-foreground">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
          <h2 className="mb-4 text-xl font-bold text-foreground">
            Consultation Types
          </h2>

          <div className="grid gap-3 md:grid-cols-4">
            <input
              type="text"
              value={newType.name}
              onChange={(event) =>
                setNewType((prev) => ({ ...prev, name: event.target.value }))
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
            placeholder="Optional description"
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
                      {type.defaultDurationMinutes} min • {type.providerRole}
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

        <section className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
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
      </main>
    </div>
  );
}
