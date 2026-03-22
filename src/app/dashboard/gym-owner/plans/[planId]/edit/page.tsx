"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import type { MarketplaceMembershipPlan } from "@/lib/types";
import { MembershipPlanType } from "@/lib/types";

export default function EditPlanPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const planId = params.planId as string;
  const organizationId = currentOrg?._id;

  const [plan, setPlan] = useState<MarketplaceMembershipPlan | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [planType, setPlanType] = useState<MembershipPlanType>(
    MembershipPlanType.SUBSCRIPTION,
  );
  const [durationDays, setDurationDays] = useState("30");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState("");

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
        const loadedPlan = response.data;
        setPlan(loadedPlan);
        setName(loadedPlan.name);
        setDescription(loadedPlan.description || "");
        setPlanType(loadedPlan.plan_type);
        setDurationDays(String(loadedPlan.duration_days));
        setPrice(String(loadedPlan.price));
        setCurrency(loadedPlan.currency);
        setFeatures(loadedPlan.features);
        setIsPublic(loadedPlan.is_public);
      } else {
        setPageError(response.message || "Failed to load plan");
      }

      setIsLoading(false);
    }

    if (authLoading || orgLoading) return;
    if (!user) return;

    void loadPlan();
  }, [authLoading, orgLoading, user, organizationId, planId]);

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    setFeatures((prev) => [...prev, trimmed]);
    setFeatureInput("");
  };

  const removeFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId || !planId) return;

    const parsedPrice = Number(price);
    const parsedDuration = Number(durationDays);

    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setPageError("Price must be a valid positive number");
      return;
    }

    if (!Number.isInteger(parsedDuration) || parsedDuration < 1) {
      setPageError("Duration must be at least 1 day");
      return;
    }

    setIsSaving(true);
    setPageError("");

    const response = await marketplaceService.updateOrgMembershipPlan(
      organizationId,
      planId,
      {
        name: name.trim(),
        description: description.trim() || undefined,
        plan_type: planType,
        duration_days: parsedDuration,
        price: parsedPrice,
        currency: currency.trim().toUpperCase(),
        features,
        is_public: isPublic,
      },
    );

    if (response.success && response.data) {
      router.push(`/dashboard/gym-owner/plans/${response.data._id}`);
      return;
    }

    setPageError(response.message || "Failed to update plan");
    setIsSaving(false);
  };

  if (authLoading || orgLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!user || !plan) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/dashboard/gym-owner/plans/${planId}`)}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Plan
          </button>

          <h1 className="text-3xl font-black text-foreground mb-2">Edit Plan</h1>
          <p className="text-foreground/60 mb-8">Update membership plan details</p>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Plan Type *</label>
                  <select
                    value={planType}
                    onChange={(event) => setPlanType(event.target.value as MembershipPlanType)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  >
                    <option value={MembershipPlanType.SUBSCRIPTION}>Subscription</option>
                    <option value={MembershipPlanType.ONE_TIME}>One-time</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Duration (days) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={durationDays}
                    onChange={(event) => setDurationDays(event.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Price *</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Currency *</label>
                  <input
                    type="text"
                    maxLength={3}
                    required
                    value={currency}
                    onChange={(event) => setCurrency(event.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500 uppercase"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Plan Features</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={featureInput}
                  onChange={(event) => setFeatureInput(event.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
                >
                  Add
                </button>
              </div>

              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={`${feature}-${index}`} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
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
                {features.length === 0 && (
                  <p className="text-sm text-foreground/50">No features configured.</p>
                )}
              </div>
            </div>

            <label className="inline-flex items-center gap-3 text-sm text-foreground/80">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-accent-blue-500 focus:ring-accent-blue-500"
              />
              Show this plan publicly in marketplace listing
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/gym-owner/plans/${planId}`)}
                className="flex-1 px-6 py-3 bg-gray-200 text-foreground font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 disabled:opacity-50"
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
