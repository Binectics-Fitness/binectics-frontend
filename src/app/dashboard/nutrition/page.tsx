"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole, PlanStatus, DietPlanDeliveryType } from "@/lib/types";
import {
  progressService,
  ClientProfile,
  MealFeedback,
  MealRating,
  DietPlan,
} from "@/lib/api/progress";

const ratingColors: Record<string, string> = {
  [MealRating.GREAT]: "bg-green-100 text-green-700",
  [MealRating.GOOD]: "bg-blue-100 text-blue-700",
  [MealRating.OKAY]: "bg-yellow-100 text-yellow-700",
  [MealRating.POOR]: "bg-red-100 text-red-700",
};

const statusColors: Record<string, string> = {
  [PlanStatus.ACTIVE]: "bg-green-100 text-green-700",
  [PlanStatus.INACTIVE]: "bg-neutral-100 text-neutral-600",
  [PlanStatus.ARCHIVED]: "bg-red-100 text-red-600",
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
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
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

  const loadDietPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const res = await progressService.getMyDietPlans();
      if (res.success && res.data) {
        setDietPlans(res.data);
      }
    } catch {
      setDietPlans([]);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProfile) {
      loadMeals(selectedProfile);
    }
  }, [selectedProfile, loadMeals]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadDietPlans();
  }, [isAuthorized, loadDietPlans]);

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

            {/* Assigned Diet Plans */}
            <div>
              <h2 className="text-lg font-bold text-foreground mb-3">
                Assigned Diet Plans
              </h2>
              {plansLoading ? (
                <div className="flex justify-center py-6">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-accent-purple-500 border-t-transparent" />
                </div>
              ) : dietPlans.length === 0 ? (
                <div className="bg-white rounded-xl border border-neutral-200 p-6 text-center">
                  <p className="text-neutral-500 text-sm">
                    No diet plans assigned yet. Your dietitian will create one
                    for you.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {dietPlans.map((plan) => {
                    const dietitianName =
                      typeof plan.professional_id === "object"
                        ? `${plan.professional_id.first_name} ${plan.professional_id.last_name}`
                        : "Dietitian";
                    const isDocument =
                      plan.delivery_type === DietPlanDeliveryType.DOCUMENT;
                    return (
                      <Link
                        key={plan._id}
                        href={`/dashboard/nutrition/${plan._id}`}
                        className="block rounded-xl border border-neutral-200 bg-white p-4 sm:p-5 hover:border-accent-purple-300 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-foreground line-clamp-1">
                            {plan.title}
                          </h3>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                              statusColors[plan.status] ??
                              "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {plan.status}
                          </span>
                        </div>
                        {plan.description && (
                          <p className="text-sm text-neutral-500 line-clamp-2 mb-2">
                            {plan.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                          <span>By {dietitianName}</span>
                          <span>·</span>
                          <span
                            className={`rounded-full px-2 py-0.5 font-medium ${
                              isDocument
                                ? "bg-accent-blue-100 text-accent-blue-700"
                                : "bg-accent-purple-100 text-accent-purple-700"
                            }`}
                          >
                            {isDocument ? "Document" : "Platform"}
                          </span>
                          {!isDocument && (
                            <>
                              <span>·</span>
                              <span>
                                {plan.meals.length} meal
                                {plan.meals.length !== 1 ? "s" : ""}
                              </span>
                            </>
                          )}
                          {isDocument && plan.document_file_name && (
                            <>
                              <span>·</span>
                              <span className="truncate max-w-[120px]">
                                {plan.document_file_name}
                              </span>
                            </>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
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
