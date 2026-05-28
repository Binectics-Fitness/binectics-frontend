"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import { showAlert } from "@/lib/ui/dialogs";

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<
    "verifying" | "success" | "error" | "expired"
  >("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        if (token === "expired") {
          setStatus("expired");
        } else if (token === "invalid") {
          setStatus("error");
          setErrorMessage("Invalid verification link");
        } else {
          setStatus("success");
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    verifyEmail();
  }, [token]);

  /* ── Verifying ─────────────────────────────────────── */

  if (status === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center animate-pulse" style={{ background: "var(--signal-soft)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: "var(--signal-ink)" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div className="eyebrow mb-2">Email verification</div>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Verifying your email
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  /* ── Success ───────────────────────────────────────── */

  if (status === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
          </div>
          <div className="eyebrow mb-2">Email verification</div>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Email verified
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
            Your email has been successfully verified. You can now access all features of your Binectics account.
          </p>

          <Link
            href="/login"
            className="btn-signal-v2 inline-flex items-center justify-center mt-8"
            style={{ height: "38px", padding: "0 24px" }}
          >
            Sign in to your account
          </Link>

          <div className="mt-8 rounded-(--r-3) p-5 text-left" style={{ border: "1px solid var(--border)", background: "var(--bg)" }}>
            <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] mb-3" style={{ color: "var(--fg-3)" }}>What&apos;s next</p>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal)" }}>
                  <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>Complete your profile with fitness goals and preferences</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal)" }}>
                  <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>Browse gyms near you and start your fitness journey</span>
              </li>
              <li className="flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" style={{ color: "var(--signal)" }}>
                  <circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/>
                </svg>
                <span className="text-[13px]" style={{ color: "var(--fg-2)" }}>Download the mobile app for easy QR check-ins</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ── Expired ───────────────────────────────────────── */

  if (status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "oklch(0.96 0.06 75)", color: "var(--warn)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </div>
          <div className="eyebrow mb-2">Email verification</div>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Link expired
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
            This verification link has expired. Verification links are valid for 24 hours.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={async () => {
                await showAlert(
                  "A new verification email has been sent to your inbox.",
                );
              }}
              className="btn-signal-v2 w-full"
              style={{ height: "38px" }}
            >
              Resend verification email
            </button>
            <Link
              href="/contact"
              className="btn-ghost-v2 w-full inline-flex items-center justify-center"
              style={{ height: "38px" }}
            >
              Contact support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  /* ── Error ─────────────────────────────────────────── */

  return (
    <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-sm text-center">
        <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/>
          </svg>
        </div>
        <div className="eyebrow mb-2">Email verification</div>
        <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
          Verification failed
        </h2>
        <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
          {errorMessage ||
            "We couldn't verify your email address. The link may be invalid or already used."}
        </p>
        <div className="flex flex-col gap-3 mt-8">
          <button
            onClick={async () => {
              await showAlert(
                "A new verification email has been sent to your inbox.",
              );
            }}
            className="btn-signal-v2 w-full"
            style={{ height: "38px" }}
          >
            Send new verification link
          </button>
          <Link
            href="/contact"
            className="btn-ghost-v2 w-full inline-flex items-center justify-center"
            style={{ height: "38px" }}
          >
            Contact support
          </Link>
        </div>
      </div>
    </div>
  );
}
