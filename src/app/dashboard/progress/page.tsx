"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import {
  progressService,
  MealType,
  MealRating,
  ActivityType,
} from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";
import type {
  ClientProfile,
  ProgressSummary,
  CreateWeightLogRequest,
  CreateMealFeedbackRequest,
  CreateActivityReportRequest,
  ClientRequestItem,
} from "@/lib/api/progress";

// ─── Helpers ───────────────────────────────────────────────────────

function formatDate(iso: string) {
  return formatLocal(iso, "MMM d, yyyy");
}

function signedChange(val: number | null | undefined) {
  if (val == null || val === 0) return "—";
  return val > 0 ? `+${val.toFixed(1)} kg` : `${val.toFixed(1)} kg`;
}

const MEAL_TYPE_LABELS: Record<MealType, string> = {
  [MealType.BREAKFAST]: "Breakfast",
  [MealType.LUNCH]: "Lunch",
  [MealType.DINNER]: "Dinner",
  [MealType.SNACK]: "Snack",
};

const RATING_COLORS: Record<MealRating, string> = {
  [MealRating.GREAT]: "bg-green-100 text-green-800",
  [MealRating.GOOD]: "bg-blue-100 text-blue-800",
  [MealRating.OKAY]: "bg-yellow-100 text-yellow-800",
  [MealRating.POOR]: "bg-red-100 text-red-800",
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  [ActivityType.CARDIO]: "Cardio",
  [ActivityType.STRENGTH]: "Strength",
  [ActivityType.FLEXIBILITY]: "Flexibility",
  [ActivityType.HIIT]: "HIIT",
  [ActivityType.YOGA]: "Yoga",
  [ActivityType.SWIMMING]: "Swimming",
  [ActivityType.CYCLING]: "Cycling",
  [ActivityType.RUNNING]: "Running",
  [ActivityType.WALKING]: "Walking",
  [ActivityType.OTHER]: "Other",
};

const PERIOD_OPTIONS = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

// ─── Mini SVG line chart ───────────────────────────────────────────

function MiniLineChart({
  data,
  labels,
  unit = "",
  width = 260,
  height = 60,
  color = "#00d991",
}: {
  data: number[];
  labels?: string[];
  unit?: string;
  width?: number;
  height?: number;
  color?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = 6; // padding for dot radius
  const stepX = (width - pad * 2) / (data.length - 1);

  const coords = data.map((v, i) => ({
    x: pad + i * stepX,
    y: height - pad - ((v - min) / range) * (height - pad * 2),
  }));

  const points = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className="overflow-visible"
      onMouseLeave={() => setHovered(null)}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={2}
        points={points}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {coords.map((c, i) => (
        <g key={i}>
          {/* Invisible larger hit area */}
          <circle
            cx={c.x}
            cy={c.y}
            r={12}
            fill="transparent"
            onMouseEnter={() => setHovered(i)}
          />
          {/* Visible dot */}
          <circle
            cx={c.x}
            cy={c.y}
            r={hovered === i ? 5 : 3}
            fill={hovered === i ? color : "white"}
            stroke={color}
            strokeWidth={2}
            className="transition-all duration-150"
            style={{ cursor: "pointer" }}
          />
          {/* Tooltip */}
          {hovered === i && (
            <g>
              <rect
                x={c.x - 40}
                y={c.y - 38}
                width={80}
                height={labels ? 30 : 20}
                rx={4}
                fill="#03314b"
              />
              <text
                x={c.x}
                y={c.y - (labels ? 24 : 22)}
                textAnchor="middle"
                fill="white"
                fontSize={11}
                fontWeight={600}
              >
                {data[i]}
                {unit ? ` ${unit}` : ""}
              </text>
              {labels?.[i] && (
                <text
                  x={c.x}
                  y={c.y - 12}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize={9}
                >
                  {labels[i]}
                </text>
              )}
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}

// ─── Tab type ──────────────────────────────────────────────────────

type Tab = "overview" | "weight" | "meals" | "activities";

// ─── Page ──────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.USER);

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(
    null,
  );
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [periodDays, setPeriodDays] = useState(30);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // modals
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // connection requests
  const [pendingRequests, setPendingRequests] = useState<ClientRequestItem[]>(
    [],
  );
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // ─── load profiles ─────────────────────────────────────────────

  const loadPendingRequests = useCallback(async () => {
    try {
      const res = await progressService.getMyPendingClientRequests();
      if (res.success && res.data) setPendingRequests(res.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    if (!isAuthorized) return;
    let mounted = true;

    async function load() {
      try {
        const res = await progressService.getMyOwnProfiles();
        if (!mounted) return;
        if (res.success && res.data) {
          setProfiles(res.data);
          if (res.data.length > 0) {
            setSelectedProfileId(res.data[0]._id);
          }
        }
      } catch {
        if (mounted) setError("Could not load your profiles.");
      } finally {
        if (mounted) setLoadingData(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [isAuthorized]);

  useEffect(() => {
    if (isAuthorized) loadPendingRequests();
  }, [isAuthorized, loadPendingRequests]);

  // ─── load summary whenever profile or period changes ──────────

  const loadSummary = useCallback(async () => {
    if (!selectedProfileId) return;
    setLoadingData(true);
    try {
      const res = await progressService.getProgressSummary(
        selectedProfileId,
        periodDays,
      );
      if (res.success && res.data) setSummary(res.data);
      else setError("Could not load progress data.");
    } catch {
      setError("Could not load progress data.");
    } finally {
      setLoadingData(false);
    }
  }, [selectedProfileId, periodDays]);

  useEffect(() => {
    if (selectedProfileId) loadSummary();
  }, [selectedProfileId, periodDays, loadSummary]);

  // ─── form handlers ────────────────────────────────────────────

  async function handleLogWeight(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProfileId) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: CreateWeightLogRequest = {
      weight_kg: Number(fd.get("weight_kg")),
      recorded_at:
        (fd.get("recorded_at") as string) || new Date().toISOString(),
      note: (fd.get("note") as string) || undefined,
    };
    const res = await progressService.createWeightLog(selectedProfileId, data);
    setSubmitting(false);
    if (res.success) {
      setShowWeightModal(false);
      loadSummary();
    }
  }

  async function handleLogMeal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProfileId) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: CreateMealFeedbackRequest = {
      meal_date:
        (fd.get("meal_date") as string) ||
        new Date().toISOString().split("T")[0],
      meal_type: fd.get("meal_type") as MealType,
      description: fd.get("description") as string,
      rating: (fd.get("rating") as MealRating) || undefined,
      calories: fd.get("calories") ? Number(fd.get("calories")) : undefined,
      feedback: (fd.get("feedback") as string) || undefined,
    };
    const res = await progressService.createMealFeedback(
      selectedProfileId,
      data,
    );
    setSubmitting(false);
    if (res.success) {
      setShowMealModal(false);
      loadSummary();
    }
  }

  async function handleLogActivity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedProfileId) return;
    setSubmitting(true);
    const fd = new FormData(e.currentTarget);
    const data: CreateActivityReportRequest = {
      activity_type: fd.get("activity_type") as ActivityType,
      title: fd.get("title") as string,
      duration_minutes: Number(fd.get("duration_minutes")),
      calories_burned: fd.get("calories_burned")
        ? Number(fd.get("calories_burned"))
        : undefined,
      intensity: fd.get("intensity") ? Number(fd.get("intensity")) : undefined,
      performed_at:
        (fd.get("performed_at") as string) || new Date().toISOString(),
      notes: (fd.get("notes") as string) || undefined,
    };
    const res = await progressService.createActivityReport(
      selectedProfileId,
      data,
    );
    setSubmitting(false);
    if (res.success) {
      setShowActivityModal(false);
      loadSummary();
    }
  }

  // ─── guards ───────────────────────────────────────────────────

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized || !user) return null;

  // ─── handle connection request response ───────────────────────

  async function handleRespondToRequest(requestId: string, approved: boolean) {
    setRespondingTo(requestId);
    try {
      const res = await progressService.respondToClientRequest(
        requestId,
        approved,
      );
      if (res.success) {
        loadPendingRequests();
        if (approved) {
          // Re-load profiles since a new one was just created
          const profileRes = await progressService.getMyOwnProfiles();
          if (profileRes.success && profileRes.data) {
            setProfiles(profileRes.data);
            if (!selectedProfileId && profileRes.data.length > 0) {
              setSelectedProfileId(profileRes.data[0]._id);
            }
          }
        }
      }
    } catch {
      setError("Failed to respond to request.");
    } finally {
      setRespondingTo(null);
    }
  }

  // ─── empty state ──────────────────────────────────────────────

  const noProfiles = !loadingData && profiles.length === 0;
  const selectedProfile = selectedProfileId
    ? (profiles.find((profile) => profile._id === selectedProfileId) ?? null)
    : null;
  const selectedProfessional =
    selectedProfile && typeof selectedProfile.professional_id === "object"
      ? selectedProfile.professional_id
      : null;
  const selectedProviderId = selectedProfessional?._id;
  const selectedProviderName = selectedProfessional
    ? `${selectedProfessional.first_name} ${selectedProfessional.last_name}`.trim()
    : "";
  const selectedProviderRoleName = selectedProfessional?.user_role?.role?.name;
  const selectedProviderRole = selectedProviderRoleName
    ? selectedProviderRoleName.toLowerCase().includes("diet")
      ? "DIETITIAN"
      : selectedProviderRoleName.toLowerCase().includes("trainer")
        ? "PERSONAL_TRAINER"
        : "OTHER"
    : undefined;
  const bookConsultationHref = selectedProviderId
    ? `/dashboard/bookings/consultations?providerId=${encodeURIComponent(selectedProviderId)}&providerName=${encodeURIComponent(selectedProviderName)}${selectedProviderRole ? `&providerRole=${encodeURIComponent(selectedProviderRole)}` : ""}`
    : "/dashboard/bookings/consultations";

  // ─── derived chart data ───────────────────────────────────────

  const sortedWeightLogs =
    summary?.weight.logs
      .slice()
      .sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      ) ?? [];

  const weightData = sortedWeightLogs.map((l) => l.weight_kg);
  const weightLabels = sortedWeightLogs.map((l) =>
    formatLocal(l.recorded_at, "MMM d"),
  );

  const sortedActivityReports =
    summary?.activities.reports
      .slice()
      .sort(
        (a, b) =>
          new Date(a.performed_at).getTime() -
          new Date(b.performed_at).getTime(),
      ) ?? [];

  const activityCalData = sortedActivityReports.map(
    (r) => r.calories_burned ?? 0,
  );
  const activityLabels = sortedActivityReports.map((r) =>
    formatLocal(r.performed_at, "MMM d"),
  );

  // ─── render ───────────────────────────────────────────────────

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "weight", label: "Weight" },
    { key: "meals", label: "Meals" },
    { key: "activities", label: "Activities" },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="mb-6 sm:mb-8 flex flex-wrap items-start justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-black text-foreground">
              My Progress
            </h1>
            <p className="mt-1 text-sm text-foreground-secondary">
              Track your weight, meals, and activities over time.
            </p>
          </div>

          {profiles.length > 1 && (
            <select
              value={selectedProfileId ?? ""}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-foreground"
            >
              {profiles.map((p) => {
                const pro =
                  typeof p.professional_id === "object"
                    ? `${p.professional_id.first_name} ${p.professional_id.last_name}`
                    : "Professional";
                return (
                  <option key={p._id} value={p._id}>
                    With {pro}
                  </option>
                );
              })}
            </select>
          )}

          {selectedProviderId && (
            <Link
              href={bookConsultationHref}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-accent-purple-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-accent-purple-600"
            >
              Book Consultation
            </Link>
          )}

          <Link
            href="/dashboard/journals"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
          >
            View Journals
          </Link>
        </div>

        {selectedProfessional && (
          <div className="mb-6 rounded-2xl bg-white px-4 sm:px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Book with {selectedProviderName}
                </p>
                <p className="text-sm text-foreground-secondary">
                  Choose a date and time from this provider&apos;s consultation
                  availability.
                </p>
              </div>
              <Link
                href={bookConsultationHref}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-background px-4 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-100"
              >
                View Calendar
              </Link>
            </div>
          </div>
        )}

        {/* ── Connection Requests ─────────────────────────── */}
        {pendingRequests.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-foreground">
              Connection Requests
            </h2>
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const proInfo =
                  typeof req.professional_id === "object"
                    ? req.professional_id
                    : null;
                return (
                  <div
                    key={req._id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-xl bg-white px-4 sm:px-5 py-4 shadow-sm gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {proInfo
                          ? `${proInfo.first_name} ${proInfo.last_name}`
                          : "Professional"}
                      </p>
                      <p className="text-sm text-foreground-tertiary">
                        {req.professional_type} &middot; {proInfo?.email}
                      </p>
                      {req.message && (
                        <p className="mt-1 text-sm text-foreground-secondary italic">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleRespondToRequest(req._id, false)}
                        disabled={respondingTo === req._id}
                        className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-semibold text-foreground-secondary hover:bg-neutral-100 disabled:opacity-50 flex-1 sm:flex-none"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespondToRequest(req._id, true)}
                        disabled={respondingTo === req._id}
                        className="rounded-lg bg-primary-500 px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:opacity-50 flex-1 sm:flex-none"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── No profiles state ──────────────────────────── */}
        {noProfiles && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <svg
              className="mb-4 h-16 w-16 text-neutral-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <h2 className="text-xl font-bold text-foreground">
              No Progress Profiles Yet
            </h2>
            <p className="mt-2 max-w-md text-foreground-secondary">
              Once a trainer, dietitian, or gym sets you up as a client
              you&apos;ll see your progress tracking data here.
            </p>
          </div>
        )}

        {/* ── Content ────────────────────────────────────── */}
        {!noProfiles && selectedProfileId && (
          <>
            {/* Period selector */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {PERIOD_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setPeriodDays(o.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    periodDays === o.value
                      ? "bg-foreground text-white"
                      : "bg-white text-foreground-secondary hover:bg-neutral-100"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Tabs */}
            <div className="mb-6 flex border-b border-neutral-200">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`px-4 py-3 text-sm font-semibold transition-colors ${
                    activeTab === t.key
                      ? "border-b-2 border-foreground text-foreground"
                      : "text-foreground-tertiary hover:text-foreground-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {loadingData && (
              <div className="flex items-center justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
              </div>
            )}

            {!loadingData && summary && (
              <>
                {/* ─── Overview Tab ───────────────────────── */}
                {activeTab === "overview" && (
                  <div className="space-y-8">
                    {/* Stats cards */}
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                      <StatCard
                        label="Current Weight"
                        value={
                          summary.weight.latest_kg != null
                            ? `${summary.weight.latest_kg} kg`
                            : "—"
                        }
                        sub={signedChange(summary.weight.change_kg)}
                        color="green"
                      />
                      <StatCard
                        label="Target Weight"
                        value={
                          summary.weight.target_kg != null
                            ? `${summary.weight.target_kg} kg`
                            : "—"
                        }
                        color="blue"
                      />
                      <StatCard
                        label="Activities"
                        value={String(summary.activities.total_count)}
                        sub={`${summary.activities.total_duration_minutes} min total`}
                        color="yellow"
                      />
                      <StatCard
                        label="Meals Logged"
                        value={String(summary.meals.total_count)}
                        color="purple"
                      />
                    </div>

                    {/* Charts row */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-foreground-secondary">
                          Weight Trend
                        </h3>
                        {weightData.length >= 2 ? (
                          <MiniLineChart
                            data={weightData}
                            labels={weightLabels}
                            unit="kg"
                            width={420}
                            height={100}
                            color="#00d991"
                          />
                        ) : (
                          <p className="text-sm text-foreground-tertiary">
                            Not enough data yet.
                          </p>
                        )}
                      </div>
                      <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <h3 className="mb-4 text-sm font-semibold text-foreground-secondary">
                          Calories Burned
                        </h3>
                        {activityCalData.length >= 2 ? (
                          <MiniLineChart
                            data={activityCalData}
                            labels={activityLabels}
                            unit="cal"
                            width={420}
                            height={100}
                            color="#0267f2"
                          />
                        ) : (
                          <p className="text-sm text-foreground-tertiary">
                            Not enough data yet.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick log buttons */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => setShowWeightModal(true)}
                        className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600"
                      >
                        + Log Weight
                      </button>
                      <button
                        onClick={() => setShowMealModal(true)}
                        className="rounded-lg bg-accent-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-blue-600"
                      >
                        + Log Meal
                      </button>
                      <button
                        onClick={() => setShowActivityModal(true)}
                        className="rounded-lg bg-accent-yellow-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-accent-yellow-600"
                      >
                        + Log Activity
                      </button>
                    </div>
                  </div>
                )}

                {/* ─── Weight Tab ─────────────────────────── */}
                {activeTab === "weight" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground">
                        Weight History
                      </h2>
                      <button
                        onClick={() => setShowWeightModal(true)}
                        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary-600"
                      >
                        + Log Weight
                      </button>
                    </div>

                    {weightData.length >= 2 && (
                      <div className="rounded-2xl bg-white p-6 shadow-sm">
                        <MiniLineChart
                          data={weightData}
                          labels={weightLabels}
                          unit="kg"
                          width={600}
                          height={120}
                          color="#00d991"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {summary.weight.logs.length === 0 && (
                        <p className="py-8 text-center text-foreground-tertiary">
                          No weight entries yet.
                        </p>
                      )}
                      {summary.weight.logs.map((log) => (
                        <div
                          key={log._id}
                          className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm"
                        >
                          <div>
                            <span className="text-lg font-bold text-foreground">
                              {log.weight_kg} kg
                            </span>
                            {log.note && (
                              <p className="mt-0.5 text-sm text-foreground-secondary">
                                {log.note}
                              </p>
                            )}
                          </div>
                          <span className="text-sm text-foreground-tertiary">
                            {formatDate(log.recorded_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Meals Tab ──────────────────────────── */}
                {activeTab === "meals" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground">
                        Meal Feedback
                      </h2>
                      <button
                        onClick={() => setShowMealModal(true)}
                        className="rounded-lg bg-accent-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-blue-600"
                      >
                        + Log Meal
                      </button>
                    </div>

                    <div className="space-y-3">
                      {summary.meals.feedbacks.length === 0 && (
                        <p className="py-8 text-center text-foreground-tertiary">
                          No meal feedback yet.
                        </p>
                      )}
                      {summary.meals.feedbacks.map((m) => (
                        <div
                          key={m._id}
                          className="rounded-xl bg-white px-5 py-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {MEAL_TYPE_LABELS[m.meal_type]}
                                </span>
                                {m.rating && (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${RATING_COLORS[m.rating]}`}
                                  >
                                    {m.rating}
                                  </span>
                                )}
                              </div>
                              <p className="mt-1 text-sm text-foreground-secondary">
                                {m.description}
                              </p>
                              {m.feedback && (
                                <p className="mt-1 text-sm italic text-foreground-tertiary">
                                  {m.feedback}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              {m.calories != null && (
                                <span className="text-sm font-medium text-foreground">
                                  {m.calories} kcal
                                </span>
                              )}
                              <p className="text-sm text-foreground-tertiary">
                                {formatDate(m.meal_date)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ─── Activities Tab ─────────────────────── */}
                {activeTab === "activities" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-foreground">
                        Activity Reports
                      </h2>
                      <button
                        onClick={() => setShowActivityModal(true)}
                        className="rounded-lg bg-accent-yellow-500 px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent-yellow-600"
                      >
                        + Log Activity
                      </button>
                    </div>

                    <div className="space-y-3">
                      {summary.activities.reports.length === 0 && (
                        <p className="py-8 text-center text-foreground-tertiary">
                          No activity reports yet.
                        </p>
                      )}
                      {summary.activities.reports.map((a) => (
                        <div
                          key={a._id}
                          className="rounded-xl bg-white px-5 py-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="rounded-full bg-accent-yellow-100 px-2 py-0.5 text-xs font-medium text-accent-yellow-800">
                                  {ACTIVITY_LABELS[a.activity_type]}
                                </span>
                                <span className="text-sm font-semibold text-foreground">
                                  {a.title}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-foreground-secondary">
                                {a.duration_minutes} min
                                {a.calories_burned != null &&
                                  ` · ${a.calories_burned} kcal`}
                                {a.intensity != null &&
                                  ` · Intensity ${a.intensity}/10`}
                              </p>
                              {a.notes && (
                                <p className="mt-1 text-sm text-foreground-tertiary">
                                  {a.notes}
                                </p>
                              )}
                            </div>
                            <span className="text-sm text-foreground-tertiary">
                              {formatDate(a.performed_at)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </>
        )}
      </main>

      {/* ─── Weight Modal ──────────────────────────────────── */}
      {showWeightModal && (
        <ModalOverlay
          onClose={() => setShowWeightModal(false)}
          title="Log Weight"
        >
          <form onSubmit={handleLogWeight} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Weight (kg) *
              </span>
              <input
                name="weight_kg"
                type="number"
                step="0.1"
                required
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Date</span>
              <input
                name="recorded_at"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                max={new Date().toISOString().slice(0, 16)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Note</span>
              <input
                name="note"
                type="text"
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Optional note"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-primary-500 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </form>
        </ModalOverlay>
      )}

      {/* ─── Meal Modal ────────────────────────────────────── */}
      {showMealModal && (
        <ModalOverlay onClose={() => setShowMealModal(false)} title="Log Meal">
          <form onSubmit={handleLogMeal} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Meal Type *
              </span>
              <select
                name="meal_type"
                required
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {Object.entries(MEAL_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Description *
              </span>
              <textarea
                name="description"
                required
                rows={2}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="What did you eat?"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Date</span>
              <input
                name="meal_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                max={new Date().toISOString().split("T")[0]}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Rating
                </span>
                <select
                  name="rating"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="">–</option>
                  <option value={MealRating.GREAT}>Great</option>
                  <option value={MealRating.GOOD}>Good</option>
                  <option value={MealRating.OKAY}>Okay</option>
                  <option value={MealRating.POOR}>Poor</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Calories
                </span>
                <input
                  name="calories"
                  type="number"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  placeholder="kcal"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Professional Feedback
              </span>
              <textarea
                name="feedback"
                rows={2}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="Any notes from your professional?"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent-blue-500 py-2.5 text-sm font-semibold text-white hover:bg-accent-blue-600 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </form>
        </ModalOverlay>
      )}

      {/* ─── Activity Modal ────────────────────────────────── */}
      {showActivityModal && (
        <ModalOverlay
          onClose={() => setShowActivityModal(false)}
          title="Log Activity"
        >
          <form onSubmit={handleLogActivity} className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Activity Type *
              </span>
              <select
                name="activity_type"
                required
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {Object.entries(ACTIVITY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Title *
              </span>
              <input
                name="title"
                type="text"
                required
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="e.g. Morning run"
              />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Duration (min) *
                </span>
                <input
                  name="duration_minutes"
                  type="number"
                  required
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">
                  Calories Burned
                </span>
                <input
                  name="calories_burned"
                  type="number"
                  className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Intensity (1-10)
              </span>
              <input
                name="intensity"
                type="number"
                min={1}
                max={10}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">
                Date &amp; Time
              </span>
              <input
                name="performed_at"
                type="datetime-local"
                defaultValue={new Date().toISOString().slice(0, 16)}
                max={new Date().toISOString().slice(0, 16)}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Notes</span>
              <textarea
                name="notes"
                rows={2}
                className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                placeholder="How did it go?"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-accent-yellow-500 py-2.5 text-sm font-semibold text-foreground hover:bg-accent-yellow-600 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save"}
            </button>
          </form>
        </ModalOverlay>
      )}
    </div>
  );
}

// ─── Stat Card ──────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "green" | "blue" | "yellow" | "purple";
}) {
  const accents: Record<string, string> = {
    green: "border-l-primary-500",
    blue: "border-l-accent-blue-500",
    yellow: "border-l-accent-yellow-500",
    purple: "border-l-accent-purple-500",
  };
  return (
    <div
      className={`rounded-2xl border-l-4 ${accents[color]} bg-white p-5 shadow-sm`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-tertiary">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-foreground-secondary">{sub}</p>}
    </div>
  );
}

// ─── Modal Overlay ──────────────────────────────────────────────────

function ModalOverlay({
  onClose,
  title,
  children,
}: {
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="text-foreground-tertiary hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
