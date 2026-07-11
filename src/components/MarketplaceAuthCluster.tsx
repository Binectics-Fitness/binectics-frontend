"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { NavAvatarMenu } from "@/components/ds/NavAvatarMenu";
import { getDashboardRoute } from "@/lib/constants/routes";

/**
 * Auth-aware header cluster for the marketplace/public pages that carry
 * their own (non-Unified) navbars. These headers used to hardcode
 * "Log in / Sign up", so a signed-in member arriving from their
 * dashboard appeared logged out. Signed in → dashboard link + avatar
 * menu; signed out → the original links.
 */
export function MarketplaceAuthCluster({
  signupHref = "/login?mode=signup",
  compact = false,
}: {
  /** Preserve per-page role hints, e.g. "/login?mode=signup&role=member". */
  signupHref?: string;
  /** Single "Sign in" button variant (map/search/compare/review headers). */
  compact?: boolean;
}) {
  const { user, isLoading } = useAuth();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={getDashboardRoute(user.role)}
          className="btn-ghost-v2 sm hidden sm:inline-flex"
          style={{ textDecoration: "none" }}
        >
          Dashboard
        </Link>
        <NavAvatarMenu />
      </div>
    );
  }

  // While auth state hydrates, render the signed-out cluster — it's the
  // majority case for public pages and avoids a layout jump.
  void isLoading;

  if (compact) {
    return (
      <Link href="/login" prefetch={false} className="btn-primary-v2 sm">
        Sign in
      </Link>
    );
  }
  return (
    <>
      <Link
        href="/login"
        prefetch={false}
        className="btn-ghost-v2 sm hidden sm:inline-flex"
      >
        Log in
      </Link>
      <Link href={signupHref} className="btn-primary-v2 sm">
        Sign up
      </Link>
    </>
  );
}
