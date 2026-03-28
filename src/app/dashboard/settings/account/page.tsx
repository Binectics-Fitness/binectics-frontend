"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from "@/lib/schemas/settings";

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current: "", new: "", confirm: "" },
  });

  const onPasswordChange = async () => {
    setIsChangingPassword(true);
    // Simulate password change
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsChangingPassword(false);
    reset();
    await showAlert("Password changed successfully!");
  };

  const handleDeleteAccount = async () => {
    requestConfirmation({
      title: "Delete account?",
      description:
        "This action is permanent. Your account will be removed and you will be signed out immediately.",
      confirmLabel: "Delete Account",
      onConfirm: async () => {
        await logout();
        router.push("/");
      },
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">
          Change Password
        </h3>
        <form onSubmit={handleSubmit(onPasswordChange)} className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Current Password
            </label>
            <input
              type="password"
              {...register("current")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.current && (
              <p className="mt-1 text-sm text-red-500">{errors.current.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              New Password
            </label>
            <input
              type="password"
              {...register("new")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.new && (
              <p className="mt-1 text-sm text-red-500">{errors.new.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("confirm")}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {errors.confirm && (
              <p className="mt-1 text-sm text-red-500">{errors.confirm.message}</p>
            )}
          </div>
          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full rounded-lg bg-primary-500 px-6 py-3 font-semibold text-foreground transition-colors hover:bg-primary-600 sm:w-auto"
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-red-200 bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-red-600 sm:text-xl">
          Danger Zone
        </h3>
        <p className="text-sm text-foreground/70 mb-4">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
        >
          Delete Account
        </button>
      </div>
      {confirmationModal}
    </div>
  );
}
