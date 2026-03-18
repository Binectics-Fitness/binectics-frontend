"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { authService } from "@/lib/api/auth";
import { utilityService } from "@/lib/api/utility";
import type { CountryItem } from "@/lib/api/utility";
import TagInput from "@/components/TagInput";
import SearchableSelect from "@/components/SearchableSelect";

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

export default function ProfileSettingsPage() {
  const { user, updateUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [countriesLoading, setCountriesLoading] = useState(true);

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

    // Trainer/Dietician specific
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
      if (formData.bio) payload.other_name = formData.bio;

      const res = await authService.updateProfile(payload);

      if (res.success && res.data) {
        updateUser(res.data);
        setSuccessMessage("Profile saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setSuccessMessage(res.message || "Failed to save profile");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error("Save error:", error);
      setSuccessMessage("An error occurred while saving");
      setTimeout(() => setSuccessMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  const renderGymOwnerFields = () => (
    <>
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">
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

      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">Gym Details</h3>
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
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      <h3 className="text-xl font-bold text-foreground mb-4">
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

  const renderDieticianFields = () => (
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      <h3 className="text-xl font-bold text-foreground mb-4">
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
    <div className="bg-white rounded-xl shadow-card p-6 mb-6">
      <h3 className="text-xl font-bold text-foreground mb-4">
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
        <div className="mb-6 bg-primary-50 border-2 border-primary-500 text-primary-900 rounded-lg p-4">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <h3 className="text-xl font-bold text-foreground mb-4">
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
      {user.role === "GYM_OWNER" && renderGymOwnerFields()}
      {user.role === "TRAINER" && renderTrainerFields()}
      {user.role === "DIETICIAN" && renderDieticianFields()}
      {user.role === "USER" && renderUserFields()}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-8 py-3 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  );
}
