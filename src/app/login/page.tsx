"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";
import { Input, PasswordInput } from "@/components";
import { InactivityNotification } from "@/components/InactivityNotification";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading: authLoading, user } = useAuth();

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Admin users should use /admin login
      if (user.role === UserRole.ADMIN) {
        router.push("/admin");
        return;
      }
      // Redirect to role-based dashboard
      router.push(getDashboardRoute(user.role));
    }
  }, [user, router]);

  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  const onSubmit = async (data: LoginFormData) => {
    setApiError("");
    setIsLoading(true);

    try {
      const result = await login({
        email: data.email,
        password: data.password,
        rememberMe,
      });

      if (!result.success) {
        setApiError(result.error || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Redirect is handled by AuthContext
    } catch (error) {
      setApiError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary">
      {/* Inactivity Notification */}
      <InactivityNotification />

      {/* Main Content */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center py-12 sm:py-16">
        <div className="mx-auto w-full max-w-md px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-black text-foreground sm:text-4xl">
              Welcome back
            </h1>
            <p className="mt-2 text-base text-foreground-secondary">
              Sign in to your Binectics account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* API Error Message */}
            {apiError && (
              <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4">
                <div className="flex gap-3">
                  <svg
                    className="h-5 w-5 shrink-0 text-red-600 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-sm text-red-800">{apiError}</p>
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-background p-6 sm:p-8 shadow-card">
              <div className="space-y-5">
                {/* Email */}
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  error={errors.email?.message}
                  {...registerField("email")}
                />

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-semibold text-foreground"
                    >
                      Password
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm font-medium text-accent-blue-500 hover:text-accent-blue-600"
                    >
                      Forgot?
                    </Link>
                  </div>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    error={errors.password?.message}
                    className="h-12"
                    {...registerField("password")}
                  />
                </div>

                {/* Remember Me */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-accent-blue-500 focus:ring-accent-blue-500"
                  />
                  <label
                    htmlFor="rememberMe"
                    className="ml-2 text-sm text-foreground"
                  >
                    Remember me for 30 days
                  </label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="w-full h-12 rounded-lg bg-primary-500 text-base font-semibold text-foreground shadow-button transition-colors duration-200 hover:bg-primary-600 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading || authLoading ? "Signing in..." : "Sign In"}
            </button>

            {/* Sign Up Link */}
            <p className="text-center text-sm text-foreground-secondary">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="font-semibold text-accent-blue-500 hover:text-accent-blue-600"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
