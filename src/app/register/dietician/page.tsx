"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components";

export default function DieticianRegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    // TODO: API call to register dietician
    // The API will set isOnboardingComplete to false
    console.log("Dietician registration:", formData);
    // Redirect to dashboard where onboarding prompt will appear
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Main Content */}
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-purple-100 px-4 py-2">
              <svg
                className="h-5 w-5 text-accent-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13c-2.21 0-4-1.79-4-4m4 4c2.21 0 4-1.79 4-4m-9 13h10M3 21h18"
                />
              </svg>
              <span className="text-sm font-semibold text-accent-purple-600">
                Dietician
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Get started as a dietician
            </h1>
            <p className="mt-2 text-base text-foreground-secondary">
              You'll add your credentials and specialties after creating your account
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
              <div className="space-y-5">
                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    name="firstName"
                    placeholder="Jane"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    error={errors.firstName}
                  />
                  <Input
                    label="Last Name"
                    name="lastName"
                    placeholder="Smith"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    error={errors.lastName}
                  />
                </div>

                {/* Email */}
                <Input
                  label="Email Address"
                  type="email"
                  name="email"
                  placeholder="jane@dietician.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />

                {/* Password */}
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

                {/* Confirm Password */}
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

            {/* Info Box */}
            <div className="rounded-xl bg-accent-purple-50 p-4 border-2 border-accent-purple-200">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 text-accent-purple-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-accent-purple-800 mb-1">
                    Quick signup, complete later
                  </p>
                  <p className="text-sm text-accent-purple-700">
                    After creating your account, you'll be guided to add your credentials, license, specialties, and professional details.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full h-12 rounded-lg bg-accent-purple-500 text-base font-semibold text-white shadow-button transition-colors duration-200 hover:bg-accent-purple-600 active:bg-accent-purple-700"
            >
              Create Account
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
