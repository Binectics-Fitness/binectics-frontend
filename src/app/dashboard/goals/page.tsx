"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import {
  progressService,
  ClientProfile,
  ProgressSummary,
} from "@/lib/api/progress";

export default function Page() {
  const {
    user,
    isLoading: authLoading,
    isAuthorized,
  } = useRoleGuard(UserRole.USER);
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [summary, setSummary] = useState<ProgressSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await progressService.getMyOwnProfiles();
        if (res.success && res.data) {
          setProfiles(res.data);
          if (res.data.length > 0) {
            setSelectedProfile(res.data[0]._id);
          }
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const loadSummary = useCallback(async (profileId: string) => {
    setSummaryLoading(true);
    try {
      const res = await progressService.getProgressSummary(profileId, 30);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadSummary(selectedProfile);
    }
  }, [selectedProfile, loadSummary]);

  if (authLoading || !isAuthorized) return <DashboardLoading />;

  const selectedProfileData = profiles.find((p) => p._id === selectedProfile);
  const professionalName =
    selectedProfileData?.professional_id &&
    typeof selectedProfileData.professional_id === "object"
      ? `${selectedProfileData.professional_id.first_name} ${selectedProfileData.professional_id.last_name}`
      : "Your Professional";

  function weightProgress(): number | null {
    if (!summary?.weight.starting_kg || !summary.weight.target_kg) return null;
    const start = summary.weight.starting_kg;
    const target = summary.weight.target_kg;
    const current = summary.weight.latest_kg ?? start;
    const totalDiff = Math.abs(target - start);
    if (totalDiff === 0) return 100;
    const achieved = Math.abs(current - start);
    return Math.min(100, Math.round((achieved / totalDiff) * 100));
  }

  const progress = weightProgress();

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Goals & Progress
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          Track your fitness goals and weight progress over the last 30 days.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No Goals Set Yet
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Connect with a trainer or dietitian to set your fitness goals and
              track your progress.
            </p>
            <a
              href="/marketplace"
              className="inline-flex px-4 py-2 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors"
            >
              Browse Marketplace
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Selector */}
            {profiles.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {profiles.map((p) => {
                  const name =
                    typeof p.professional_id === "object"
                      ? `${p.professional_id.first_name} ${p.professional_id.last_name}`
                      : "Professional";
                  return (
                    <button
                      key={p._id}
                      onClick={() => setSelectedProfile(p._id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedProfile === p._id
                          ? "bg-primary-500 text-foreground"
                          : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Professional Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
              <p className="text-sm text-neutral-500">Managed by</p>
              <p className="font-semibold text-foreground">
                {professionalName}
              </p>
            </div>

            {summaryLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
            ) : !summary ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500 text-sm">
                  No progress data available for this profile yet.
                </p>
              </div>
            ) : (
              <>
                {/* Goals List */}
                {selectedProfileData?.goals &&
                  selectedProfileData.goals.length > 0 && (
                    <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
                      <h2 className="text-lg font-semibold text-foreground mb-3">
                        Your Goals
                      </h2>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfileData.goals.map((goal, i) => (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 text-sm font-medium"
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Weight Progress */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Weight Progress (30 days)
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-neutral-500">Starting</p>
                      <p className="text-lg font-bold text-foreground">
                        {summary.weight.starting_kg != null
                          ? `${summary.weight.starting_kg} kg`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Current</p>
                      <p className="text-lg font-bold text-foreground">
                        {summary.weight.latest_kg != null
                          ? `${summary.weight.latest_kg} kg`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Target</p>
                      <p className="text-lg font-bold text-foreground">
                        {summary.weight.target_kg != null
                          ? `${summary.weight.target_kg} kg`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-neutral-500">Change</p>
                      <p
                        className={`text-lg font-bold ${
                          summary.weight.change_kg != null &&
                          summary.weight.change_kg < 0
                            ? "text-green-600"
                            : summary.weight.change_kg != null &&
                                summary.weight.change_kg > 0
                              ? "text-red-600"
                              : "text-foreground"
                        }`}
                      >
                        {summary.weight.change_kg != null
                          ? `${summary.weight.change_kg > 0 ? "+" : ""}${summary.weight.change_kg} kg`
                          : "—"}
                      </p>
                    </div>
                  </div>
                  {progress != null && (
                    <div>
                      <div className="flex justify-between text-xs text-neutral-500 mb-1">
                        <span>Progress to target</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Activity Summary */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Activity Summary (30 days)
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <p className="text-2xl font-bold text-blue-700">
                        {summary.activities.total_count}
                      </p>
                      <p className="text-xs text-blue-600">Workouts</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-50">
                      <p className="text-2xl font-bold text-yellow-700">
                        {summary.activities.total_duration_minutes >= 60
                          ? `${Math.floor(summary.activities.total_duration_minutes / 60)}h ${summary.activities.total_duration_minutes % 60}m`
                          : `${summary.activities.total_duration_minutes}m`}
                      </p>
                      <p className="text-xs text-yellow-600">Total Duration</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-50">
                      <p className="text-2xl font-bold text-red-700">
                        {summary.activities.total_calories_burned.toLocaleString()}
                      </p>
                      <p className="text-xs text-red-600">Calories Burned</p>
                    </div>
                  </div>
                </div>

                {/* Nutrition Summary */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
                  <h2 className="text-lg font-semibold text-foreground mb-2">
                    Nutrition Summary (30 days)
                  </h2>
                  <p className="text-sm text-neutral-600">
                    <span className="font-semibold text-foreground">
                      {summary.meals.total_count}
                    </span>{" "}
                    meal{summary.meals.total_count !== 1 ? "s" : ""} logged
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
