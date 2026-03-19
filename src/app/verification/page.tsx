"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Input, Button } from "@/components";
import { useVerification } from "@/hooks/useVerification";

function VerificationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [otp, setOtp] = useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email is required");
      return;
    }

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit code");
      return;
    }

    const result = await verifyOtp(email, otp);

    if (result.success) {
      setSuccess("Account verified successfully! Redirecting to login...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      setError("Verification failed");
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary py-12 sm:py-16">
      <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8">
        <div className="bg-background-primary rounded-xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground-primary">
              Verify your account
            </h1>
            <p className="mt-2 text-sm text-foreground-secondary">
              We sent a verification code to{" "}
              <span className="font-medium text-foreground-primary">
                {email || "your email"}
              </span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="otp"
                className="block text-sm font-medium text-foreground-primary mb-2"
              >
                Verification Code
              </label>
              <Input
                id="otp"
                name="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="000000"
                required
                className="text-center tracking-widest text-lg"
                maxLength={6}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-4 border border-red-200">
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md bg-green-50 p-4 border border-green-200">
                <p className="text-sm text-green-600 font-medium">{success}</p>
                <Link
                  href="/login"
                  className="block mt-2 text-sm text-green-700 underline font-medium"
                >
                  Proceed to Login
                </Link>
              </div>
            )}

            <Button
              type="submit"
              fullWidth
              isLoading={isVerifying}
              variant="primary"
            >
              Verify Email
            </Button>

            <div className="text-center mt-4">
              <p className="text-sm text-foreground-secondary">
                Didn't receive the code?{" "}
                <button
                  type="button"
                  className="text-accent-blue-500 hover:text-accent-blue-600 font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleResend}
                  disabled={isResending || isVerifying}
                >
                  {isResending ? "Resending..." : "Resend"}
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <VerificationForm />
    </Suspense>
  );
}
