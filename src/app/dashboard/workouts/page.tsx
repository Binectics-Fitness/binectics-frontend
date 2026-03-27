"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import { progressService, ClientProfile, ActivityReport } from "@/lib/api/progress";

export default function Page() {
  const { user, isLoading: authLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [activities, setActivities] = useState<ActivityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

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

  const loadActivities = useCallback(async (profileId: string) => {
    setActivitiesLoading(true);
    try {
      const res = await progressService.getActivityReports(profileId, 50);
      if (res.success && res.data) {
        setActivities(res.data);
      }
    } catch {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadActivities(selectedProfile);
    }
  }, [selectedProfile, loadActivities]);

  if (authLoading || !isAuthorized) return <DashboardLoading />;

  const selectedProfileData = profiles.find((p) => p._id === selectedProfile);
  const professionalName =
    selectedProfileData?.professional_id &&
    typeof selectedProfileData.professional_id === "object"
      ? `${selectedProfileData.professional_id.first_name} ${selectedProfileData.professional_id.last_name}`
      : "Your Professional";

  // Stats
  const totalWorkouts = activities.length;
  const totalMinutes = activities.reduce((s, a) => s + (a.duration_minutes || 0), 0);
  const totalCalories = activities.reduce((s, a) => s + (a.calories_burned || 0), 0);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Workouts
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          View your activity reports and workout history.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">No Workout Data Yet</h2>
            <p className="text-sm text-neutral-500 mb-4">Once you&apos;re connected with a trainer, your activity reports will appear here.</p>
            <a href="/trainers" className="inline-flex px-4 py-2 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors">Browse Trainers</a>
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

            {/* Stats Cards */}
            {!activitiesLoading && activities.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-500">Total Workouts</p>
                  <p className="text-2xl font-bold text-foreground">{totalWorkouts}</p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-500">Total Duration</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalMinutes >= 60
                      ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                      : `${totalMinutes}m`}
                  </p>
                </div>
                <div className="bg-white rounded-xl border border-neutral-200 p-4">
                  <p className="text-sm text-neutral-500">Calories Burned</p>
                  <p className="text-2xl font-bold text-foreground">
                    {totalCalories.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Professional Info */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5">
              <p className="text-sm text-neutral-500">Managed by</p>
              <p className="font-semibold text-foreground">{professionalName}</p>
            </div>

            {/* Activities List */}
            {activitiesLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
            ) : activities.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500 text-sm">
                  No activity reports recorded yet for this profile.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => (
                  <div
                    key={act._id}
                    className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium capitalize">
                        {act.activity_type.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {act.title}
                      </span>
                      <span className="ml-auto text-xs text-neutral-400">
                        {new Date(act.performed_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-neutral-600">
                      <span>
                        ⏱ {act.duration_minutes} min
                      </span>
                      {act.calories_burned != null && (
                        <span>🔥 {act.calories_burned} kcal</span>
                      )}
                      {act.intensity != null && (
                        <span>💪 Intensity: {act.intensity}/10</span>
                      )}
                    </div>
                    {act.notes && (
                      <p className="mt-2 text-sm text-neutral-500">{act.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
