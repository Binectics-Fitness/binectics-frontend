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
  const { user, logout } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const onDeleteAccount = async () => {
    if (!deletePassword || isDeleting) return;
    setIsDeleting(true);
    setDeleteError("");
    const res = await authService.deleteAccount(deletePassword);
    if (!res.success) {
      setIsDeleting(false);
      setDeleteError(
        res.status === 401
          ? "Password is incorrect."
          : res.message || "Could not delete your account. Please try again.",
      );
      return;
    }
    // The server has already killed the session — clear local state too.
    await logout();
  };

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


      {/* Danger zone — real deletion via POST /auth/account/delete */}
      <div className="rounded-xl bg-bg p-4 sm:p-6" style={{ border: "1px solid oklch(0.88 0.05 25)" }}>
        <h3 className="mb-1 text-lg font-bold sm:text-xl" style={{ color: "var(--danger)" }}>
          Delete account
        </h3>
        <p className="mb-4 max-w-[64ch] text-sm text-fg-2">
          Permanent. Your name and contact details are removed and you are
          signed out everywhere, immediately. Past bookings and payments stay
          in your providers&rsquo; records for tax compliance, without your
          personal details attached. If you own an organization, transfer or
          close it first.
        </p>
        {!deleteOpen ? (
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg px-5 py-2.5 text-sm font-semibold"
            style={{ border: "1px solid oklch(0.88 0.05 25)", color: "var(--danger)", background: "var(--danger-soft)" }}
          >
            Delete my account&hellip;
          </button>
        ) : (
          <div className="max-w-xl space-y-3">
            <label className="block text-sm font-medium text-fg-2">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-200 px-4 py-3 focus:outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: "var(--danger)" }}
            />
            {deleteError && (
              <p className="text-sm" style={{ color: "var(--danger)" }}>{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onDeleteAccount}
                disabled={!deletePassword || isDeleting}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ background: "var(--danger)" }}
              >
                {isDeleting ? "Deleting…" : "Permanently delete my account"}
              </button>
              <button
                type="button"
                onClick={() => { setDeleteOpen(false); setDeletePassword(""); setDeleteError(""); }}
                disabled={isDeleting}
                className="rounded-lg px-5 py-2.5 text-sm font-semibold text-fg-2"
                style={{ border: "1px solid var(--border)" }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
