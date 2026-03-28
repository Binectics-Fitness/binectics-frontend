"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useFormCreate } from "@/hooks/useForms";
import { createFormSchema, type CreateFormFormData } from "@/lib/schemas/forms";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import DashboardLoading from "@/components/DashboardLoading";
import { Building2 } from "lucide-react";

export default function CreateFormPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrg } = useOrganization();
  const router = useRouter();
  const { createForm, isCreating, error: createError } = useFormCreate();
  const [showBranding, setShowBranding] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFormFormData>({
    resolver: zodResolver(createFormSchema),
    defaultValues: {
      title: "",
      description: "",
      allow_multiple_submissions: false,
      require_authentication: true,
      company_name: "",
      company_description: "",
      custom_logo: "",
      custom_header_color: "",
    },
  });

  const formData = watch();
  const error = errors.title?.message || createError;
  const isSubmitting = isCreating;

  if (authLoading) {
    return <DashboardLoading />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  const onSubmit = async (data: CreateFormFormData) => {
    const result = await createForm(data, currentOrg?._id);

    if (result) {
      // Redirect to form builder
      router.push(`/forms/${result._id}/edit`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
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
          <p className="text-foreground-secondary mb-4">
            Start by giving your form a title and description
          </p>

          {/* Context Banner */}
          {currentOrg && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2.5 rounded-lg text-sm">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span>
                <strong>Organization Form:</strong> This form will be created
                for <strong>{currentOrg.name}</strong> and visible to all
                members.
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-xl shadow-[var(--shadow-card)] p-4 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)}>
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
                {...register("title")}
                maxLength={255}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.title.message}
                </p>
              )}
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
                {...register("description")}
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
                      setValue("allow_multiple_submissions", e.target.checked)
                    }
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
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
                      setValue("require_authentication", e.target.checked)
                    }
                  />
                  <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </label>
              </div>
            </div>

            {/* Branding (Optional) */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setShowBranding(!showBranding)}
                className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">🎨</span>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">
                      Branding (Optional)
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      Add your company logo and customize the form header
                    </p>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-foreground-secondary transition-transform ${showBranding ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showBranding && (
                <div className="mt-4 space-y-4 p-4 border border-neutral-200 rounded-lg">
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Company / Brand Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., FitLife Nutrition"
                      {...register("company_name")}
                      maxLength={255}
                    />
                  </div>

                  {/* Company Description */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Tagline / Description
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Personalized nutrition for your goals"
                      {...register("company_description")}
                      maxLength={500}
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Logo URL
                    </label>
                    <Input
                      type="url"
                      placeholder="https://your-domain.com/logo.png"
                      {...register("custom_logo")}
                    />
                    {formData.custom_logo && (
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-foreground-secondary">
                          Preview:
                        </span>
                        <img
                          src={formData.custom_logo}
                          alt="Logo preview"
                          className="h-10 max-w-30 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Header Color */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Header Background Color
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={formData.custom_header_color || "#00d991"}
                        onChange={(e) =>
                          setValue("custom_header_color", e.target.value)
                        }
                        className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                      />
                      <Input
                        type="text"
                        placeholder="#00d991"
                        {...register("custom_header_color")}
                        maxLength={100}
                      />
                    </div>
                  </div>

                  {/* Preview Banner */}
                  {(formData.company_name ||
                    formData.custom_logo ||
                    formData.custom_header_color) && (
                    <div
                      className="rounded-lg p-4 mt-2"
                      style={{
                        backgroundColor:
                          formData.custom_header_color || "#00d991",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        {formData.custom_logo && (
                          <img
                            src={formData.custom_logo}
                            alt="Logo"
                            className="h-10 max-w-25 object-contain"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        )}
                        <div>
                          {formData.company_name && (
                            <p className="font-bold text-foreground text-sm">
                              {formData.company_name}
                            </p>
                          )}
                          {formData.company_description && (
                            <p className="text-xs text-foreground">
                              {formData.company_description}
                            </p>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-foreground mt-2 opacity-70">
                        ↑ Header preview
                      </p>
                    </div>
                  )}
                </div>
              )}
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
