"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import SearchableSelect from "@/components/SearchableSelect";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { utilityService, type PlatformCurrency } from "@/lib/api/utility";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import { UserRole, MembershipPlanType } from "@/lib/types";
import {
  membershipPlanSchema,
  type MembershipPlanFormData,
} from "@/lib/schemas/plans";

export default function DietitianEditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const planId = params.planId as string;
  const organizationId = currentOrg?._id;

  const [plan, setPlan] = useState<MarketplaceMembershipPlan | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
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
  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [currencies, setCurrencies] = useState<PlatformCurrency[]>([]);

  useEffect(() => {
    utilityService.getPlatformConfig().then((res) => {
      if (res.success && res.data) {
        setCurrencies(res.data.currencies.filter((c) => c.is_active));
      }
    });
  }, []);

  useEffect(() => {
    async function loadPlan() {
      if (!organizationId || !planId) return;
      setIsLoading(true);
      setPageError("");
      const response = await marketplaceService.getOrgMembershipPlanById(
        organizationId,
        planId,
      );
      if (response.success && response.data) {
        const p = response.data;
        setPlan(p);
        reset({
          name: p.name,
          description: p.description || "",
          plan_type: p.plan_type,
          duration_days: String(p.duration_days),
          price: String(p.price),
          currency: p.currency,
          features: p.features,
          is_public: p.is_public,
        });
      } else {
        setPageError(response.message || "Failed to load plan");
      }
      setIsLoading(false);
    }
    if (authLoading || orgLoading || !user) return;
    void loadPlan();
  }, [authLoading, orgLoading, user, organizationId, planId, reset]);

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    setValue("features", [...formData.features, trimmed]);
    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    setValue(
      "features",
      formData.features.filter((_, idx) => idx !== index),
    );
  };

  const onSubmit = async (data: MembershipPlanFormData) => {
    if (!organizationId || !planId) return;
    setIsSaving(true);
    setPageError("");
    const response = await marketplaceService.updateOrgMembershipPlan(
      organizationId,
      planId,
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
      router.push(`/dashboard/dietitian/plans/${response.data._id}`);
      return;
    }
    setPageError(response.message || "Failed to update plan");
    setIsSaving(false);
  };

  if (authLoading || orgLoading || isLoading) return <DashboardLoading />;
  if (!user || !plan) return null;

  return (
    <div className="flex min-h-screen bg-background">
      <DietitianSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/dietitian/plans/${planId}`)}
            className="text-accent-purple-500 hover:text-accent-purple-700 font-medium mb-4 flex items-center gap-2"
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
            Back to Plan
          </button>

          <h1 className="text-3xl font-black text-foreground mb-2">
            Edit Plan
          </h1>
          <p className="text-foreground/60 mb-8">
            Update your service plan details
          </p>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Plan Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600 mt-1">
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
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
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
                    Duration (days) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register("duration_days")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
                  />
                  {errors.duration_days && (
                    <p className="text-sm text-red-600 mt-1">
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
                    step="0.01"
                    {...register("price")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
                  />
                  {errors.price && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.price.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Currency <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    value={formData.currency}
                    onChange={(val) => setValue("currency", val, { shouldValidate: true })}
                    options={
                      currencies.length === 0
                        ? [{ label: formData.currency, value: formData.currency }]
                        : currencies.map((c) => ({ label: `${c.code} — ${c.name}`, value: c.code }))
                    }
                    placeholder="Select currency"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">
                    Description
                  </label>
                  <textarea
                    rows={4}
                    {...register("description")}
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
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
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-6 py-3 bg-accent-purple-500 text-white font-semibold rounded-lg hover:bg-accent-purple-600"
                >
                  Add
                </button>
              </div>
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
                {formData.features.length === 0 && (
                  <p className="text-sm text-foreground/50">
                    No features configured.
                  </p>
                )}
              </div>
            </div>

            <label className="inline-flex items-center gap-3 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => setValue("is_public", e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-accent-purple-500 focus:ring-accent-purple-500"
              />
              Show this plan publicly in marketplace listing
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() =>
                  router.push(`/dashboard/dietitian/plans/${planId}`)
                }
                className="flex-1 px-6 py-3 bg-neutral-200 text-foreground font-semibold rounded-lg hover:bg-neutral-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-accent-purple-500 text-white font-semibold rounded-lg hover:bg-accent-purple-600 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
