"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { progressService } from "@/lib/api/progress";

export default function InviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

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
      // Already logged in — accept invitation immediately
      acceptInvite();
    } else {
      // Not logged in — store token for after registration and show signup prompt
      if (typeof window !== "undefined") {
        sessionStorage.setItem("binectics_invite_token", token);
      }
      setStatus("needs-signup");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  async function acceptInvite() {
    if (!token) return;
    setStatus("loading");
    try {
      const res = await progressService.acceptClientInvitation({ token });
      if (res.success) {
        // Clean up stored token
        if (typeof window !== "undefined") {
          sessionStorage.removeItem("binectics_invite_token");
        }
        setStatus("accepted");
      } else {
        setStatus("error");
        setErrorMsg(
          res.message ||
            "Could not accept this invitation. It may have expired or already been used.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong. Please try again later.");
    }
  }

  // ─── Loading ────────────────────────────────────────────────────

  if (authLoading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="text-center">
          <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-r-transparent" />
          <p className="mt-4 text-foreground-secondary">
            Accepting invitation…
          </p>
        </div>
      </div>
    );
  }

  // ─── Accepted ───────────────────────────────────────────────────

  if (status === "accepted") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-black text-foreground">
            You&apos;re Connected!
          </h1>
          <p className="mt-3 text-foreground-secondary">
            Your professional can now track your progress. Head to your
            dashboard to start logging your weight, meals, and activities.
          </p>
          <Link
            href="/dashboard/progress"
            className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-sm font-semibold text-foreground hover:bg-primary-600"
          >
            Go to My Progress
          </Link>
        </div>
      </div>
    );
  }

  // ─── Needs signup ───────────────────────────────────────────────

  if (status === "needs-signup") {
    const registerUrl = email
      ? `/register/user?email=${encodeURIComponent(email)}`
      : "/register/user";

    return (
      <div className="flex min-h-screen items-center justify-center bg-background-secondary">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue-100">
            <svg
              className="h-8 w-8 text-accent-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-black text-foreground">
            You&apos;ve Been Invited!
          </h1>
          <p className="mt-3 text-foreground-secondary">
            A fitness professional wants to work with you on Binectics. Create
            an account or log in to accept the invitation.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={registerUrl}
              className="inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-sm font-semibold text-foreground hover:bg-primary-600"
            >
              Create Account
            </Link>
            <Link
              href="/login"
              className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-300 px-8 text-sm font-semibold text-foreground hover:bg-neutral-50"
            >
              I Already Have an Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── Error ──────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center shadow-card">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-black text-foreground">
          Invitation Error
        </h1>
        <p className="mt-3 text-foreground-secondary">{errorMsg}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary-500 px-8 text-sm font-semibold text-foreground hover:bg-primary-600"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
