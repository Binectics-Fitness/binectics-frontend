"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { teamsService } from "@/lib/api/teams";
import { useAuth } from "@/contexts/AuthContext";

type PageState = "loading" | "success" | "error" | "requires_login";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const token = searchParams.get("token");

  const [state, setState] = useState<PageState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [orgName, setOrgName] = useState<string>("");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      setState("error");
      setErrorMessage("No invitation token found. Please use the link from your email.");
      return;
    }

    if (!user) {
      // Not logged in — redirect to login with return URL
      setState("requires_login");
      return;
    }

    acceptToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token]);

  async function acceptToken() {
    if (!token) return;
    setState("loading");
    try {
      const res = await teamsService.acceptInvitation({ token });
      if (res.success) {
        setState("success");
      } else {
        setState("error");
        setErrorMessage(res.message ?? "Failed to accept invitation.");
      }
    } catch {
      setState("error");
      setErrorMessage("Something went wrong. Please try again or contact support.");
    }
  }

  function handleLoginRedirect() {
    const returnUrl = encodeURIComponent(`/teams/invite/accept?token=${token}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  }

  // ─── Loading ───
  if (state === "loading" || authLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        <p className="text-sm text-foreground-secondary">Accepting invitation...</p>
      </div>
    );
  }

  // ─── Requires Login ───
  if (state === "requires_login") {
    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-blue-500/10">
          <svg className="h-8 w-8 text-accent-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">Sign in to accept</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            You need to be signed in to accept this invitation. If you don&apos;t have an account yet, create one first.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleLoginRedirect}
            className="rounded-lg bg-primary-500 px-6 py-3 text-sm font-bold text-foreground hover:bg-primary-600 transition-colors"
          >
            Sign In
          </button>
          <Link
            href={`/register?returnUrl=${encodeURIComponent(`/teams/invite/accept?token=${token}`)}`}
            className="rounded-lg border border-neutral-200 px-6 py-3 text-sm font-semibold text-foreground text-center hover:bg-neutral-50 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  // ─── Success ───
  if (state === "success") {
    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-500">
          <svg className="h-8 w-8 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-foreground">
            Invitation accepted!
          </h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            {orgName
              ? `You've joined ${orgName}.`
              : "You've successfully joined the organization."}{" "}
            Head to your Team dashboard to get started.
          </p>
        </div>
        <Link
          href="/dashboard/team"
          className="rounded-lg bg-primary-500 px-6 py-3 text-sm font-bold text-foreground hover:bg-primary-600 transition-colors"
        >
          Go to Team Dashboard
        </Link>
      </div>
    );
  }

  // ─── Error ───
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-black text-foreground">Unable to accept</h2>
        <p className="mt-2 text-sm text-foreground-secondary">{errorMessage}</p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/contact"
          className="rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-primary-600 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-primary-500">
              <span className="text-xl font-bold text-foreground">B</span>
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              Binectics
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
              </div>
            }
          >
            <AcceptInvitationContent />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
