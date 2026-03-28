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

export default function GymOwnerRegisterPage() {
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
        role: AccountType.GYM_OWNER,
        accept_tos: data.acceptTos,
      });

      if (!result.success) {
        const unmapped = mapApiErrors(result, setError, REGISTER_FIELDS);
        if (unmapped.length > 0) {
          setApiErrors(unmapped);
        }
      }
    } catch (error) {
      setApiErrors(["An unexpected error occurred. Please try again."]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      <main className="py-12 sm:py-16">
        <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8">
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
                  d="M3 10h2m0 0v4m0-4h2m12 0h2m0 0v4m0-4h-2m-8-4v12m0-12h4v12h-4z M7 10h10M7 14h10"
                />
              </svg>
              <span className="text-sm font-semibold text-accent-blue-600">
                Gym Owner
              </span>
            </div>
            <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Get started as a gym owner
            </h1>
            <p className="mt-2 text-base text-foreground-secondary">
              You'll complete your gym details after creating your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@gym.com"
                  error={errors.email?.message}
                  {...registerField("email")}
                />
                <PasswordInput
                  label="Password"
                  placeholder="••••••••"
                  error={errors.password?.message}
                  helperText="Min 12 characters with uppercase, lowercase, number, and special character (!@#$%^&*)"
                  {...registerField("password")}
                />
                <PasswordInput
                  label="Confirm Password"
                  placeholder="••••••••"
                  error={errors.confirmPassword?.message}
                  {...registerField("confirmPassword")}
                />
              </div>
            </div>

            <div className="rounded-xl bg-accent-blue-50 p-4 border-2 border-accent-blue-200">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 text-accent-blue-600 flex-shrink-0 mt-0.5"
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
                  <p className="text-sm font-semibold text-accent-blue-800 mb-1">
                    Quick signup, complete later
                  </p>
                  <p className="text-sm text-accent-blue-700">
                    After creating your account, you'll be guided to add your
                    gym details, location, facilities, and business information.
                  </p>
                </div>
              </div>
            </div>

            {/* Terms of Service Checkbox */}
            <div className="space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
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
                <p className="text-sm text-red-600 ml-7">
                  {errors.acceptTos.message}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full h-12 rounded-lg bg-primary-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
