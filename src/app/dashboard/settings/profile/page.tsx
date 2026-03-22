"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect, useRef } from "react";
import { authService } from "@/lib/api/auth";
import { utilityService } from "@/lib/api/utility";
import type { CountryItem } from "@/lib/api/utility";
import { UserRole } from "@/lib/types";
import TagInput from "@/components/TagInput";
import SearchableSelect from "@/components/SearchableSelect";
import ConfirmationModal from "@/components/ConfirmationModal";

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
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingProfileImage, setIsUploadingProfileImage] = useState(false);
  const [isDeletingProfileImage, setIsDeletingProfileImage] = useState(false);
  const [isDeleteProfileImageModalOpen, setIsDeleteProfileImageModalOpen] =
    useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null,
  );
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);
  const profileImagePreviewRef = useRef<string | null>(null);

  const displayedProfileImage = profileImagePreview ?? user?.profile_picture;

  const revokeProfilePreview = () => {
    if (profileImagePreviewRef.current) {
      URL.revokeObjectURL(profileImagePreviewRef.current);
      profileImagePreviewRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;
    async function loadCountries() {
      try {
        const res = await utilityService.getCountries();
        if (mounted && res.success && res.data) setCountries(res.data);
      } catch {
        // non-critical
      } finally {
        if (mounted) setCountriesLoading(false);
      }
    }
    loadCountries();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      revokeProfilePreview();
    };
  }, []);

  const [formData, setFormData] = useState({
    // Basic Info
    firstName: user?.first_name || "",
    lastName: user?.last_name || "",
    email: user?.email || "",
    phone: user?.phone_number || "",
    country: user?.country_code || "",

    // Gym Owner specific
    businessName: "",
    businessRegistration: "",
    gymName: "",
    gymAddress: "",
    gymCity: "",
    gymDescription: "",
    facilities: [] as string[],

    // Trainer/Dietitian specific
    bio: "",
    specialties: [] as string[],
    certifications: [] as string[],
    experience: "",

    // User specific
    fitnessGoals: (user?.fitness_goals || []) as string[],
    preferences: (user?.preferred_activities || []) as string[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage("");

    try {
      const payload: Record<string, unknown> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phone,
        country_code: formData.country,
        fitness_goals: formData.fitnessGoals,
        preferred_activities: formData.preferences,
      };

      if (formData.businessName) payload.company_name = formData.businessName;
      if (formData.bio) payload.bio = formData.bio;

      const res = await authService.updateProfile(payload);

      if (res.success && res.data) {
        updateUser(res.data);
        setSuccessMessage("Profile saved successfully!");
        setErrorMessage("");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrorMessage(res.message || "Failed to save profile");
        setSuccessMessage("");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      console.error("Save error:", error);
      setErrorMessage("An error occurred while saving");
      setSuccessMessage("");
      setTimeout(() => setErrorMessage(""), 3000);
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
      setErrorMessage(
        "Unsupported image format. Please upload PNG, JPEG, WEBP, or GIF.",
      );
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
      setErrorMessage("Image is too large. Maximum allowed size is 5MB.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");
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
        setSuccessMessage("Profile image updated successfully.");
      } else {
        setErrorMessage(res.message || "Failed to upload profile image");
      }
    } catch (error) {
      console.error("Profile image upload error:", error);
      setErrorMessage("An error occurred while uploading the profile image");
    } finally {
      revokeProfilePreview();
      setProfileImagePreview(null);
      setIsUploadingProfileImage(false);
      event.target.value = "";
    }
  };

  const handleProfileImageDelete = async () => {
    if (!user?.profile_picture) return;

    setErrorMessage("");
    setSuccessMessage("");
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
        setSuccessMessage("Profile image removed successfully.");
      } else {
        setErrorMessage(res.message || "Failed to remove profile image");
      }
    } catch (error) {
      console.error("Profile image delete error:", error);
      setErrorMessage("An error occurred while removing the profile image");
    } finally {
      setIsDeletingProfileImage(false);
    }
  };

  if (!user) return null;

  const renderGymOwnerFields = () => (
    <>
      <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
          Business Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Business Name
            </label>
            <input
              type="text"
              name="businessName"
              value={formData.businessName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
              placeholder="Your business name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Business Registration Number
            </label>
            <input
              type="text"
              name="businessRegistration"
              value={formData.businessRegistration}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
              placeholder="Registration number"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
          Gym Details
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Gym Name
            </label>
            <input
              type="text"
              name="gymName"
              value={formData.gymName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
              placeholder="Enter gym name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Description
            </label>
            <textarea
              name="gymDescription"
              value={formData.gymDescription}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
              placeholder="Tell members about your gym..."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                Address
              </label>
              <input
                type="text"
                name="gymAddress"
                value={formData.gymAddress}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                placeholder="Street address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-2">
                City
              </label>
              <input
                type="text"
                name="gymCity"
                value={formData.gymCity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                placeholder="City"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  const renderTrainerFields = () => (
    <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
        Professional Information
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Professional Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
            placeholder="Tell clients about your experience and approach..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Specialties (comma-separated)
          </label>
          <input
            type="text"
            name="specialties"
            onChange={(e) => {
              const specialties = e.target.value
                .split(",")
                .map((s) => s.trim());
              setFormData({ ...formData, specialties });
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
            placeholder="e.g., Strength Training, Weight Loss, Sports Performance"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Certifications (comma-separated)
          </label>
          <input
            type="text"
            name="certifications"
            onChange={(e) => {
              const certifications = e.target.value
                .split(",")
                .map((s) => s.trim());
              setFormData({ ...formData, certifications });
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
            placeholder="e.g., NASM-CPT, ACE, CSCS"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Years of Experience
          </label>
          <input
            type="text"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-yellow-500"
            placeholder="e.g., 5 years"
          />
        </div>
      </div>
    </div>
  );

  const renderDietitianFields = () => (
    <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
        Professional Information
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Professional Bio
          </label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
            placeholder="Tell clients about your approach to nutrition and wellness..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Specialties (comma-separated)
          </label>
          <input
            type="text"
            name="specialties"
            onChange={(e) => {
              const specialties = e.target.value
                .split(",")
                .map((s) => s.trim());
              setFormData({ ...formData, specialties });
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
            placeholder="e.g., Weight Management, Sports Nutrition, Clinical Nutrition"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Certifications & Licenses (comma-separated)
          </label>
          <input
            type="text"
            name="certifications"
            onChange={(e) => {
              const certifications = e.target.value
                .split(",")
                .map((s) => s.trim());
              setFormData({ ...formData, certifications });
            }}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
            placeholder="e.g., RD, RDN, LD, CDN"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Years of Experience
          </label>
          <input
            type="text"
            name="experience"
            value={formData.experience}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-purple-500"
            placeholder="e.g., 7 years"
          />
        </div>
      </div>
    </div>
  );

  const renderUserFields = () => (
    <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
      <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
        Fitness Goals & Preferences
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Fitness Goals
          </label>
          <TagInput
            name="fitnessGoals"
            value={formData.fitnessGoals}
            onChange={(goals) =>
              setFormData({ ...formData, fitnessGoals: goals })
            }
            suggestions={FITNESS_GOAL_SUGGESTIONS}
            placeholder="Type to search or add a goal…"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground/70 mb-2">
            Preferred Activities
          </label>
          <TagInput
            name="preferences"
            value={formData.preferences}
            onChange={(prefs) =>
              setFormData({ ...formData, preferences: prefs })
            }
            suggestions={ACTIVITY_SUGGESTIONS}
            placeholder="Type to search or add an activity…"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 rounded-lg border-2 border-green-200 bg-green-50 p-4 text-green-800">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mb-6 rounded-lg border-2 border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">{errorMessage}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
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
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-50 text-2xl font-black text-primary-700">
                {`${user.first_name?.[0] || ""}${user.last_name?.[0] || ""}`.toUpperCase() ||
                  "U"}
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-foreground sm:text-xl">
                Profile Image
              </h3>
              <p className="text-sm text-foreground-secondary">
                Upload a clear photo for your dashboard and marketplace
                presence.
              </p>
              {profileImagePreview && (
                <p className="mt-1 text-xs text-primary-600">
                  Previewing your new image while upload completes.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary-500 disabled:opacity-50">
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

      <div className="mb-6 rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
          Basic Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              First Name
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-foreground/50 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="+1 (555) 000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Country
            </label>
            <SearchableSelect
              name="country"
              value={formData.country}
              onChange={(val) => setFormData({ ...formData, country: val })}
              options={countries.map((c) => ({ label: c.name, value: c.code }))}
              placeholder="Select a country"
              loading={countriesLoading}
            />
          </div>
        </div>
      </div>

      {/* Role-specific fields */}
      {user.role === UserRole.GYM_OWNER && renderGymOwnerFields()}
      {user.role === UserRole.TRAINER && renderTrainerFields()}
      {user.role === UserRole.DIETITIAN && renderDietitianFields()}
      {user.role === UserRole.USER && renderUserFields()}

      {/* Save Button */}
      <div className="flex justify-stretch sm:justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full rounded-lg bg-primary-500 px-8 py-3 font-semibold text-foreground transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
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
