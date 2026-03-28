"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Input, PasswordInput } from "@/components";
import { AccountType } from "@/lib/types";
import { registerSchema, type RegisterFormData } from "@/lib/schemas/auth";
import { mapApiErrors } from "@/lib/utils/form-errors";

const REGISTER_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "password",
  "confirmPassword",
] as const;

export default function UserRegisterPage() {
  const { register: authRegister, isLoading: authLoading } = useAuth();

  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptTos: false,
    },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [apiErrors, setApiErrors] = useState<string[]>([]);

  const onSubmit = async (data: RegisterFormData) => {
    setApiErrors([]);
    setIsLoading(true);

    try {
      const result = await authRegister({
        email: data.email,
        password: data.password,
        first_name: data.firstName,
        last_name: data.lastName,
        role: AccountType.FITNESS_MEMBER,
        accept_tos: data.acceptTos,
      });

      if (!result.success) {
        const unmapped = mapApiErrors(result, setError, REGISTER_FIELDS);
        if (unmapped.length > 0) {
          setApiErrors(unmapped);
        }
      }
      // Success redirect is handled by AuthContext
    } catch (error) {
      setApiErrors(["An unexpected error occurred. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Main Content */}
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
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
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent-blue-100 px-4 py-2">
              <svg
                className="h-5 w-5 text-accent-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-sm font-semibold text-accent-blue-600">
                Fitness Enthusiast
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-2 text-base text-foreground-secondary">
              Start your fitness journey with Binectics
            </p>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Error Messages */}
            {apiErrors.length > 0 && (
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
                    <ul className="text-sm text-red-800 space-y-1">
                      {apiErrors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
              <div className="space-y-5">
                {/* Name Fields */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    placeholder="John"
                    error={errors.firstName?.message}
                    {...registerField("firstName")}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Doe"
                    error={errors.lastName?.message}
                    {...registerField("lastName")}
                  />
                </div>

                {/* Email */}
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...registerField("email")}
                />

                {/* Password */}
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  helperText="Min 12 characters with uppercase, lowercase, number, and special character (!@#$%^&*)"
                  {...registerField("password")}
                />

                {/* Confirm Password */}
                <PasswordInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...registerField("confirmPassword")}
                />
              </div>
            </div>

            {/* Terms and Conditions Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-neutral-300 text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  {...registerField("acceptTos")}
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
                <p className="text-sm text-red-600 ml-7">{errors.acceptTos.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full h-12 rounded-lg bg-primary-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || authLoading
                ? "Creating Account..."
                : "Create Account"}
            </button>

            {/* Login Link */}
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

            {/* Login Link */}
            <p className="text-center text-sm text-foreground-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-accent-blue-500 hover:text-accent-blue-600"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
