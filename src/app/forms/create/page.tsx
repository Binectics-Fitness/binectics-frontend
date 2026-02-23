"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { formsService, type CreateFormRequest } from "@/lib/api/forms";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import DashboardLoading from "@/components/DashboardLoading";

export default function CreateFormPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateFormRequest>({
    title: "",
    description: "",
    allow_multiple_submissions: false,
    require_authentication: true,
  });

  if (authLoading) {
    return <DashboardLoading />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.title.trim()) {
      setError("Form title is required");
      return;
    }

    setIsSubmitting(true);

    const response = await formsService.createForm(formData);

    if (response.success && response.data) {
      // Redirect to form builder
      router.push(`/forms/${response.data._id}/edit`);
    } else {
      setError(response.message || "Failed to create form");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Create New Form", href: "/forms/create" },
          ]}
        />

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-black text-foreground mb-2">
            Create New Form
          </h1>
          <p className="text-foreground-secondary">
            Start by giving your form a title and description
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-card p-8">
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Form Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                type="text"
                placeholder="e.g., Customer Satisfaction Survey"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
                maxLength={255}
              />
            </div>

            {/* Description */}
            <div className="mb-6">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-foreground mb-2"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Describe what this form is for..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                maxLength={1000}
              />
            </div>

            {/* Settings */}
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">
                    Allow Multiple Submissions
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    Users can submit more than one response
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.allow_multiple_submissions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        allow_multiple_submissions: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div>
                  <p className="font-semibold text-foreground">
                    Require Authentication
                  </p>
                  <p className="text-sm text-foreground-secondary">
                    Only logged-in users can submit responses
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.require_authentication}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        require_authentication: e.target.checked,
                      })
                    }
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-foreground-secondary hover:text-foreground font-medium transition-colors"
              >
                Cancel
              </button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Form & Add Questions"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
