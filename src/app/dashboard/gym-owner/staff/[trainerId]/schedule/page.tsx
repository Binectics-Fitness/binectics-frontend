"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLoading from "@/components/DashboardLoading";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import TimezoneHelpBadge from "@/components/TimezoneHelpBadge";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import {
  consultationsService,
  type AvailabilityException,
  type AvailabilityRule,
  AvailabilityExceptionType,
} from "@/lib/api/consultations";
import {
  MemberStatus,
  teamsService,
  type OrganizationMember,
  type TeamRole,
} from "@/lib/api/teams";
import { formatLocal, getClientTimezone } from "@/utils/format";

const DAY_OPTIONS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const STATUS_STYLES: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "bg-primary-100 text-primary-700",
  [MemberStatus.PENDING]: "bg-yellow-100 text-yellow-700",
  [MemberStatus.INACTIVE]: "bg-gray-100 text-gray-700",
};

function getMemberUser(member: OrganizationMember) {
  return typeof member.user_id === "object" && member.user_id !== null
    ? member.user_id
    : null;
}

function getMemberRole(member: OrganizationMember): TeamRole | null {
  return typeof member.team_role_id === "object" && member.team_role_id !== null
    ? member.team_role_id
    : null;
}

function getMemberName(member: OrganizationMember): string {
  const user = getMemberUser(member);
  if (!user) return "Unknown team member";
  return `${user.first_name} ${user.last_name}`.trim();
}

function formatStatusLabel(status: MemberStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function TrainerSchedulePage() {
  const params = useParams<{ trainerId: string }>();
  const router = useRouter();
  const { isLoading: authLoading, isAuthenticated: isAuthorized } =
    useRequireAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const trainerId = params.trainerId;
  const userTimezone = getClientTimezone();
  const todayDay = new Date().getDay();
  const [selectedDay, setSelectedDay] = useState<number>(todayDay);
  const [member, setMember] = useState<OrganizationMember | null>(null);
  const [availabilityRules, setAvailabilityRules] = useState<
    AvailabilityRule[]
  >([]);
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || orgLoading || !isAuthorized) return;
    if (!currentOrg?._id) {
      setMember(null);
      setAvailabilityRules([]);
      setExceptions([]);
      setIsLoading(false);
      return;
    }

    const organizationId = currentOrg._id;
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        const [membersResponse, availabilityResponse, exceptionsResponse] =
          await Promise.all([
            teamsService.getMembers(organizationId),
            consultationsService.getMyAvailability(),
            consultationsService.getMyExceptions(),
          ]);

        if (!mounted) return;

        if (membersResponse.success && membersResponse.data) {
          const matchedMember = membersResponse.data.find(
            (entry) => entry._id === trainerId,
          );
          setMember(matchedMember ?? null);
          if (!matchedMember) {
            setError("Team member not found in the current organization.");
          }
        } else {
          setMember(null);
          setError(
            membersResponse.message ?? "Failed to load staff member details.",
          );
        }

        if (availabilityResponse.success && availabilityResponse.data) {
          setAvailabilityRules(availabilityResponse.data);
        } else {
          setAvailabilityRules([]);
        }

        if (exceptionsResponse.success && exceptionsResponse.data) {
          setExceptions(exceptionsResponse.data);
        } else {
          setExceptions([]);
        }
      } catch {
        if (mounted) {
          setMember(null);
          setAvailabilityRules([]);
          setExceptions([]);
          setError("Failed to load schedule details.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [authLoading, currentOrg?._id, isAuthorized, orgLoading, trainerId]);

  const role = useMemo(() => (member ? getMemberRole(member) : null), [member]);

  const selectedDayRules = useMemo(
    () =>
      availabilityRules
        .filter((rule) => rule.dayOfWeek === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [availabilityRules, selectedDay],
  );

  const upcomingExceptions = useMemo(() => {
    const now = new Date();
    return exceptions
      .filter((exception) => new Date(exception.date) >= now)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 5);
  }, [exceptions]);

  const activeRulesCount = availabilityRules.filter(
    (rule) => rule.isActive,
  ).length;
  const unavailableDays = exceptions.filter(
    (exception) => exception.type === AvailabilityExceptionType.UNAVAILABLE,
  ).length;

  if (authLoading || orgLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!isAuthorized) {
    return null;
  }

  if (!currentOrg || !member) {
    return (
      <div className="flex min-h-screen bg-neutral-50">
        <GymOwnerSidebar />
        <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
          <div className="mx-auto max-w-4xl rounded-xl bg-white p-8 shadow-card">
            <button
              onClick={() => router.push("/dashboard/gym-owner/staff")}
              className="mb-4 inline-flex items-center gap-2 font-medium text-accent-blue-500 hover:text-accent-blue-700"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Staff
            </button>
            <h1 className="text-2xl font-black text-foreground">
              Schedule details unavailable
            </h1>
            <p className="mt-2 text-foreground/60">
              {error ?? "We could not find this team member."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          <button
            onClick={() =>
              router.push(`/dashboard/gym-owner/staff/${trainerId}`)
            }
            className="inline-flex items-center gap-2 font-medium text-accent-blue-500 hover:text-accent-blue-700"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Staff Member
          </button>

          <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-black text-foreground">
                    Schedule Operations
                  </h1>
                  <TimezoneHelpBadge
                    message="Consultation availability windows are interpreted in your selected timezone first, then converted for clients and trainers automatically."
                    label="Scheduling timezone help"
                    className="text-foreground/60"
                  />
                </div>
                <p className="mt-1 text-foreground/60">
                  {getMemberName(member)} • {role?.name ?? "Unassigned role"}
                </p>
                <p className="mt-2 text-sm text-foreground/60">
                  Current browser timezone:{" "}
                  <span className="font-semibold text-foreground">
                    {userTimezone}
                  </span>
                </p>
                <div className="mt-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[member.status]}`}
                  >
                    {formatStatusLabel(member.status)}
                  </span>
                </div>
              </div>
              <Link
                href="/dashboard/gym-owner/consultations"
                className="inline-flex items-center rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-blue-600"
              >
                Manage Consultation Availability
              </Link>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Active Availability Rules
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {activeRulesCount}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Exceptions Configured
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {exceptions.length}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Unavailable Days
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {unavailableDays}
              </p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-card">
              <p className="text-sm font-medium text-foreground/60">
                Selected Day Slots
              </p>
              <p className="mt-2 text-3xl font-black text-foreground">
                {selectedDayRules.length}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-card">
            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((day) => (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium ${
                    selectedDay === day.value
                      ? "bg-accent-blue-500 text-white"
                      : "bg-gray-100 text-foreground hover:bg-gray-200"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-xl bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-foreground">
                {DAY_OPTIONS.find((day) => day.value === selectedDay)?.label}{" "}
                availability
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                Windows configured in your consultation availability settings.
              </p>

              {selectedDayRules.length === 0 ? (
                <div className="mt-6 rounded-lg bg-gray-50 p-4 text-sm text-foreground/60">
                  No active availability windows are configured for this day.
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectedDayRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-lg border border-gray-200 px-4 py-3"
                    >
                      <p className="font-semibold text-foreground">
                        {rule.startTime} - {rule.endTime}
                      </p>
                      <p className="mt-1 text-sm text-foreground/60">
                        Timezone: {rule.timezone}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground">
                  Upcoming Exceptions
                </h2>
                <div className="mt-4 space-y-3">
                  {upcomingExceptions.length === 0 ? (
                    <p className="text-sm text-foreground/60">
                      No upcoming exceptions configured.
                    </p>
                  ) : (
                    upcomingExceptions.map((exception) => (
                      <div
                        key={exception.id}
                        className="rounded-lg border border-gray-200 p-4"
                      >
                        <p className="font-semibold text-foreground">
                          {formatLocal(exception.date, "EEE, MMM d, yyyy")}
                        </p>
                        <p className="mt-1 text-sm text-foreground/60">
                          {exception.type ===
                          AvailabilityExceptionType.UNAVAILABLE
                            ? "Unavailable"
                            : `Custom hours: ${exception.startTime ?? "—"} - ${exception.endTime ?? "—"}`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-foreground">Notes</h2>
                <p className="mt-3 text-sm leading-6 text-foreground/70">
                  Trainer-specific schedule controls are not yet exposed as a
                  separate API surface. This page now reflects the real
                  consultation availability configuration for the organization
                  and links to the canonical consultations manager for edits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
