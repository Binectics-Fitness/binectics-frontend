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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl font-black text-foreground">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-foreground/60">
          You&rsquo;re signed in with a temporary password. Choose a new one
          before continuing to the admin dashboard.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Current password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              {...register("current")}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.current && (
              <p className="mt-1 text-xs text-red-500">
                {errors.current.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              New password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register("new")}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.new && (
              <p className="mt-1 text-xs text-red-500">{errors.new.message}</p>
            )}
            <p className="mt-1 text-xs text-foreground/50">
              At least 8 characters with a mix of upper, lower, number and
              symbol.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-1">
              Confirm new password
            </label>
            <input
              type="password"
              autoComplete="new-password"
              {...register("confirm")}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.confirm && (
              <p className="mt-1 text-xs text-red-500">
                {errors.confirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-primary-500 px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
