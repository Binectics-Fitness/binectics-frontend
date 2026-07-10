"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showAlert } from "@/lib/ui/dialogs";
import { authService } from "@/lib/api/auth";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/schemas/settings";

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", new: "", confirm: "" },
  });

  const onPasswordChange = async (values: ChangePasswordFormData) => {
    setIsChangingPassword(true);
    const res = await authService.changePassword({
      current_password: values.current,
      new_password: values.new,
    });
    setIsChangingPassword(false);

    if (!res.success) {
      // Surface a 401 against the current-password field so the user
      // gets actionable feedback instead of a generic error.
      const message = res.message || "Could not change password";
      if (res.status === 401) {
        setError("current", { message: "Current password is incorrect" });
      } else {
        await showAlert(message);
      }
      return;
    }

    reset();
    await showAlert("Password changed successfully!");
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-xl bg-bg p-4 border border-border sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-ink sm:text-xl">
          Change Password
        </h3>
        <form
          onSubmit={handleSubmit(onPasswordChange)}
          className="max-w-xl space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              Current Password
            </label>
            <input
              type="password"
              {...register("current")}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
            />
            {errors.current && (
              <p className="mt-1 text-sm text-red-500">
                {errors.current.message}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              New Password
            </label>
            <input
              type="password"
              {...register("new")}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
            />
            {errors.new && (
              <p className="mt-1 text-sm text-red-500">{errors.new.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg-2 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("confirm")}
              className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-signal"
            />
            {errors.confirm && (
              <p className="mt-1 text-sm text-red-500">
                {errors.confirm.message}
              </p>
            )}
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full rounded-lg bg-signal px-6 py-3 font-semibold text-ink transition-colors hover:bg-signal/85 sm:w-auto"
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

    </div>
  );
}
