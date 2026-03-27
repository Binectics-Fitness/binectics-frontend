"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { marketplaceService } from "@/lib/api/marketplace";
import { utilityService, type PlatformCurrency } from "@/lib/api/utility";
import { MembershipPlanType } from "@/lib/types";

export default function CreatePlanPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    plan_type: MembershipPlanType.SUBSCRIPTION,
    duration_days: "30",
    price: "",
    currency: "USD",
    features: [] as string[],
    is_public: true,
  });
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
    setFormData((prev) => ({ ...prev, features: [...prev.features, trimmed] }));
    setNewFeature("");
  };

  const removeFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!organizationId) {
      setPageError("No active organization selected");
      return;
    }

    const price = Number(formData.price);
    const durationDays = Number(formData.duration_days);

    if (!Number.isFinite(price) || price < 0) {
      setPageError("Price must be a valid positive number");
      return;
    }

    if (price > 999999.99) {
      setPageError("Price cannot exceed 999,999.99");
      return;
    }

    if (!Number.isInteger(durationDays) || durationDays < 1) {
      setPageError("Duration must be at least 1 day");
      return;
    }

    if (durationDays > 3650) {
      setPageError("Duration cannot exceed 3,650 days (~10 years)");
      return;
    }

    setPageError("");
    setIsSubmitting(true);

    const response = await marketplaceService.createOrgMembershipPlan(
      organizationId,
      {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        plan_type: formData.plan_type,
        duration_days: durationDays,
        price,
        currency: formData.currency.trim().toUpperCase(),
        features: formData.features,
        is_public: formData.is_public,
      },
    );

    if (response.success && response.data) {
      router.push(`/dashboard/gym-owner/plans/${response.data._id}`);
      return;
    }

    setPageError(response.message || "Failed to create plan");
    setIsSubmitting(false);
  };

  if (authLoading || orgLoading) {
    return <DashboardLoading />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push("/dashboard/gym-owner/plans")}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Plans
          </button>

          <h1 className="text-3xl font-black text-foreground mb-2">Create New Plan</h1>
          <p className="text-foreground/60 mb-8">Set up a membership plan for your gym listing</p>

          {pageError && (
            <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-sm text-red-800">{pageError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Plan Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, name: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                    placeholder="Monthly Unlimited"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Plan Type *</label>
                  <select
                    value={formData.plan_type}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        plan_type: event.target.value as MembershipPlanType,
                      }))
                    }
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
                    max={3650}
                    required
                    value={formData.duration_days}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, duration_days: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Price *</label>
                  <input
                    type="number"
                    min={0}
                    max={999999.99}
                    step="0.01"
                    required
                    value={formData.price}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, price: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                    placeholder="49"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Currency *</label>
                  <select
                    required
                    value={formData.currency}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, currency: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
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
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(event) =>
                      setFormData((prev) => ({ ...prev, description: event.target.value }))
                    }
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                    placeholder="Describe what this plan includes"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Plan Features</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newFeature}
                  onChange={(event) => setNewFeature(event.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                  placeholder="Add a feature (e.g. Unlimited gym access)"
                />
                <button
                  type="button"
                  onClick={addFeature}
                  className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
                >
                  Add
                </button>
              </div>

              {formData.features.length === 0 ? (
                <p className="text-sm text-foreground/50">No features added yet.</p>
              ) : (
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div
                      key={`${feature}-${index}`}
                      className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
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
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, is_public: event.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-accent-blue-500 focus:ring-accent-blue-500"
              />
              Show this plan publicly in marketplace listing
            </label>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard/gym-owner/plans")}
                className="flex-1 px-6 py-3 bg-gray-200 text-foreground font-semibold rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 disabled:opacity-50"
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
