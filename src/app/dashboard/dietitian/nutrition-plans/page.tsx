"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { EmptyState } from "@/components/EmptyState";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { UserRole } from "@/lib/types";
import {
  progressService,
  type ClientProfile,
  type MealFeedback,
  MealType,
  MealRating,
} from "@/lib/api/progress";
import { formatLocal } from "@/utils/format";

function getClientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object" && profile.client_id) {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Client";
}

const ratingColors: Record<string, string> = {
  [MealRating.GREAT]: "bg-primary-100 text-primary-700",
  [MealRating.GOOD]: "bg-accent-blue-100 text-accent-blue-700",
  [MealRating.OKAY]: "bg-accent-yellow-100 text-accent-yellow-700",
  [MealRating.POOR]: "bg-red-100 text-red-700",
};

export default function DietitianNutritionPlansPage() {
  const { user, isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealFeedback[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingMeals, setLoadingMeals] = useState(false);

  useEffect(() => {
    if (!user || orgLoading) return;

    const promise = currentOrg
      ? progressService.getOrgClientProfiles(currentOrg._id)
      : progressService.getMyClientProfiles();

    promise
      .then((res) => {
        if (res.success && res.data) setClients(res.data.filter((c) => c.is_active));
      })
      .finally(() => setLoadingClients(false));
  }, [user, currentOrg, orgLoading]);

  useEffect(() => {
    if (!selectedClientId) {
      setMeals([]);
      return;
    }
    setLoadingMeals(true);
    progressService
      .getMealFeedbacks(selectedClientId, 20)
      .then((res) => {
        if (res.success && res.data) setMeals(res.data);
      })
      .finally(() => setLoadingMeals(false));
  }, [selectedClientId]);

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Nutrition Tracking
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Monitor client meal feedback and nutrition adherence
          </p>
        </div>

        {loadingClients ? (
          <DashboardLoading />
        ) : clients.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 shadow-card">
            <EmptyState
              title="No Active Clients"
              description="Add clients to start tracking their nutrition progress."
              actionLabel="Manage Clients"
              actionHref="/dashboard/dietitian/clients"
            />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Client List */}
            <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-1">
              <h2 className="mb-4 text-lg font-bold text-foreground">
                Clients ({clients.length})
              </h2>
              <div className="space-y-2">
                {clients.map((client) => (
                  <button
                    key={client._id}
                    onClick={() => setSelectedClientId(client._id)}
                    className={`w-full rounded-lg p-3 text-left transition-colors ${
                      selectedClientId === client._id
                        ? "bg-accent-purple-50 border border-accent-purple-200"
                        : "hover:bg-neutral-50"
                    }`}
                  >
                    <p className="font-semibold text-foreground text-sm">
                      {getClientName(client)}
                    </p>
                    {client.goals.length > 0 && (
                      <p className="text-xs text-foreground-secondary mt-0.5 line-clamp-1">
                        {client.goals.join(", ")}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Feedback */}
            <div className="rounded-2xl bg-white p-6 shadow-card lg:col-span-2">
              {!selectedClientId ? (
                <div className="flex h-full items-center justify-center py-12">
                  <p className="text-sm text-foreground-secondary">
                    Select a client to view their meal feedback
                  </p>
                </div>
              ) : loadingMeals ? (
                <DashboardLoading />
              ) : meals.length === 0 ? (
                <EmptyState
                  title="No Meal Data"
                  description="This client hasn't logged any meals yet."
                />
              ) : (
                <>
                  <h2 className="mb-4 text-lg font-bold text-foreground">
                    Recent Meals
                  </h2>
                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <div
                        key={meal._id}
                        className="rounded-lg border border-neutral-100 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded-full bg-accent-purple-100 px-2.5 py-0.5 text-xs font-semibold text-accent-purple-700">
                              {meal.meal_type}
                            </span>
                            {meal.rating && (
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                  ratingColors[meal.rating] ||
                                  "bg-neutral-100 text-neutral-600"
                                }`}
                              >
                                {meal.rating}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-foreground-secondary">
                            {formatLocal(meal.meal_date, "MMM d, yyyy")}
                          </span>
                        </div>
                        {meal.description && (
                          <p className="mt-2 text-sm text-foreground">
                            {meal.description}
                          </p>
                        )}
                        <div className="mt-2 flex gap-4 text-xs text-foreground-secondary">
                          {meal.calories != null && (
                            <span>{meal.calories} cal</span>
                          )}
                          {meal.feedback && <span>{meal.feedback}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
