"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/lib/api/auth";
import { teamsService } from "@/lib/api/teams";
import { useCountries, usePlatformConfig } from "@/lib/queries/utility";
import { UserRole } from "@/lib/types";
import TagInput from "@/components/TagInput";
import SearchableSelect from "@/components/SearchableSelect";
import ConfirmationModal from "@/components/ConfirmationModal";
import { toast } from "@/components/Toast";
import {
  profileSettingsSchema,
  type ProfileSettingsFormData,
} from "@/lib/schemas/settings";

const FITNESS_GOAL_SUGGESTIONS = [
  "Weight Loss",
  "Build Muscle",
  "Improve Flexibility",
  "Increase Endurance",
  "Improve Cardio",
  "Tone Body",
  "Gain Strength",
  "Lose Body Fat",
  "Improve Posture",
  "Stress Relief",
  "Improve Balance",
  "Rehabilitation",
  "Marathon Training",
  "Sports Performance",
  "General Fitness",
  "Body Recomposition",
];

const ACTIVITY_SUGGESTIONS = [
  "Yoga",
  "Cycling",
  "Swimming",
  "Weight Training",
  "Running",
  "Walking",
  "HIIT",
  "Pilates",
  "CrossFit",
  "Boxing",
  "Dance",
  "Martial Arts",
  "Rowing",
  "Rock Climbing",
  "Tennis",
  "Basketball",
  "Soccer",
  "Hiking",
  "Stretching",
  "Calisthenics",
];

const MAX_IMAGE_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_UPLOAD_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const { currentOrg, refreshOrganizations } = useOrganization();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isDeletingProfileImage, setIsDeletingProfileImage] = useState(false);
  const [isDeleteProfileImageModalOpen, setIsDeleteProfileImageModalOpen] =
    useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [orgCurrency, setOrgCurrency] = useState<string>("");
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const { data: countries = [], isLoading: countriesLoading } = useCountries();
  const { data: platformConfig } = usePlatformConfig();
  const profileImagePreviewRef = useRef<string | null>(null);

  useEffect(() => {
    if (currentOrg) {
      setOrgCurrency(currentOrg.currency || "USD");
    }
  }, [currentOrg]);

  const handleSaveCurrency = async () => {
    if (!currentOrg || !orgCurrency) return;
    setIsSavingCurrency(true);
    try {
      const res = await teamsService.updateOrganization(currentOrg._id, {
        currency: orgCurrency,
      });
      if (res.success) {
        toast.success("Default currency updated.");
        await refreshOrganizations();
      } else {
        toast.error(res.message || "Failed to update currency");
      }
    } catch {
      toast.error("An error occurred while updating currency");
    } finally {
      setIsSavingCurrency(false);
    }
  };

  const displayedProfileImage = profileImagePreview ?? user?.profile_picture;

  const revokeProfilePreview = () => {
    if (profileImagePreviewRef.current) {
      URL.revokeObjectURL(profileImagePreviewRef.current);
      profileImagePreviewRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      revokeProfilePreview();
    };
  }, []);

  const {
    register: registerField,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileSettingsFormData>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      email: user?.email || "",
      phone: user?.phone_number || "",
      country: user?.country_code || "",
      fitnessGoals: (user?.fitness_goals || []) as string[],
      preferences: (user?.preferred_activities || []) as string[],
    },
  });

  const formData = watch();

  const onSave = async (data: ProfileSettingsFormData) => {
    setIsSaving(true);

    try {
      const payload: Record<string, unknown> = {
        first_name: data.firstName,
        last_name: data.lastName,
        phone_number: data.phone,
        country_code: data.country,
        fitness_goals: data.fitnessGoals,
        preferred_activities: data.preferences,
      };

      const res = await authService.updateProfile(payload);

      if (res.success && res.data) {
        updateUser(res.data);
        toast.success("Profile saved successfully!");
        router.push("/dashboard");
      } else {
        toast.error(res.message || "Failed to save profile");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_UPLOAD_TYPES.has(file.type)) {
      toast.error(
        "Unsupported image format. Please upload PNG, JPEG, WEBP, or GIF.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
      toast.error("Image is too large. Maximum allowed size is 5MB.");
      event.target.value = "";
      return;
    }

    setIsUploadingProfileImage(true);

    revokeProfilePreview();
    const previewUrl = URL.createObjectURL(file);
    profileImagePreviewRef.current = previewUrl;
    setProfileImagePreview(previewUrl);

    try {
      const res = await authService.uploadProfilePicture(file);

      if (res.success && res.data) {
        updateUser({
          ...user,
          profile_picture: res.data.profile_picture || undefined,
        });
        toast.success("Profile image updated successfully.");
      } else {
        toast.error(res.message || "Failed to upload profile image");
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      toast.error("An error occurred while uploading the profile image");
    } finally {
      revokeProfilePreview();
      setProfileImagePreview(null);
      setIsUploadingProfileImage(false);
      event.target.value = "";
    }
  };

  const handleProfileImageDelete = async () => {
    if (!user?.profile_picture) return;

    setIsDeletingProfileImage(true);

    try {
      const res = await authService.deleteProfilePicture();

      if (res.success) {
        revokeProfilePreview();
        setProfileImagePreview(null);
        updateUser({
          ...user,
          profile_picture: undefined,
        });
        setIsDeleteProfileImageModalOpen(false);
        toast.success("Profile image removed successfully.");
      } else {
        toast.error(res.message || "Failed to remove profile image");
      }
    } catch (error) {
      console.error("Profile image delete error:", error);
      toast.error("An error occurred while removing the profile image");
    } finally {
      setIsDeletingProfileImage(false);
    }
  };

  if (!user) return null;

  const renderUserFields = () => (
    <div className="mb-6 rounded-xl bg-bg p-4 border border-border sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-ink sm:text-xl">
        Fitness Goals & Preferences
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-fg-2 mb-2">
            Fitness Goals
          </label>
          <TagInput
            name="fitnessGoals"
            value={formData.fitnessGoals}
            onChange={(goals) => setValue("fitnessGoals", goals)}
            suggestions={FITNESS_GOAL_SUGGESTIONS}
            placeholder="Type to search or add a goal…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fg-2 mb-2">
            Preferred Activities
          </label>
          <TagInput
            name="preferences"
            value={formData.preferences}
            onChange={(prefs) => setValue("preferences", prefs)}
            suggestions={ACTIVITY_SUGGESTIONS}
            placeholder="Type to search or add an activity…"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>

      {/* Basic Information */}
      <div className="mb-6 rounded-xl bg-bg p-4 border border-border sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {displayedProfileImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={displayedProfileImage}
                alt="Profile"
                className="h-20 w-20 rounded-2xl object-cover border border-neutral-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-signal-soft text-2xl font-black text-signal-ink">
                {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
                  "U"}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-ink sm:text-xl">
                Profile Image
              </h3>
              <p className="text-sm text-fg-2">
                Upload a clear photo for your dashboard and marketplace
                presence.
              </p>
              {profileImagePreview && (
                <p className="mt-1 text-xs text-signal-ink">
                  Previewing your new image while upload completes.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-signal disabled:opacity-50">
              {isUploadingProfileImage ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                onChange={handleProfileImageUpload}
                disabled={isUploadingProfileImage || isDeletingProfileImage}
              />
            </label>
            <button
              type="button"
              onClick={() => setIsDeleteProfileImageModalOpen(true)}
              disabled={
                !user.profile_picture ||
                isUploadingProfileImage ||
                isDeletingProfileImage
              }
              className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletingProfileImage ? "Removing..." : "Remove Image"}
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-bg p-4 border border-border sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-ink sm:text-xl">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              First Name
            </label>
            <input
              type="text"
              {...registerField("firstName")}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              Last Name
            </label>
            <input
              type="text"
              {...registerField("lastName")}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-500">
                {errors.lastName.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg bg-neutral-50 text-fg-3 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              Phone
            </label>
            <input
              type="tel"
              {...registerField("phone")}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-fg-2 mb-2">
              Country
            </label>
            <SearchableSelect
              name="country"
              value={formData.country ?? ""}
              onChange={(val) => setValue("country", val)}
              options={countries.map((c) => ({ label: c.name, value: c.code }))}
              placeholder="Select a country"
              loading={countriesLoading}
            />
          </div>
        </div>
      </div>

      {/* Default Currency (providers only) */}
      {(user.role === UserRole.GYM_OWNER ||
        user.role === UserRole.TRAINER ||
        user.role === UserRole.DIETITIAN) && (
        <div className="mb-6 rounded-xl border-2 border-border bg-bg p-4 border border-border sm:p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-signal-soft text-signal-ink">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 10v2m0-10c-1.11 0-2.08.402-2.599 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-ink sm:text-xl">
                Default Currency
              </h3>
              <p className="text-sm text-fg-2">
                Used as the default for new plans and earnings displays across
                your organization.
              </p>
            </div>
          </div>
          {!currentOrg ? (
            <p className="text-sm text-fg-3">
              Loading your organization...
            </p>
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-fg-2 mb-2">
                  Currency
                </label>
                <SearchableSelect
                  name="orgCurrency"
                  value={orgCurrency}
                  onChange={(val) => setOrgCurrency(val)}
                  options={(platformConfig?.currencies ?? [])
                    .filter((c) => c.is_active)
                    .map((c) => ({
                      label: `${c.code} — ${c.name}`,
                      value: c.code,
                    }))}
                  placeholder="Select currency"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveCurrency}
                disabled={
                  isSavingCurrency ||
                  !orgCurrency ||
                  orgCurrency === (currentOrg.currency || "USD")
                }
                className="h-12 rounded-lg bg-signal-soft0 px-6 text-sm font-semibold text-white transition-colors hover:bg-signal/85 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingCurrency ? "Saving..." : "Save Currency"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Role-specific fields */}
      {user.role === UserRole.USER && renderUserFields()}

      {/* Save Button */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={handleSubmit(onSave)}
          disabled={isSaving}
          className="w-full rounded-lg bg-signal px-8 py-3 font-semibold text-ink transition-colors hover:bg-signal/85 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>

      <ConfirmationModal
        isOpen={isDeleteProfileImageModalOpen}
        title="Remove profile image?"
        description="This removes your current photo from your profile until you upload a new one."
        confirmLabel="Remove Image"
        onConfirm={handleProfileImageDelete}
        onCancel={() => setIsDeleteProfileImageModalOpen(false)}
        isConfirming={isDeletingProfileImage}
      />
    </div>
  );
}
