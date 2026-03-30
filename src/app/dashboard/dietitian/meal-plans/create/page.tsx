"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import DietitianSidebar from "@/components/DietitianSidebar";
import DashboardLoading from "@/components/DashboardLoading";
import { useRoleGuard } from "@/hooks/useRequireAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { progressService } from "@/lib/api/progress";
import { UserRole, DietPlanDeliveryType, MealSlot } from "@/lib/types";
import type { ClientProfile, CreateDietMealRequest } from "@/lib/api/progress";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { dietPlanSchema, type DietPlanFormData } from "@/lib/schemas/progress";
import { tokenStorage } from "@/lib/utils/storage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://binectics-gym-dev-api-dwbaeufeafgqd6db.canadacentral-01.azurewebsites.net/api/v1";

// ─── Helpers ───────────────────────────────────────────────────────

/** Upload FormData with real progress tracking via XMLHttpRequest. */
function uploadWithProgress(
  endpoint: string,
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ success: boolean; message?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE_URL}${endpoint}`);

    const token = tokenStorage.get();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ success: true });
      } else {
        resolve({ success: false, message: `Upload failed (${xhr.status})` });
      }
    });

    xhr.addEventListener("error", () =>
      resolve({ success: false, message: "Network error during upload" }),
    );

    xhr.send(formData);
  });
}

function clientName(profile: ClientProfile): string {
  if (typeof profile.client_id === "object") {
    return `${profile.client_id.first_name} ${profile.client_id.last_name}`;
  }
  return "Client";
}

const MEAL_SLOT_LABELS: Record<MealSlot, string> = {
  [MealSlot.BREAKFAST]: "Breakfast",
  [MealSlot.MORNING_SNACK]: "Morning Snack",
  [MealSlot.LUNCH]: "Lunch",
  [MealSlot.AFTERNOON_SNACK]: "Afternoon Snack",
  [MealSlot.DINNER]: "Dinner",
  [MealSlot.EVENING_SNACK]: "Evening Snack",
};

// ─── Meal Row Editor ──────────────────────────────────────────────

function MealRowEditor({
  index,
  register,
  remove,
  errors,
  totalCount,
}: {
  index: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  remove: (index: number) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors: any;
  totalCount: number;
}) {
  const fieldErrors = errors?.meals?.[index];

  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground">
          Meal {index + 1}
        </h4>
        {totalCount > 1 && (
          <button
            type="button"
            onClick={() => remove(index)}
            className="text-sm text-red-600 hover:text-red-700 font-medium"
          >
            Remove
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Meal Type <span className="text-red-500">*</span>
          </label>
          <select
            {...register(`meals.${index}.meal_type`)}
            className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          >
            <option value="">Select type</option>
            {Object.values(MealSlot).map((slot) => (
              <option key={slot} value={slot}>
                {MEAL_SLOT_LABELS[slot]}
              </option>
            ))}
          </select>
          {fieldErrors?.meal_type && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.meal_type.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register(`meals.${index}.title`)}
            placeholder="e.g. Overnight Oats with Berries"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
          {fieldErrors?.title && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.title.message}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Description
          </label>
          <textarea
            {...register(`meals.${index}.description`)}
            rows={2}
            placeholder="Describe the meal..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Calories
          </label>
          <input
            type="number"
            {...register(`meals.${index}.calories`, { valueAsNumber: true })}
            placeholder="e.g. 380"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground-secondary mb-1">
            Notes
          </label>
          <input
            {...register(`meals.${index}.notes`)}
            placeholder="e.g. Prep the night before"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
          />
        </div>
      </div>

      <input
        type="hidden"
        {...register(`meals.${index}.order`, { valueAsNumber: true })}
      />
    </div>
  );
}

// ─── Form Content (uses useSearchParams) ───────────────────────────

function CreateDietPlanContent() {
  const router = useRouter();

  const { isLoading, isAuthorized } = useRoleGuard(UserRole.DIETITIAN);
  const { currentOrg, isLoading: orgLoading } = useOrganization();

  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Document upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orgId = currentOrg?._id;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DietPlanFormData>({
    resolver: zodResolver(dietPlanSchema),
    defaultValues: {
      title: "",
      description: "",
      delivery_type: DietPlanDeliveryType.PLATFORM,
      meals: [{ meal_type: "", title: "", order: 1 }],
      dietitian_notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "meals",
  });

  const deliveryType = watch("delivery_type");

  // Clear meals when switching to DOCUMENT so hidden entries don't block validation
  useEffect(() => {
    if (deliveryType === DietPlanDeliveryType.DOCUMENT) {
      setValue("meals", []);
    }
  }, [deliveryType, setValue]);

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const res = orgId
        ? await progressService.getOrgClientProfiles(orgId)
        : await progressService.getMyClientProfiles();
      if (res.success && res.data) {
        const active = res.data.filter((p) => p.is_active);
        setProfiles(active);
      }
    } catch {
      setError("Failed to load clients");
    }
    setLoadingProfiles(false);
  }, [orgId]);

  useEffect(() => {
    if (!isAuthorized || orgLoading) return;
    loadProfiles();
  }, [isAuthorized, orgLoading, loadProfiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only PDF and DOCX files are allowed");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File size must be under 10 MB");
        return;
      }
      setError("");
      setSelectedFile(file);
    }
  };

  const onSubmit = async (data: DietPlanFormData) => {
    setSubmitting(true);
    setError("");
    setUploadProgress(0);
    setIsUploading(data.delivery_type === DietPlanDeliveryType.DOCUMENT);

    try {
      if (data.delivery_type === DietPlanDeliveryType.DOCUMENT) {
        if (!selectedFile) {
          setError("Please select a document to upload");
          setSubmitting(false);
          setIsUploading(false);
          return;
        }
      }

      // ── Standalone (no clients selected) ──────────────────────────
      if (selectedProfileIds.length === 0) {
        if (data.delivery_type === DietPlanDeliveryType.DOCUMENT) {
          const formData = new FormData();
          formData.append("title", data.title.trim());
          formData.append("delivery_type", DietPlanDeliveryType.DOCUMENT);
          if (data.description)
            formData.append("description", data.description);
          if (data.dietitian_notes)
            formData.append("dietitian_notes", data.dietitian_notes);
          formData.append("file", selectedFile!);

          const endpoint = orgId
            ? `/progress/organizations/${orgId}/diet-plans`
            : `/progress/diet-plans`;

          const res = await uploadWithProgress(endpoint, formData, (percent) =>
            setUploadProgress(percent),
          );

          if (!res.success) {
            setError(res.message || "Failed to upload diet plan");
            setSubmitting(false);
            setIsUploading(false);
            return;
          }
        } else {
          const meals: CreateDietMealRequest[] = (data.meals || [])
            .filter((m) => m.title.trim() && m.meal_type)
            .map((m, idx) => ({
              meal_type: m.meal_type as MealSlot,
              title: m.title.trim(),
              description: m.description || undefined,
              foods: undefined,
              calories: m.calories || undefined,
              notes: m.notes || undefined,
              order: idx + 1,
            }));

          const payload = {
            title: data.title.trim(),
            description: data.description || undefined,
            delivery_type: DietPlanDeliveryType.PLATFORM,
            meals: meals.length > 0 ? meals : undefined,
            dietitian_notes: data.dietitian_notes || undefined,
          };

          const res = orgId
            ? await progressService.createStandaloneDietPlanInOrg(
                orgId,
                payload,
              )
            : await progressService.createStandaloneDietPlan(payload);

          if (!res.success) {
            setError("Failed to create diet plan");
            setSubmitting(false);
            setIsUploading(false);
            return;
          }
        }

        router.push("/dashboard/dietitian/meal-plans");
        return;
      }

      // ── Assigned to client(s) ─────────────────────────────────────

      const failedClients: string[] = [];

      for (let i = 0; i < selectedProfileIds.length; i++) {
        const profileId = selectedProfileIds[i];
        try {
          if (data.delivery_type === DietPlanDeliveryType.DOCUMENT) {
            const formData = new FormData();
            formData.append("title", data.title.trim());
            formData.append("delivery_type", DietPlanDeliveryType.DOCUMENT);
            if (data.description)
              formData.append("description", data.description);
            if (data.dietitian_notes)
              formData.append("dietitian_notes", data.dietitian_notes);
            formData.append("file", selectedFile!);

            const endpoint = orgId
              ? `/progress/organizations/${orgId}/clients/${profileId}/diet-plans`
              : `/progress/clients/${profileId}/diet-plans`;

            const res = await uploadWithProgress(
              endpoint,
              formData,
              (percent) => {
                // Scale progress across multiple clients
                const clientBase = (i / selectedProfileIds.length) * 100;
                const clientShare = 100 / selectedProfileIds.length;
                setUploadProgress(
                  Math.round(clientBase + (percent * clientShare) / 100),
                );
              },
            );

            if (!res.success) {
              failedClients.push(profileId);
            }
          } else {
            const meals: CreateDietMealRequest[] = (data.meals || [])
              .filter((m) => m.title.trim() && m.meal_type)
              .map((m, idx) => ({
                meal_type: m.meal_type as MealSlot,
                title: m.title.trim(),
                description: m.description || undefined,
                foods: undefined,
                calories: m.calories || undefined,
                notes: m.notes || undefined,
                order: idx + 1,
              }));

            const payload = {
              title: data.title.trim(),
              description: data.description || undefined,
              delivery_type: DietPlanDeliveryType.PLATFORM,
              meals: meals.length > 0 ? meals : undefined,
              dietitian_notes: data.dietitian_notes || undefined,
            };

            const res = orgId
              ? await progressService.createDietPlanInOrg(
                  orgId,
                  profileId,
                  payload,
                )
              : await progressService.createDietPlan(profileId, payload);

            if (!res.success) {
              failedClients.push(profileId);
            }
          }
        } catch {
          failedClients.push(profileId);
        }
      }

      if (failedClients.length === 0) {
        router.push("/dashboard/dietitian/meal-plans");
      } else if (failedClients.length < selectedProfileIds.length) {
        setError(
          `Created for ${selectedProfileIds.length - failedClients.length} client(s), but failed for ${failedClients.length}. Check the meal plans list.`,
        );
      } else {
        setError("Failed to create diet plan for all selected clients");
      }
    } catch {
      setError("Failed to create diet plan");
    }
    setSubmitting(false);
    setIsUploading(false);
  };

  if (isLoading || orgLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DietitianSidebar />

      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6">
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
            Back
          </button>
          <h1 className="font-display text-2xl font-black text-foreground sm:text-3xl">
            Create Meal Plan
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Build a structured meal plan or upload a document for your clients
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Delivery Type */}
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Delivery Method
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${
                  deliveryType === DietPlanDeliveryType.PLATFORM
                    ? "border-accent-purple-500 bg-accent-purple-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  {...register("delivery_type")}
                  value={DietPlanDeliveryType.PLATFORM}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Platform Meals
                  </p>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    Create structured meals directly in the app
                  </p>
                </div>
              </label>
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${
                  deliveryType === DietPlanDeliveryType.DOCUMENT
                    ? "border-accent-purple-500 bg-accent-purple-50"
                    : "border-neutral-200 hover:border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  {...register("delivery_type")}
                  value={DietPlanDeliveryType.DOCUMENT}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Upload Document
                  </p>
                  <p className="text-xs text-foreground-secondary mt-0.5">
                    Upload a PDF or DOCX meal plan document
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Plan Details */}
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-bold text-foreground mb-4">
              Plan Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("title")}
                  placeholder="e.g. Week 1 — Calorie Deficit Plan"
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  placeholder="Describe the diet plan..."
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground-secondary mb-1">
                  Dietitian Notes
                </label>
                <textarea
                  {...register("dietitian_notes")}
                  rows={2}
                  placeholder="Private notes about this client's dietary needs..."
                  className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-foreground focus:border-accent-purple-500 focus:outline-none focus:ring-1 focus:ring-accent-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Document Upload (when delivery_type === 'document') */}
          {deliveryType === DietPlanDeliveryType.DOCUMENT && (
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-lg font-bold text-foreground mb-4">
                Document Upload
              </h2>
              <div
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors ${
                  isUploading
                    ? "border-accent-purple-300 bg-accent-purple-50 cursor-not-allowed"
                    : "border-neutral-300 hover:border-accent-purple-400 cursor-pointer"
                }`}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <svg
                  className="h-10 w-10 text-neutral-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {selectedFile ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-foreground-secondary mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB — Click to
                      change
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground-secondary">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-foreground-secondary mt-1">
                      PDF or DOCX (max 10 MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Upload progress bar */}
              {isUploading && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground-secondary">
                      Uploading document…
                    </span>
                    <span className="text-sm font-semibold text-accent-purple-600">
                      {uploadProgress}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent-purple-500 transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Meals (when delivery_type === 'platform') */}
          {deliveryType === DietPlanDeliveryType.PLATFORM && (
            <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground">Meals</h2>
                <button
                  type="button"
                  onClick={() =>
                    append({
                      meal_type: "",
                      title: "",
                      order: fields.length + 1,
                    })
                  }
                  className="inline-flex items-center gap-1 text-sm font-semibold text-accent-purple-600 hover:text-accent-purple-700"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Meal
                </button>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <MealRowEditor
                    key={field.id}
                    index={index}
                    register={register}
                    remove={remove}
                    errors={errors}
                    totalCount={fields.length}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Assign to Client(s) */}
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  Assign to Client(s)
                  <span className="ml-2 text-xs font-normal text-foreground-secondary">
                    Optional
                  </span>
                </h2>
                <p className="text-xs text-foreground-secondary mt-0.5">
                  Leave unselected to create a standalone plan you can assign
                  later
                </p>
              </div>
              {selectedProfileIds.length > 0 && (
                <span className="text-sm font-medium text-accent-purple-600">
                  {selectedProfileIds.length} selected
                </span>
              )}
            </div>

            {loadingProfiles ? (
              <DashboardLoading />
            ) : profiles.length === 0 ? (
              <p className="text-sm text-foreground-secondary">
                No clients found.{" "}
                <a
                  href="/dashboard/dietitian/clients"
                  className="text-accent-purple-600 hover:underline"
                >
                  Add a client
                </a>{" "}
                first.
              </p>
            ) : (
              <>
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedProfileIds(
                        selectedProfileIds.length === profiles.length
                          ? []
                          : profiles.map((p) => p._id),
                      )
                    }
                    className="text-sm font-medium text-accent-purple-600 hover:text-accent-purple-700"
                  >
                    {selectedProfileIds.length === profiles.length
                      ? "Deselect All"
                      : "Select All"}
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-neutral-200 divide-y divide-neutral-100">
                  {profiles.map((p) => (
                    <label
                      key={p._id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfileIds.includes(p._id)}
                        onChange={(e) =>
                          setSelectedProfileIds(
                            e.target.checked
                              ? [...selectedProfileIds, p._id]
                              : selectedProfileIds.filter((id) => id !== p._id),
                          )
                        }
                        className="h-4 w-4 rounded border-neutral-300 text-accent-purple-500 focus:ring-accent-purple-500"
                      />
                      <span className="text-sm text-foreground">
                        {clientName(p)}
                      </span>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-lg bg-accent-purple-500 px-6 text-sm font-semibold text-white hover:bg-accent-purple-600 disabled:opacity-50"
            >
              {submitting
                ? isUploading
                  ? `Uploading… ${uploadProgress}%`
                  : "Creating…"
                : "Create Meal Plan"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-neutral-300 bg-white px-6 text-sm font-medium text-foreground hover:bg-neutral-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CreateDietPlanPage() {
  return <CreateDietPlanContent />;
}
