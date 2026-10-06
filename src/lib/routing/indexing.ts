/**
 * Routes that exist for one person at one moment: signing in, paying,
 * checking in, filling a provider's form, account-state notices. They are
 * reachable without a session, so search engines find them, but a search
 * result for one is useless or worse (a provider's private intake form).
 *
 * Most are client components, which cannot declare page metadata, so the
 * middleware sends X-Robots-Tag: noindex for them instead.
 */
export const PRIVATE_PATH_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/verification",
  "/session-expired",
  "/rate-limit",
  "/account-deleted",
  "/account-locked",
  "/account-suspended",
  "/onboarding",
  "/checkout",
  "/booking",
  "/payments",
  "/check-in",
  "/forms",
  "/teams",
  "/search",
  "/maintenance",
  "/status",
  "/member",
  "/dashboard",
  "/admin",
] as const;

/** Whether a path is one of the routes above, matching whole segments only. */
export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
