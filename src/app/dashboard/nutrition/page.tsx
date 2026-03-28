"use client";

import { useEffect, useState, useCallback } from "react";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole } from "@/lib/types";
import {
  progressService,
  ClientProfile,
  MealFeedback,
  MealRating,
} from "@/lib/api/progress";

const ratingColors: Record<string, string> = {
  [MealRating.GREAT]: "bg-green-100 text-green-700",
  [MealRating.GOOD]: "bg-blue-100 text-blue-700",
  [MealRating.OKAY]: "bg-yellow-100 text-yellow-700",
  [MealRating.POOR]: "bg-red-100 text-red-700",
};

export default function Page() {
  const {
    user,
    isLoading: authLoading,
    isAuthorized,
  } = useRoleGuard(UserRole.USER);
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [mealsLoading, setMealsLoading] = useState(false);

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

  const loadMeals = useCallback(async (profileId: string) => {
    setMealsLoading(true);
    try {
      const res = await progressService.getMealFeedbacks(profileId, 50);
      if (res.success && res.data) {
        setMeals(res.data);
      }
    } catch {
      setMeals([]);
    } finally {
      setMealsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadMeals(selectedProfile);
    }
  }, [selectedProfile, loadMeals]);

  if (authLoading || !isAuthorized) return <DashboardLoading />;

  const selectedProfileData = profiles.find((p) => p._id === selectedProfile);
  const professionalName =
    selectedProfileData?.professional_id &&
    typeof selectedProfileData.professional_id === "object"
      ? `${selectedProfileData.professional_id.first_name} ${selectedProfileData.professional_id.last_name}`
      : "Your Professional";

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Nutrition
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          View meal feedback and nutrition notes from your professionals.
        </p>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              No Nutrition Data Yet
            </h2>
            <p className="text-sm text-neutral-500 mb-4">
              Once you&apos;re connected with a dietitian or trainer, your meal
              feedback will appear here.
            </p>
            <a
              href="/dietitians"
              className="inline-flex px-4 py-2 bg-primary-500 text-foreground font-semibold rounded-lg text-sm hover:bg-primary-600 transition-colors"
            >
              Browse Dietitians
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
                  const role =
                    typeof p.professional_id === "object"
                      ? (p.professional_id.user_role?.role?.name ?? "")
                      : "";
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
                      {role && (
                        <span className="ml-1 text-xs opacity-70">
                          ({role})
                        </span>
                      )}
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

            {/* Meals List */}
            {mealsLoading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
            ) : meals.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
                <p className="text-neutral-500 text-sm">
                  No meal feedback recorded yet for this profile.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {meals.map((meal) => (
                  <div
                    key={meal._id}
                    className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium capitalize">
                        {meal.meal_type}
                      </span>
                      {meal.rating && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                            ratingColors[meal.rating] ??
                            "bg-neutral-100 text-neutral-700"
                          }`}
                        >
                          {meal.rating}
                        </span>
                      )}
                      {meal.calories != null && (
                        <span className="text-xs text-neutral-400">
                          {meal.calories} kcal
                        </span>
                      )}
                      <span className="ml-auto text-xs text-neutral-400">
                        {new Date(meal.meal_date).toLocaleDateString()}
                      </span>
                    </div>
                    {meal.description && (
                      <p className="text-sm text-foreground mb-1">
                        {meal.description}
                      </p>
                    )}
                    {meal.feedback && (
                      <p className="text-sm text-neutral-500 italic">
                        &ldquo;{meal.feedback}&rdquo;
                      </p>
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
