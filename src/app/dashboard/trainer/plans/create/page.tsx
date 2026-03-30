"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import TrainerSidebar from "@/components/TrainerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { utilityService, type PlatformCurrency } from "@/lib/api/utility";
import { UserRole, MembershipPlanType } from "@/lib/types";
import {
  membershipPlanSchema,
  type MembershipPlanFormData,
} from "@/lib/schemas/plans";

export default function TrainerCreatePlanPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useRoleGuard(UserRole.TRAINER);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MembershipPlanFormData>({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: {
      name: "",
      description: "",
      plan_type: MembershipPlanType.SUBSCRIPTION,
      duration_days: "30",
      price: "",
      currency: "USD",
      features: [],
      is_public: true,
    },
  });
  const formData = watch();
  const [newFeature, setNewFeature] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [currencies, setCurrencies] = useState<PlatformCurrency[]>([]);

  const organizationId = currentOrg?._id;

  useEffect(() => {
    utilityService.getPlatformConfig().then((res) => {
      if (res.success && res.data) {
        setCurrencies(res.data.currencies.filter((c) => c.is_active));
      }
    });
  }, []);

  const addFeature = () => {
    const trimmed = newFeature.trim();
    if (!trimmed) return;
    setValue("features", [...formData.features, trimmed]);
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setValue(
      "features",
      formData.features.filter((_, idx) => idx !== index),
    );
  };

  const onSubmit = async (data: MembershipPlanFormData) => {
    if (!organizationId) {
      setPageError("No active organization selected");
      return;
    }

    setPageError("");
    setIsSubmitting(true);

    const response = await marketplaceService.createOrgMembershipPlan(
      organizationId,
      {
        name: data.name.trim(),
        description: data.description?.trim() || undefined,
        plan_type: data.plan_type as MembershipPlanType,
        duration_days: Number(data.duration_days),
        price: Number(data.price),
        currency: data.currency.trim().toUpperCase(),
        features: data.features,
        is_public: data.is_public,
      },
    );

    if (response.success && response.data) {
      router.push(`/dashboard/trainer/plans/${response.data._id}`);
      return;
    }

    setPageError(response.message || "Failed to create plan");
    setIsSubmitting(false);
  };

  if (authLoading || orgLoading) return <DashboardLoading />;
  if (!user) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <TrainerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/trainer/plans")}
            className="text-accent-yellow-600 hover:text-accent-yellow-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
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
            Back to Plans
          </button>

          <h1 className="text-3xl font-black text-foreground mb-2">
            Create New Plan
          </h1>
          <p className="text-foreground/60 mb-8">
            Set up a training plan for your clients
          </p>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                    placeholder="e.g. Monthly Personal Training"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Plan Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("plan_type")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                  >
                    <option value={MembershipPlanType.SUBSCRIPTION}>
                      Subscription
                    </option>
                    <option value={MembershipPlanType.ONE_TIME}>
                      One-time
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Duration (days) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={3650}
                    {...register("duration_days")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                  />
                  {errors.duration_days && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.duration_days.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Price <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={999999.99}
                    step="0.01"
                    {...register("price")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                    placeholder="49"
                  />
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Currency *
                  </label>
                  <select
                    {...register("currency")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                  >
                    {currencies.length === 0 ? (
                      <option value="USD">USD — US Dollar</option>
                    ) : (
                      currencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code} — {c.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    {...register("description")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                    placeholder="Describe what this training plan includes"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                Plan Features
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
                  placeholder="Add a feature (e.g. Weekly check-ins)"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-6 py-3 bg-accent-yellow-500 text-foreground font-semibold rounded-lg hover:bg-accent-yellow-600"
                >
                  Add
                </button>
              </div>
              {formData.features.length === 0 ? (
                <p className="text-sm text-foreground/50">
                  No features added yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div
                      key={`${feature}-${index}`}
                      className="flex items-center justify-between rounded-lg bg-neutral-50 p-3"
                    >
                      <span className="text-foreground">{feature}</span>
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <label className="inline-flex items-center gap-3 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setValue("is_public", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-accent-yellow-500 focus:ring-accent-yellow-500"
              />
              Show this plan publicly in marketplace listing
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/trainer/plans")}
                className="flex-1 px-6 py-3 bg-neutral-200 text-foreground font-semibold rounded-lg hover:bg-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-accent-yellow-500 text-foreground font-semibold rounded-lg hover:bg-accent-yellow-600 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Plan"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
