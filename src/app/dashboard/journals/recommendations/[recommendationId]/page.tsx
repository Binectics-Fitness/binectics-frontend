"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { UserRole, RecommendationCategory } from "@/lib/types";
import { progressService } from "@/lib/api/progress";
import type { Recommendation } from "@/lib/api/progress";

const categoryColors: Record<string, string> = {
  [RecommendationCategory.RECOVERY]: "bg-blue-100 text-blue-700",
  [RecommendationCategory.HYDRATION]: "bg-cyan-100 text-cyan-700",
  [RecommendationCategory.NUTRITION]: "bg-green-100 text-green-700",
  [RecommendationCategory.LIFESTYLE]: "bg-yellow-100 text-yellow-700",
  [RecommendationCategory.EXERCISE]: "bg-red-100 text-red-700",
  [RecommendationCategory.GENERAL]: "bg-neutral-100 text-neutral-600",
};

export default function RecommendationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recommendationId = params.recommendationId as string;

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.USER);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [loadingRec, setLoadingRec] = useState(true);
  const [error, setError] = useState("");

  const loadRecommendation = useCallback(async () => {
    if (!recommendationId) return;
    setLoadingRec(true);
    try {
      const res =
        await progressService.getMyRecommendationById(recommendationId);
      if (res.success && res.data) {
        setRec(res.data);
      } else {
        setError(res.message || "Recommendation not found");
      }
    } catch {
      setError("Failed to load recommendation");
    }
    setLoadingRec(false);
  }, [recommendationId]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadRecommendation();
  }, [isAuthorized, loadRecommendation]);

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  const proName =
    rec && typeof rec.professional_id === "object"
      ? `${rec.professional_id.first_name} ${rec.professional_id.last_name}`
      : "Professional";

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DashboardSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-foreground-secondary hover:text-foreground"
        >
          <svg
            className="h-4 w-4"
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
          Back to Journals
        </button>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {loadingRec ? (
          <DashboardLoading />
        ) : !rec ? (
          <div className="rounded-2xl bg-white p-8 shadow-[var(--shadow-card)] text-center">
            <p className="text-foreground-secondary">
              Recommendation not found.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
                    {rec.title}
                  </h1>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    By {proName} ·{" "}
                    {new Date(rec.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${
                    categoryColors[rec.category] ??
                    "bg-neutral-100 text-neutral-600"
                  }`}
                >
                  {rec.category}
                </span>
              </div>
            </div>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Category</p>
                <p className="text-sm font-bold text-foreground capitalize">
                  {rec.category}
                </p>
              </div>
              {rec.plan_type && rec.plan_type !== "general" && (
                <div className="rounded-xl border border-neutral-200 bg-white p-4">
                  <p className="text-xs text-neutral-500">Linked Plan</p>
                  <p className="text-sm font-bold text-foreground capitalize">
                    {rec.plan_type.replace(/_/g, " ")}
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-xs text-neutral-500">Status</p>
                <p className="text-sm font-bold text-foreground">
                  {rec.is_active ? "Active" : "Inactive"}
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground mb-3">
                Recommendation
              </h2>
              <div className="text-sm text-foreground-secondary whitespace-pre-wrap leading-relaxed">
                {rec.content}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
