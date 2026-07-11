"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { authService } from "@/lib/api/auth";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormData,
} from "@/lib/schemas/auth";

export default function ForgotPasswordPage() {
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const [apiError, setApiError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setApiError("");
    try {
      const res = await authService.forgotPassword({ email: data.email });
      if (res.success) {
        setSubmitted(true);
      } else {
        setApiError(res.message || "Something went wrong. Please try again.");
      }
    } catch {
      setApiError("Something went wrong. Please try again.");
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
                  Forgot your password?
                </h1>
                <p className="text-[14.5px] mt-2" style={{ color: "var(--fg-3)" }}>
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                {apiError && (
                  <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "oklch(0.95 0.03 25)", border: "1px solid oklch(0.85 0.06 25)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }}>
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                    </svg>
                    <p className="text-[13px]" style={{ color: "var(--danger)" }}>{apiError}</p>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                    Email address <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="h-8.5 w-full rounded-(--r-2) px-3 text-[13.5px]"
                    style={{
                      background: "var(--bg)",
                      border: errors.email ? "1px solid var(--danger)" : "1px solid var(--border-2)",
                      color: "var(--ink)",
                      fontFamily: "inherit",
                    }}
                    {...registerField("email")}
                  />
                  {errors.email && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.email.message}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-signal-v2 w-full"
                  style={{ height: "38px" }}
                >
                  {isSubmitting ? "Sending…" : "Send reset link"}
                </button>

                <Link
                  href="/login" prefetch={false}
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
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 19V10.07a2 2 0 0 1 .89-1.66l7-4.67a2 2 0 0 1 2.22 0l7 4.67A2 2 0 0 1 21 10.07V19"/><path d="M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2"/><path d="m3 10 9 6 9-6"/></svg>
              </div>
              <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
                Check your email
              </h2>
              <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
                We sent a reset link to
              </p>
              <p className="text-[14px] font-medium mt-1" style={{ color: "var(--ink)" }}>
                {getValues("email")}
              </p>
              <p className="text-[13px] mt-6" style={{ color: "var(--fg-3)" }}>
                Didn&apos;t receive it?{" "}
                <button onClick={() => setSubmitted(false)} className="font-medium" style={{ color: "var(--ink)" }}>
                  Try again
                </button>
              </p>
              <Link
                href="/login" prefetch={false}
                className="inline-flex items-center gap-2 text-[13px] font-medium mt-6"
                style={{ color: "var(--fg-2)" }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m15 19-7-7 7-7"/></svg>
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
