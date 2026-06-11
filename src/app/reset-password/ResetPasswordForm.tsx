"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/lib/api/auth";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import {
  resetPasswordSchema,
  type ResetPasswordFormData,
} from "@/lib/schemas/auth";

export default function ResetPasswordForm({ token }: { token?: string }) {
  const {
    register: registerField,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError("password", {
        message: "Reset token is missing. Please use the link from your email.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await authService.resetPassword({
        token,
        newPassword: data.password,
      });
      if (res.success) {
        setSubmitted(true);
      } else {
        setError("password", {
          message: res.message || "Reset failed. The link may have expired.",
        });
      }
    } catch {
      setError("password", {
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center h-14 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/"><BinecticsLockup /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          {!submitted ? (
            <>
              <div className="mb-8">
                <div className="eyebrow mb-2">Password reset</div>
                <h1 className="text-[28px] font-medium leading-tight" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
                  Set new password
                </h1>
                <p className="text-[14.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                  Your new password must be different from previously used passwords.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {errors.password?.message && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "var(--danger-soft)", border: "1px solid var(--danger)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                    </svg>
                    <p className="text-[13px]" style={{ color: "var(--danger)" }}>{errors.password.message}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    New password <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      placeholder="Minimum 12 characters"
                      className="h-8.5 w-full rounded-(--r-2) px-3 pr-14 text-[13.5px]"
                      style={{
                        background: "var(--bg)",
                        border: errors.password ? "1px solid var(--danger)" : "1px solid var(--border-2)",
                        color: "var(--ink)",
                        fontFamily: "inherit",
                      }}
                      {...registerField("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.05em]"
                      style={{ color: "var(--fg-3)" }}
                      aria-label={showNewPassword ? "Hide password" : "Show password"}
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Confirm password <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter your password"
                      className="h-8.5 w-full rounded-(--r-2) px-3 pr-14 text-[13.5px]"
                      style={{
                        background: "var(--bg)",
                        border: errors.confirmPassword ? "1px solid var(--danger)" : "1px solid var(--border-2)",
                        color: "var(--ink)",
                        fontFamily: "inherit",
                      }}
                      {...registerField("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase tracking-[0.05em]"
                      style={{ color: "var(--fg-3)" }}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.confirmPassword.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-signal-v2 w-full"
                  style={{ height: "38px" }}
                >
                  {isSubmitting ? "Resetting..." : "Reset password"}
                </button>

                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 text-[13px] font-medium mt-1"
                  style={{ color: "var(--fg-2)" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 19-7-7 7-7"/></svg>
                  Back to sign in
                </Link>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
                Password reset successful
              </h2>
              <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Link
                href="/login"
                className="btn-signal-v2 inline-flex items-center justify-center mt-8"
                style={{ height: "38px", padding: "0 24px" }}
              >
                Continue to sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
