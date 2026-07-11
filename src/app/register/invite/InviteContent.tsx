"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BinecticsMark } from "@/components/BinecticsLogo";
import { useAuth } from "@/contexts/AuthContext";
import { useClientInviteAccept } from "@/hooks/useProgress";

export default function InviteContent() {
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { status: acceptStatus, error: acceptError, acceptInvite } = useClientInviteAccept();

  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<
    "loading" | "accepted" | "error" | "needs-signup"
  >("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      setStatus("error");
      setErrorMsg("Invalid or missing invitation token.");
      return;
    }

    if (user) {
      acceptInvite(token);
    } else {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("binectics_invite_token", token);
      }
      setStatus("needs-signup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  useEffect(() => {
    if (acceptStatus === "success") {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("binectics_invite_token");
      }
      setStatus("accepted");
    }
    if (acceptStatus === "error") {
      setStatus("error");
      setErrorMsg(
        acceptError ||
          "Could not accept this invitation. It may have expired or already been used.",
      );
    }
  }, [acceptStatus, acceptError]);

  /* ── Loading ───────────────────────────────────────── */

  if (authLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center animate-pulse" style={{ background: "var(--signal-soft)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="animate-spin" style={{ color: "var(--signal-ink)" }}>
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div className="eyebrow mb-2">Invitation</div>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            Accepting invitation
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
            Please wait while we process your invitation.
          </p>
        </div>
      </div>
    );
  }

  /* ── Accepted ──────────────────────────────────────── */

  if (status === "accepted") {
    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7"/></svg>
          </div>
          <div className="eyebrow mb-2">Invitation</div>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            You&apos;re connected
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
            Your professional can now track your progress. Head to your dashboard to start logging your weight, meals, and activities.
          </p>
          <Link
            href="/dashboard/progress"
            className="btn-signal-v2 inline-flex items-center justify-center mt-8"
            style={{ height: "38px", padding: "0 24px" }}
          >
            Go to my progress
          </Link>
        </div>
      </div>
    );
  }

  /* ── Needs signup ──────────────────────────────────── */

  if (status === "needs-signup") {
    const registerUrl = email
      ? `/onboarding?email=${encodeURIComponent(email)}`
      : "/onboarding";

    return (
      <div className="min-h-screen flex items-center justify-center px-5" style={{ background: "var(--bg)" }}>
        <div className="w-full max-w-sm text-center">
          <div className="mb-5 w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{ background: "var(--signal-soft)", color: "var(--signal-ink)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <div className="eyebrow mb-2">Invitation</div>
          <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
            You&apos;ve been invited
          </h2>
          <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>
            A fitness professional wants to work with you on Binectics. Create an account or log in to accept the invitation.
          </p>
          <div className="flex flex-col gap-3 mt-8">
            <Link
              href={registerUrl}
              className="btn-signal-v2 w-full inline-flex items-center justify-center"
              style={{ height: "38px" }}
            >
              Create account
            </Link>
            <Link
              href="/login" prefetch={false}
              className="btn-ghost-v2 w-full inline-flex items-center justify-center"
              style={{ height: "38px" }}
            >
              I already have an account
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
        <div className="eyebrow mb-2">Invitation</div>
        <h2 className="text-[24px] font-medium" style={{ letterSpacing: "-0.02em", color: "var(--ink)" }}>
          Invitation error
        </h2>
        <p className="text-[14px] mt-3" style={{ color: "var(--fg-3)" }}>{errorMsg}</p>
        <Link
          href="/"
          className="btn-signal-v2 inline-flex items-center justify-center mt-8"
          style={{ height: "38px", padding: "0 24px" }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
