"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { InactivityNotification } from "@/components/InactivityNotification";
import { UserRole } from "@/lib/types";
import { adminLoginSchema, type AdminLoginFormData } from "@/lib/schemas/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, user, isLoading: authLoading } = useAuth();
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string>("");

  // Redirect if already logged in as admin
  useEffect(() => {
    if (user && user.role === UserRole.ADMIN) {
      router.push("/admin/dashboard");
    }
  }, [user, router]);

  const onSubmit = async (data: AdminLoginFormData) => {
    setApiError("");
    setIsLoading(true);

    try {
      const result = await login({
        email: data.email,
        password: data.password,
      });

      if (!result.success) {
        setApiError(result.error || "Login failed. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check if logged in user is admin
      // Note: The redirect will be handled by the useEffect above
    } catch (error) {
      setApiError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Inactivity Notification */}
      <InactivityNotification />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-(--r-3) bg-signal-soft text-fg mb-4">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-black text-ink mb-2">
            Admin Login
          </h1>
          <p className="text-fg-2">
            Sign in to access the admin dashboard
          </p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-bg rounded-(--r-3) border border-border p-8"
          style={{ boxShadow: "var(--shadow-2)" }}
        >
          {/* API Error Message */}
          {apiError && (
            <div className="mb-6 p-4 bg-danger-soft border border-danger rounded-(--r-3)">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 shrink-0 text-danger mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-danger font-medium">{apiError}</p>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-fg mb-2"
              >
                Admin Email
                <span className="text-danger ml-1">*</span>
              </label>
              <input
                type="email"
                id="email"
                required
                {...registerField("email")}
                placeholder="admin@binectics.com"
                className={`w-full h-12 border ${
                  errors.email ? "border-danger" : "border-border"
                } rounded-(--r-2) px-4 text-fg placeholder:text-fg-4 focus:outline-none focus:border-signal transition-colors`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-danger">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-fg mb-2"
              >
                Password
                <span className="text-danger ml-1">*</span>
              </label>
              <input
                type="password"
                id="password"
                required
                minLength={8}
                {...registerField("password")}
                placeholder="••••••••"
                className={`w-full h-12 border ${
                  errors.password ? "border-danger" : "border-border"
                } rounded-(--r-2) px-4 text-fg placeholder:text-fg-4 focus:outline-none focus:border-signal transition-colors`}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-danger">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || authLoading}
            className="w-full h-12 bg-signal text-bg font-semibold rounded-(--r-2) hover:bg-signal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isLoading || authLoading ? "Signing in..." : "Sign In as Admin"}
          </button>

          {/* Info */}
          <div className="mt-6 p-4 bg-bg-2 border border-border rounded-(--r-3)">
            <p className="text-xs text-fg-2 mb-2">
              <strong>Admin Access Only</strong>
            </p>
            <p className="text-xs text-fg-2">
              This login is for administrators only. For regular user access,
              please use the{" "}
              <Link
                href="/login" prefetch={false}
                className="text-signal hover:text-signal/80 font-semibold"
              >
                user login page
              </Link>
              .
            </p>
          </div>

          {/* Demo Account Info */}
          <div className="mt-4 p-4 bg-bg-2 border border-border rounded-(--r-3)">
            <p className="text-xs text-fg-2">
              <strong>Demo Account:</strong>
            </p>
            <p className="text-xs text-fg-2 mt-1 font-mono">
              admin@binectics.com / Admin@123456
            </p>
            <p className="text-xs text-fg-2 mt-2">
              Create demo accounts at{" "}
              <Link
                href="/admin/create-super-admin"
                className="text-signal hover:underline"
              >
                /admin/create-super-admin
              </Link>
            </p>
          </div>
        </form>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-fg-2 hover:text-fg"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
