"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Input, PasswordInput } from "@/components";

export default function TrainerRegisterPage() {
  const { register, isLoading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTos: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    if (apiError) setApiError("");
    if (apiErrors.length > 0) setApiErrors([]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Please enter a valid email";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 12)
      newErrors.password = "Password must be at least 12 characters";
    else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/.test(formData.password)
    )
      newErrors.password =
        "Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!formData.acceptTos)
      newErrors.acceptTos = "You must accept the terms of service";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    setApiErrors([]);
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: "personal_trainer" as any,
        accept_tos: formData.acceptTos,
      });
      if (!result.success) {
        if (result.errors && typeof result.errors === "object") {
          const errorMessages: string[] = [];
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (Array.isArray(messages)) errorMessages.push(...messages);
          });
          if (errorMessages.length > 0) setApiErrors(errorMessages);
          else
            setApiError(
              result.error || "Registration failed. Please try again.",
            );
        } else
          setApiError(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
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
              Get started as a trainer
            </h1>
            <p className="mt-2 text-base text-foreground-secondary">
              You'll add your certifications and experience after creating your
              account
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {(apiError || apiErrors.length > 0) && (
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
                <div className="flex gap-3">
                  <svg
                    className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    {apiError && (
                      <p className="text-sm text-red-800">{apiError}</p>
                    )}
                    {apiErrors.length > 0 && (
                      <ul className="text-sm text-red-800 space-y-1">
                        {apiErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
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
                <PasswordInput
                  label="Password"
                  name="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  helperText="Min 12 characters with uppercase, lowercase, number, and special character (!@#$%^&*)"
                />
                <PasswordInput
                  label="Confirm Password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
              </div>
            </div>
            <div className="rounded-xl bg-accent-yellow-50 p-4 border-2 border-accent-yellow-200">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 text-accent-yellow-600 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm font-semibold text-accent-yellow-800 mb-1">
                    Quick signup, complete later
                  </p>
                  <p className="text-sm text-accent-yellow-700">
                    After creating your account, you'll be guided to add your
                    certifications, specialties, bio, and professional details.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="acceptTos"
                  checked={formData.acceptTos}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-accent-yellow-500 focus:ring-accent-yellow-500"
                />
                <span className="text-sm text-foreground-secondary">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-accent-blue-500 hover:text-accent-blue-600 font-medium"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-accent-blue-500 hover:text-accent-blue-600 font-medium"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.acceptTos && (
                <p className="text-sm text-red-600 ml-7">{errors.acceptTos}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full h-12 rounded-lg bg-accent-yellow-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-accent-yellow-600 active:bg-accent-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || authLoading
                ? "Creating Account..."
                : "Create Account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
