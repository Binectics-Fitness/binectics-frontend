"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AccountStatePanel, { Accent } from "@/components/AccountStatePanel";
import { safeRedirectPath } from "@/lib/routing/accountState";

/**
 * Where a signed-in visitor lands when their session can't be renewed. The
 * `redirect` param is the page they were on; signing in returns them there
 * (same-origin paths only, the rule the login page also applies).
 */
export default function SessionExpiredNotice() {
  const params = useSearchParams();
  const redirect = safeRedirectPath(params.get("redirect"));
  const loginHref = redirect
    ? `/login?redirect=${encodeURIComponent(redirect)}`
    : "/login";

  return (
    <AccountStatePanel
      tone="neutral"
      eyebrow="Session expired"
      title={
        <>
          You were <Accent>signed out</Accent>.
        </>
      }
      description={
        redirect
          ? "Your session ended, so we signed you out. Sign in again to go back to where you were."
          : "Your session ended, so we signed you out. Sign in again to carry on."
      }
      actions={
        <>
          <Link
            href={loginHref}
            prefetch={false}
            className="btn-primary-v2"
            style={{ height: 38, padding: "0 16px" }}
          >
            Sign in
          </Link>
          <Link href="/" className="btn-ghost-v2" style={{ height: 38, padding: "0 16px" }}>
            Back to home
          </Link>
        </>
      }
    />
  );
}
