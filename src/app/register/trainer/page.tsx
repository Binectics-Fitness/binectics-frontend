"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components";

export default function TrainerRegisterPage() {
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Professional Info
    certifications: "",
    specialties: "",
    yearsOfExperience: "",
    bio: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.certifications.trim())
      newErrors.certifications = "Certifications are required";
    if (!formData.specialties.trim())
      newErrors.specialties = "Specialties are required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // TODO: API call to register trainer
    console.log("Trainer registration:", formData);
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Main Content */}
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/register"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground-secondary transition-colors hover:text-accent-blue-500 mb-8"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to role selection
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-yellow-100 px-4 py-2">
              <svg
                className="h-5 w-5 text-accent-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z M16 8a2 2 0 100-4 2 2 0 000 4z"
                />
              </svg>
              <span className="text-sm font-semibold text-accent-yellow-600">
                Personal Trainer
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Become a verified trainer
            </h1>
            <p className="mt-2 text-base text-foreground-secondary">
              Build your brand and grow your client base globally
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
              <h2 className="mb-6 font-display text-xl font-bold text-foreground">
                Personal Information
              </h2>
              <div className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    name="firstName"
                    placeholder="John"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    placeholder="Doe"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="john@trainer.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  placeholder="+1 (555) 000-0000"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    helperText="Minimum 8 characters"
                  />
                  <Input
                    label="Confirm Password"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    error={errors.confirmPassword}
                  />
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
              <h2 className="mb-6 font-display text-xl font-bold text-foreground">
                Professional Information
              </h2>
              <div className="space-y-5">
                <Input
                  label="Certifications"
                  name="certifications"
                  placeholder="e.g., NASM-CPT, ACE, ISSA"
                  required
                  value={formData.certifications}
                  onChange={handleChange}
                  error={errors.certifications}
                  helperText="Comma separated list"
                />

                <Input
                  label="Specialties"
                  name="specialties"
                  placeholder="e.g., Strength Training, HIIT, Weight Loss"
                  required
                  value={formData.specialties}
                  onChange={handleChange}
                  error={errors.specialties}
                  helperText="Comma separated list"
                />

                <Input
                  label="Years of Experience"
                  type="number"
                  name="yearsOfExperience"
                  placeholder="5"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  error={errors.yearsOfExperience}
                />

                <div>
                  <label
                    htmlFor="bio"
                    className="block text-sm font-semibold text-foreground mb-2"
                  >
                    Professional Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell clients about your training philosophy, experience, and what makes you unique..."
                    className="w-full rounded-lg border-2 border-neutral-300 focus:border-accent-yellow-500 bg-background px-4 py-3 text-base text-foreground placeholder:text-foreground-tertiary transition-colors duration-200 focus:outline-none resize-none"
                  />
                  <p className="mt-1 text-sm text-foreground-tertiary">
                    This will appear on your profile
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-12 rounded-lg bg-accent-yellow-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-accent-yellow-600 active:bg-accent-yellow-700"
            >
              Create Trainer Account
            </button>

            {/* Terms */}
            <p className="text-center text-sm text-foreground-tertiary">
              By creating an account, you agree to our{" "}
              <Link
                href="/terms"
                className="text-accent-blue-500 hover:text-accent-blue-600"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-accent-blue-500 hover:text-accent-blue-600"
              >
                Privacy Policy
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
