"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useOptionalOrganization } from "@/contexts/OrganizationContext";
import { useTeamInviteAccept } from "@/hooks/useTeams";
import { getDashboardRoute } from "@/lib/constants/routes";
import { UserRole } from "@/lib/types";
import { inviteDestination, type InviteDestination } from "@/lib/workspaces";

type PageState = "loading" | "success" | "error" | "requires_login";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const token = searchParams.get("token");

  const {
    status: acceptStatus,
    error: acceptError,
    organizationId: joinedOrgId,
    token: acceptedFor,
    acceptInvite,
  } = useTeamInviteAccept();
  const orgs = useOptionalOrganization();
  const refreshOrganizations = orgs?.refreshOrganizations;
  // Joining as a gym's trainer makes the account a trainer, and joining a
  // gym's team adds its workspace: take the fresh role and workspaces
  // before offering where to go.
  const [joined, setJoined] = useState<{ token: string; as: { id: string; role: string } | null } | null>(null);

  // Once per token. Refreshing the user after a success replaces the user
  // object (and refreshUser is a new function each render); keyed on those,
  // the accept ran again, the API refused the spent token, and the page
  // turned a success into "Unable to accept".
  const acceptedToken = useRef<string | null>(null);
  const userId = user?.id ?? null;
  useEffect(() => {
    if (authLoading || !token || !userId || acceptedToken.current === token) return;
    acceptedToken.current = token;
    acceptInvite(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, userId, token]);

  // Once per accepted token, as the accept above is: take the fresh role and
  // workspaces, then say where to go. Keyed on the token the success is for,
  // so a second link opened in the same page is refreshed for too, and the
  // first link's success never stands in for it while it is accepted.
  const refreshedToken = useRef<string | null>(null);
  useEffect(() => {
    if (acceptStatus !== "success" || !token || acceptedFor !== token || refreshedToken.current === token) return;
    refreshedToken.current = token;
    void Promise.all([refreshUser(), refreshOrganizations?.()]).then(([fresh]) => {
      setJoined({ token, as: fresh ?? user });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [acceptStatus, acceptedFor, token]);
  const joinedAs = joined && joined.token === token ? joined.as : null;

  // Where the page is, from what it knows: no token or a refused accept is an
  // error, no session asks to sign in, and success waits for the refresh.
  const state: PageState = authLoading
    ? "loading"
    : !token || acceptStatus === "error"
      ? "error"
      : !user
        ? "requires_login"
        : joinedAs
          ? "success"
          : "loading";
  const errorMessage = !token
    ? "No invitation token found. Please use the link from your email."
    : (acceptError ?? "Failed to accept invitation.");

  // Read at render, after the workspaces were refreshed above.
  const destination: InviteDestination | null = joinedAs
    ? inviteDestination(
        joinedAs,
        orgs?.organizations,
        joinedOrgId,
        getDashboardRoute((joinedAs.role as UserRole) ?? UserRole.USER),
      )
    : null;

  function handleLoginRedirect() {
    const returnUrl = encodeURIComponent(`/teams/invite/accept?token=${token}`);
    router.push(`/login?returnUrl=${returnUrl}`);
  }

  // ─── Loading ───
  if (state === "loading" || authLoading) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-signal border-t-transparent" />
        <p className="text-sm text-fg-2">
          Accepting invitation...
        </p>
      </div>
    );
  }

  // ─── Requires Login ───
  if (state === "requires_login") {
    return (
      <div className="flex flex-col items-center text-center gap-6">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal-soft">
          <svg
            className="h-8 w-8 text-signal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-ink">
            Sign in to accept
          </h2>
          <p className="mt-2 text-sm text-fg-2">
            You need to be signed in to accept this invitation. If you
            don&apos;t have an account yet, create one first.
          </p>
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={handleLoginRedirect}
            className="rounded-(--r-2) bg-signal px-6 py-3 text-sm font-bold text-bg hover:bg-signal/90 transition-colors"
          >
            Sign In
          </button>
          <Link
            href={`/register?returnUrl=${encodeURIComponent(`/teams/invite/accept?token=${token}`)}`}
            className="rounded-(--r-2) border border-border px-6 py-3 text-sm font-semibold text-fg text-center hover:bg-bg-2 transition-colors"
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-signal">
          <svg
            className="h-8 w-8 text-bg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-black text-ink">
            Invitation accepted
          </h2>
          <p className="mt-2 text-sm text-fg-2">
            {destination?.body}
          </p>
        </div>
        {destination && (
          <Link
            href={destination.href}
            onClick={() => {
              const org = orgs?.organizations.find((o) => o._id === destination.organizationId);
              if (org) orgs?.setCurrentOrg(org);
            }}
            className="rounded-(--r-2) bg-signal px-6 py-3 text-sm font-bold text-bg hover:bg-signal/90 transition-colors"
          >
            {destination.label}
          </Link>
        )}
      </div>
    );
  }

  // ─── Error ───
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
        <svg
          className="h-8 w-8 text-danger"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-2xl font-black text-ink">
          Unable to accept
        </h2>
        <p className="mt-2 text-sm text-fg-2">{errorMessage}</p>
      </div>
      <div className="flex gap-3">
        <Link
          href="/dashboard"
          className="rounded-(--r-2) border border-border px-5 py-2.5 text-sm font-semibold text-fg hover:bg-bg-2 transition-colors"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/contact"
          className="rounded-(--r-2) bg-signal px-5 py-2.5 text-sm font-semibold text-bg hover:bg-signal/90 transition-colors"
        >
          Contact Support
        </Link>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center bg-signal">
              <span className="text-xl font-bold text-bg">B</span>
            </div>
            <span className="text-xl font-bold text-ink">
              Binectics
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-(--r-3) border border-border bg-bg p-8">
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-signal border-t-transparent" />
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
