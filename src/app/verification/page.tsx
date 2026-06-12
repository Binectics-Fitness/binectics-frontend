"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BinecticsLockup } from "@/components/BinecticsLogo";
import { useVerification } from "@/hooks/useVerification";
import {
  verificationOtpSchema,
  type VerificationOtpFormData,
} from "@/lib/schemas/contact";

function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerificationOtpFormData>({
    resolver: zodResolver(verificationOtpSchema),
    defaultValues: { otp: "" },
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { verifyOtp, resendOtp, isVerifying, isResending } = useVerification();

  const handleResend = async () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setError("");
    setSuccess("");

    const sent = await resendOtp(email);

    if (sent) {
      setSuccess("Verification code has been resent to your email");
      setTimeout(() => setSuccess(""), 5000);
    } else {
      setError("Failed to resend code");
    }
  };

  const onSubmit = async (data: VerificationOtpFormData) => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      return;
    }

    const result = await verifyOtp(email, data.otp);

    if (result.success) {
      setSuccess("Account verified successfully. Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError("Verification failed");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <header className="flex items-center h-14 px-6" style={{ borderBottom: "1px solid var(--border)" }}>
        <Link href="/"><BinecticsLockup /></Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="eyebrow mb-2">Verification</div>
            <h1 className="text-[28px] font-medium leading-tight" style={{ letterSpacing: "-0.025em", color: "var(--ink)" }}>
              Verify your account
            </h1>
            <p className="text-[14.5px] mt-2" style={{ color: "var(--fg-3)" }}>
              We sent a verification code to{" "}
              <span className="font-medium" style={{ color: "var(--ink)" }}>
                {email || "your email"}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="font-mono text-[10.5px] uppercase tracking-[0.06em]" style={{ color: "var(--fg-3)" }}>
                Verification code <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="otp"
                type="text"
                {...register("otp")}
                placeholder="000000"
                maxLength={6}
                className="h-8.5 w-full rounded-(--r-2) px-3 text-[16px] text-center tracking-widest"
                style={{
                  background: "var(--bg)",
                  border: errors.otp ? "1px solid var(--danger)" : "1px solid var(--border-2)",
                  color: "var(--ink)",
                  fontFamily: "inherit",
                }}
              />
              {errors.otp && <p className="text-[12px]" style={{ color: "var(--danger)" }}>{errors.otp.message}</p>}
            </div>

            {error && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "oklch(0.95 0.03 25)", border: "1px solid oklch(0.85 0.06 25)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--danger)" }}>
                  <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
                </svg>
                <p className="text-[13px]" style={{ color: "var(--danger)" }}>{error}</p>
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-(--r-2)" style={{ background: "var(--signal-soft)", border: "1px solid var(--signal)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal-ink)" }}>
                  <path d="M5 13l4 4L19 7"/>
                </svg>
                <div>
                  <p className="text-[13px]" style={{ color: "var(--signal-ink)" }}>{success}</p>
                  <Link
                    href="/login"
                    className="text-[12px] font-medium underline mt-1 inline-block"
                    style={{ color: "var(--signal-ink)" }}
                  >
                    Proceed to login
                  </Link>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying}
              className="btn-signal-v2 w-full"
              style={{ height: "38px" }}
            >
              {isVerifying ? "Verifying..." : "Verify email"}
            </button>

            <div className="text-center mt-1">
              <p className="text-[13px]" style={{ color: "var(--fg-3)" }}>
                Didn&apos;t receive the code?{" "}
                <button
                  type="button"
                  className="font-medium"
                  style={{ color: "var(--ink)" }}
                  onClick={handleResend}
                  disabled={isResending || isVerifying}
                >
                  {isResending ? "Resending..." : "Resend"}
                </button>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
          <p className="text-[14px]" style={{ color: "var(--fg-3)" }}>Loading...</p>
        </div>
      }
    >
      <VerificationForm />
    </Suspense>
  );
}
