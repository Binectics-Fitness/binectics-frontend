"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/schemas/settings";
import { authService } from "@/lib/api/auth";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/Toast";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", new: "", confirm: "" },
  });

  async function onSubmit(values: ChangePasswordFormData) {
    setIsSubmitting(true);
    const res = await authService.changePassword({
      current_password: values.current,
      new_password: values.new,
    });
    setIsSubmitting(false);

    if (!res.success) {
      toast.error(res.message || "Could not change password");
      return;
    }

    // Mirror the cleared flag locally so AdminClientShell stops redirecting.
    if (user) {
      updateUser({ ...user, must_change_password: false });
    }
    toast.success("Password updated. Welcome to the admin dashboard.");
    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-bg rounded-(--r-3) border border-border p-6 sm:p-8"
        style={{ boxShadow: "var(--shadow-2)" }}
      >
        <h1 className="text-2xl font-black text-ink">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-fg-2">
          You&rsquo;re signed in with a temporary password. Choose a new one
          before continuing to the admin dashboard.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-1">
              Current password
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              {...register("current")}
              className="w-full px-3 py-2 border border-border rounded-(--r-2) focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            />
            {errors.current && (
              <p className="mt-1 text-xs text-danger">
                {errors.current.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-fg-2 mb-1">
              New password
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              {...register("new")}
              className="w-full px-3 py-2 border border-border rounded-(--r-2) focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            />
            {errors.new && (
              <p className="mt-1 text-xs text-danger">{errors.new.message}</p>
            )}
            <p className="mt-1 text-xs text-fg-3">
              At least 8 characters with a mix of upper, lower, number and
              symbol.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-fg-2 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              {...register("confirm")}
              className="w-full px-3 py-2 border border-border rounded-(--r-2) focus:outline-none focus-visible:ring-2 focus-visible:ring-signal"
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-danger">
                {errors.confirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-(--r-2) bg-signal px-4 py-2.5 text-sm font-semibold text-bg hover:bg-signal/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
